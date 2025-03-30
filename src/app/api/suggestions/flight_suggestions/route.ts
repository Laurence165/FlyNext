import { NextResponse } from "next/server";
import { prisma } from "@/utils/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin") || "YYZ"; // Default to YYZ if not provided
  const reservationId = searchParams.get("reservation");

  // Validation
  if (!reservationId) {
    return NextResponse.json({ error: "Missing reservation ID" }, { status: 400 });
  }

  try {
    // Fetch reservation with related room and hotel details
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {


        roomType: {
            include: {
            hotel: true
            }
        }


      }
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // Extract required data
    const { checkInDate, checkOutDate } = reservation;
    const hotelCity = reservation.roomType?.hotel?.city;

    if (!hotelCity) {
      return NextResponse.json({ error: "Hotel city not found" }, { status: 400 });
    }
    const formattedCheckInDate = new Date(checkInDate).toISOString().split("T")[0];
    const formattedCheckOutDate = new Date(checkOutDate).toISOString().split("T")[0];

    console.log("🔹 Reservation Check-in:", checkInDate);
    console.log("🔹 Reservation Check-out:", checkOutDate);
    console.log("🔹 Hotel City:", hotelCity);

    // Call API via a GET request

    const roundtripApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/flights/roundtrip?origin=${encodeURIComponent(
        origin
      )}&destination=${encodeURIComponent(hotelCity)}&departDate=${formattedCheckInDate}&returnDate=${formattedCheckOutDate}`;
      
    console.log("🔹 Fetching flights from:", roundtripApiUrl);

    const flightResponse = await fetch(roundtripApiUrl, { method: "GET" });

    if (!flightResponse.ok) {
      throw new Error(`Failed to fetch flights: ${flightResponse.statusText}`);
    }

    const flights = await flightResponse.json();
    console.log("🔹 Flights Response:", flights);


    const outboundFlights = flights.outbound.flatMap((leg) =>
        leg.flights.map((flight) => ({
          id: flight.id,
          type: "outbound", 
          airline: flight.airline.name,
          flightNumber: flight.flightNumber,
          from: flight.origin.city,
          to: flight.destination.city,
          departureTime: flight.departureTime.split("T")[0],
          arrivalTime: flight.arrivalTime.split("T")[0], 
          duration: flight.duration,
          price: flight.price,
          currency: flight.currency,
          availableSeats: flight.availableSeats,
          status: flight.status,
          link: `${process.env.NEXT_PUBLIC_API_URL}/api/flights/search?origin=${encodeURIComponent(flight.origin.code)}&destination=${encodeURIComponent(flight.destination.code)}&date=${flight.departureTime.split("T")[0]}`
        }))
      );
      
      const returnFlights = flights.return.flatMap((leg) =>
        leg.flights.map((flight) => ({
          id: flight.id,
          type: "return", // ✅ Mark as return flight
          airline: flight.airline.name,
          flightNumber: flight.flightNumber,
          from: flight.origin.city,
          to: flight.destination.city,
          departureTime: flight.departureTime.split("T")[0], // Format as YYYY-MM-DD
          arrivalTime: flight.arrivalTime.split("T")[0], // Format as YYYY-MM-DD
          duration: flight.duration,
          price: flight.price,
          currency: flight.currency,
          availableSeats: flight.availableSeats,
          status: flight.status,
          link: `${process.env.NEXT_PUBLIC_API_URL}/api/flights/search?origin=${encodeURIComponent(flight.origin.code)}&destination=${encodeURIComponent(flight.destination.code)}&date=${flight.departureTime.split("T")[0]}`
        }))
      );
      
      console.log("🔹 Outbound Flights:", outboundFlights);
      console.log("🔹 Return Flights:", returnFlights);
      
      //
      const flightData = {
        outbound: outboundFlights,
        return: returnFlights
      };
      
      return NextResponse.json({ flights: flightData });
  } catch (error) {
    console.error("Error fetching reservation and flights:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
