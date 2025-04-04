import Cors from "cors";
import { NextResponse } from "next/server";

// Helper method to initialize the middleware
export function initMiddleware(middleware) {
  return (req, res) =>
    new Promise((resolve, reject) => {
      middleware(req, res, (result) => {
        if (result instanceof Error) {
          return reject(result);
        }
        return resolve(result);
      });
    });
}

// Initialize the cors middleware
const cors = initMiddleware(
  Cors({
    methods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

// Create a middleware function that will be applied to all API routes
export async function middleware(req) {
  // For API routes, apply CORS
  if (req.nextUrl.pathname.startsWith("/api/")) {
    const res = NextResponse.next();

    // Apply CORS headers
    res.headers.set(
      "Access-Control-Allow-Origin",
      process.env.ALLOWED_ORIGINS || "*"
    );
    res.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.headers.set("Access-Control-Allow-Credentials", "true");

    // Handle OPTIONS requests specially
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: res.headers,
      });
    }

    return res;
  }

  return NextResponse.next();
}
