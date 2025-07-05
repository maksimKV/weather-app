import { writable } from 'svelte/store';
import { cities } from './index';
import type { City, Country } from '../lib/types';
import { logDevError } from '../lib/utils';

interface RawCity {
  geonameId: number;
  name: string;
  lat: number;
  lng?: number;
  lon?: number;
  countryCode?: string;
  countryName?: string;
  population?: number;
}

export const countries = writable<Country[]>([]);
export const countriesLoaded = writable(false);
export const countryCityError = writable<string | null>(null);

export async function fetchAndCacheCountriesCities() {
  // Try to load from sessionStorage first
  let cachedCountries: string | null = null;
  let cachedCities: string | null = null;

  if (typeof window !== 'undefined') {
    cachedCountries = sessionStorage.getItem('countries');
    cachedCities = sessionStorage.getItem('cities');
  }

  if (cachedCountries && cachedCities) {
    countries.set(JSON.parse(cachedCountries));
    cities.set(JSON.parse(cachedCities));
    countriesLoaded.set(true);
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
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('countries', JSON.stringify(countriesData));
    }
    countriesLoaded.set(true);

    // Batch fetch all cities
    let allCities: RawCity[] = [];
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
      } catch (error) {
        logDevError('Error fetching cities batch:', error);
        // Continue with the cities we've already fetched instead of failing completely
        keepFetching = false;
      }
    }

    // Deduplicate by geonameId and normalize to the correct City interface
    const uniqueCities = Array.from(new Map(allCities.map(c => [c.geonameId, c])).values()).map(
      (c: RawCity) => ({
        name: c.name,
        lat: c.lat,
        lon: c.lng || c.lon || 0,
        country: c.countryCode || c.countryName || 'Unknown',
        countryCode: c.countryCode,
        geonameId: c.geonameId,
      })
    );

    if (uniqueCities.length > 0) {
      cities.set(uniqueCities);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('cities', JSON.stringify(uniqueCities));
      }
      countryCityError.set(null);
    } else {
      countryCityError.set('No cities could be fetched from the API');
    }
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Unknown error fetching countries/cities';
    countryCityError.set(errorMessage);
    countriesLoaded.set(false);
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
      const newCities = citiesData.map((city: RawCity) => ({
        name: city.name,
        lat: city.lat,
        lon: city.lng || city.lon || 0,
        country: city.countryCode || city.countryName || 'Unknown',
        countryCode: city.countryCode,
        geonameId: city.geonameId,
      }));
      cities.update((currentCities: City[]) => {
        // Add new cities, avoiding duplicates
        const existingIds = new Set(currentCities.map((c: City) => c.geonameId));
        const uniqueNewCities = newCities.filter(city => !existingIds.has(city.geonameId));
        return [...currentCities, ...uniqueNewCities];
      });
    }
  } catch (error) {
    logDevError('Error fetching additional cities for country:', error);
    // Continue with what we have
  }
}
