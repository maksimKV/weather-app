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