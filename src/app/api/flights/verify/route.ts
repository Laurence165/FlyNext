import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from "@/app/api/middleware";

export async function GET(request: NextRequest) {
    // Authenticate the user first
    const user = await authenticateToken(request);
    if (!(user instanceof Object)) {
        return user; // Return the error response if authentication failed
    }

    try {
        // Get booking reference from query parameters
        const { searchParams } = new URL(request.url);
        const bookingReference = searchParams.get('bookingReference');

        // Validate booking reference
        if (!bookingReference) {
            return NextResponse.json({ 
                error: "Booking reference is required" 
            }, { status: 400 });
        }

        // Use the authenticated user's last name
        const lastName = user.lastName;

        // Construct the URL to verify booking with AFS
        const afsUrl = new URL('https://advanced-flights-system.replit.app/api/bookings/retrieve');
        afsUrl.searchParams.append('lastName', lastName);
        afsUrl.searchParams.append('bookingReference', bookingReference);
        
        // Call AFS to verify the booking
        const afsResponse = await fetch(afsUrl, {
            headers: {
                'x-api-key': process.env.AFS_API_KEY || ''
            }
        });

        const data = await afsResponse.json();

        // Return the verified booking information
        return NextResponse.json(data, {
            status: afsResponse.status
        });

    } catch (error) {
        console.error("Error verifying flight:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, {
            status: 500
        });
    }
}
