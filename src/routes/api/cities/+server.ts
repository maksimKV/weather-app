import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

interface GeoNamesCity {
  name: string;
  lat: string | number;
  lng: string | number;
  countryCode?: string;
  countryName?: string;
  population?: number;
  geonameId?: number;
  [key: string]: unknown;
}

export async function GET({ url }: RequestEvent) {
  const username = import.meta.env.VITE_GEONAMES_USERNAME;

  if (!username || username === 'your_geonames_username_here') {
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const res = await fetch(apiUrl, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`GeoNames API responded with status ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();

    // Validate response structure
    if (!data || !data.geonames || !Array.isArray(data.geonames)) {
      throw new Error('Invalid response format from GeoNames API');
    }

    // Filter out invalid cities and convert lat/lng to numbers
    const step1 = data.geonames.filter(
      (city: GeoNamesCity) =>
        city && city.name && city.lat && city.lng && typeof city.name === 'string'
    );

    const step2 = step1.map((city: GeoNamesCity) => ({
      ...city,
      lat: parseFloat(city.lat as string),
      lng: parseFloat(city.lng as string),
    }));

    const validCities = step2.filter(
      (city: GeoNamesCity) =>
        !isNaN(city.lat as number) &&
        !isNaN(city.lng as number) &&
        typeof city.lat === 'number' &&
        typeof city.lng === 'number'
    );

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
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
