// Backward compatibility layer - re-export from new weather service
export {
  getCurrentWeather as getCurrentWeatherWithCache,
  getForecast as getForecastWithCache,
  WEATHER_ICONS,
} from './services/weatherService';

// Legacy functions for backward compatibility
import { getCurrentWeather, getForecast } from './services/weatherService';

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
    precipitation_sum?: number[];
    windspeed_10m_max?: number[];
    winddirection_10m_dominant?: number[];
    sunrise?: string[];
    sunset?: string[];
    uv_index_max?: number[];
  };
}

// Legacy functions that maintain the old API
export async function fetchCurrentWeather(lat: number, lon: number): Promise<Weather | null> {
  const city = { name: 'temp', lat, lon, country: 'unknown' };
  const weather = await getCurrentWeather(city);
  return weather
    ? {
        temperature: weather.temperature,
        weathercode: weather.weathercode,
        time: weather.time,
      }
    : null;
}

export async function fetchForecast(lat: number, lon: number): Promise<Forecast | null> {
  const city = { name: 'temp', lat, lon, country: 'unknown' };
  const forecast = await getForecast(city);
  return forecast
    ? {
        daily: forecast.daily,
      }
    : null;
}
