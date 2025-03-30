import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');
    const date = searchParams.get('date');
  
    // Validation
    if (!origin || !destination || !date) {
      return NextResponse.json({ error: 'Missing required parameters' }, {
        status: 400
      });
    }
  
    try {
      const afsUrl = new URL('https://advanced-flights-system.replit.app/api/flights');
      afsUrl.searchParams.append('origin', origin);
      afsUrl.searchParams.append('destination', destination);
      afsUrl.searchParams.append('date', date);
      console.log(afsUrl);
  
      const afsResponse = await fetch(afsUrl, {
        headers: {
          'x-api-key': process.env.AFS_API_KEY,
        },
      });
  
      const data = await afsResponse.json();
      console.log(data);
  
      return NextResponse.json(data, {
        status: afsResponse.status,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      return NextResponse.json({ error: 'Internal Server Error' }, {
        status: 500
      });
    }
  }