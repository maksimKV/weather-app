import { actions, selectors } from '../../stores';
import { logDevError } from '../utils';
import type { City } from '../types';
import { normalizeCity as normalizeCityUtil, isValidWeatherData } from '../utils';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Weather {
  temperature: number;
  weathercode: number;
  time: string;
}

export interface Forecast {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
    relative_humidity_2m_max?: number[];
    relative_humidity_2m_min?: number[];
    sunrise?: string[];
    sunset?: string[];
    uv_index_max?: number[];
  };
}

export interface WeatherWithIcon {
  temperature: number;
  icon: string;
  weathercode: number;
  time: string;
}

export interface ForecastWithIcons {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
    relative_humidity_2m_max: number[];
    relative_humidity_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
  };
  icons: Record<number, string>;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country_name?: string;
  country_code?: string;
  timestamp?: number;
  method?: 'browser' | 'ip' | 'fallback';
}

export interface WeatherServiceError {
  message: string;
  code: string;
  details?: unknown;
}

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const IP_API_URL = '/api/location';
const REQUEST_DELAY_MS = 50; // Reduced delay for better performance
const MAX_CONCURRENT_REQUESTS = 6; // Increased concurrency
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes
// const PREFETCH_THRESHOLD = 0.8; // Prefetch when cache is 80% full

// Weather icon mapping
export const WEATHER_ICONS: Record<number, string> = {
  0: '/weather-icons/clear-day.svg',
  1: '/weather-icons/mainly-clear.svg',
  2: '/weather-icons/partly-cloudy.svg',
  3: '/weather-icons/overcast.svg',
  45: '/weather-icons/fog.svg',
  48: '/weather-icons/depositing-rime-fog.svg',
  51: '/weather-icons/drizzle.svg',
  53: '/weather-icons/drizzle.svg',
  55: '/weather-icons/drizzle.svg',
  56: '/weather-icons/freezing-drizzle.svg',
  57: '/weather-icons/freezing-drizzle.svg',
  61: '/weather-icons/rain.svg',
  63: '/weather-icons/rain.svg',
  65: '/weather-icons/rain.svg',
  66: '/weather-icons/freezing-rain.svg',
  67: '/weather-icons/freezing-rain.svg',
  71: '/weather-icons/snow.svg',
  73: '/weather-icons/snow.svg',
  75: '/weather-icons/snow.svg',
  77: '/weather-icons/snow-grains.svg',
  80: '/weather-icons/showers.svg',
  81: '/weather-icons/showers.svg',
  82: '/weather-icons/showers.svg',
  85: '/weather-icons/snow-showers.svg',
  86: '/weather-icons/snow-showers.svg',
  95: '/weather-icons/thunderstorm.svg',
  96: '/weather-icons/thunderstorm-hail.svg',
  99: '/weather-icons/thunderstorm-hail.svg',
};

// ============================================================================
// MEMOIZATION & CACHING
// ============================================================================

class MemoizationCache<T> {
  private cache = new Map<string, { data: T; timestamp: number }>();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
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
const weatherMemoCache = new MemoizationCache<WeatherWithIcon>();
const forecastMemoCache = new MemoizationCache<ForecastWithIcons>();
const locationMemoCache = new MemoizationCache<LocationData>();

// ============================================================================
// ENHANCED REQUEST MANAGEMENT
// ============================================================================

class EnhancedRequestQueue {
  private queue: Array<() => Promise<unknown>> = [];
  private running = 0;
  private requestCache = new Map<string, Promise<unknown>>();
  private abortControllers = new Map<string, AbortController>();

  async add<T>(key: string, requestFn: () => Promise<T>, timeoutMs: number = 30000): Promise<T> {
    // Check if request is already in progress
    if (this.requestCache.has(key)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.requestCache.get(key)! as T;
    }

    // Create abort controller for this request
    const controller = new AbortController();
    this.abortControllers.set(key, controller);

    // Create new request promise with timeout
    const requestPromise = this.executeRequest(requestFn, controller, timeoutMs);
    this.requestCache.set(key, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.requestCache.delete(key);
      this.abortControllers.delete(key);
    }
  }

  private async executeRequest<T>(
    requestFn: () => Promise<T>,
    controller: AbortController,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Set timeout
      const timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error('Request timeout'));
      }, timeoutMs);

      this.queue.push(async () => {
        try {
          this.running++;
          const result = await requestFn();
          clearTimeout(timeoutId);
          resolve(result);
        } catch (error) {
          clearTimeout(timeoutId);
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

  cancelRequest(key: string): void {
    const controller = this.abortControllers.get(key);
    if (controller) {
      controller.abort();
      this.requestCache.delete(key);
      this.abortControllers.delete(key);
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

const requestQueue = new EnhancedRequestQueue();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function createRequestKey(endpoint: string, params: Record<string, unknown>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return `${endpoint}?${sortedParams}`;
}

function normalizeCity(city: City): City {
  return normalizeCityUtil(city);
}

// Memoized city normalization
const cityNormalizationCache = new MemoizationCache<City>();
function normalizeCityMemoized(city: City): City {
  const key = `${city.name}|${city.lat}|${city.lon}`;
  const cached = cityNormalizationCache.get(key);
  if (cached) return cached;

  const normalized = normalizeCity(city);
  cityNormalizationCache.set(key, normalized);
  return normalized;
}

function addWeatherIcons(weather: Weather): WeatherWithIcon {
  return {
    ...weather,
    icon: WEATHER_ICONS[weather.weathercode] || WEATHER_ICONS[0],
  };
}

function addForecastIcons(forecast: Forecast): ForecastWithIcons {
  return {
    daily: {
      time: forecast.daily.time,
      temperature_2m_max: forecast.daily.temperature_2m_max,
      temperature_2m_min: forecast.daily.temperature_2m_min,
      weathercode: forecast.daily.weathercode,
      relative_humidity_2m_max: forecast.daily.relative_humidity_2m_max || [],
      relative_humidity_2m_min: forecast.daily.relative_humidity_2m_min || [],
      sunrise: forecast.daily.sunrise || [],
      sunset: forecast.daily.sunset || [],
      uv_index_max: forecast.daily.uv_index_max || [],
    },
    icons: WEATHER_ICONS,
  };
}

// ============================================================================
// CORE API FUNCTIONS
// ============================================================================

async function makeRequest<T>(url: string, signal?: AbortSignal): Promise<T> {
  try {
    const response = await fetch(url, {
      signal: signal || AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      // Handle rate limiting specifically
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      // Try to get error details from response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && typeof errorData === 'object' && 'error' in errorData) {
          errorMessage = errorData.error as string;
        }
      } catch {
        // If we can't parse the error response, use the default message
      }

      throw new Error(errorMessage);
    }

    const data: unknown = await response.json();

    // Validate response data
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format from API');
    }

    return data as unknown as T;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request cancelled');
      }
      if (error.message.includes('fetch')) {
        throw new Error('Network error - please check your connection');
      }
    }
    throw error;
  }
}

async function fetchCurrentWeatherRaw(lat: number, lon: number): Promise<Weather | null> {
  const params = { latitude: lat, longitude: lon, current_weather: true };
  const key = createRequestKey(BASE_URL, params);

  return requestQueue.add(key, async () => {
    const url = `${BASE_URL}?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const data = await makeRequest<unknown>(url);
    return (data as { current_weather: Weather }).current_weather;
  });
}

async function fetchForecastRaw(lat: number, lon: number): Promise<Forecast | null> {
  const params = {
    latitude: lat,
    longitude: lon,
    daily:
      'temperature_2m_max,temperature_2m_min,weathercode,relative_humidity_2m_max,relative_humidity_2m_min,sunrise,sunset,uv_index_max',
    forecast_days: 16,
    timezone: 'auto',
  };
  const key = createRequestKey(BASE_URL, params);

  return requestQueue.add(key, async () => {
    const url = `${BASE_URL}?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode,relative_humidity_2m_max,relative_humidity_2m_min,sunrise,sunset,uv_index_max&forecast_days=16&timezone=auto`;
    return makeRequest<Forecast>(url);
  });
}

// Browser geolocation function (most accurate)
async function fetchBrowserLocation(): Promise<LocationData | null> {
  return new Promise(resolve => {
    // Check if we're in browser environment and geolocation is available
    if (
      typeof window === 'undefined' ||
      typeof navigator === 'undefined' ||
      !navigator.geolocation
    ) {
      logDevError('Browser geolocation not available');
      resolve(null);
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // 15 seconds
      maximumAge: 5 * 60 * 1000, // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const { latitude, longitude } = position.coords;

          // Use reverse geocoding to get city/country info
          const locationInfo = await reverseGeocode(latitude, longitude);

          resolve({
            latitude,
            longitude,
            city: locationInfo.city || 'Your Location',
            country_name: locationInfo.country || 'Unknown',
            country_code: locationInfo.country_code || 'XX',
          });
        } catch (error) {
          logDevError('Error processing browser location:', error);
          resolve(null);
        }
      },
      error => {
        logDevError('Browser geolocation error:', error.message);
        resolve(null);
      },
      options
    );
  });
}

// Reverse geocoding to get location info from coordinates
async function reverseGeocode(
  lat: number,
  lon: number
): Promise<{
  city?: string;
  country?: string;
  country_code?: string;
}> {
  try {
    // Use a simple reverse geocoding service
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();

    return {
      city: data.city || data.locality || data.principalSubdivision,
      country: data.countryName,
      country_code: data.countryCode,
    };
  } catch (error) {
    logDevError('Reverse geocoding error:', error);
    return {};
  }
}

// IP-based location (fallback)
async function fetchIPLocation(): Promise<LocationData> {
  const key = createRequestKey(IP_API_URL, {});

  return requestQueue.add(key, async () => {
    try {
      return await makeRequest<LocationData>(IP_API_URL);
    } catch (error) {
      // If we get a rate limit error, try to use a fallback location
      if (error instanceof Error && error.message.includes('Rate limit')) {
        logDevError('Rate limit hit for location service, using fallback location');
        // Return a fallback location (London) to prevent complete failure
        return {
          latitude: 51.5074,
          longitude: -0.1278,
          city: 'London (Fallback)',
          country_name: 'United Kingdom',
          country_code: 'GB',
        };
      }
      throw error;
    }
  });
}

// Hybrid location function - tries browser first, then IP
async function fetchLocationData(): Promise<LocationData> {
  try {
    // First, try browser geolocation (most accurate)
    const browserLocation = await fetchBrowserLocation();
    if (browserLocation) {
      logDevError('Using browser geolocation (precise)');
      return browserLocation;
    }
  } catch (error) {
    logDevError('Browser geolocation failed, falling back to IP:', error);
  }

  // Fallback to IP-based location
  logDevError('Using IP-based geolocation (approximate)');
  return await fetchIPLocation();
}

// ============================================================================
// OPTIMIZED CACHED API FUNCTIONS
// ============================================================================

export async function getCurrentWeather(city: City): Promise<WeatherWithIcon | null> {
  try {
    // Validate city data
    if (!city) {
      logDevError('No city data provided for weather fetch');
      return null;
    }

    // Convert coordinates to numbers if they're strings
    const lat = Number(city.lat);
    const lon = Number(city.lon ?? (city as { lng?: number }).lng ?? 0);

    if (isNaN(lat) || isNaN(lon)) {
      logDevError('Invalid coordinates for weather fetch:', city);
      return null;
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      logDevError('Coordinates out of valid range:', { lat, lon });
      return null;
    }

    const normalizedCity = normalizeCityMemoized(city);
    const cityKey = `${normalizedCity.name}|${normalizedCity.lat}|${normalizedCity.lon}`;

    // Check memoization cache first
    const memoized = weatherMemoCache.get(cityKey);
    if (memoized) {
      return memoized;
    }

    // Check store cache
    const cacheStats = selectors.getCacheStats();
    const cached = cacheStats.size > 0 ? actions.getWeatherCache(cityKey) : null;
    if (cached?.current) {
      const weather: Weather = {
        temperature: cached.current.temperature_2m,
        weathercode: cached.current.weathercode,
        time: cached.current.time,
      };
      const weatherWithIcons = addWeatherIcons(weather);
      if (weatherWithIcons) {
        weatherMemoCache.set(cityKey, weatherWithIcons);
        return weatherWithIcons;
      }
    }

    // Fetch from API
    const weather = await fetchCurrentWeatherRaw(normalizedCity.lat, normalizedCity.lon);
    if (!weather || !isValidWeatherData(weather)) {
      logDevError('Invalid weather data received for city:', city.name, weather);
      return null;
    }

    // Add icons and cache
    const weatherWithIcons = addWeatherIcons(weather);
    weatherMemoCache.set(cityKey, weatherWithIcons);
    actions.setWeatherCache(cityKey, {
      current: {
        temperature_2m: weather.temperature,
        weathercode: weather.weathercode,
        time: weather.time,
      },
    });

    return weatherWithIcons;
  } catch (error) {
    logDevError('Error fetching current weather:', error);
    return null;
  }
}

export async function getForecast(city: City): Promise<ForecastWithIcons | null> {
  try {
    const normalizedCity = normalizeCityMemoized(city);
    const cityKey = `${normalizedCity.name}|${normalizedCity.lat}|${normalizedCity.lon}`;

    // Check memoization cache first
    const memoized = forecastMemoCache.get(cityKey);
    if (memoized) {
      return memoized;
    }

    // Check store cache
    const cached = actions.getWeatherCache(cityKey);
    if (cached?.daily) {
      const forecast: Forecast = {
        daily: {
          time: cached.daily.time,
          temperature_2m_max: cached.daily.temperature_2m_max,
          temperature_2m_min: cached.daily.temperature_2m_min,
          weathercode: cached.daily.weathercode,
        },
      };
      const forecastWithIcons = addForecastIcons(forecast);
      forecastMemoCache.set(cityKey, forecastWithIcons);
      return forecastWithIcons;
    }

    // Fetch from API
    const forecast = await fetchForecastRaw(normalizedCity.lat, normalizedCity.lon);
    if (!forecast || !isValidWeatherData(forecast)) {
      logDevError('Invalid forecast data received for city:', city.name, forecast);
      return null;
    }

    // Add icons and cache
    const forecastWithIcons = addForecastIcons(forecast);
    forecastMemoCache.set(cityKey, forecastWithIcons);
    actions.setWeatherCache(cityKey, forecast);

    return forecastWithIcons;
  } catch (error) {
    logDevError('Error fetching forecast:', error);
    return null;
  }
}

export async function getLocationForecast(): Promise<{
  forecast: ForecastWithIcons;
  location: string;
  country: string;
  latitude: number;
  longitude: number;
  country_code?: string;
  locationMethod?: 'browser' | 'ip' | 'fallback';
} | null> {
  try {
    // Check if we have a cached location (shorter cache for better accuracy)
    const cacheKey = 'user_location';
    const memoizedLocation = locationMemoCache.get(cacheKey);
    let locationData: LocationData;
    let locationMethod: 'browser' | 'ip' | 'fallback' = 'ip';

    if (memoizedLocation && Date.now() - (memoizedLocation.timestamp || 0) < 5 * 60 * 1000) {
      // Use cached location if less than 5 minutes old
      locationData = memoizedLocation;
      locationMethod = memoizedLocation.method || 'ip';
    } else {
      // Fetch fresh location data using hybrid approach
      locationData = await fetchLocationData();

      // Determine which method was used based on the response
      if (locationData.city && !locationData.city.includes('(Fallback)')) {
        // Check if coordinates seem precise (browser geolocation typically has more decimal places)
        const hasHighPrecision =
          locationData.latitude.toString().split('.')[1]?.length > 4 ||
          locationData.longitude.toString().split('.')[1]?.length > 4;
        locationMethod = hasHighPrecision ? 'browser' : 'ip';
      } else {
        locationMethod = 'fallback';
      }

      // Cache with timestamp and method info
      locationMemoCache.set(cacheKey, {
        ...locationData,
        timestamp: Date.now(),
        method: locationMethod,
      });
    }

    if (!locationData.latitude || !locationData.longitude) {
      throw new Error('No coordinates in location response');
    }

    const forecast = await fetchForecastRaw(locationData.latitude, locationData.longitude);
    if (!forecast) return null;

    // Create more descriptive location labels
    let locationLabel = locationData.city || 'Your Location';
    if (locationMethod === 'browser') {
      locationLabel = `📍 ${locationLabel}`; // GPS icon for precise location
    } else if (locationMethod === 'ip') {
      locationLabel = `🌐 ${locationLabel} (Approximate)`; // Globe icon for IP location
    } else if (locationMethod === 'fallback') {
      locationLabel = `⚠️ ${locationLabel}`; // Warning icon for fallback
    }

    return {
      forecast: addForecastIcons(forecast),
      location: locationLabel,
      country: locationData.country_name || '',
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      country_code: locationData.country_code,
      locationMethod,
    };
  } catch (_error) {
    logDevError('Error fetching forecast:', _error);
    return null;
  }
}

// ============================================================================
// PARALLEL BATCH OPERATIONS
// ============================================================================

export async function getWeatherForCities(
  cities: City[]
): Promise<Record<string, WeatherWithIcon>> {
  // Filter out cities with invalid coordinates
  const validCities = cities.filter(city => {
    const lat = Number(city.lat);
    // Try both 'lon' and 'lng' fields for longitude
    const lon = Number(city.lon ?? (city as { lng?: number }).lng ?? 0);
    return !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  });

  if (validCities.length === 0) {
    return {};
  }

  // Process cities in parallel with controlled concurrency
  const chunks = [];
  for (let i = 0; i < validCities.length; i += MAX_CONCURRENT_REQUESTS) {
    chunks.push(validCities.slice(i, i + MAX_CONCURRENT_REQUESTS));
  }

  // Process chunks sequentially to avoid race conditions
  const results: Record<string, WeatherWithIcon> = {};

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex];

    // Process cities in this chunk in parallel
    const chunkPromises = chunk.map(async city => {
      try {
        const normalized = normalizeCityMemoized(city);
        const weather = await getCurrentWeather(normalized);
        if (weather) {
          return { cityName: normalized.name, weather };
        }
      } catch (_error) {
        logDevError(`Error fetching weather for ${city.name}:`, _error);
      }
      return null;
    });

    // Wait for all cities in this chunk to complete
    const chunkResults = await Promise.all(chunkPromises);

    // Add successful results to the main results object
    for (const result of chunkResults) {
      if (result) {
        results[result.cityName] = result.weather;
      }
    }

    // Add delay between chunks for rate limiting
    if (chunkIndex < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS));
    }
  }

  return results;
}

// ============================================================================
// BACKGROUND PREFETCHING
// ============================================================================

let prefetchQueue: City[] = [];
let isPrefetching = false;

export async function prefetchWeatherForCities(cities: City[]): Promise<void> {
  if (isPrefetching) {
    // Add to queue if already prefetching
    prefetchQueue.push(...cities);
    return;
  }

  isPrefetching = true;

  try {
    // Process cities in background
    const validCities = cities.filter(city => {
      const lat = Number(city.lat);
      const lon = Number(city.lon ?? (city as { lng?: number }).lng ?? 0);
      return !isNaN(lat) && !isNaN(lon);
    });

    if (validCities.length === 0) return;

    // Use lower concurrency for background prefetching
    const prefetchConcurrency = Math.min(3, MAX_CONCURRENT_REQUESTS);
    const chunks = [];
    for (let i = 0; i < validCities.length; i += prefetchConcurrency) {
      chunks.push(validCities.slice(i, i + prefetchConcurrency));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async city => {
        try {
          const normalized = normalizeCityMemoized(city);
          await getCurrentWeather(normalized);
        } catch (error) {
          logDevError('Error in weather prefetching:', error);
          // Silently fail for prefetching
        }
      });

      await Promise.all(promises);
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS * 2));
    }
  } finally {
    isPrefetching = false;

    // Process queued cities
    if (prefetchQueue.length > 0) {
      const queuedCities = [...prefetchQueue];
      prefetchQueue = [];
      await prefetchWeatherForCities(queuedCities);
    }
  }
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

export function clearWeatherCache(): void {
  weatherMemoCache.clear();
  forecastMemoCache.clear();
  locationMemoCache.clear();
  cityNormalizationCache.clear();
  actions.clearWeatherCache();
}

export function getCacheStats(): {
  size: number;
  entries: number;
  memoizationStats: {
    weather: number;
    forecast: number;
    location: number;
    cityNormalization: number;
  };
  requestStats: {
    queueLength: number;
    running: number;
    cachedRequests: number;
  };
} {
  const cacheStats = selectors.getCacheStats();

  return {
    size: cacheStats.size,
    entries: cacheStats.totalSize,
    memoizationStats: {
      weather: weatherMemoCache.size(),
      forecast: forecastMemoCache.size(),
      location: locationMemoCache.size(),
      cityNormalization: cityNormalizationCache.size(),
    },
    requestStats: requestQueue.getStats(),
  };
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export function createWeatherError(
  message: string,
  code: string,
  details?: unknown
): WeatherServiceError {
  return { message, code, details };
}

export function isWeatherError(error: unknown): error is WeatherServiceError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as WeatherServiceError).code === 'string' &&
    typeof (error as WeatherServiceError).message === 'string'
  );
}
