import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import {
  actions,
  selectors,
  countries,
  cities,
  weatherCache,
  selectedCountry,
  selectedCity,
  cityWeather,
  currentForecast,
  locationData,
  loading,
  errors,
  geolocatedCity,
} from '../../../stores';
import type { City, Country, WeatherData } from '../../../lib/types';
import type { ForecastWithIcons } from '../../../lib/services/weatherService';

// Mock localStorage and sessionStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

// Mock console.error for testing
const mockConsoleError = vi.fn();
global.console.error = mockConsoleError;

// Test data
const mockCountries: Country[] = [
  { countryCode: 'GB', countryName: 'United Kingdom', population: '67215293' },
  { countryCode: 'FR', countryName: 'France', population: '67391582' },
  { countryCode: 'US', countryName: 'United States', population: '331002651' },
];

const mockCities: City[] = [
  {
    name: 'London',
    lat: 51.5074,
    lon: -0.1278,
    country: 'GB',
    countryCode: 'GB',
    geonameId: 2643743,
    population: 8982000,
  },
  {
    name: 'Paris',
    lat: 48.8566,
    lon: 2.3522,
    country: 'FR',
    countryCode: 'FR',
    geonameId: 2988507,
    population: 2161000,
  },
  {
    name: 'New York',
    lat: 40.7128,
    lon: -74.006,
    country: 'US',
    countryCode: 'US',
    geonameId: 5128581,
    population: 8336817,
  },
];

const mockWeatherData: WeatherData = {
  current: {
    temperature_2m: 20,
    weathercode: 1,
    time: '2024-01-01T12:00:00Z',
  },
  daily: {
    time: ['2024-01-01'],
    temperature_2m_min: [15],
    temperature_2m_max: [25],
    weathercode: [1],
    relative_humidity_2m_max: [80],
    relative_humidity_2m_min: [60],
    sunrise: ['2024-01-01T08:00:00Z'],
    sunset: ['2024-01-01T18:00:00Z'],
    uv_index_max: [5],
  },
  icons: {
    1: 'clear-day.svg',
  },
};

const mockForecast: ForecastWithIcons = {
  daily: {
    time: ['2024-01-01'],
    temperature_2m_min: [15],
    temperature_2m_max: [25],
    weathercode: [1],
    relative_humidity_2m_max: [80],
    relative_humidity_2m_min: [60],
    sunrise: ['2024-01-01T08:00:00Z'],
    sunset: ['2024-01-01T18:00:00Z'],
    uv_index_max: [5],
  },
  icons: {
    1: 'clear-day.svg',
  },
};

describe('Store Actions', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReset();
    mockLocalStorage.setItem.mockReset();
    mockLocalStorage.removeItem.mockReset();
    mockSessionStorage.removeItem.mockReset();

    // Reset all stores to initial state
    countries.set([]);
    cities.set([]);
    weatherCache.set({});
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
    loading.set({
      countries: false,
      cities: false,
      weather: false,
      forecast: false,
      location: false,
    });
    errors.set({
      countries: null,
      cities: null,
      weather: null,
      location: null,
    });
    geolocatedCity.set(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setLocationData', () => {
    it('updates location data, resets loading/error', () => {
      // Set initial loading and error states
      loading.set({ ...get(loading), location: true });
      errors.set({ ...get(errors), location: 'Previous error' });

      const newLocationData = {
        name: 'London',
        country: 'United Kingdom',
        latitude: 51.5074,
        longitude: -0.1278,
        country_code: 'GB',
      };

      actions.setLocationData(newLocationData);

      const currentLocation = get(locationData);
      expect(currentLocation.name).toBe('London');
      expect(currentLocation.country).toBe('United Kingdom');
      expect(currentLocation.latitude).toBe(51.5074);
      expect(currentLocation.longitude).toBe(-0.1278);
      expect(currentLocation.country_code).toBe('GB');

      // Check that loading and error are reset
      expect(get(loading).location).toBe(false);
      expect(get(errors).location).toBe(null);
    });
  });

  describe('setWeatherCache', () => {
    it('sets weather cache with timestamp', () => {
      const cityKey = 'London|51.5074|-0.1278';
      const timestamp = Date.now();

      actions.setWeatherCache(cityKey, mockWeatherData);

      const cache = get(weatherCache);
      expect(cache[cityKey]).toBeDefined();
      expect(cache[cityKey].weatherData).toEqual(mockWeatherData);
      expect(cache[cityKey].timestamp).toBeGreaterThanOrEqual(timestamp);
    });
  });

  describe('getWeatherCache', () => {
    it('retrieves valid cache', () => {
      const cityKey = 'London|51.5074|-0.1278';
      const timestamp = Date.now();

      // Set cache with recent timestamp
      weatherCache.set({
        [cityKey]: { weatherData: mockWeatherData, timestamp },
      });

      const result = actions.getWeatherCache(cityKey);
      expect(result).toEqual(mockWeatherData);
    });

    it('returns null if expired', () => {
      const cityKey = 'London|51.5074|-0.1278';
      const oldTimestamp = Date.now() - 11 * 60 * 1000; // 11 minutes ago

      // Set cache with old timestamp
      weatherCache.set({
        [cityKey]: { weatherData: mockWeatherData, timestamp: oldTimestamp },
      });

      const result = actions.getWeatherCache(cityKey);
      expect(result).toBe(null);
    });

    it('returns null if cache entry does not exist', () => {
      const result = actions.getWeatherCache('nonexistent');
      expect(result).toBe(null);
    });
  });

  describe('clearWeatherCache', () => {
    it('clears weather cache and localStorage', () => {
      // Set some cache data
      weatherCache.set({
        'London|51.5074|-0.1278': { weatherData: mockWeatherData, timestamp: Date.now() },
      });

      actions.clearWeatherCache();

      expect(get(weatherCache)).toEqual({});
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('weatherCache');
    });
  });

  describe('clearAllStorage', () => {
    it('clears all local/session storage', () => {
      actions.clearAllStorage();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('weatherApp_state');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('weatherCache');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('countries');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('cities');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('countries');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('cities');
    });
  });

  describe('setLoading', () => {
    it('updates loading state', () => {
      actions.setLoading('countries', true);
      expect(get(loading).countries).toBe(true);

      actions.setLoading('cities', true);
      expect(get(loading).cities).toBe(true);

      actions.setLoading('weather', false);
      expect(get(loading).weather).toBe(false);
    });
  });

  describe('setError', () => {
    it('updates error state', () => {
      actions.setError('countries', 'Failed to load countries');
      expect(get(errors).countries).toBe('Failed to load countries');

      actions.setError('cities', 'Network error');
      expect(get(errors).cities).toBe('Network error');

      actions.setError('weather', null);
      expect(get(errors).weather).toBe(null);
    });
  });

  describe('clearErrors', () => {
    it('resets all errors', () => {
      // Set some errors first
      errors.set({
        countries: 'Error 1',
        cities: 'Error 2',
        weather: 'Error 3',
        location: 'Error 4',
      });

      actions.clearErrors();

      const currentErrors = get(errors);
      expect(currentErrors.countries).toBe(null);
      expect(currentErrors.cities).toBe(null);
      expect(currentErrors.weather).toBe(null);
      expect(currentErrors.location).toBe(null);
    });
  });

  describe('resetApp', () => {
    it('resets all state and storage', () => {
      // Set some state first
      selectedCountry.set(mockCountries[0]);
      selectedCity.set(mockCities[0]);
      cityWeather.set({ London: mockWeatherData });
      currentForecast.set(mockForecast);
      locationData.set({
        forecast: mockForecast,
        name: 'London',
        country: 'UK',
        error: 'Some error',
        latitude: 51.5074,
        longitude: -0.1278,
        country_code: 'GB',
      });
      errors.set({
        countries: 'Error',
        cities: 'Error',
        weather: 'Error',
        location: 'Error',
      });

      actions.resetApp();

      // Check that all state is reset
      expect(get(selectedCountry)).toBe(null);
      expect(get(selectedCity)).toBe(null);
      expect(get(cityWeather)).toEqual({});
      expect(get(currentForecast)).toBe(null);
      expect(get(locationData)).toEqual({
        forecast: null,
        name: '',
        country: '',
        error: null,
        latitude: null,
        longitude: null,
        country_code: '',
      });
      expect(get(errors)).toEqual({
        countries: null,
        cities: null,
        weather: null,
        location: null,
      });

      // Check that storage is cleared
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
      expect(mockSessionStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('resetWeather', () => {
    it('resets weather state and errors', () => {
      // Set some weather state first
      cityWeather.set({ London: mockWeatherData });
      currentForecast.set(mockForecast);
      errors.set({
        countries: null,
        cities: null,
        weather: 'Weather error',
        location: null,
      });

      actions.resetWeather();

      // Check that weather state is reset
      expect(get(cityWeather)).toEqual({});
      expect(get(currentForecast)).toBe(null);
      expect(get(errors)).toEqual({
        countries: null,
        cities: null,
        weather: null,
        location: null,
      });
    });
  });
});

describe('Store Selectors', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Reset all stores to initial state
    countries.set([]);
    cities.set([]);
    weatherCache.set({});
    cityWeather.set({});
  });

  describe('getCitiesForCountry', () => {
    it('returns correct cities for country', () => {
      cities.set(mockCities);

      const gbCities = selectors.getCitiesForCountry('GB');
      expect(gbCities).toHaveLength(1);
      expect(gbCities[0].name).toBe('London');

      const frCities = selectors.getCitiesForCountry('FR');
      expect(frCities).toHaveLength(1);
      expect(frCities[0].name).toBe('Paris');

      const usCities = selectors.getCitiesForCountry('US');
      expect(usCities).toHaveLength(1);
      expect(usCities[0].name).toBe('New York');

      const emptyCities = selectors.getCitiesForCountry('CA');
      expect(emptyCities).toHaveLength(0);
    });
  });

  describe('getWeatherForCity', () => {
    it('returns correct weather for city', () => {
      cityWeather.set({
        London: mockWeatherData,
        Paris: {
          ...mockWeatherData,
          current: {
            temperature_2m: 25,
            weathercode: 1,
            time: '2024-01-01T12:00:00Z',
          },
        },
      });

      const londonWeather = selectors.getWeatherForCity('London');
      expect(londonWeather).toEqual(mockWeatherData);

      const parisWeather = selectors.getWeatherForCity('Paris');
      expect(parisWeather?.current?.temperature_2m).toBe(25);

      const tokyoWeather = selectors.getWeatherForCity('Tokyo');
      expect(tokyoWeather).toBe(null);
    });
  });

  describe('isDataLoaded', () => {
    it('returns true/false based on data presence', () => {
      // Initially no data
      expect(selectors.isDataLoaded()).toBe(false);

      // Add countries only
      countries.set(mockCountries);
      expect(selectors.isDataLoaded()).toBe(false);

      // Add cities only
      countries.set([]);
      cities.set(mockCities);
      expect(selectors.isDataLoaded()).toBe(false);

      // Add both countries and cities
      countries.set(mockCountries);
      expect(selectors.isDataLoaded()).toBe(true);
    });
  });

  describe('getCacheStats', () => {
    it('returns correct cache statistics', () => {
      // Empty cache
      let stats = selectors.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.totalSize).toBeGreaterThan(0); // Empty object still has size

      // Add some cache entries
      weatherCache.set({
        'London|51.5074|-0.1278': { weatherData: mockWeatherData, timestamp: Date.now() },
        'Paris|48.8566|2.3522': { weatherData: mockWeatherData, timestamp: Date.now() },
      });

      stats = selectors.getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.totalSize).toBeGreaterThan(0);
    });
  });
});
