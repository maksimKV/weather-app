import { writable } from 'svelte/store';

export interface WeatherCacheEntry {
  weatherData: any;
  timestamp: number; // ms since epoch
}

// Helper to create a unique key for each city (by name, lat, lon)
export function cityKey(city: { name: string; lat: number; lon: number }): string {
  return `${city.name}|${city.lat}|${city.lon}`;
}

const CACHE_KEY = 'weatherCache';
const FRESHNESS_MS = 10 * 60 * 1000; // 10 minutes

function loadCache(): Record<string, WeatherCacheEntry> {
  const stored = localStorage.getItem(CACHE_KEY);
  return stored ? JSON.parse(stored) : {};
}

function saveCache(cache: Record<string, WeatherCacheEntry>) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

function createWeatherCacheStore() {
  const initial = loadCache();
  const { subscribe, set, update } = writable<Record<string, WeatherCacheEntry>>(initial);

  subscribe((cache) => saveCache(cache));

  function get(city: { name: string; lat: number; lon: number }) {
    const key = cityKey(city);
    const entry = initial[key];
    if (entry && Date.now() - entry.timestamp < FRESHNESS_MS) {
      return entry.weatherData;
    }
    return null;
  }

  function setWeather(city: { name: string; lat: number; lon: number }, weatherData: any) {
    const key = cityKey(city);
    update((cache) => {
      cache[key] = { weatherData, timestamp: Date.now() };
      return { ...cache };
    });
  }

  return {
    subscribe,
    get,
    setWeather,
  };
}

export const weatherCacheStore = createWeatherCacheStore(); 