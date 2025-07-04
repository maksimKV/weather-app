import { actions, selectors } from '../../stores';
import type { City } from '../../stores';

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
  };
  icons: Record<number, string>;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country_name?: string;
}

export interface WeatherServiceError {
  message: string;
  code: string;
  details?: any;
}

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const IP_API_URL = 'https://ipapi.co/json/';
const REQUEST_DELAY_MS = 100; // Rate limiting delay
const MAX_CONCURRENT_REQUESTS = 3;

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
// REQUEST MANAGEMENT
// ============================================================================

class RequestQueue {
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
    if (this.running < MAX_CONCURRENT_REQUESTS && this.queue.length > 0) {
      const request = this.queue.shift();
      if (request) {
        request();
      }
    }
  }
}

const requestQueue = new RequestQueue();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function createRequestKey(endpoint: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return `${endpoint}?${sortedParams}`;
}

function normalizeCity(city: City): City {
  return {
    ...city,
    lon: city.lon || (city as any).lng
  };
}

function addWeatherIcons(weather: Weather): WeatherWithIcon {
  return {
    ...weather,
    icon: WEATHER_ICONS[weather.weathercode] || WEATHER_ICONS[0]
  };
}

function addForecastIcons(forecast: Forecast): ForecastWithIcons {
  return {
    ...forecast,
    icons: WEATHER_ICONS
  };
}

// ============================================================================
// CORE API FUNCTIONS
// ============================================================================

async function makeRequest<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Validate response data
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format from API');
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

async function fetchCurrentWeatherRaw(lat: number, lon: number): Promise<Weather | null> {
  const params = { latitude: lat, longitude: lon, current_weather: true };
  const key = createRequestKey(BASE_URL, params);
  
  return requestQueue.add(key, async () => {
    const url = `${BASE_URL}?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const data = await makeRequest<any>(url);
    return data.current_weather;
  });
}

async function fetchForecastRaw(lat: number, lon: number): Promise<Forecast | null> {
  const params = { 
    latitude: lat, 
    longitude: lon, 
    daily: 'temperature_2m_max,temperature_2m_min,weathercode',
    forecast_days: 16,
    timezone: 'auto'
  };
  const key = createRequestKey(BASE_URL, params);
  
  return requestQueue.add(key, async () => {
    const url = `${BASE_URL}?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&forecast_days=16&timezone=auto`;
    return makeRequest<Forecast>(url);
  });
}

async function fetchLocationData(): Promise<LocationData> {
  const key = createRequestKey(IP_API_URL, {});
  
  return requestQueue.add(key, async () => {
    return makeRequest<LocationData>(IP_API_URL);
  });
}

// ============================================================================
// CACHED API FUNCTIONS
// ============================================================================

export async function getCurrentWeather(city: City): Promise<WeatherWithIcon | null> {
  try {
    // Validate city data
    if (!city) {
      console.error('No city data provided for weather fetch');
      return null;
    }
    
    // Convert coordinates to numbers if they're strings
    const lat = Number(city.lat);
    const lon = Number(city.lon);
    
    if (isNaN(lat) || isNaN(lon)) {
      console.error('Invalid coordinates for weather fetch:', city);
      return null;
    }
    
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      console.error('Coordinates out of valid range:', { lat, lon });
      return null;
    }
    
    const normalizedCity = normalizeCity(city);
    const cityKey = `${normalizedCity.name}|${normalizedCity.lat}|${normalizedCity.lon}`;
    
    // Check cache first
    const cacheStats = selectors.getCacheStats();
    const cached = cacheStats.size > 0 ? actions.getWeatherCache(cityKey) : null;
    if (cached?.current_weather) {
      const weatherWithIcons = addWeatherIcons(cached.current_weather);
      if (weatherWithIcons) {
        return weatherWithIcons;
      }
    }
    
    // Fetch from API
    const weather = await fetchCurrentWeatherRaw(normalizedCity.lat, normalizedCity.lon);
    if (!weather) {
      console.warn('No weather data received for city:', city.name);
      return null;
    }
    
    // Validate weather data
    if (!weather.temperature || typeof weather.temperature !== 'number') {
      console.error('Invalid weather data received:', weather);
      return null;
    }
    
    // Cache the result
    actions.setWeatherCache(cityKey, { current_weather: weather });
    
    return addWeatherIcons(weather);
  } catch (error) {
    console.error('Error fetching current weather for city:', city?.name, error);
    return null;
  }
}

export async function getForecast(city: City): Promise<ForecastWithIcons | null> {
  try {
    const normalizedCity = normalizeCity(city);
    const cityKey = `${normalizedCity.name}|${normalizedCity.lat}|${normalizedCity.lon}`;
    
    // Check cache first
    const cached = actions.getWeatherCache(cityKey);
    if (cached?.daily) {
      return addForecastIcons(cached);
    }
    
    // Fetch from API
    const forecast = await fetchForecastRaw(normalizedCity.lat, normalizedCity.lon);
    if (!forecast) return null;
    
    // Cache the result
    actions.setWeatherCache(cityKey, forecast);
    
    return addForecastIcons(forecast);
  } catch (error) {
    console.error('Error fetching forecast:', error);
    return null;
  }
}

export async function getLocationForecast(): Promise<{ forecast: ForecastWithIcons; location: string; country: string } | null> {
  try {
    const locationData = await fetchLocationData();
    
    if (!locationData.latitude || !locationData.longitude) {
      throw new Error('No coordinates in location response');
    }
    
    const forecast = await fetchForecastRaw(locationData.latitude, locationData.longitude);
    if (!forecast) return null;
    
    return {
      forecast: addForecastIcons(forecast),
      location: locationData.city || 'Your Location (Approximate)',
      country: locationData.country_name || ''
    };
  } catch (error) {
    console.error('Error fetching location forecast:', error);
    return null;
  }
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

export async function getWeatherForCities(cities: City[]): Promise<Record<string, WeatherWithIcon>> {
  const results: Record<string, WeatherWithIcon> = {};
  
  // Process cities with controlled concurrency
  const chunks = [];
  for (let i = 0; i < cities.length; i += MAX_CONCURRENT_REQUESTS) {
    chunks.push(cities.slice(i, i + MAX_CONCURRENT_REQUESTS));
  }
  
  for (const chunk of chunks) {
    const promises = chunk.map(async (city) => {
      const normalized = normalizeCity(city);
      const weather = await getCurrentWeather(normalized);
      if (weather) {
        results[normalized.name] = weather;
      }
    });
    
    await Promise.all(promises);
    
    // Add delay between chunks for rate limiting
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS));
    }
  }
  
  return results;
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

export function clearWeatherCache(): void {
  actions.clearWeatherCache();
}

export function getCacheStats(): { size: number; entries: number } {
  const stats = selectors.getCacheStats();
  return {
    size: stats.totalSize,
    entries: stats.size
  };
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export function createWeatherError(message: string, code: string, details?: any): WeatherServiceError {
  return { message, code, details };
}

export function isWeatherError(error: any): error is WeatherServiceError {
  return error && typeof error === 'object' && 'code' in error;
} 