import { writable } from 'svelte/store';
import type { WeatherData } from '$lib/types';

export interface WeatherCacheEntry {
  weatherData: WeatherData;
  timestamp: number; // ms since epoch
}

interface City {
  name: string;
  lat: number;
  lon: number;
}

// Helper to create a unique key for each city (by name, lat, lon)
export function cityKey(city: City): string {
  return `${city.name}|${city.lat}|${city.lon}`;
}

const CACHE_KEY = 'weatherCache';
const FRESHNESS_MS = 10 * 60 * 1000; // 10 minutes

function loadCache(): Record<string, WeatherCacheEntry> {
  if (typeof window === 'undefined') {
    return {};
  }
  const stored = localStorage.getItem(CACHE_KEY);
  return stored ? JSON.parse(stored) : {};
}

function saveCache(cache: Record<string, WeatherCacheEntry>) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  }
}

function createWeatherCacheStore() {
  const initial = loadCache();
  const { subscribe, update } = writable<Record<string, WeatherCacheEntry>>(initial);

  subscribe(cache => saveCache(cache));

  function get(city: City): WeatherData | null {
    const key = cityKey(city);
    const entry = initial[key];
    if (entry && Date.now() - entry.timestamp < FRESHNESS_MS) {
      return entry.weatherData;
    }
    return null;
  }

  function setWeather(city: City, weatherData: WeatherData) {
    const key = cityKey(city);
    update(cache => {
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
