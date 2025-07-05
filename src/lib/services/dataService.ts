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
const REQUEST_DELAY_MS = 50; // Reduced for better performance
const MAX_CONCURRENT_REQUESTS = 4; // Parallel batch processing
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes for data cache

// ============================================================================
// MEMOIZATION & CACHING
// ============================================================================

class DataMemoizationCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private maxSize: number;

  constructor(maxSize: number = 500) {
    this.maxSize = maxSize;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > CACHE_DURATION_MS) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T): void {
    // Implement LRU eviction
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Memoization caches
const countriesMemoCache = new DataMemoizationCache<Country[]>();
const citiesMemoCache = new DataMemoizationCache<City[]>();
const searchMemoCache = new DataMemoizationCache<City[]>();

// ============================================================================
// ENHANCED REQUEST MANAGEMENT
// ============================================================================

class DataRequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private requestCache = new Map<string, Promise<any>>();

  async add<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if request is already in progress
    if (this.requestCache.has(key)) {
      return this.requestCache.get(key)!;
    }

    // Create new request promise
    const requestPromise = this.executeRequest(requestFn);
    this.requestCache.set(key, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.requestCache.delete(key);
    }
  }

  private async executeRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          this.running++;
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      });

      this.processQueue();
    });
  }

  private processQueue() {
    while (this.running < MAX_CONCURRENT_REQUESTS && this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        request();
      }
    }
  }

  getStats(): { queueLength: number; running: number; cachedRequests: number } {
    return {
      queueLength: this.queue.length,
      running: this.running,
      cachedRequests: this.requestCache.size,
    };
  }
}

const dataRequestQueue = new DataRequestQueue();

// ============================================================================
// CORE API FUNCTIONS
// ============================================================================

async function makeRequest<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Validate response data
    if (!data) {
      throw new Error('Empty response from API');
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      if (error.message.includes('fetch')) {
        throw new Error('Network error - please check your connection');
      }
    }
    throw error;
  }
}

// ============================================================================
// COUNTRIES API
// ============================================================================

export async function fetchCountries(): Promise<Country[]> {
  try {
    actions.setLoading('countries', true);
    actions.setError('countries', null);

    // Check memoization cache first
    const memoized = countriesMemoCache.get('all_countries');
    if (memoized) {
      actions.setCountries(memoized);
      return memoized;
    }

    const countries = await dataRequestQueue.add('countries', async () => {
      return makeRequest<Country[]>('/api/countries');
    });

    // Validate countries data
    if (!Array.isArray(countries)) {
      throw new Error('Invalid countries data format');
    }

    const validCountries = countries.filter(
      country =>
        country &&
        typeof country.countryCode === 'string' &&
        typeof country.countryName === 'string'
    );

    if (validCountries.length === 0) {
      throw new Error('No valid countries found in response');
    }

    // Cache in memoization and sessionStorage
    countriesMemoCache.set('all_countries', validCountries);
    try {
      sessionStorage.setItem('countries', JSON.stringify(validCountries));
    } catch (storageError) {
      console.warn('Failed to cache countries in sessionStorage:', storageError);
    }

    actions.setCountries(validCountries);
    return validCountries;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch countries';
    actions.setError('countries', errorMessage);
    throw error;
  } finally {
    actions.setLoading('countries', false);
  }
}

// ============================================================================
// CITIES API
// ============================================================================

export async function fetchCities(): Promise<City[]> {
  try {
    actions.setLoading('cities', true);
    actions.setError('cities', null);

    // Check memoization cache first
    const memoized = citiesMemoCache.get('all_cities');
    if (memoized) {
      actions.setCities(memoized);
      return memoized;
    }

    // Try to load from sessionStorage first
    const cachedCities = sessionStorage.getItem('cities');
    if (cachedCities) {
      const cities = JSON.parse(cachedCities);
      citiesMemoCache.set('all_cities', cities);
      actions.setCities(cities);
      return cities;
    }

    // Fetch cities in parallel batches
    const allCities = await fetchCitiesInParallelBatches();

    // Cache in memoization and sessionStorage
    citiesMemoCache.set('all_cities', allCities);
    sessionStorage.setItem('cities', JSON.stringify(allCities));

    actions.setCities(allCities);
    return allCities;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch cities';
    actions.setError('cities', errorMessage);
    throw error;
  } finally {
    actions.setLoading('cities', false);
  }
}

async function fetchCitiesInParallelBatches(): Promise<City[]> {
  let allCities: City[] = [];
  let startRow = 0;
  let batchCount = 0;

  // Create all batch promises upfront for parallel execution
  const batchPromises: Promise<City[]>[] = [];

  while (batchCount < MAX_BATCHES) {
    batchCount++;
    const currentStartRow = startRow;

    const batchPromise = dataRequestQueue.add(`cities_batch_${batchCount}`, async () => {
      try {
        const url = `/api/cities?maxRows=${BATCH_SIZE}&startRow=${currentStartRow}`;
        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to fetch cities batch ${batchCount}: ${response.status}`
          );
        }

        const responseText = await response.text();
        if (!responseText || responseText.trim() === '') {
          return []; // No more data
        }

        const batch = JSON.parse(responseText);

        if (Array.isArray(batch) && batch.length > 0) {
          // Normalize city data
          const normalizedBatch = batch
            .map((city: any) => ({
              name: city.name,
              lat: Number(city.lat),
              lon: Number(city.lon ?? city.lng),
              country: city.country,
              countryCode: city.countryCode,
              geonameId: city.geonameId,
            }))
            .filter(city => !isNaN(city.lat) && !isNaN(city.lon));

          return normalizedBatch;
        }

        return [];
      } catch (error) {
        console.error(`Error in batch ${batchCount}:`, error);
        return []; // Return empty array instead of failing completely
      }
    });

    batchPromises.push(batchPromise);
    startRow += BATCH_SIZE;

    // Add delay between batch creation to avoid overwhelming the server
    if (batchCount < MAX_BATCHES) {
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS));
    }
  }

  // Execute all batches in parallel
  const batchResults = await Promise.all(batchPromises);

  // Combine all results
  for (const batch of batchResults) {
    if (batch.length > 0) {
      allCities = allCities.concat(batch);
    }
  }

  // Deduplicate by geonameId
  const uniqueCities = Array.from(new Map(allCities.map(c => [c.geonameId, c])).values());

  return uniqueCities;
}

export async function fetchCitiesForCountry(countryCode: string): Promise<City[]> {
  try {
    // Check memoization cache first
    const memoized = citiesMemoCache.get(`country_${countryCode}`);
    if (memoized) {
      actions.addCities(memoized);
      return memoized;
    }

    const citiesData = await dataRequestQueue.add(`cities_country_${countryCode}`, async () => {
      const res = await fetch(`/api/cities?country=${countryCode}&maxRows=50`);
      if (!res.ok) {
        throw new Error(`Failed to fetch cities for ${countryCode}`);
      }
      return res.json();
    });

    if (Array.isArray(citiesData)) {
      const normalizedCities = citiesData
        .map((city: any) => ({
          name: city.name,
          lat: Number(city.lat),
          lon: Number(city.lon ?? city.lng),
          country: city.country,
          countryCode: city.countryCode,
          geonameId: city.geonameId,
        }))
        .filter(city => !isNaN(city.lat) && !isNaN(city.lon));

      // Cache the result
      citiesMemoCache.set(`country_${countryCode}`, normalizedCities);

      // Add to existing cities
      actions.addCities(normalizedCities);
      return normalizedCities;
    }

    return [];
  } catch (err) {
    console.error(`Error fetching cities for ${countryCode}:`, err);
    return [];
  }
}

export async function searchCities(query: string, countryCode?: string): Promise<City[]> {
  try {
    // Create cache key
    const cacheKey = `search_${query}_${countryCode || 'all'}`;

    // Check memoization cache first
    const memoized = searchMemoCache.get(cacheKey);
    if (memoized) {
      return memoized;
    }

    let url = `/api/cities?q=${encodeURIComponent(query)}&maxRows=50`;
    if (countryCode && countryCode !== '') {
      url += `&country=${countryCode}`;
    }

    const citiesData = await dataRequestQueue.add(cacheKey, async () => {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to search cities for "${query}"`);
      }
      return res.json();
    });

    if (Array.isArray(citiesData)) {
      const normalizedCities = citiesData
        .map((city: any) => ({
          name: city.name,
          lat: Number(city.lat),
          lon: Number(city.lon ?? city.lng),
          country: city.country,
          countryCode: city.countryCode,
          geonameId: city.geonameId,
        }))
        .filter(city => !isNaN(city.lat) && !isNaN(city.lon));

      // Cache the result
      searchMemoCache.set(cacheKey, normalizedCities);
      return normalizedCities;
    }

    return [];
  } catch (error) {
    console.error(`Error searching cities for "${query}":`, error);
    return [];
  }
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

export function clearDataCache(): void {
  countriesMemoCache.clear();
  citiesMemoCache.clear();
  searchMemoCache.clear();

  try {
    sessionStorage.removeItem('countries');
    sessionStorage.removeItem('cities');
  } catch (error) {
    console.warn('Failed to clear sessionStorage cache:', error);
  }
}

export function getDataCacheStats(): {
  countries: number;
  cities: number;
  search: number;
  requestStats: {
    queueLength: number;
    running: number;
    cachedRequests: number;
  };
} {
  return {
    countries: countriesMemoCache.size(),
    cities: citiesMemoCache.size(),
    search: searchMemoCache.size(),
    requestStats: dataRequestQueue.getStats(),
  };
}

// ============================================================================
// INITIALIZATION
// ============================================================================

export async function initializeData(): Promise<void> {
  try {
    // Fetch countries and cities in parallel
    const [countries, cities] = await Promise.all([fetchCountries(), fetchCities()]);
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
    lat: Number(city.lat),
    lon: Number(city.lon ?? city.lng),
    country: city.country,
    countryCode: city.countryCode,
    geonameId: city.geonameId,
  };
}

export function createCityKey(city: City): string {
  return `${city.name}|${city.lat}|${city.lon}`;
}
