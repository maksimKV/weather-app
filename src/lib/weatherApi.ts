// Weather API functions using open-meteo.com

export type WeatherData = {
  temp: number;
  code: number;
  description: string;
  icon: string;
};

export type ForecastDay = {
  dt: number;
  temp: number;
  code: number;
  description: string;
  icon: string;
};

// Weather code mapping (simplified)
const WEATHER_CODE_MAP: Record<number, { icon: string; description: string }> = {
  0: { icon: 'clear-day', description: 'Clear sky' },
  1: { icon: 'mainly-clear', description: 'Mainly clear' },
  2: { icon: 'partly-cloudy', description: 'Partly cloudy' },
  3: { icon: 'overcast', description: 'Overcast' },
  45: { icon: 'fog', description: 'Fog' },
  48: { icon: 'depositing-rime-fog', description: 'Depositing rime fog' },
  51: { icon: 'drizzle', description: 'Light drizzle' },
  53: { icon: 'drizzle', description: 'Moderate drizzle' },
  55: { icon: 'drizzle', description: 'Dense drizzle' },
  56: { icon: 'freezing-drizzle', description: 'Light freezing drizzle' },
  57: { icon: 'freezing-drizzle', description: 'Dense freezing drizzle' },
  61: { icon: 'rain', description: 'Slight rain' },
  63: { icon: 'rain', description: 'Moderate rain' },
  65: { icon: 'rain', description: 'Heavy rain' },
  66: { icon: 'freezing-rain', description: 'Light freezing rain' },
  67: { icon: 'freezing-rain', description: 'Heavy freezing rain' },
  71: { icon: 'snow', description: 'Slight snow fall' },
  73: { icon: 'snow', description: 'Moderate snow fall' },
  75: { icon: 'snow', description: 'Heavy snow fall' },
  77: { icon: 'snow-grains', description: 'Snow grains' },
  80: { icon: 'showers', description: 'Slight rain showers' },
  81: { icon: 'showers', description: 'Moderate rain showers' },
  82: { icon: 'showers', description: 'Violent rain showers' },
  85: { icon: 'snow-showers', description: 'Slight snow showers' },
  86: { icon: 'snow-showers', description: 'Heavy snow showers' },
  95: { icon: 'thunderstorm', description: 'Thunderstorm' },
  96: { icon: 'thunderstorm-hail', description: 'Thunderstorm with slight hail' },
  99: { icon: 'thunderstorm-hail', description: 'Thunderstorm with heavy hail' }
};

function getWeatherInfo(code: number) {
  return WEATHER_CODE_MAP[code] || { icon: 'unknown', description: 'Unknown' };
}

export async function fetchCurrentWeather(lat: number, lon: number): Promise<WeatherData | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const w = data.current_weather;
    const info = getWeatherInfo(w.weathercode);
    return {
      temp: w.temperature,
      code: w.weathercode,
      description: info.description,
      icon: info.icon
    };
  } catch (e) {
    return null;
  }
}

export async function fetch6DayForecast(lat: number, lon: number): Promise<ForecastDay[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,weathercode&timezone=auto`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const days: ForecastDay[] = [];
    for (let i = 0; i < Math.min(6, data.daily.time.length); i++) {
      const code = data.daily.weathercode[i];
      const info = getWeatherInfo(code);
      days.push({
        dt: new Date(data.daily.time[i]).getTime() / 1000,
        temp: data.daily.temperature_2m_max[i],
        code,
        description: info.description,
        icon: info.icon
      });
    }
    return days;
  } catch (e) {
    return [];
  }
}

export async function fetchLocationByIP(): Promise<{ lat: number; lon: number; city: string } | null> {
  try {
    const res = await fetch('https://ip-api.com/json');
    if (!res.ok) return null;
    const data = await res.json();
    return { lat: data.lat, lon: data.lon, city: data.city };
  } catch (e) {
    return null;
  }
} 