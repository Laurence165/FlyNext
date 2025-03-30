import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  const departDate = searchParams.get('departDate');
  const returnDate = searchParams.get('returnDate');
  
  // Validation
  if (!origin || !destination || !departDate || !returnDate) {
    return NextResponse.json({ error: 'Missing required parameters' }, {
      status: 400
    });
  }

  try {
    // Make two separate API calls
    const [departFlightsRes, returnFlightsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/flights/search?origin=${origin}&destination=${destination}&date=${departDate}`),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/flights/search?origin=${destination}&destination=${origin}&date=${returnDate}`)
    ]);

    if (!departFlightsRes.ok || !returnFlightsRes.ok) {
      throw new Error('Failed to fetch flights');
    }

    const departFlights = await departFlightsRes.json();
    const returnFlights = await returnFlightsRes.json();

    // Combine results into round trip options
    const roundTripOptions = {
      outbound: departFlights.results || [],
      return: returnFlights.results || [],
    };

    return NextResponse.json(roundTripOptions, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Round-trip search error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, {
      status: 500
    });
  }
}
