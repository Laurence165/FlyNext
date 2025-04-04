import { NextResponse } from "next/server";

// Handle GET requests to /api
export async function GET() {
  return NextResponse.json({ message: "API is working" });
}
