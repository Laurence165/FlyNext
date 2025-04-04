import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define protected routes that require authentication
const protectedRoutes = ["/profile", "/bookings", "/checkout", "/hotel-owner"]

// Define routes that are only accessible to hotel owners
const hotelOwnerRoutes = ["/hotel-owner"]

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value
  //console.log(token)
  const path = request.nextUrl.pathname

  // Check if the path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route))

  // Check if the path is a hotel owner route
  const isHotelOwnerRoute = hotelOwnerRoutes.some((route) => path.startsWith(route))

  // If the route is protected and there's no token, redirect to login
  //console.log(isProtectedRoute + " " + !token)
  if (isProtectedRoute && !token) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", path)
    return NextResponse.redirect(url)
  }

  // If the route is for hotel owners, check if the user is a hotel owner
  if (isHotelOwnerRoute) {
    // decode jwt
    // For frontend testing purposes, we'll just check if there exist special hotel owner cookie
    const isHotelOwner = request.cookies.get("isHotelOwner")?.value === "true"
    console.log("NO access")
    if (!isHotelOwner) {
      throw new Error("No access Error")
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all protected routes
    "/profile/:path*",
    "/bookings/:path*",
    "/checkout",
    "/hotel-owner/:path*",
  ],
}

