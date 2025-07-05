import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

interface GeoNamesCity {
  name: string;
  lat: number;
  lng: number;
  countryCode?: string;
  countryName?: string;
  population?: number;
  geonameId?: number;
}

export async function GET({ url }: RequestEvent) {
  const username = import.meta.env.VITE_GEONAMES_USERNAME;
  console.log('API: Cities endpoint called, username:', username);

  if (!username || username === 'your_geonames_username_here') {
    console.error('API: GeoNames username not configured');
    return new Response(
      JSON.stringify({
        error:
          'GeoNames username not configured. Please set VITE_GEONAMES_USERNAME in your .env file.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const q = url.searchParams.get('q');
  const country = url.searchParams.get('country'); // ISO country code
  const maxRows = url.searchParams.get('maxRows') || '1000';
  const startRow = url.searchParams.get('startRow') || '0';

  console.log('API: Request parameters:', { q, country, maxRows, startRow });

  try {
    // Validate parameters
    const maxRowsNum = parseInt(maxRows);
    const startRowNum = parseInt(startRow);

    if (isNaN(maxRowsNum) || maxRowsNum < 1 || maxRowsNum > 1000) {
      return new Response(JSON.stringify({ error: 'Invalid maxRows parameter (must be 1-1000)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (isNaN(startRowNum) || startRowNum < 0) {
      return new Response(JSON.stringify({ error: 'Invalid startRow parameter (must be >= 0)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let apiUrl = `http://api.geonames.org/searchJSON?featureClass=P&maxRows=${maxRows}&startRow=${startRow}&username=${username}`;
    if (q) apiUrl += `&name_startsWith=${encodeURIComponent(q)}`;
    if (country) apiUrl += `&country=${encodeURIComponent(country)}`;

    console.log('API: Calling GeoNames API:', apiUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const res = await fetch(apiUrl, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('API: GeoNames response status:', res.status, res.statusText);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('API: GeoNames API error response:', errorText);
      throw new Error(`GeoNames API responded with status ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    console.log('API: GeoNames response data keys:', Object.keys(data));
    console.log('API: GeoNames geonames array length:', data.geonames?.length || 'undefined');

    // Validate response structure
    if (!data || !data.geonames || !Array.isArray(data.geonames)) {
      console.error('API: Invalid response structure:', data);
      throw new Error('Invalid response format from GeoNames API');
    }

    // Debug: Log first few cities to see their structure
    if (data.geonames.length > 0) {
      console.log('API: First city structure:', JSON.stringify(data.geonames[0], null, 2));
      console.log('API: First city keys:', Object.keys(data.geonames[0]));
    }

    // Filter out invalid cities and convert lat/lng to numbers
    console.log('API: Starting validation of', data.geonames.length, 'cities');
    
    const step1 = data.geonames.filter(
      (city: any) =>
        city &&
        city.name &&
        city.lat &&
        city.lng &&
        typeof city.name === 'string'
    );
    console.log('API: Step 1 - cities with required fields:', step1.length);
    
    const step2 = step1.map((city: any) => ({
      ...city,
      lat: parseFloat(city.lat),
      lng: parseFloat(city.lng)
    }));
    console.log('API: Step 2 - cities after lat/lng conversion:', step2.length);
    
    const validCities = step2.filter(
      (city: any) =>
        !isNaN(city.lat) &&
        !isNaN(city.lng) &&
        typeof city.lat === 'number' &&
        typeof city.lng === 'number'
    );
    console.log('API: Step 3 - cities after final validation:', validCities.length);

    console.log('API: Valid cities count:', validCities.length);
    return json(validCities);
  } catch (error) {
    let errorMessage = 'Failed to fetch cities from GeoNames API';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout - please try again';
        statusCode = 408;
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Network error - please check your connection';
        statusCode = 503;
      } else {
        errorMessage = error.message;
      }
    }

    console.error('API: Error details:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
