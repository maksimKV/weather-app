import { json } from '@sveltejs/kit';

export async function GET() {
  const username = import.meta.env.VITE_GEONAMES_USERNAME;
  
  if (!username || username === 'your_geonames_username_here') {
    return new Response(JSON.stringify({ error: 'GeoNames username not configured. Please set VITE_GEONAMES_USERNAME in your .env file.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const res = await fetch(`http://api.geonames.org/countryInfoJSON?username=${username}`);
    const data = await res.json();
    return json(data.geonames); // array of countries
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch countries from GeoNames API' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 