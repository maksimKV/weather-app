import { json } from '@sveltejs/kit';

export async function GET({ url }) {
  const username = import.meta.env.VITE_GEONAMES_USERNAME;
  
  if (!username || username === 'your_geonames_username_here') {
    return new Response(JSON.stringify({ error: 'GeoNames username not configured. Please set VITE_GEONAMES_USERNAME in your .env file.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const q = url.searchParams.get('q');
  const country = url.searchParams.get('country'); // ISO country code
  const maxRows = url.searchParams.get('maxRows') || '10';

  try {
    let apiUrl = `http://api.geonames.org/searchJSON?featureClass=P&maxRows=${maxRows}&username=${username}`;
    if (q) apiUrl += `&name_startsWith=${encodeURIComponent(q)}`;
    if (country) apiUrl += `&country=${encodeURIComponent(country)}`;

    const res = await fetch(apiUrl);
    const data = await res.json();
    return json(data.geonames); // array of cities
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch cities from GeoNames API' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 