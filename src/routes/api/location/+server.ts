import { json } from '@sveltejs/kit';

interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country_name?: string;
  country_code?: string;
}

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'WeatherApp/1.0',
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded. Please try again later.',
            code: 'RATE_LIMIT',
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      throw new Error(`IP API responded with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Validate and transform the response
    if (!data || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
      throw new Error('Invalid response format from IP API');
    }

    const locationData: LocationData = {
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city || undefined,
      country_name: data.country_name || undefined,
      country_code: data.country_code || undefined,
    };

    return json(locationData);
  } catch (error) {
    let errorMessage = 'Failed to fetch location data';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout - please try again';
        statusCode = 408;
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Network error - please check your connection';
        statusCode = 503;
      } else if (error.message.includes('Rate limit')) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
        statusCode = 429;
      } else {
        errorMessage = error.message;
      }
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        code: statusCode === 429 ? 'RATE_LIMIT' : 'LOCATION_ERROR',
      }),
      {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
