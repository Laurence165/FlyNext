import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "@/app/api/middleware";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();
export async function GET(req: Request) {
  const user = await authenticateToken(req);
  if (user instanceof NextResponse) return user;

  try {
    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, read: false },
    });

    return NextResponse.json({ unreadCount }, { status: 200 });
  } catch (error) {
    console.error("ERROR FETCHING UNREAD COUNT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
