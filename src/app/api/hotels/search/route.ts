import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Required filters
    const city = searchParams.get("city");
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");

    // Optional filters
    const name = searchParams.get("name")?.toLowerCase();
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
    const rating = searchParams.get("rating") ? Number(searchParams.get("rating")) : undefined;

    if (!city || !checkIn || !checkOut) {
      return NextResponse.json({ error: "City, check-in, and check-out dates are required" }, { status: 400 });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Fetch hotels with available rooms within the date range and price range
    const hotels = await prisma.hotel.findMany({
      where: {
        city,
        name: name ? { contains: name} : undefined, // Case-insensitive search
        starRating: rating ? { gte: rating } : undefined, // Filters hotels with at least this rating
        roomTypes: {
          some: {
            pricePerNight: {
              gte: minPrice ?? 0, // Minimum price filter
              lte: maxPrice ?? undefined, // Maximum price filter
            },
            rooms: {
              some: {
                availabilityStatus: "available",
                reservations: {
                  none: {
                    
                  },
                },
              },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        city: true,
        address: true,
        starRating: true,
        latitude: true,
        longitude: true,
        roomTypes: {
          select: {
            name: true,
            pricePerNight: true,
          },
        },
      },
    });

    // Calculate the minimum price for each hotel
    const hotelsWithPricing = hotels.map(hotel => ({
      ...hotel,
      startingPrice: hotel.roomTypes.length > 0 
        ? Math.min(...hotel.roomTypes.map(rt => rt.pricePerNight)) 
        : null,
    }));

    return NextResponse.json(hotelsWithPricing);
  } catch (error) {
    console.error("Error searching hotels:", error);
    return NextResponse.json({ error: "Failed to search hotels" }, { status: 500 });
  }
}
