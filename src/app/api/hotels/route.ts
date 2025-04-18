import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "@/app/api/middleware";
import { NextRequest, NextResponse } from "next/server";
const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Parse query parameters
    const url = new URL(req.url);
    const city = url.searchParams.get("city");
    const name = url.searchParams.get("name");
    const minStarRating = url.searchParams.get("minStarRating");
    const maxStarRating = url.searchParams.get("maxStarRating");
    const minPrice = url.searchParams.get("minPrice");
    const maxPrice = url.searchParams.get("maxPrice");
    const guests = url.searchParams.get("guests");

    // Build filter object
    const filters: any = {};
    console.log(guests);
    if (guests) {
      filters.roomTypes = {
        some: {
          totalRooms: {
            gte: Number(guests),
          },
        },
      };
    }
    if (city) {
      filters.city = city;
    }

    if (name) {
      filters.name = {
        contains: name, // Case-insensitive search
      };
    }

    if (minStarRating || maxStarRating) {
      filters.starRating = {
        gte: minStarRating ? Number(minStarRating) : undefined,
        lte: maxStarRating ? Number(maxStarRating) : undefined,
      };
    }

    // Handle price range filter (pricePerNight)
    if (minPrice || maxPrice) {
      // If filters.roomTypes is already defined (for guests), we merge the price filter with it
      filters.roomTypes = filters.roomTypes || {};
      filters.roomTypes.some = {
        ...filters.roomTypes.some,
        pricePerNight: {
          gte: minPrice ? Number(minPrice) : undefined,
          lte: maxPrice ? Number(maxPrice) : undefined,
        },
      };
    }

    // Fetch hotels based on filters
    const hotels = await prisma.hotel.findMany({
      where: filters,
      include: {
        images: true,
        roomTypes: {
          select: {
            id: true,
            name: true,
            pricePerNight: true,
            images: true,
            amenities: true,
            totalRooms: true,
          },
        },
      },
    });

    return NextResponse.json(hotels, { status: 200 });
  } catch (error) {
    console.error("Error fetching hotels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await authenticateToken(req);
  if (user instanceof Response) return user;

  try {
    const body = await req.json();
    let { name, address, city, latitude, longitude, starRating, logo, images } =
      body;

    // Check if latitude and longitude are missing, and set them to 0 if so
    if (!latitude) {
      latitude = 0;
    }
    if (!longitude) {
      longitude = 0;
    }

    console.log(!name, !address, !city, !latitude, !longitude, !starRating);

    // Validate required fields
    if (!name || !address || !city || !starRating) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate images if provided
    if (
      images &&
      (!Array.isArray(images) ||
        !images.every((img) => typeof img === "string"))
    ) {
      return NextResponse.json(
        { error: "Images must be an array of URLs" },
        { status: 400 }
      );
    }

    // Create hotel with optional logo
    const hotel = await prisma.hotel.create({
      data: {
        name,
        address,
        city,
        latitude,
        longitude,
        starRating,
        logo,
        ownerId: user.id,
        // Create HotelImage entries if images array is provided
        ...(images && images.length > 0
          ? {
              images: {
                create: images.map((url: string) => ({ url })),
              },
            }
          : {}),
      },
      // Include images in the response
      include: {
        images: true,
      },
    });

    if (user.role === "USER") {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "HOTEL_OWNER" },
      });
    }

    return NextResponse.json(hotel, { status: 201 });
  } catch (error) {
    console.error("Error creating hotel:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const user = await authenticateToken(req);
  if (user instanceof Response) return user;

  const { id, name, address, city, latitude, longitude, starRating } =
    await req.json();

  const hotel = await prisma.hotel.findUnique({ where: { id } });
  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  if (hotel.ownerId !== user.id) {
    return NextResponse.json(
      {
        error: "Forbidden: You are not the owner of this hotel",
      },
      { status: 403 }
    );
  }

  const updatedHotel = await prisma.hotel.update({
    where: { id },
    data: { name, address, city, latitude, longitude, starRating },
  });

  return NextResponse.json(updatedHotel, { status: 200 });
}

export async function DELETE(req: NextRequest) {
  const user = await authenticateToken(req);
  if (user instanceof Response) return user;

  const { id } = await req.json();

  const hotel = await prisma.hotel.findUnique({ where: { id } });
  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  if (hotel.ownerId !== user.id) {
    return NextResponse.json(
      {
        error: "Forbidden: You are not the owner of this hotel",
      },
      { status: 403 }
    );
  }

  await prisma.hotel.delete({ where: { id } });

  return NextResponse.json(
    { message: "Hotel deleted successfully" },
    { status: 200 }
  );
}
