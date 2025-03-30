import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "@/app/api/middleware";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET /api/users/me - Fetch the current user's profile
export async function GET(req: NextRequest) {
  const user = await authenticateToken(req);
  console.log("Authenticated User:", user); // Log the user object

  if (user instanceof NextResponse) return user; // Unauthorized or Forbidden response

  // Ensure user.id is available
  if (!user.id) {
    console.error("User ID not found in token");
    return NextResponse.json({ error: "User ID not found" }, { status: 401 });
  }

  const userData = await prisma.user.findUnique({
    where: { id: user.id }, // Ensure user.id is available
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      profilePic: true,
      role: true,
    },
  });

  if (!userData) {
    console.error("User not found in database");
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({user: userData}, { status: 200 });
}

export async function PUT(req: NextRequest) {
  // Authenticate user
  const user = await authenticateToken(req);
  console.log("Authenticated User:", user); // Log the user object

  if (user instanceof NextResponse) return user; // Handle unauthorized

  // Ensure user.id is available
  if (!user.id) {
    console.error("User ID not found in token");
    return NextResponse.json({ error: "User ID not found" }, { status: 401 });
  }
  // Parse request body
  const updates = await req.json();

  // Validate email (if provided and changed)
  if (updates.email && updates.email !== user.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: updates.email },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }
  }

  console.log(user.id)
  // Fetch the current user profile
  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Apply updates (only provided fields)
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName: updates.firstName ?? currentUser.firstName,
      lastName: updates.lastName ?? currentUser.lastName,
      email: updates.email ?? currentUser.email,
      phone: updates.phone ?? currentUser.phone,
      profilePic: updates.profilePic ?? currentUser.profilePic,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      profilePic: true,
    },
  });

  return NextResponse.json(updatedUser);
}