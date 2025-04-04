import { NextResponse } from "next/server";

export function middleware(request) {
  // For ALL requests, apply permissive CORS headers
  const headers = new Headers();

  // Allow everything
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "*");
  headers.set("Access-Control-Allow-Headers", "*");
  headers.set("Access-Control-Max-Age", "86400"); // Cache preflight for 24 hours

  // For preflight OPTIONS requests, return 200 immediately
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers,
    });
  }

  // For actual requests, apply headers to the response
  const response = NextResponse.next();
  headers.forEach((value, key) => {
    response.headers.set(key, value);
  });

  return response;
}

// Configure to apply to ALL paths
export const config = {
  matcher: [
    // Apply to ALL routes
    "/(.*)",
  ],
};
