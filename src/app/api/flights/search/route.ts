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
      const afsBaseUrl = process.env.AFS_BASE_URL;
      if (!afsBaseUrl) {
        throw new Error("AFS_BASE_URL is not defined in the environment variables.");
      }
      
      // Construct the full URL with /api/flights
      const afsUrl = new URL(`${afsBaseUrl}/api/flights`);
      afsUrl.searchParams.append('origin', origin);
      afsUrl.searchParams.append('destination', destination);
      afsUrl.searchParams.append('date', date);
      console.log("AFS URL:", afsUrl.toString());
  
      const afsApiKey = process.env.AFS_API_KEY;
      if (!afsApiKey) {
        throw new Error("AFS_API_KEY is not defined in the environment variables.");
      }
  
      const afsResponse = await fetch(afsUrl, {
        headers: {
          'x-api-key': afsApiKey,
        },
      });
  
      if (!afsResponse.ok) {
        const errorText = await afsResponse.text(); // Get the response as text
        console.error("AFS API Error:", errorText); // Log the error response
        throw new Error(`AFS API Error: ${afsResponse.status} ${errorText}`);
      }
  
      const data = await afsResponse.json();
      console.log(data);
  
      return NextResponse.json(data, {
        status: afsResponse.status,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      console.error("Error processing flight search:", error);
      return NextResponse.json({ error: 'Internal Server Error' }, {
        status: 500
      });
    }
  }