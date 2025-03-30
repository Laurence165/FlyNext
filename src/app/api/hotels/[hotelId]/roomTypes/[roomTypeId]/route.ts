import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/db";
import { authenticateToken } from "@/app/api/middleware";

/**
 * GET: Retrieve a specific room type
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { hotelId: string; roomTypeId: string } }
) {
  try {
    const { hotelId, roomTypeId } = params;

    const roomType = await prisma.roomType.findFirst({
      where: { 
        id: roomTypeId, 
        hotelId 
      },
      include: {
        amenities: true,
        images: true,
        roomAvailability: {
          select: {
            date: true,
            availableRooms: true
          }
        }
      }
    });

    if (!roomType) {
      return NextResponse.json({ error: "Room type not found" }, { status: 404 });
    }

    return NextResponse.json(roomType, { status: 200 });
  } catch (error) {
    console.error("Error fetching room type:", error);
    return NextResponse.json({ error: "Failed to fetch room type" }, { status: 500 });
  }
}

/**
 * PUT: Update a room type
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { hotelId: string; roomTypeId: string } }
) {
  try {
    const user = await authenticateToken(req);
    if (user instanceof Response) return user;

    const { hotelId, roomTypeId } = params;
    const { name, pricePerNight, totalRooms, amenities, images } = await req.json();

    // Verify hotel exists and belongs to user
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId, ownerId: user.id }
    });

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found or unauthorized" }, { status: 403 });
    }

    // Verify room type exists
    const existingRoomType = await prisma.roomType.findFirst({
      where: { id: roomTypeId, hotelId },
    });

    if (!existingRoomType) {
      return NextResponse.json({ error: "Room type not found" }, { status: 404 });
    }

    // Update basic room type details
    const updatedRoomType = await prisma.roomType.update({
      where: { id: roomTypeId },
      data: { 
        name: name || undefined,
        pricePerNight: pricePerNight || undefined,
        totalRooms: totalRooms !== undefined ? totalRooms : undefined,
      },
    });

    // If amenities provided, update them
    if (Array.isArray(amenities)) {
      // Delete existing amenities
      await prisma.amenities.deleteMany({
        where: { roomTypeId }
      });

      // Add new amenities
      await Promise.all(
        amenities.map(amenity => 
          prisma.amenities.create({
            data: {
              roomTypeId,
              amenity
            }
          })
        )
      );
    }

    // If images provided, update them
    if (Array.isArray(images)) {
      // Delete existing images
      await prisma.roomTypeImage.deleteMany({
        where: { roomTypeId }
      });

      // Add new images
      await Promise.all(
        images.map(imageUrl =>
          prisma.roomTypeImage.create({
            data: {
              roomTypeId,
              imageUrl
            }
          })
        )
      );
    }

    // Fetch the updated room type with all related data
    const refreshedRoomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      include: {
        amenities: true,
        images: true,
        roomAvailability: true
      }
    });

    return NextResponse.json(refreshedRoomType, { status: 200 });
  } catch (error) {
    console.error("Error updating room type:", error);
    return NextResponse.json({ error: "Failed to update room type" }, { status: 500 });
  }
}

/**
 * DELETE: Remove a room type
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { hotelId: string; roomTypeId: string } }
) {
  try {
    const user = await authenticateToken(req);
    if (user instanceof Response) return user;

    const { hotelId, roomTypeId } = params;

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

    // Check if there are active reservations for this room type
    const activeReservations = await prisma.reservation.findFirst({
      where: {
        roomTypeId,
        status: "CONFIRMED"
      }
    });

    if (activeReservations) {
      return NextResponse.json({ 
        error: "Cannot delete room type with active reservations" 
      }, { status: 400 });
    }

    // Delete related entities first
    await prisma.amenities.deleteMany({ where: { roomTypeId } });
    await prisma.roomTypeImage.deleteMany({ where: { roomTypeId } });
    await prisma.roomAvailability.deleteMany({ where: { roomTypeId } });
    // Note: Reservations are cascade deleted as per schema
    
    // Finally delete the room type
    await prisma.roomType.delete({ where: { id: roomTypeId } });

    return NextResponse.json({ message: "Room type deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting room type:", error);
    return NextResponse.json({ error: "Failed to delete room type" }, { status: 500 });
  }
}
