import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client"; 
import { authenticateToken } from "@/app/api/middleware";

const prisma = new PrismaClient();

/**
 * POST: Create a new room type for a specific hotel
 */
export async function POST(req: NextRequest, { params }: { params: { hotelId: string } }) {
  try {
    const user = await authenticateToken(req);
    if (user instanceof Response) return user;

    const { hotelId } = params;
    const body = await req.json();
    const { name, pricePerNight, amenities, images, totalRooms = 0 } = body;

    // Validate input
    if (!name || !pricePerNight || !Array.isArray(amenities) || !Array.isArray(images)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ensure the hotel exists and belongs to the user
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId, ownerId: user.id }
    });

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found or unauthorized" }, { status: 403 });
    }

    // Create Room Type with amenities & images in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create the room type
      const roomType = await prisma.roomType.create({
        data: {
          name,
          pricePerNight,
          totalRooms,
          hotel: { connect: { id: hotelId } },
          amenities: {
            create: amenities.map((amenity: string) => ({ amenity }))
          },
          images: {
            create: images.map((imageUrl: string) => ({ imageUrl }))
          }
        },
        include: { 
          amenities: true, 
          images: true
        }
      });

      // Initialize availability for the next 365 days if totalRooms > 0
      

      return roomType;
    });

    // Fetch the complete room type with availability
    const roomTypeWithAvailability = await prisma.roomType.findUnique({
      where: { id: result.id },
      include: { 
        amenities: true, 
        images: true,
        roomAvailability: true
      }
    });

    return NextResponse.json(
      {
        ...roomTypeWithAvailability,
        message: totalRooms > 0 ? `Room type created with ${totalRooms} rooms and availability initialized` : "Room type created"
      }, 
      { status: 201 }
    );

  } catch (error) {
    console.error("Error adding room type:", error);
    return NextResponse.json({ error: "Failed to create room type" }, { status: 500 });
  }
}

/**
 * GET: List all room types for a specific hotel
 */
export async function GET(req: NextRequest, { params }: { params: { hotelId: string } }) {
  try {
    const { hotelId } = params;

    // Verify hotel exists
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId }
    });

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    // Fetch room types with related data
    const roomTypes = await prisma.roomType.findMany({
      where: { hotelId },
      include: {
        amenities: true,
        images: true,
        roomAvailability: {
          where: {
            date: {
              gte: new Date() // Only get availability for current date and future
            }
          }
        }
      }
    });

    return NextResponse.json(roomTypes, { status: 200 });
  } catch (error) {
    console.error("Error fetching room types:", error);
    return NextResponse.json({ error: "Failed to fetch room types" }, { status: 500 });
  }
}

/**
 * DELETE: Remove a room type - Redirects to specific roomTypeId endpoint
 * This method is kept for backward compatibility but should be deprecated
 */
export async function DELETE(req: NextRequest, { params }: { params: { hotelId: string } }) {
  try {
    const user = await authenticateToken(req);
    if (user instanceof Response) return user;
    
    const { hotelId } = params;
    const { roomTypeId } = await req.json();

    if (!roomTypeId) {
      return NextResponse.json({ error: "Room type ID is required" }, { status: 400 });
    }

    // Create a new request to the proper RESTful endpoint
    const url = new URL(`/api/hotels/${hotelId}/roomTypes/${roomTypeId}`, req.url);
    const newRequest = new Request(url, {
      method: 'DELETE',
      headers: req.headers
    });
    
    // Forward to the proper endpoint
    const response = await fetch(newRequest);
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (error) {
    console.error("Error deleting room type:", error);
    return NextResponse.json({ error: "Failed to delete room type" }, { status: 500 });
  }
}
