import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { authenticateToken } from "@/app/api/middleware";

/**
 * POST: Set total room count and initialize availability
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { hotelId: string; roomTypeId: string } }
) {
  try {
    const user = await authenticateToken(req);
    if (user instanceof Response) return user;

    const { hotelId, roomTypeId } = params;
    const { roomCount } = await req.json();

    // Validate input
    if (!roomCount || roomCount < 1) {
      return NextResponse.json({ error: "Invalid room count" }, { status: 400 });
    }

    // Verify hotel exists and belongs to user
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId, ownerId: user.id }
    });

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found or unauthorized" }, { status: 403 });
    }

    // Verify room type exists
    const roomType = await prisma.roomType.findFirst({
      where: { id: roomTypeId, hotelId }
    });

    if (!roomType) {
      return NextResponse.json({ error: "Room type not found" }, { status: 404 });
    }

    // Update room type with total rooms
    const updatedRoomType = await prisma.roomType.update({
      where: { id: roomTypeId },
      data: { totalRooms: roomCount }
    });

    // Initialize availability for the next 365 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const availabilityRecords = [];
    
    // Create availability records for next 365 days
    for (let i = 0; i < 365; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      availabilityRecords.push({
        roomTypeId,
        date,
        availableRooms: roomCount
      });
    }
    
    // Batch create availability records - using transaction instead of createMany for SQLite compatibility
    const createOperations = availabilityRecords.map(record => 
      prisma.roomAvailability.upsert({
        where: {
          roomTypeId_date: {
            roomTypeId: record.roomTypeId,
            date: record.date
          }
        },
        update: {
          availableRooms: record.availableRooms
        },
        create: {
          roomTypeId: record.roomTypeId,
          date: record.date,
          availableRooms: record.availableRooms
        }
      })
    );
    
    await prisma.$transaction(createOperations);

    return NextResponse.json({
      roomType: updatedRoomType,
      message: `Successfully set room count to ${roomCount} and initialized availability`
    }, { status: 201 });
  } catch (error) {
    console.error("Error setting room count:", error);
    return NextResponse.json({ error: "Failed to set room count" }, { status: 500 });
  }
}

/**
 * GET: Get room type details with availability
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { hotelId: string; roomTypeId: string } }
) {
  try {
    const { hotelId, roomTypeId } = params;
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Verify hotel exists
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId }
    });

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    // Verify room type exists
    const roomType = await prisma.roomType.findFirst({
      where: { id: roomTypeId, hotelId },
      include: {
        amenities: true,
        images: true
      }
    });

    if (!roomType) {
      return NextResponse.json({ error: "Room type not found" }, { status: 404 });
    }

    // Get availability if dates are provided
    let availability = [];
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        availability = await prisma.roomAvailability.findMany({
          where: {
            roomTypeId,
            date: {
              gte: start,
              lte: end
            }
          },
          orderBy: {
            date: 'asc'
          }
        });
      }
    }

    return NextResponse.json({
      ...roomType,
      availability
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching room type:", error);
    return NextResponse.json({ error: "Failed to fetch room type" }, { status: 500 });
  }
}

/**
 * PUT: Update room count and recalculate availability
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { hotelId: string; roomTypeId: string } }
) {
  try {
    const user = await authenticateToken(req);
    if (user instanceof Response) return user;

    const { hotelId, roomTypeId } = params;
    const { roomCount } = await req.json();

    // Validate input
    if (typeof roomCount !== 'number' || roomCount < 0) {
      return NextResponse.json({ error: "Invalid room count" }, { status: 400 });
    }

    // Verify hotel exists and belongs to user
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId, ownerId: user.id }
    });

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found or unauthorized" }, { status: 403 });
    }

    // Verify room type exists
    const roomType = await prisma.roomType.findFirst({
      where: { id: roomTypeId, hotelId }
    });

    if (!roomType) {
      return NextResponse.json({ error: "Room type not found" }, { status: 404 });
    }

    // If reducing room count, check future reservations to make sure we don't go below needed capacity
    if (roomCount < roomType.totalRooms) {
      const today = new Date();
      
      // Get date range from today to 1 year ahead
      const endDate = new Date(today);
      endDate.setFullYear(today.getFullYear() + 1);
      
      // Calculate max rooms needed for any date
      const maxRoomsNeeded = await getMaxBookedRooms(roomTypeId, today, endDate);
      
      if (roomCount < maxRoomsNeeded) {
        return NextResponse.json({
          error: "Cannot reduce room count below existing reservation requirements",
          maxRoomsNeeded
        }, { status: 400 });
      }
    }

    // Update room type with new total room count
    const updatedRoomType = await prisma.roomType.update({
      where: { id: roomTypeId },
      data: { totalRooms: roomCount }
    });

    // Update availability for future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get all relevant future dates
    const availabilities = await prisma.roomAvailability.findMany({
      where: {
        roomTypeId,
        date: { gte: today }
      }
    });
    
    // Get reservations by date
    const reservationsByDate = await getReservationsByDate(roomTypeId, today);
    
    // Update each availability record
    const updates = [];
    for (const availability of availabilities) {
      const dateKey = availability.date.toISOString().split('T')[0];
      const bookedRooms = reservationsByDate[dateKey] || 0;
      const newAvailableRooms = Math.max(0, roomCount - bookedRooms);
      
      updates.push(
        prisma.roomAvailability.update({
          where: { id: availability.id },
          data: { availableRooms: newAvailableRooms }
        })
      );
    }
    
    if (updates.length > 0) {
      await prisma.$transaction(updates);
    }

    return NextResponse.json({
      roomType: updatedRoomType,
      message: `Successfully updated room count to ${roomCount} and recalculated availability`
    }, { status: 200 });
  } catch (error) {
    console.error("Error updating room count:", error);
    return NextResponse.json({ error: "Failed to update room count" }, { status: 500 });
  }
}

/**
 * Helper function to get maximum booked rooms for any date in a range
 */
async function getMaxBookedRooms(roomTypeId: string, startDate: Date, endDate: Date) {
  // Get all confirmed reservations that overlap with the date range
  const reservations = await prisma.reservation.findMany({
    where: {
      roomTypeId,
      status: "CONFIRMED",
      OR: [
        {
          checkInDate: { lte: endDate },
          checkOutDate: { gte: startDate }
        }
      ]
    },
    select: {
      checkInDate: true,
      checkOutDate: true,
      roomsBooked: true
    }
  });
  
  // Calculate occupancy for each day in the range
  const dailyBookings = {};
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dateString = currentDate.toISOString().split('T')[0];
    dailyBookings[dateString] = 0;
    
    // For each reservation, check if it covers this day
    reservations.forEach(reservation => {
      const checkIn = new Date(reservation.checkInDate);
      const checkOut = new Date(reservation.checkOutDate);
      
      if (currentDate >= checkIn && currentDate < checkOut) {
        dailyBookings[dateString] += reservation.roomsBooked;
      }
    });
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Find the maximum booking for any day
  return Math.max(0, ...Object.values(dailyBookings));
}

/**
 * Helper function to get booked rooms by date
 */
async function getReservationsByDate(roomTypeId: string, startDate: Date) {
  // Get all confirmed reservations from the start date
  const reservations = await prisma.reservation.findMany({
    where: {
      roomTypeId,
      status: "CONFIRMED",
      checkOutDate: { gte: startDate }
    },
    select: {
      checkInDate: true,
      checkOutDate: true,
      roomsBooked: true
    }
  });
  
  // Calculate bookings for each day
  const dailyBookings = {};
  
  reservations.forEach(reservation => {
    const checkIn = new Date(reservation.checkInDate);
    const checkOut = new Date(reservation.checkOutDate);
    
    // For each day of the reservation
    const currentDate = new Date(checkIn);
    while (currentDate < checkOut) {
      const dateKey = currentDate.toISOString().split('T')[0];
      
      if (!dailyBookings[dateKey]) {
        dailyBookings[dateKey] = 0;
      }
      
      dailyBookings[dateKey] += reservation.roomsBooked;
      currentDate.setDate(currentDate.getDate() + 1);
    }
  });
  
  return dailyBookings;
}
