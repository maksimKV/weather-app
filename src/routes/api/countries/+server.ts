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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const res = await fetch(`http://api.geonames.org/countryInfoJSON?username=${username}`, {
      signal: controller.signal
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
    
    // Filter out invalid countries
    const validCountries = data.geonames.filter((country: any) => 
      country && 
      country.countryCode && 
      country.countryName &&
      typeof country.countryCode === 'string' &&
      typeof country.countryName === 'string'
    );
    
    if (validCountries.length === 0) {
      throw new Error('No valid countries found in GeoNames response');
    }
    
    return json(validCountries);
  } catch (error) {
    console.error('Countries API error:', error);
    
    let errorMessage = 'Failed to fetch countries from GeoNames API';
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
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 