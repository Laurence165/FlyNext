import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { authenticateToken } from "@/app/api/middleware";
import { checkRoomAvailability, updateRoomAvailability } from "@/utils/roomAvailability";

/**
 * POST: Create a new booking with hotel room reservation and/or flights
 */
export async function POST(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (user instanceof Response) return user;

    const { hotelBooking, flightBooking, totalPrice, existingBookingId } = await req.json();


    // Validate that at least one booking type is provided
    if (!hotelBooking && !flightBooking) {
      return NextResponse.json({ error: "Must provide either hotel booking or flight booking details" }, { status: 400 });
    }
    
    let calculatedTotalPrice = 0;
    let hotelReservation = null;
    let booking;
    
    // Check if we're adding to an existing booking
    if (existingBookingId) {
      // Get existing booking to add more items to it
      booking = await prisma.booking.findUnique({
        where: { 
          id: existingBookingId,
          userId: user.id // Ensure the booking belongs to this user
        },
        include: {
          flights: true,
          reservations: true
        }
      });

      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }
      
      // Use existing total price as starting point
      calculatedTotalPrice = booking.totalPrice;
    }
    
    // Validate hotel booking data if provided
    if (hotelBooking) {
      const { hotelId, roomTypeId, checkInDate, checkOutDate, roomsRequested } = hotelBooking;
      
      // Validate required fields for hotel booking
      if (!hotelId || !roomTypeId || !checkInDate || !checkOutDate || !roomsRequested) {
        return NextResponse.json({ error: "Missing required hotel booking information" }, { status: 400 });
      }

      // Parse dates
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      
      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
      }

      if (checkIn >= checkOut) {
        return NextResponse.json({ error: "Check-out date must be after check-in date" }, { status: 400 });
      }

      // Verify hotel and room type exist
      const roomType = await prisma.roomType.findFirst({
        where: {
          id: roomTypeId,
          hotelId
        },
        include: {
          hotel: true
        }
      });

      if (!roomType) {
        return NextResponse.json({ error: "Room type not found" }, { status: 404 });
      }

      // Check availability before booking
      const availability = await checkRoomAvailability(
        roomTypeId,
        checkIn,
        checkOut,
        roomsRequested
      );

      if (!availability.available) {
        return NextResponse.json({
          error: "Rooms not available for selected dates",
          unavailableDates: availability.unavailableDates
        }, { status: 400 });
      }
      
      // Calculate hotel price
      const hotelPrice = hotelBooking.price || calculateHotelPrice(
        roomType.pricePerNight, 
        checkIn, 
        checkOut, 
        roomsRequested
      );
      
      calculatedTotalPrice += hotelPrice;
      
      // Store room booking details for later
      hotelReservation = {
        roomTypeId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        roomsRequested,
        hotelPrice,
        hotelName: roomType.hotel.name,
        roomType,
        hotelOwnerId: roomType.hotel.ownerId // Store hotel owner ID for notification
      };
    }
    
    // Handle flight booking data if provided
    let flightDetails = [];
    if (flightBooking) {
      const flightsToBook = Array.isArray(flightBooking) ? flightBooking : [flightBooking];
      
      for (const flight of flightsToBook) {
        const { afsFlightId, departureTime, arrivalTime, source, destination, price } = flight;
        
        // Validate required fields
        if (!afsFlightId || !departureTime || !arrivalTime || !source || !destination) {
          return NextResponse.json({ error: "Missing required flight information" }, { status: 400 });
        }
        
        // Add flight price to total
        const flightPrice = price || 0;
        calculatedTotalPrice += flightPrice;
        
        flightDetails.push({
          afsFlightId,
          departureTime: new Date(departureTime),
          arrivalTime: new Date(arrivalTime),
          source,
          destination,
          price: flightPrice
        });
      }
    }
    
    // Use provided total price or calculated price
    const finalTotalPrice = totalPrice || calculatedTotalPrice;

    // Create booking and reservations in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create booking or update existing one
      let booking;
      
      if (existingBookingId) {
        booking = await prisma.booking.update({
          where: { id: existingBookingId },
          data: {
            totalPrice: finalTotalPrice,
            status: "PENDING"
          },
          include: { flights: true, reservations: true } 
        });
      } else {
        // Create a new booking
        booking = await prisma.booking.create({
          data: {
            userId: user.id,
            totalPrice: finalTotalPrice,
            status: "PENDING",
          },
          include: { flights: true, reservations: true } 
        });
      }
      
      let reservation = null;
      // Create hotel reservation if applicable
      if (hotelReservation) {
        reservation = await prisma.reservation.create({
          data: {
            roomTypeId: hotelReservation.roomTypeId,
            checkInDate: hotelReservation.checkInDate,
            checkOutDate: hotelReservation.checkOutDate,
            roomsBooked: hotelReservation.roomsRequested,
            status: "PENDING",
            bookingId: booking.id
          }
        });
      }
      
      // Create flight records if applicable
      const flights = [];
      for (const flight of flightDetails) {
        const newFlight = await prisma.flight.create({
          data: {
            afsFlightId: flight.afsFlightId,
            departureTime: flight.departureTime,
            arrivalTime: flight.arrivalTime,
            source: flight.source,
            destination: flight.destination,
            status: "PENDING",
            bookingId: booking.id
          }
        });
        flights.push(newFlight);
      }
      
      return { booking, reservation, flights };
    });

    // Update room availability after successful booking
    if (hotelReservation) {
      await updateRoomAvailability(
        hotelReservation.roomTypeId,
        hotelReservation.checkInDate,
        hotelReservation.checkOutDate,
        hotelReservation.roomsRequested
      );
    }

    return NextResponse.json({
      message: existingBookingId ? "Items added to cart successfully" : "Items added to cart successfully",
      booking: result.booking,
      reservation: result.reservation,
      flights: result.flights
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}

/**
 * GET: Get all bookings for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (user instanceof Response) return user;

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const includeFlights = url.searchParams.get('includeFlights') !== 'false';
    const includeHotels = url.searchParams.get('includeHotels') !== 'false';

    // Build the where clause for filter
    const where: any = { userId: user.id };
    
    if (status) {
      where.status = status;
    }
    
    // Get all bookings for the user with optional includes
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        flights: includeFlights,
        reservations: includeHotels ? {
          include: {
            roomType: {
              include: {
                hotel: true
              }
            }
          }
        } : false,
        invoice: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(bookings, { status: 200 });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

/**
 * Helper function to calculate hotel booking price
 */
function calculateHotelPrice(
  pricePerNight: number,
  checkInDate: Date,
  checkOutDate: Date,
  roomsBooked: number
): number {
  const nights = Math.ceil(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  return pricePerNight * nights * roomsBooked;
}
