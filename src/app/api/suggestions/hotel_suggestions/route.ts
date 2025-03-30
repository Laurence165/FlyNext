import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/db"; // Assuming Prisma is set up
import {getHotelSuggestions } from "@/lib/suggestions"; // Functions to fetch data

export async function GET(request: NextRequest) {
    try {
      const { searchParams } = new URL(request.url);
      const incomingFlightId = searchParams.get("IncomingFlightId");
      const outgoingFlightId = searchParams.get("OutgoingFlightId");
  
      if (!incomingFlightId) {
        return NextResponse.json({ error: "Must have Incoming Flight" }, { status: 400 });
      }
      
      // Fetch incoming flight details
      const incomingFlight = await prisma.flight.findUnique({ where: { id: incomingFlightId } });
      if (!incomingFlight) {
        return NextResponse.json({ error: "Incoming flight not found" }, { status: 404 });
      }
  
      const city = incomingFlight.destination;
      const checkinTime = incomingFlight.arrivalTime.toISOString().split("T")[0];
      let checkOutTime = null;
  
      // Fetch outgoing flight details if provided
      if (outgoingFlightId) {
        const outgoingFlight = await prisma.flight.findUnique({ where: { id: outgoingFlightId } });
        if (outgoingFlight) {
          checkOutTime = outgoingFlight.departureTime.toISOString().split("T")[0];
        }
      }
      
      let hotels = [];
      if (city) {
        // Fetch hotel suggestions for the given city
        hotels = await getHotelSuggestions(city, checkinTime, checkOutTime);
      }
  
      return NextResponse.json({ hotels });
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
    }
  }
  
