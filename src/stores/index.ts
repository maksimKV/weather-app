// ============================================================================
// UNIFIED STATE MANAGEMENT SYSTEM
// ============================================================================

import { writable, derived, get } from 'svelte/store';
import type { WeatherWithIcon, ForecastWithIcons } from '../lib/services/weatherService';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Country {
  countryCode: string;
  countryName: string;
  population?: string;
  code?: string; // Alternative field name from API
}

export interface City {
  name: string;
  lat: number;
  lon: number;
  country: string;
  countryCode?: string;
  geonameId?: number;
}

export interface WeatherData {
  temperature: number;
  icon: string;
  weathercode: number;
  time: string;
}

export interface WeatherCacheEntry {
  weatherData: any;
  timestamp: number;
}

export interface LocationData {
  forecast: ForecastWithIcons | null;
  name: string;
  country: string;
  error: string | null;
}

export interface LoadingState {
  countries: boolean;
  cities: boolean;
  weather: boolean;
  forecast: boolean;
  location: boolean;
}

export interface ErrorState {
  countries: string | null;
  cities: string | null;
  weather: string | null;
  location: string | null;
}

// ============================================================================
// CORE STATE STORES
// ============================================================================

// Data Stores
export const countries = writable<Country[]>([]);
export const cities = writable<City[]>([]);
export const weatherCache = writable<Record<string, WeatherCacheEntry>>({});

// UI State Stores
export const selectedCountry = writable<Country | null>(null);
export const selectedCity = writable<City | null>(null);
export const cityWeather = writable<Record<string, WeatherData>>({});
export const currentForecast = writable<ForecastWithIcons | null>(null);
export const locationData = writable<LocationData>({
  forecast: null,
  name: '',
  country: '',
  error: null
});

// Loading States
export const loading = writable<LoadingState>({
  countries: false,
  cities: false,
  weather: false,
  forecast: false,
  location: false
});

// Error States
export const errors = writable<ErrorState>({
  countries: null,
  cities: null,
  weather: null,
  location: null
});

// ============================================================================
// DERIVED STORES
// ============================================================================

// Computed state for cities of selected country
export const citiesOfSelectedCountry = derived(
  [cities, selectedCountry],
  ([$cities, $selectedCountry]) => {
    if (!$selectedCountry) return [];
    
    // Filter cities by country code - handle both possible field structures
    return $cities.filter(city => {
      const cityCountryCode = city.countryCode || city.country;
      const selectedCountryCode = $selectedCountry.countryCode || $selectedCountry.code;
      return cityCountryCode === selectedCountryCode;
    });
  }
);

// Computed state for weather data with icons
export const weatherWithIcons = derived(
  cityWeather,
  ($cityWeather) => {
    return Object.fromEntries(
      Object.entries($cityWeather).map(([cityName, weather]) => [
        cityName,
        {
          temperature: Math.round(weather.temperature),
          icon: weather.icon,
          weathercode: weather.weathercode,
          time: weather.time
        }
      ])
    );
  }
);

// Computed state for app readiness
export const appReady = derived(
  [countries, cities, loading],
  ([$countries, $cities, $loading]) => {
    return $countries.length > 0 && $cities.length > 0 && 
           !$loading.countries && !$loading.cities;
  }
);

// Computed state for current selection
export const currentSelection = derived(
  [selectedCountry, selectedCity],
  ([$selectedCountry, $selectedCity]) => ({
    country: $selectedCountry,
    city: $selectedCity,
    hasSelection: !!(selectedCountry || selectedCity)
  })
);

// ============================================================================
// PERSISTENCE LAYER
// ============================================================================

const PERSISTENCE_KEYS = {
  APP_STATE: 'weatherApp_state',
  WEATHER_CACHE: 'weatherCache',
  COUNTRIES: 'countries',
  CITIES: 'cities'
} as const;

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save to storage: ${key}`, error);
  }
}

// Initialize stores with persisted data
const initialAppState = loadFromStorage(PERSISTENCE_KEYS.APP_STATE, {
  selectedCountry: null,
  selectedCity: null
});

selectedCountry.set(initialAppState.selectedCountry);
selectedCity.set(initialAppState.selectedCity);

// Persist app state changes
selectedCountry.subscribe(value => {
  const current = get(selectedCity);
  saveToStorage(PERSISTENCE_KEYS.APP_STATE, {
    selectedCountry: value,
    selectedCity: current
  });
});

selectedCity.subscribe(value => {
  const current = get(selectedCountry);
  saveToStorage(PERSISTENCE_KEYS.APP_STATE, {
    selectedCountry: current,
    selectedCity: value
  });
});

// Persist weather cache
weatherCache.subscribe(value => {
  saveToStorage(PERSISTENCE_KEYS.WEATHER_CACHE, value);
});

// ============================================================================
// ACTION-BASED STATE UPDATES
// ============================================================================

export const actions = {
  // Country & City Actions
  setSelectedCountry: (country: Country | null) => {
    selectedCountry.set(country);
    selectedCity.set(null); // Clear city when country changes
    // Don't clear weather data - let it be updated by the reactive statement
    currentForecast.set(null); // Clear forecast when country changes
  },

  setSelectedCity: (city: City | null) => {
    selectedCity.set(city);
    selectedCountry.set(null); // Clear country when city changes
  },

  // Data Loading Actions
  setCountries: (countriesData: Country[]) => {
    countries.set(countriesData);
    loading.update(state => ({ ...state, countries: false }));
    errors.update(state => ({ ...state, countries: null }));
  },

  setCities: (citiesData: City[]) => {
    cities.set(citiesData);
    loading.update(state => ({ ...state, cities: false }));
    errors.update(state => ({ ...state, cities: null }));
  },

  addCities: (newCities: City[]) => {
    cities.update(currentCities => {
      const existingIds = new Set(currentCities.map(c => c.geonameId));
      const uniqueNewCities = newCities.filter(city => 
        !existingIds.has(city.geonameId)
      );
      return [...currentCities, ...uniqueNewCities];
    });
  },

  // Weather Actions
  setCityWeather: (cityName: string, weather: WeatherData) => {
    cityWeather.update(current => ({
      ...current,
      [cityName]: weather
    }));
  },

  setMultipleCityWeather: (weatherData: Record<string, WeatherData>) => {
    cityWeather.set(weatherData);
  },

  setCurrentForecast: (forecast: ForecastWithIcons | null) => {
    currentForecast.set(forecast);
    loading.update(state => ({ ...state, forecast: false }));
    errors.update(state => ({ ...state, weather: null }));
  },

  setLocationData: (data: Partial<LocationData>) => {
    locationData.update(current => ({ ...current, ...data }));
    loading.update(state => ({ ...state, location: false }));
    errors.update(state => ({ ...state, location: null }));
  },

  // Cache Actions
  setWeatherCache: (cityKey: string, weatherData: any) => {
    weatherCache.update(cache => ({
      ...cache,
      [cityKey]: { weatherData, timestamp: Date.now() }
    }));
  },

  getWeatherCache: (cityKey: string) => {
    const cache = get(weatherCache);
    const entry = cache[cityKey];
    if (entry && Date.now() - entry.timestamp < 10 * 60 * 1000) { // 10 minutes
      return entry.weatherData;
    }
    return null;
  },

  clearWeatherCache: () => {
    weatherCache.set({});
    localStorage.removeItem(PERSISTENCE_KEYS.WEATHER_CACHE);
  },

  // Loading Actions
  setLoading: (key: keyof LoadingState, value: boolean) => {
    loading.update(state => ({ ...state, [key]: value }));
  },

  // Error Actions
  setError: (key: keyof ErrorState, error: string | null) => {
    errors.update(state => ({ ...state, [key]: error }));
  },

  clearErrors: () => {
    errors.set({
      countries: null,
      cities: null,
      weather: null,
      location: null
    });
  },

  // Reset Actions
  resetApp: () => {
    selectedCountry.set(null);
    selectedCity.set(null);
    cityWeather.set({});
    currentForecast.set(null);
    locationData.set({
      forecast: null,
      name: '',
      country: '',
      error: null
    });
    actions.clearErrors();
  },

  resetWeather: () => {
    cityWeather.set({});
    currentForecast.set(null);
    actions.clearErrors();
  }
};

// ============================================================================
// SELECTORS (Computed Values)
// ============================================================================

export const selectors = {
  // Get cities for a specific country
  getCitiesForCountry: (countryCode: string) => {
    const currentCities = get(cities);
    return currentCities.filter(city => city.countryCode === countryCode);
  },

  // Get weather for a specific city
  getWeatherForCity: (cityName: string) => {
    const currentWeather = get(cityWeather);
    return currentWeather[cityName] || null;
  },

  // Check if data is loaded
  isDataLoaded: () => {
    const currentCountries = get(countries);
    const currentCities = get(cities);
    return currentCountries.length > 0 && currentCities.length > 0;
  },

  // Get cache statistics
  getCacheStats: () => {
    const cache = get(weatherCache);
    return {
      size: Object.keys(cache).length,
      totalSize: new Blob([JSON.stringify(cache)]).size
    };
  }
};

// ============================================================================
// BACKWARD COMPATIBILITY
// ============================================================================

// Export individual stores for backward compatibility
export const countriesLoaded = derived(countries, $countries => $countries.length > 0);
export const citiesLoaded = derived(cities, $cities => $cities.length > 0);
export const countryCityError = derived(errors, $errors => $errors.countries || $errors.cities);

// Legacy store interface for backward compatibility
export const appStore = {
  subscribe: selectedCountry.subscribe,
  setCountry: actions.setSelectedCountry,
  setCity: actions.setSelectedCity,
  setWeather: (weather: any) => actions.setCurrentForecast(weather)
}; 