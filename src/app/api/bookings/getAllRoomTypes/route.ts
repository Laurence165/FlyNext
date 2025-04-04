import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/db"; 
import { authenticateToken } from "@/app/api/middleware";

export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user's session
    const user = await authenticateToken(req);
    if (user instanceof Response) return user;

    // Get date from query params, default to today
    const searchParams = req.nextUrl.searchParams;
    const date = searchParams.get('date') 
      ? new Date(searchParams.get('date')!) 
      : new Date();

    // Set start and end of the specified date
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Get all hotels owned by the user with their room types
    const hotels = await prisma.hotel.findMany({
      where: {
        ownerId: user.id
      },
      select: {
        id: true,
        name: true,
        logo: true,
        roomTypes: {
          select: {
            id: true,
            name: true,
            pricePerNight: true,
            totalRooms: true,
            amenities: {
              select: {
                amenity: true
              }
            },
            images: {
              select: {
                imageUrl: true
              }
            },
            // Get room availability for specified date
            roomAvailability: {
              where: {
                date: {
                  gte: startDate,
                  lte: endDate
                }
              },
              select: {
                availableRooms: true,
                date: true
              }
            },
            // Get active reservations for the date
            reservations: {
              where: {
                status: 'CONFIRMED',
                checkInDate: { lte: endDate },
                checkOutDate: { gte: startDate }
              },
              select: {
                roomsBooked: true,
                checkInDate: true,
                checkOutDate: true
              }
            }
          }
        }
      }
    });

    // Transform the data to group room types by hotel
    const hotelRoomTypes = hotels.map(hotel => ({
      id: hotel.id,
      name: hotel.name,
      logo: hotel.logo,
      roomTypes: hotel.roomTypes.map(room => ({
        id: room.id,
        name: room.name,
        pricePerNight: room.pricePerNight,
        totalRooms: room.totalRooms,
        amenities: room.amenities,
        images: room.images,
        // Calculate available rooms considering both roomAvailability and active reservations
        availableRooms: room.totalRooms-room.roomAvailability.length
        //  availableRooms: room.roomAvailability[0]?.availableRooms ?? 
        //   (room.totalRooms - room.reservations.reduce((acc, res) => acc + res.roomsBooked, 0))
      }))
    }));

    return NextResponse.json(hotelRoomTypes);

  } catch (error) {
    console.error("Error fetching room types:", error);
    return NextResponse.json(
      { error: "Failed to fetch room types" },
      { status: 500 }
    );
  }
}
