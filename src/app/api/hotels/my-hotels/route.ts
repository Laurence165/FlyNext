import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "@/app/api/middleware";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    // Authenticate the user
    const user = await authenticateToken(req);
    if (user instanceof Response) return user;

    // Fetch hotels owned by the user
    const hotels = await prisma.hotel.findMany({
      where: {
        ownerId: user.id
      },
      include: {
        images: true,
        roomTypes: {
          select: {
            id: true,
            name: true,
            pricePerNight: true,
          },
        },
      },
    });

    return NextResponse.json(hotels, { status: 200 });
  } catch (error) {
    console.error("Error fetching user's hotels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}