import { writable } from 'svelte/store';

export const countries = writable<
  { countryCode: string; countryName: string; population?: string }[]
>([]);
export const cities = writable<any[]>([]);
export const countriesLoaded = writable(false);
export const citiesLoaded = writable(false);
export const countryCityError = writable<string | null>(null);

export async function fetchAndCacheCountriesCities() {
  // Try to load from sessionStorage first
  const cachedCountries = sessionStorage.getItem('countries');
  const cachedCities = sessionStorage.getItem('cities');
  if (cachedCountries && cachedCities) {
    countries.set(JSON.parse(cachedCountries));
    cities.set(JSON.parse(cachedCities));
    countriesLoaded.set(true);
    citiesLoaded.set(true);
    countryCityError.set(null);
    return;
  }
  try {
    // Fetch countries as before
    const countriesRes = await fetch('/api/countries');
    if (!countriesRes.ok) {
      const errorData = await countriesRes.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch countries: ${countriesRes.status}`);
    }
    const countriesData = await countriesRes.json();
    countries.set(countriesData);
    sessionStorage.setItem('countries', JSON.stringify(countriesData));
    countriesLoaded.set(true);

    // Batch fetch all cities
    let allCities: any[] = [];
    let startRow = 0;
    const batchSize = 1000;
    let keepFetching = true;
    let batchCount = 0;
    const maxBatches = 10; // Limit to 10 batches (10,000 cities) to avoid rate limits

    while (keepFetching) {
      batchCount++;

      try {
        const res = await fetch(`/api/cities?maxRows=${batchSize}&startRow=${startRow}`);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to fetch cities batch ${batchCount}: ${res.status}`
          );
        }

        const responseText = await res.text();
        if (!responseText || responseText.trim() === '') {
          keepFetching = false;
          break;
        }

        const batch = JSON.parse(responseText);

        if (Array.isArray(batch) && batch.length > 0) {
          allCities = allCities.concat(batch);
          startRow += batchSize;

          // If less than batchSize returned, we're done
          if (batch.length < batchSize) {
            keepFetching = false;
          }

          // Safety limit to prevent infinite loops and rate limiting
          if (batchCount >= maxBatches) {
            keepFetching = false;
          }

          // Add a small delay between requests to avoid rate limiting
          if (keepFetching) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } else {
          keepFetching = false;
        }
      } catch (err: any) {
        console.error(`Error in batch ${batchCount}:`, err);
        // Continue with the cities we've already fetched instead of failing completely
        keepFetching = false;
      }
    }

    // Deduplicate by geonameId
    const uniqueCities = Array.from(new Map(allCities.map(c => [c.geonameId, c])).values());

    if (uniqueCities.length > 0) {
      cities.set(uniqueCities);
      sessionStorage.setItem('cities', JSON.stringify(uniqueCities));
      citiesLoaded.set(true);
      countryCityError.set(null);
    } else {
      countryCityError.set('No cities could be fetched from the API');
      citiesLoaded.set(false);
    }
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
      let uniqueNewCities: any[] = [];
      cities.update(currentCities => {
        // Add new cities, avoiding duplicates
        const existingIds = new Set(currentCities.map(c => c.geonameId));
        uniqueNewCities = newCities.filter(city => !existingIds.has(city.geonameId));
        return [...currentCities, ...uniqueNewCities];
      });
    }
  } catch (err) {
    console.error(`Error fetching cities for ${countryCode}:`, err);
  }
}
