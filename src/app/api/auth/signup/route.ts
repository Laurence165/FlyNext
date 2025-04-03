import { PrismaClient,Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { firstName, lastName, email, password, phone, role }: { 
    firstName: string; 
    lastName: string; 
    email: string; 
    password: string; 
    phone: string; 
    role?: string;
} = await req.json();
  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser)
    return NextResponse.json({ error: "User already exists" }, { status: 400 });

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  let userRole: Role = Role.USER
  if (role === "HOTEL_OWNER" || role === "hotel_owner")
    userRole = Role.HOTEL_OWNER;
  // Create user
  const user = await prisma.user.create({
    data: { firstName, lastName, email, password: hashedPassword, phone, role: userRole,},
  });

  // Generate JWT token
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  return NextResponse.json({ user, token }, { status: 201 });
}
