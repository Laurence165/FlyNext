import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { authenticateToken } from "@/app/api/middleware";
import { getBookedRoomsForDate } from "@/utils/roomAvailability";

/**
 * GET: Retrieve room availability for a date range
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { hotelId: string; roomTypeId: string } }
) {
  try {
    // Fix: Destructure after awaiting params
    const hotelId = params.hotelId;
    const roomTypeId = params.roomTypeId;
    
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Validate date parameters
    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Start date and end date are required" }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    // Verify hotel exists
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId }
    });

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    // Verify room type exists
    const roomType = await prisma.roomType.findFirst({
      where: { id: roomTypeId, hotelId }
    });

    if (!roomType) {
      return NextResponse.json({ error: "Room type not found" }, { status: 404 });
    }

    // Get availability for the date range
    const availability = await prisma.roomAvailability.findMany({
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

    // Create a map of dates that have records
    const availableDates = new Map();
    availability.forEach(record => {
      const dateStr = record.date.toISOString().split('T')[0];
      availableDates.set(dateStr, record);
    });

    // Generate full date range and fill in missing dates with default values
    const fullAvailability = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      if (availableDates.has(dateStr)) {
        // Use existing record
        fullAvailability.push(availableDates.get(dateStr));
      } else {
        // Calculate availability based on bookings
        const date = new Date(currentDate);
        const bookedRooms = await getBookedRoomsForDate(roomTypeId, date);
        fullAvailability.push({
          roomTypeId,
          date,
          availableRooms: Math.max(0, roomType.totalRooms - bookedRooms),
          isCalculated: true // Flag to indicate this is a calculated value, not from DB
        });
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get reservations for the date range (for reference)
    const reservations = await prisma.reservation.findMany({
      where: {
        roomTypeId,
        status: "CONFIRMED",
        OR: [
          {
            checkInDate: { lte: end },
            checkOutDate: { gte: start }
          }
        ]
      },
      select: {
        id: true,
        checkInDate: true,
        checkOutDate: true,
        roomsBooked: true,
        status: true
      },
      orderBy: {
        checkInDate: 'asc'
      }
    });

    return NextResponse.json({
      roomType,
      availability: fullAvailability,
      reservations
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching room availability:", error);
    return NextResponse.json({ error: "Failed to fetch room availability" }, { status: 500 });
  }
}

/**
 * POST: Create or update room availability for specific dates
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { hotelId: string; roomTypeId: string } }
) {
  try {
    const user = await authenticateToken(req);
    if (user instanceof Response) return user;

    // Fix: Destructure after awaiting params
    const hotelId = params.hotelId;
    const roomTypeId = params.roomTypeId;
    
    const { date, availableRooms, dateRange } = await req.json();

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

    // If single date update
    if (date && typeof availableRooms === 'number') {
      const parsedDate = new Date(date);
      
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
      }

      // Ensure the available rooms aren't less than current bookings
      const bookedRooms = await getBookedRoomsForDate(roomTypeId, parsedDate);
      
      if (availableRooms < bookedRooms) {
        return NextResponse.json({
          error: "Cannot set available rooms below current bookings",
          currentlyBooked: bookedRooms
        }, { status: 400 });
      }

      // Update or create availability for the date
      const updatedAvailability = await prisma.roomAvailability.upsert({
        where: {
          roomTypeId_date: {
            roomTypeId,
            date: parsedDate
          }
        },
        update: {
          availableRooms
        },
        create: {
          roomTypeId,
          date: parsedDate,
          availableRooms
        }
      });

      return NextResponse.json(updatedAvailability, { status: 200 });
    }
    // If date range update
    else if (dateRange && typeof availableRooms === 'number') {
      const { startDate, endDate } = dateRange;
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json({ error: "Invalid date range format" }, { status: 400 });
      }

      const updates = [];

      // Create array of dates in range
      const currentDate = new Date(start);
      while (currentDate <= end) {
        // Check bookings for this date
        const bookedRooms = await getBookedRoomsForDate(roomTypeId, new Date(currentDate));
        
        if (availableRooms < bookedRooms) {
          return NextResponse.json({
            error: `Cannot set available rooms below current bookings for date ${currentDate.toISOString().split('T')[0]}`,
            date: currentDate.toISOString().split('T')[0],
            currentlyBooked: bookedRooms
          }, { status: 400 });
        }
        
        updates.push(
          prisma.roomAvailability.upsert({
            where: {
              roomTypeId_date: {
                roomTypeId,
                date: new Date(currentDate)
              }
            },
            update: {
              availableRooms
            },
            create: {
              roomTypeId,
              date: new Date(currentDate),
              availableRooms
            }
          })
        );
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const updatedAvailability = await prisma.$transaction(updates);
      return NextResponse.json({
        message: `Successfully updated availability for ${updatedAvailability.length} dates`,
        startDate,
        endDate,
        availableRooms
      }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
  } catch (error) {
    console.error("Error updating room availability:", error);
    return NextResponse.json({ error: "Failed to update room availability" }, { status: 500 });
  }
}

/**
 * Helper function to get booked rooms for a specific date
 */
async function getBookedRoomsForDate(roomTypeId: string, date: Date) {
  const formattedDate = new Date(date);
  formattedDate.setHours(0, 0, 0, 0);
  
  const reservations = await prisma.reservation.findMany({
    where: {
      roomTypeId,
      status: "CONFIRMED",
      checkInDate: { lte: formattedDate },
      checkOutDate: { gt: formattedDate }
    }
  });
  
  return reservations.reduce((total, res) => total + res.roomsBooked, 0);
}
