import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { authenticateToken } from "@/app/api/middleware";
import { releaseRoomAvailability } from "@/utils/roomAvailability";

/**
 * POST: Cancel a booking and update room availability
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const user = await authenticateToken(req);
    if (user instanceof Response) return user;

    const bookingId = params.bookingId;
    
    // Get optional parameters from request body
    const { cancelHotelsOnly, cancelFlightsOnly } = await req.json().catch(() => ({}));

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        reservations: true,
        flights: true
      }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Check authorization: either booking owner or hotel owner for reservations
    let authorized = booking.userId === user.id;
    
    // If user is a hotel owner, check if they own any of the hotels in the reservations
    let authorizedHotelOwner = false;
    if (user.role === "HOTEL_OWNER" && booking.reservations.length > 0) {
      const reservationIds = booking.reservations.map(res => res.id);
      
      const reservations = await prisma.reservation.findMany({
        where: { id: { in: reservationIds } },
        include: {
          roomType: {
            include: {
              hotel: true
            }
          }
        }
      });

      authorizedHotelOwner = reservations.some(res => res.roomType.hotel.ownerId === user.id);
    }
    
    if (!authorized && !authorizedHotelOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Begin transaction
    const result = await prisma.$transaction(async (prisma) => {
      let updateBookingStatus = true;
      
      // If canceling only hotels or flights, check if we should update the booking status
      if (cancelHotelsOnly && booking.flights.length > 0) {
        updateBookingStatus = false;
      }
      if (cancelFlightsOnly && booking.reservations.length > 0) {
        updateBookingStatus = false;
      }
      
      // Update booking status if needed
      let updatedBooking = booking;
      if (updateBookingStatus) {
        updatedBooking = await prisma.booking.update({
          where: { id: bookingId },
          data: { status: "CANCELLED" }
        });
      }

      // If hotel owner, only cancel the reservations they own
      if (authorizedHotelOwner && !authorized) {
        const ownedReservationIds = [];
        
        // Find reservations owned by this hotel owner
        for (const reservation of booking.reservations) {
          const res = await prisma.reservation.findUnique({
            where: { id: reservation.id },
            include: {
              roomType: {
                include: {
                  hotel: true
                }
              }
            }
          });
          
          if (res?.roomType.hotel.ownerId === user.id) {
            ownedReservationIds.push(reservation.id);
          }
        }
        
        // Update only owned reservations
        if (ownedReservationIds.length > 0) {
          await prisma.reservation.updateMany({
            where: { id: { in: ownedReservationIds } },
            data: { status: "CANCELLED" }
          });
          
          // Send notification
          await prisma.notification.create({
            data: {
              userId: booking.userId,
              message: `Your hotel reservation${ownedReservationIds.length > 1 ? 's' : ''} for booking (ID: ${bookingId.substring(0, 8)}) ${ownedReservationIds.length > 1 ? 'have' : 'has'} been cancelled by the hotel`,
              type: "BOOKING_CANCELLED"
            }
          });
        }
      } else {
        // Regular user or cancelling entire booking
        
        // Cancel reservations if requested
        if (!cancelFlightsOnly && booking.reservations.length > 0) {
          await prisma.reservation.updateMany({
            where: { bookingId },
            data: { status: "CANCELLED" }
          });
        }
        
        // Cancel flights if requested
        if (!cancelHotelsOnly && booking.flights.length > 0) {
          await prisma.flight.updateMany({
            where: { bookingId },
            data: { status: "CANCELLED" }
          });
        }
        
        // Create notification
        await prisma.notification.create({
          data: {
            userId: booking.userId,
            message: `Your booking (ID: ${bookingId.substring(0, 8)}) has been ${updateBookingStatus ? 'completely ' : 'partially '}cancelled`,
            type: "BOOKING_CANCELLED"
          }
        });
      }

      return { 
        booking: updatedBooking,
        cancelledHotels: !cancelFlightsOnly,
        cancelledFlights: !cancelHotelsOnly
      };
    });

    // Update room availability for each reservation that was cancelled
    if (result.cancelledHotels) {
      for (const reservation of booking.reservations) {
        // For hotel owners, only release availability for their hotels
        if (authorizedHotelOwner && !authorized) {
          const res = await prisma.reservation.findUnique({
            where: { id: reservation.id },
            include: {
              roomType: {
                include: {
                  hotel: true
                }
              }
            }
          });
          
          if (res?.roomType.hotel.ownerId === user.id) {
            await releaseRoomAvailability(reservation.id);
          }
        } else {
          await releaseRoomAvailability(reservation.id);
        }
      }
    }

    return NextResponse.json({
      message: "Booking cancelled successfully",
      booking: result.booking
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json({ error: "Failed to cancel booking" }, { status: 500 });
  }
}
