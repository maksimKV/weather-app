// ============================================================================
// DATA SERVICE - Handles Country/City API Operations
// ============================================================================

import { actions, selectors } from '../../stores';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Country {
  countryCode: string;
  countryName: string;
  population?: string;
}

export interface City {
  name: string;
  lat: number;
  lon: number;
  country: string;
  countryCode?: string;
  geonameId?: number;
}

// ============================================================================
// API CONFIGURATION
// ============================================================================

const BATCH_SIZE = 1000;
const MAX_BATCHES = 10;
const REQUEST_DELAY_MS = 100;

// ============================================================================
// CORE API FUNCTIONS
// ============================================================================

async function makeRequest<T>(url: string): Promise<T> {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

// ============================================================================
// COUNTRIES API
// ============================================================================

export async function fetchCountries(): Promise<Country[]> {
  try {
    actions.setLoading('countries', true);
    actions.setError('countries', null);
    
    const countries = await makeRequest<Country[]>('/api/countries');
    
    // Cache in sessionStorage for faster subsequent loads
    sessionStorage.setItem('countries', JSON.stringify(countries));
    
    actions.setCountries(countries);
    return countries;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch countries';
    actions.setError('countries', errorMessage);
    throw error;
  }
}

// ============================================================================
// CITIES API
// ============================================================================

export async function fetchCities(): Promise<City[]> {
  try {
    actions.setLoading('cities', true);
    actions.setError('cities', null);
    
    // Try to load from sessionStorage first
    const cachedCities = sessionStorage.getItem('cities');
    if (cachedCities) {
      const cities = JSON.parse(cachedCities);
      actions.setCities(cities);
      return cities;
    }
    
    // Fetch cities in batches
    const allCities = await fetchCitiesInBatches();
    
    // Cache in sessionStorage
    sessionStorage.setItem('cities', JSON.stringify(allCities));
    
    actions.setCities(allCities);
    return allCities;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch cities';
    actions.setError('cities', errorMessage);
    throw error;
  }
}

async function fetchCitiesInBatches(): Promise<City[]> {
  let allCities: City[] = [];
  let startRow = 0;
  let batchCount = 0;
  
  while (batchCount < MAX_BATCHES) {
    batchCount++;
    
    try {
      const url = `/api/cities?maxRows=${BATCH_SIZE}&startRow=${startRow}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch cities batch ${batchCount}: ${response.status}`);
      }
      
      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        break; // No more data
      }
      
      const batch = JSON.parse(responseText);
      
      if (Array.isArray(batch) && batch.length > 0) {
        // Normalize city data
        const normalizedBatch = batch.map((city: any) => ({
          name: city.name,
          lat: city.lat,
          lon: city.lon || city.lng,
          country: city.country,
          countryCode: city.countryCode,
          geonameId: city.geonameId
        }));
        
        allCities = allCities.concat(normalizedBatch);
        startRow += BATCH_SIZE;
        
        // If less than batchSize returned, we're done
        if (batch.length < BATCH_SIZE) {
          break;
        }
        
        // Add delay between requests to avoid rate limiting
        if (batchCount < MAX_BATCHES) {
          await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS));
        }
      } else {
        break; // No cities in batch
      }
    } catch (error) {
      console.error(`Error in batch ${batchCount}:`, error);
      // Continue with the cities we've already fetched instead of failing completely
      break;
    }
  }
  
  // Deduplicate by geonameId
  const uniqueCities = Array.from(
    new Map(allCities.map(city => [city.geonameId, city])).values()
  );
  
  return uniqueCities;
}

export async function fetchCitiesForCountry(countryCode: string): Promise<City[]> {
  try {
    const url = `/api/cities?country=${countryCode}&maxRows=50`;
    const citiesData = await makeRequest<City[]>(url);
    
    if (Array.isArray(citiesData)) {
      // Normalize city data
      const normalizedCities = citiesData.map((city: any) => ({
        name: city.name,
        lat: city.lat,
        lon: city.lon || city.lng,
        country: city.country,
        countryCode: city.countryCode,
        geonameId: city.geonameId
      }));
      
      // Add to existing cities store
      actions.addCities(normalizedCities);
      
      return normalizedCities;
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching cities for ${countryCode}:`, error);
    return [];
  }
}

export async function searchCities(query: string, countryCode?: string): Promise<City[]> {
  try {
    let url = `/api/cities?q=${encodeURIComponent(query)}&maxRows=50`;
    if (countryCode) {
      url += `&country=${countryCode}`;
    }
    
    const citiesData = await makeRequest<City[]>(url);
    
    if (Array.isArray(citiesData)) {
      // Normalize city data
      return citiesData.map((city: any) => ({
        name: city.name,
        lat: city.lat,
        lon: city.lon || city.lng,
        country: city.country,
        countryCode: city.countryCode,
        geonameId: city.geonameId
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error searching cities:', error);
    return [];
  }
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

export function clearDataCache(): void {
  sessionStorage.removeItem('countries');
  sessionStorage.removeItem('cities');
}

export function getDataCacheStats(): { countries: number; cities: number } {
  const countriesCache = sessionStorage.getItem('countries');
  const citiesCache = sessionStorage.getItem('cities');
  
  return {
    countries: countriesCache ? JSON.parse(countriesCache).length : 0,
    cities: citiesCache ? JSON.parse(citiesCache).length : 0
  };
}

// ============================================================================
// INITIALIZATION
// ============================================================================

export async function initializeData(): Promise<void> {
  try {
    // Load countries and cities in parallel
    const [countries, cities] = await Promise.all([
      fetchCountries(),
      fetchCities()
    ]);
    
    console.log(`Initialized with ${countries.length} countries and ${cities.length} cities`);
  } catch (error) {
    console.error('Failed to initialize data:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function normalizeCity(city: any): City {
  return {
    name: city.name,
    lat: city.lat,
    lon: city.lon || city.lng,
    country: city.country,
    countryCode: city.countryCode,
    geonameId: city.geonameId
  };
}

export function createCityKey(city: City): string {
  return `${city.name}|${city.lat}|${city.lon}`;
} 