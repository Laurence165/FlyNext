import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { authenticateToken } from "@/app/api/middleware";

/**
 * GET: Get all bookings for hotels owned by the current hotel owner
 */
export async function GET(req: NextRequest) {
  try {
    const user = await authenticateToken(req);
    if (user instanceof Response) return user;

    // Verify user is a hotel owner
    if (user.role !== "HOTEL_OWNER") {
      return NextResponse.json({ error: "Unauthorized. Hotel owner access required" }, { status: 403 });
    }

    const url = new URL(req.url);
    
    // Query parameters for filtering
    const hotelId = url.searchParams.get('hotelId'); // Optional: filter by specific hotel
    const status = url.searchParams.get('status'); // Optional: filter by reservation status
    const fromDate = url.searchParams.get('fromDate'); // Optional: filter by check-in date range
    const toDate = url.searchParams.get('toDate'); // Optional: filter by check-out date range

    // Get all hotels owned by this user
    const hotels = await prisma.hotel.findMany({
      where: {
        ownerId: user.id,
        ...(hotelId ? { id: hotelId } : {})
      },
      select: { id: true }
    });

    if (hotels.length === 0) {
      return NextResponse.json({ message: "No hotels found for this owner" }, { status: 404 });
    }

    // Get the hotel IDs
    const hotelIds = hotels.map(hotel => hotel.id);

    // Build filters for reservations
    const reservationFilters: any = {
      roomType: {
        hotel: {
          id: { in: hotelIds }
        }
      }
    };

    // Add date filters if provided
    if (fromDate) {
      reservationFilters.checkInDate = { 
        ...(reservationFilters.checkInDate || {}),
        gte: new Date(fromDate) 
      };
    }
    
    if (toDate) {
      reservationFilters.checkOutDate = { 
        ...(reservationFilters.checkOutDate || {}),
        lte: new Date(toDate) 
      };
    }

    // Add status filter if provided
    if (status) {
      reservationFilters.status = status;
    }

    // Find all reservations for these hotels
    const reservations = await prisma.reservation.findMany({
      where: reservationFilters,
      include: {
        roomType: {
          include: {
            hotel: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true
              }
            }
          }
        },
        booking: {
          select: {
            id: true,
            totalPrice: true,
            status: true,
            createdAt: true,
            userId: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: {
        checkInDate: 'asc'
      }
    });

    // Group reservations by hotel
    const bookingsByHotel = hotelIds.map(hotelId => {
      const hotelReservations = reservations.filter(
        res => res.roomType.hotel.id === hotelId
      );
      
      return {
        hotelId,
        hotelName: hotelReservations[0]?.roomType.hotel.name || "Unknown Hotel",
        hotelAddress: hotelReservations[0]?.roomType.hotel.address || "",
        hotelCity: hotelReservations[0]?.roomType.hotel.city || "",
        totalBookings: hotelReservations.length,
        reservations: hotelReservations.map(res => ({
          reservationId: res.id,
          bookingId: res.booking.id,
          roomType: res.roomType.name,
          roomTypeId: res.roomTypeId,
          checkInDate: res.checkInDate,
          checkOutDate: res.checkOutDate,
          roomsBooked: res.roomsBooked,
          status: res.status,
          createdAt: res.createdAt,
          customer: {
            userId: res.booking.user.id,
            name: `${res.booking.user.firstName} ${res.booking.user.lastName}`,
            email: res.booking.user.email,
            phone: res.booking.user.phone || "Not provided"
          }
        }))
      };
    });

    // Filter out hotels with no reservations if needed
    const filteredBookingsByHotel = bookingsByHotel.filter(
      hotel => hotel.reservations.length > 0
    );

    // Summary statistics
    const totalReservations = reservations.length;
    const confirmedReservations = reservations.filter(res => res.status === "CONFIRMED").length;
    const cancelledReservations = reservations.filter(res => res.status === "CANCELLED").length;
    
    // Calculate revenue from confirmed reservations
    const revenue = reservations
      .filter(res => res.status === "CONFIRMED")
      .reduce((total, res) => {
        const nights = Math.ceil(
          (res.checkOutDate.getTime() - res.checkInDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return total + (res.roomType.pricePerNight * nights * res.roomsBooked);
      }, 0);

    return NextResponse.json({
      summary: {
        totalHotels: hotelIds.length,
        totalReservations,
        confirmedReservations,
        cancelledReservations,
        estimatedRevenue: revenue
      },
      bookings: filteredBookingsByHotel
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching hotel owner bookings:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}
