import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");

    if (!city) {
      return NextResponse.json(
        { error: "City parameter is required" },
        { status: 400 }
      );
    }

    console.log("Searching hotels for city:", city);

    const hotels = await prisma.hotel.findMany({
      where: {
        city: {
          contains: city,
          mode: "insensitive",
        },
      },
      include: {
        roomTypes: {
          take: 1,
          orderBy: {
            pricePerNight: "asc",
          },
        },
      },
      take: 3,
    });

    console.log("Found hotels:", hotels.length);

    const formattedHotels = hotels.map((hotel) => ({
      id: hotel.id,
      name: hotel.name,
      starRating: hotel.starRating,
      price: hotel.roomTypes[0]?.pricePerNight || 0,
    }));

    return NextResponse.json({ hotels: formattedHotels });
  } catch (error) {
    console.error("Error in hotel suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch hotel suggestions", details: error.message },
      { status: 500 }
    );
  }
}
