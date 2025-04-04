import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define protected routes that require authentication
const protectedRoutes = ["/profile", "/bookings", "/checkout", "/hotel-owner"];

// Define routes that are only accessible to hotel owners
const hotelOwnerRoutes = ["/hotel-owner"];

export function middleware(request: NextRequest) {
  // For development, temporarily disable middleware checks
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/bookings/:path*",
    "/checkout",
    "/hotel-owner/:path*",
  ],
};
