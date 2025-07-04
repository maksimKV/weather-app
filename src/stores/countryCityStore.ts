import { writable } from 'svelte/store';

export const countries = writable<{ code: string; name: string }[]>([]);
export const cities = writable<{ name: string; lat: number; lon: number; country: string }[]>([]);
export const countriesLoaded = writable(false);
export const citiesLoaded = writable(false);
export const countryCityError = writable<string | null>(null);

export async function fetchAndCacheCountriesCities() {
  console.log('fetchAndCacheCountriesCities called');
  // Try to load from sessionStorage first
  const cachedCountries = sessionStorage.getItem('countries');
  const cachedCities = sessionStorage.getItem('cities');
  if (cachedCountries && cachedCities) {
    console.log('Loading from cache');
    countries.set(JSON.parse(cachedCountries));
    cities.set(JSON.parse(cachedCities));
    countriesLoaded.set(true);
    citiesLoaded.set(true);
    countryCityError.set(null);
    return;
  }
  console.log('Fetching from API');
  try {
    const [countriesRes, citiesRes] = await Promise.all([
      fetch('/api/countries'),
      fetch('/api/cities?maxRows=5000') // Increased to get more cities
    ]);
    
    if (!countriesRes.ok) {
      const errorData = await countriesRes.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch countries: ${countriesRes.status}`);
    }
    
    if (!citiesRes.ok) {
      const errorData = await citiesRes.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch cities: ${citiesRes.status}`);
    }
    
    const countriesData = await countriesRes.json();
    const citiesData = await citiesRes.json();
    
    if (!Array.isArray(countriesData) || !Array.isArray(citiesData)) {
      throw new Error('Invalid data format received from API');
    }
    
    console.log('Fetched countries:', countriesData.length, 'cities:', citiesData.length);
    
    countries.set(countriesData);
    cities.set(citiesData.map((city: any) => ({ ...city, lon: city.lng })));
    sessionStorage.setItem('countries', JSON.stringify(countriesData));
    sessionStorage.setItem('cities', JSON.stringify(citiesData.map((city: any) => ({ ...city, lon: city.lng }))));
    countriesLoaded.set(true);
    citiesLoaded.set(true);
    countryCityError.set(null);
  } catch (err: any) {
    console.error('Error fetching countries/cities:', err);
    countryCityError.set(err.message || 'Unknown error fetching countries/cities');
    countriesLoaded.set(false);
    citiesLoaded.set(false);
  }
}

// Function to fetch additional cities for a specific country
export async function fetchCitiesForCountry(countryCode: string) {
  try {
    const res = await fetch(`/api/cities?country=${countryCode}&maxRows=50`);
    if (!res.ok) {
      throw new Error(`Failed to fetch cities for ${countryCode}`);
    }
    const citiesData = await res.json();
    if (Array.isArray(citiesData)) {
      const newCities = citiesData.map((city: any) => ({ ...city, lon: city.lng }));
      cities.update(currentCities => {
        // Add new cities, avoiding duplicates
        const existingNames = new Set(currentCities.map(c => c.name + c.country));
        const uniqueNewCities = newCities.filter(city => 
          !existingNames.has(city.name + city.country)
        );
        console.log(`Added ${uniqueNewCities.length} cities for ${countryCode}`);
        return [...currentCities, ...uniqueNewCities];
      });
    }
  } catch (err) {
    console.error(`Error fetching cities for ${countryCode}:`, err);
  }
} 