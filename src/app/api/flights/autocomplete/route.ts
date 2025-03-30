import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.toLowerCase() || '';
  
    try {
      const [citiesRes, airportsRes] = await Promise.all([
        fetch('https://advanced-flights-system.replit.app/api/cities', {
          headers: { 'x-api-key': process.env.AFS_API_KEY }
        }),
        fetch('https://advanced-flights-system.replit.app/api/airports', {
          headers: { 'x-api-key': process.env.AFS_API_KEY }
        })
      ]);
  
      if (!citiesRes.ok || !airportsRes.ok) throw new Error('AFS request failed');
  
      const [cities, airports] = await Promise.all([
        citiesRes.json(),
        airportsRes.json()
      ]);
  
      // Transform data
      const suggestions = [
        ...cities.map(c => ({
          type: 'city',
          name: c.city,
          country: c.country,
          code: c.city // Use city name as identifier
        })),
        ...airports.map(a => ({
          type: 'airport',
          code: a.code,
          name: a.name,
          city: a.city,
          country: a.country
        }))
      ];
  
      const filtered = suggestions.filter(s => {
        const searchable = [
          s.name?.toLowerCase(),
          s.code?.toLowerCase(),
          s.city?.toLowerCase(),
          s.country?.toLowerCase()
        ];
        return searchable.some(f => f?.includes(query));
      });
  
      return NextResponse.json(filtered, {
        status: 200,
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