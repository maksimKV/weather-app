// ============================================================================
// UNIFIED STATE MANAGEMENT SYSTEM
// ============================================================================

/**
 * Error Handling Approach:
 * - All user-facing errors should use actions.setError(key, message).
 * - Use logDevError for dev-only logging instead of console.error.
 */
import { writable, derived, get } from 'svelte/store';
import type { ForecastWithIcons } from '../lib/services/weatherService';
import { logDevError } from '../lib/utils';
import type { City, Country, WeatherData } from '../lib/types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface WeatherCacheEntry {
  weatherData: WeatherData;
  timestamp: number;
}

export interface LocationData {
  forecast: ForecastWithIcons | null;
  name: string;
  country: string;
  error: string | null;
  latitude: number | null;
  longitude: number | null;
  country_code: string;
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
  error: null,
  latitude: null,
  longitude: null,
  country_code: '',
});

// Loading States
export const loading = writable<LoadingState>({
  countries: false,
  cities: false,
  weather: false,
  forecast: false,
  location: false,
});

// Error States
export const errors = writable<ErrorState>({
  countries: null,
  cities: null,
  weather: null,
  location: null,
});

// New store for geolocated city
export const geolocatedCity = writable<City | null>(null);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Determine country size based on population only (area not available in Country interface)
function getCountrySize(country: Country): 'Large' | 'Medium' | 'Small' {
  const population = parseInt(country.population || '0') || 0;

  // Large countries: very large population
  if (population > 100000000) {
    return 'Large';
  }

  // Medium countries: moderate population
  if (population > 10000000) {
    return 'Medium';
  }

  // Small countries: small population
  return 'Small';
}

// Get city limit based on country size and available cities
function getCityLimit(countrySize: 'Large' | 'Medium' | 'Small', cityCount: number): number {
  switch (countrySize) {
    case 'Large':
      return Math.min(cityCount, 12); // Large countries: up to 12 cities
    case 'Medium':
      return Math.min(cityCount, 8); // Medium countries: up to 8 cities
    case 'Small':
      return Math.min(cityCount, 5); // Small countries: up to 5 cities
    default:
      return Math.min(cityCount, 3); // Fallback: up to 3 cities
  }
}

// ============================================================================
// DERIVED STORES
// ============================================================================

// Computed state for cities of selected country
export const citiesOfSelectedCountry = derived(
  [cities, selectedCountry],
  ([$cities, $selectedCountry]) => {
    if (!$selectedCountry) return [];

    // Filter cities by country code - handle both possible field structures
    const filteredCities = $cities.filter(city => {
      const cityCountryCode = city.countryCode || city.country;
      const selectedCountryCode = $selectedCountry.countryCode;
      return cityCountryCode === selectedCountryCode;
    });

    // Determine country size and city limit
    const countrySize = getCountrySize($selectedCountry);
    const cityLimit = getCityLimit(countrySize, filteredCities.length);

    // Limit the number of cities shown on the map (country size + city count approach)
    const limitedCities = filteredCities
      .sort((a, b) => {
        // Sort by population if available, otherwise by name
        const popA = a.population || 0;
        const popB = b.population || 0;
        return popB - popA;
      })
      .slice(0, cityLimit);

    return limitedCities;
  }
);

// Computed state for weather data with icons
export const weatherWithIcons = derived(cityWeather, $cityWeather => {
  return Object.fromEntries(
    Object.entries($cityWeather).map(([cityName, weather]) => [
      cityName,
      {
        temperature: weather.current?.temperature_2m || 0,
        icon: weather.icons?.[weather.current?.weathercode || 0] || '',
        weathercode: weather.current?.weathercode || 0,
        time: weather.current?.time || '',
      },
    ])
  );
});

// Computed state for app readiness
export const appReady = derived([countries, cities, loading], ([$countries, $cities, $loading]) => {
  return $countries.length > 0 && $cities.length > 0 && !$loading.countries && !$loading.cities;
});

// Computed state for current selection
export const currentSelection = derived(
  [selectedCountry, selectedCity],
  ([$selectedCountry, $selectedCity]) => ({
    country: $selectedCountry,
    city: $selectedCity,
    hasSelection: !!(selectedCountry || selectedCity),
  })
);

// New derived store isSelectedCityGeolocated
export const isSelectedCityGeolocated = derived(
  [selectedCity, geolocatedCity],
  ([$selectedCity, $geolocatedCity]) => {
    if (!$selectedCity || !$geolocatedCity) {
      return false;
    }
    const latEqual = Math.abs(Number($selectedCity.lat) - Number($geolocatedCity.lat)) < 0.0001;
    const lonEqual = Math.abs(Number($selectedCity.lon) - Number($geolocatedCity.lon)) < 0.0001;
    return latEqual && lonEqual;
  }
);

// ============================================================================
// PERSISTENCE LAYER
// ============================================================================

const PERSISTENCE_KEYS = {
  APP_STATE: 'weatherApp_state',
  WEATHER_CACHE: 'weatherCache',
  COUNTRIES: 'countries',
  CITIES: 'cities',
} as const;

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === 'undefined') {
      return defaultValue;
    }
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    logDevError('Error loading from storage:', error);
    return defaultValue;
  }
}

function saveToStorage(key: string, value: unknown): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    logDevError('Error saving to storage:', error);
    // Silently handle storage errors
  }
}

// Initialize stores with persisted data
const initialAppState = loadFromStorage(PERSISTENCE_KEYS.APP_STATE, {
  selectedCountry: null,
  selectedCity: null,
});

// Clear stale cache on app initialization (older than 24 hours)
function clearStaleCache() {
  try {
    if (typeof window === 'undefined') return;

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Clear weather cache if it's older than 24 hours
    const weatherCacheData = localStorage.getItem(PERSISTENCE_KEYS.WEATHER_CACHE);
    if (weatherCacheData) {
      try {
        const cache = JSON.parse(weatherCacheData);
        const cacheAge = now - (cache._timestamp || 0);
        if (cacheAge > oneDayMs) {
          localStorage.removeItem(PERSISTENCE_KEYS.WEATHER_CACHE);
          logDevError('Cleared stale weather cache');
        }
      } catch (e) {
        // If cache is corrupted, remove it
        localStorage.removeItem(PERSISTENCE_KEYS.WEATHER_CACHE);
        logDevError('Cleared corrupted weather cache', e);
      }
    }

    // Clear app state if it's older than 24 hours
    const appStateData = localStorage.getItem(PERSISTENCE_KEYS.APP_STATE);
    if (appStateData) {
      try {
        const state = JSON.parse(appStateData);
        const stateAge = now - (state._timestamp || 0);
        if (stateAge > oneDayMs) {
          localStorage.removeItem(PERSISTENCE_KEYS.APP_STATE);
          logDevError('Cleared stale app state');
          return; // Don't use stale state
        }
      } catch (e) {
        // If state is corrupted, remove it
        localStorage.removeItem(PERSISTENCE_KEYS.APP_STATE);
        logDevError('Cleared corrupted app state', e);
        return; // Don't use corrupted state
      }
    }
  } catch (error) {
    logDevError('Error clearing stale cache:', error);
  }
}

// Clear stale cache on initialization
clearStaleCache();

selectedCountry.set(initialAppState.selectedCountry);
selectedCity.set(initialAppState.selectedCity);

// Persist app state changes with timestamp
selectedCountry.subscribe(value => {
  const current = get(selectedCity);
  saveToStorage(PERSISTENCE_KEYS.APP_STATE, {
    selectedCountry: value,
    selectedCity: current,
    _timestamp: Date.now(),
  });
});

selectedCity.subscribe(value => {
  const current = get(selectedCountry);
  saveToStorage(PERSISTENCE_KEYS.APP_STATE, {
    selectedCountry: current,
    selectedCity: value,
    _timestamp: Date.now(),
  });
});

// Persist weather cache with timestamp
weatherCache.subscribe(value => {
  saveToStorage(PERSISTENCE_KEYS.WEATHER_CACHE, {
    ...value,
    _timestamp: Date.now(),
  });
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
      const uniqueNewCities = newCities.filter(city => !existingIds.has(city.geonameId));
      return [...currentCities, ...uniqueNewCities];
    });
  },

  // Weather Actions
  setCityWeather: (cityName: string, weather: WeatherData) => {
    cityWeather.update(current => ({
      ...current,
      [cityName]: weather,
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
  setWeatherCache: (cityKey: string, weatherData: WeatherData) => {
    weatherCache.update(cache => ({
      ...cache,
      [cityKey]: { weatherData, timestamp: Date.now() },
    }));
  },

  getWeatherCache: (cityKey: string) => {
    const cache = get(weatherCache);
    const entry = cache[cityKey];
    if (entry && Date.now() - entry.timestamp < 10 * 60 * 1000) {
      // 10 minutes
      return entry.weatherData;
    }
    return null;
  },

  clearWeatherCache: () => {
    weatherCache.set({});
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PERSISTENCE_KEYS.WEATHER_CACHE);
    }
  },

  clearAllStorage: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(PERSISTENCE_KEYS.APP_STATE);
      localStorage.removeItem(PERSISTENCE_KEYS.WEATHER_CACHE);
      localStorage.removeItem(PERSISTENCE_KEYS.COUNTRIES);
      localStorage.removeItem(PERSISTENCE_KEYS.CITIES);
      sessionStorage.removeItem('countries');
      sessionStorage.removeItem('cities');
    }
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
      location: null,
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
      error: null,
      latitude: null,
      longitude: null,
      country_code: '',
    });
    actions.clearErrors();
    actions.clearAllStorage();
  },

  resetWeather: () => {
    cityWeather.set({});
    currentForecast.set(null);
    actions.clearErrors();
  },
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
      totalSize: new Blob([JSON.stringify(cache)]).size,
    };
  },
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
  setWeather: (weather: ForecastWithIcons | null) => actions.setCurrentForecast(weather),
};
