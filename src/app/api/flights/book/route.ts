import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from "@/app/api/middleware";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    // Authenticate the user first
    const user = await authenticateToken(request);
    if (!(user instanceof Object)) {
        return user; // Return the error response if authentication failed
    }

    try {
        const body = await request.json();
        
        // Ensure all required fields are present
        if (!body.flightIds || !Array.isArray(body.flightIds) || !body.passportNumber) {
            return NextResponse.json({ 
                error: "Flight IDs and passportNumber are required" 
            }, { status: 400 });
        }

        // Create booking payload for AFS API with all required fields
        const afsPayload = {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            passportNumber: body.passportNumber,
            flightIds: body.flightIds
        };
        
        // Call AFS to book the flight
        const afsResponse = await fetch('https://advanced-flights-system.replit.app/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.AFS_API_KEY || ''
            },
            body: JSON.stringify(afsPayload)
        });
  
        const afsData = await afsResponse.json();
        
        console.log("AFS response:", afsData); // Debug the response

        // If AFS booking was successful, forward to our booking API
        if (afsResponse.ok) {
            // Prepare flight data for each flight in the booking
            const flightDataArray = afsData.flights.map((flight: any) => ({
                afsFlightId: flight.id,
                departureTime: flight.departureTime,
                arrivalTime: flight.arrivalTime,
                source: `${flight.origin.code} (${flight.origin.city}, ${flight.origin.country})`,
                destination: `${flight.destination.code} (${flight.destination.city}, ${flight.destination.country})`,
                price: flight.price,
                status: 'CONFIRMED'
            }));
            
            // Get the auth token from request headers to pass to the booking API
            const authHeader = request.headers.get('Authorization');
            
            // Call our central booking API to create the booking
            const bookingResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/booking`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader || ''
                },
                body: JSON.stringify({
                    flightData: flightDataArray,
                    // No hotelReservationData as this is just a flight booking
                })
            });
            
            const bookingData = await bookingResponse.json();
            
            // If booking was successful, return both AFS response and our booking data
            if (bookingResponse.ok) {
                return NextResponse.json({
                    bookingId: bookingData.id,
                    bookingDetails: bookingData
                }, {
                    status: 200
                });
            } else {
                // If our booking API failed, return the error
                return NextResponse.json(bookingData, {
                    status: bookingResponse.status
                });
            }
        }
        
        // If AFS booking failed, just return the AFS response
        return NextResponse.json(afsData, {
            status: afsResponse.status
        });
    } catch (error) {
        console.error("Error booking flight:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, {
            status: 500
        });
    }
}