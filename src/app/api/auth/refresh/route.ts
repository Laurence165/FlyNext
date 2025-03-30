import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token is required" },
        { status: 401 }
      );
    }

    // Attempt to verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    // Ensure the token is specifically a refresh token
    if (decoded.type !== "refresh") {
      return NextResponse.json(
        { error: "Invalid token type. Expected refresh token." },
        { status: 401 }
      );
    }

    console.log("User ID from token:", decoded.id);

    // Validate that the user exists in the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Generate a new access token
    const newAccessToken = jwt.sign(
      { id: user.id, type: "access" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // Generate a new refresh token for security (token rotation)
    const newRefreshToken = jwt.sign(
      { id: user.id, type: "refresh" },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
