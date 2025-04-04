import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { authenticateToken } from "@/app/api/middleware";
import { checkRoomAvailability, updateRoomAvailability } from "@/utils/roomAvailability";


/**
 * GET: Get all bookings for a specific hotel owner
 */
export async function GET(req: NextRequest) {
    try {
      const user = await authenticateToken(req);
      if (user instanceof Response) return user;
  
      // Extract ownerId from query parameters
      //const url = new URL(req.url);
    //   const ownerId = url.searchParams.get('ownerId');
  
    //   if (!ownerId) {
    //     return NextResponse.json({ error: "Owner ID is required" }, { status: 400 });
    //   }
      const ownerId = user.id
      // Fetch all hotels owned by the given ownerId
      const hotels = await prisma.hotel.findMany({
        where: { ownerId },
        select: { id: true } // Only fetch the hotel IDs
      });
  
      // If no hotels are found for this owner
      if (hotels.length === 0) {
        return NextResponse.json({ error: "No hotels found for this owner" }, { status: 404 });
      }
  
      // Fetch all bookings for the hotels owned by the owner
      const bookings = await prisma.booking.findMany({
        where: {
          reservations: {
            some: {
              roomType: {
                hotelId: { in: hotels.map(hotel => hotel.id) }
              }
            }
          }
        },
        include: {
          flights: true, // Include flight details if needed
          reservations: {
            include: {
              roomType: {
                include: {
                  hotel: true // Include hotel details for the reservation
                }
              }
            }
          },
          invoice: true // Include invoice if applicable
        },
        orderBy: {
          createdAt: 'desc' // Order bookings by creation date
        }
      });
  
      return NextResponse.json(bookings, { status: 200 });
    } catch (error) {
      console.error("Error fetching hotel owner bookings:", error);
      return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
    }
  }
  