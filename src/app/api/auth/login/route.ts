import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password)
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      );

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );

    // Generate access token
    const accessToken = jwt.sign(
      { id: user.id, type: "access" },
      process.env.JWT_SECRET!,
      {
        expiresIn: "15m",
      }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: user.id, type: "refresh" },
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET!,
      {
        expiresIn: "7d",
      }
    );
    console.log(user.id);
    return NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          profilePic: user.profilePic,
        },
        accessToken,
        refreshToken,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
