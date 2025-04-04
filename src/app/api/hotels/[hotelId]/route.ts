import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "@/app/api/middleware";

const prisma = new PrismaClient();

/**
 * GET handler to retrieve a specific hotel by ID
 * Includes hotel details, room types, images, and amenities
 */
export async function GET(
  req: Request,
  { params }: { params: { hotelId: string } }
) {
  try {
    const { hotelId } = await params;
    
    // Fetch hotel with related data based on the schema
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      include: {
        roomTypes: {
          include: {
            images: true,
            amenities: true,
            roomAvailability: true
          }
        },
        images: true,
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profilePic: true
          }
        }
      }
    });

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    return NextResponse.json(hotel, { status: 200 });
  } catch (error) {
    console.error("Error fetching hotel:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PUT handler to update hotel information
 * Requires authentication and ownership verification
 */
export async function PUT(
  req: Request,
  { params }: { params: { hotelId: string } }
) {
  const user = await authenticateToken(req);
  if (user instanceof Response) return user;

  try {
    const { hotelId } = await params;
    const body = await req.json();
    const { name, logo, address, city, latitude, longitude, starRating, images } = body;
    
    // Verify hotel exists
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId }
    });

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    // Verify ownership
    if (hotel.ownerId !== user.id) {
      return NextResponse.json({
        error: "Forbidden: You are not the owner of this hotel"
      }, { status: 403 });
    }

    // Update hotel basic info
    const updatedHotel = await prisma.hotel.update({
      where: { id: hotelId },
      data: { 
        name, 
        logo, 
        address, 
        city, 
        latitude, 
        longitude, 
        starRating 
      },
      include: {
        images: true
      }
    });

    // Handle images update if provided
    if (images && Array.isArray(images)) {
      // Delete existing images
      await prisma.hotelImage.deleteMany({
        where: { hotelId }
      });
      
      // Add new images
      if (images.length > 0) {
        await prisma.hotelImage.createMany({
          data: images.map(url => ({
            url,
            hotelId
          }))
        });
      }
      
      // Fetch the hotel again with updated images
      const updatedHotelWithImages = await prisma.hotel.findUnique({
        where: { id: hotelId },
        include: { images: true }
      });
      
      return NextResponse.json(updatedHotelWithImages, { status: 200 });
    }

    return NextResponse.json(updatedHotel, { status: 200 });
  } catch (error) {
    console.error("Error updating hotel:", error);
    return NextResponse.json({ error: "Failed to update hotel" }, { status: 400 });
  }
}

/**
 * DELETE handler to remove a hotel
 * Requires authentication and ownership verification
 */
export async function DELETE(
  req: Request,
  { params }: { params: { hotelId: string } }
) {
  const user = await authenticateToken(req);
  if (user instanceof Response) return user;

  try {
    const { hotelId } = params;
    
    // Verify hotel exists
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId }
    });

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    // Verify ownership
    if (hotel.ownerId !== user.id) {
      return NextResponse.json({
        error: "Forbidden: You are not the owner of this hotel"
      }, { status: 403 });
    }

    // Delete hotel
    await prisma.hotel.delete({
      where: { id: hotelId },
    });

    return NextResponse.json({ message: "Hotel deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting hotel:", error);
    return NextResponse.json({ error: "Failed to delete hotel" }, { status: 400 });
  }
}

/**
 * PATCH handler for operations like adding images
 * Can be extended for other partial updates
 */
export async function PATCH(
  req: Request,
  { params }: { params: { hotelId: string } }
) {
  const user = await authenticateToken(req);
  if (user instanceof Response) return user;

  try {
    const { hotelId } = params;
    const { operation, data } = await req.json();
    
    // Verify hotel exists
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId }
    });

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    // Verify ownership
    if (hotel.ownerId !== user.id) {
      return NextResponse.json({
        error: "Forbidden: You are not the owner of this hotel"
      }, { status: 403 });
    }

    // Handle different operations
    switch (operation) {
      case "addImage":
        const { url } = data;
        if (!url) {
          return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }
        const image = await prisma.hotelImage.create({
          data: {
            url,
            hotelId
          }
        });
        return NextResponse.json(image, { status: 200 });
      
      case "deleteImage":
        const { imageId } = data;
        if (!imageId) {
          return NextResponse.json({ error: "Image ID is required" }, { status: 400 });
        }
        
        // Verify image belongs to this hotel
        const imageToDelete = await prisma.hotelImage.findUnique({
          where: { id: imageId }
        });
        
        if (!imageToDelete || imageToDelete.hotelId !== hotelId) {
          return NextResponse.json({ error: "Image not found or does not belong to this hotel" }, { status: 404 });
        }
        
        await prisma.hotelImage.delete({
          where: { id: imageId }
        });
        
        return NextResponse.json({ message: "Image deleted successfully" }, { status: 200 });
        
      default:
        return NextResponse.json({ error: "Invalid operation" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in PATCH operation:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 400 });
  }
}
