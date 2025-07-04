import { weatherCacheStore, cityKey } from '../stores/weatherCacheStore';
import type { City } from '../stores/appStore';

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

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

export async function fetchCurrentWeather(lat: number, lon: number): Promise<Weather | null> {
  const url = `${BASE_URL}?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.current_weather;
}

export async function fetchForecast(lat: number, lon: number): Promise<Forecast | null> {
  const url = `${BASE_URL}?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&forecast_days=16&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data;
}

export async function getCurrentWeatherWithCache(city: City): Promise<Weather | null> {
  const cached = weatherCacheStore.get(city);
  if (cached && cached.current_weather) {
    return cached.current_weather;
  }
  const url = `${BASE_URL}?latitude=${city.lat}&longitude=${city.lon}&current_weather=true`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  weatherCacheStore.setWeather(city, data);
  return data.current_weather;
}

export async function getForecastWithCache(city: City): Promise<Forecast | null> {
  const cached = weatherCacheStore.get(city);
  if (cached && cached.daily) {
    return cached;
  }
  const url = `${BASE_URL}?latitude=${city.lat}&longitude=${city.lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&forecast_days=16&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  weatherCacheStore.setWeather(city, data);
  return data;
} 