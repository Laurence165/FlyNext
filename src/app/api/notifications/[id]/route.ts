import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "@/app/api/middleware";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await authenticateToken(req);
  if (user instanceof NextResponse) return user;

  try {
    const { id } = params;

    const notification = await prisma.notification.update({
      where: { id, userId: user.id }, // Ensures user can only mark their own notifications
      data: { read: true },
    });

    return NextResponse.json(notification, { status: 200 });
  } catch (error) {
    console.error("ERROR MARKING NOTIFICATION AS READ:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
