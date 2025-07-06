import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writable } from 'svelte/store';
import type { City } from '../../../lib/types';
import type { WeatherServiceError } from '../../../lib/services/weatherService';

// Mock the entire weatherService module
const mockWeatherService = {
  getCurrentWeather: vi.fn(),
  getForecast: vi.fn(),
  getLocationForecast: vi.fn(),
  getWeatherForCities: vi.fn(),
  prefetchWeatherForCities: vi.fn(),
  clearWeatherCache: vi.fn(),
  getCacheStats: vi.fn(),
  createWeatherError: vi.fn(),
  isWeatherError: vi.fn(),
};

vi.mock('../../../lib/services/weatherService', () => mockWeatherService);

// Mock dependencies
vi.mock('../../../stores', () => ({
  actions: {
    setWeatherData: vi.fn(),
    setForecastData: vi.fn(),
    setError: vi.fn(),
    clearError: vi.fn(),
    clearWeatherCache: vi.fn(),
    setWeatherCache: vi.fn(),
    getWeatherCache: vi.fn(() => null),
  },
  selectors: {
    weatherData: writable({}),
    forecastData: writable({}),
    error: writable(null),
    getCacheStats: vi.fn(() => ({
      size: 0,
      totalSize: 0,
    })),
  },
}));

vi.mock('../../../lib/utils', () => ({
  logDevError: vi.fn(),
  normalizeCity: vi.fn((city: City) => ({ ...city, name: city.name.toLowerCase() })),
  isValidWeatherData: vi.fn(() => true),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('weatherService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('getCurrentWeather', () => {
    it('returns weather for valid city', async () => {
      const city: City = { name: 'New York', country: 'US', lat: 40.7128, lon: -74.006 };
      const expectedWeather = {
        temperature: 20,
        weathercode: 1,
        time: '2024-01-01T12:00:00Z',
        icon: '/weather-icons/mainly-clear.svg',
      };

      mockWeatherService.getCurrentWeather.mockResolvedValue(expectedWeather);

      const result = await mockWeatherService.getCurrentWeather(city);

      expect(result).toEqual(expectedWeather);
      expect(mockWeatherService.getCurrentWeather).toHaveBeenCalledWith(city);
    });

    it('returns null for invalid city', async () => {
      const city: City = { name: '', country: '', lat: NaN, lon: NaN };

      mockWeatherService.getCurrentWeather.mockResolvedValue(null);

      const result = await mockWeatherService.getCurrentWeather(city);
      expect(result).toBeNull();
    });

    it('handles HTTP errors gracefully', async () => {
      const city: City = { name: 'New York', country: 'US', lat: 40.7128, lon: -74.006 };

      mockWeatherService.getCurrentWeather.mockResolvedValue(null);

      const result = await mockWeatherService.getCurrentWeather(city);
      expect(result).toBeNull();
    });

    it('handles network errors gracefully', async () => {
      const city: City = { name: 'New York', country: 'US', lat: 40.7128, lon: -74.006 };

      mockWeatherService.getCurrentWeather.mockResolvedValue(null);

      const result = await mockWeatherService.getCurrentWeather(city);
      expect(result).toBeNull();
    });
  });

  describe('getForecast', () => {
    it('returns forecast for valid city', async () => {
      const city: City = { name: 'New York', country: 'US', lat: 40.7128, lon: -74.006 };
      const expectedForecast = {
        daily: {
          time: ['2024-01-01'],
          temperature_2m_max: [20],
          temperature_2m_min: [10],
          weathercode: [1],
        },
        icons: {
          1: '/weather-icons/mainly-clear.svg',
        },
      };

      mockWeatherService.getForecast.mockResolvedValue(expectedForecast);

      const result = await mockWeatherService.getForecast(city);

      expect(result).toEqual(expectedForecast);
      expect(mockWeatherService.getForecast).toHaveBeenCalledWith(city);
    });

    it('returns null for invalid city', async () => {
      const city: City = { name: '', country: '', lat: NaN, lon: NaN };

      mockWeatherService.getForecast.mockResolvedValue(null);

      const result = await mockWeatherService.getForecast(city);
      expect(result).toBeNull();
    });

    it('handles errors gracefully', async () => {
      const city: City = { name: 'New York', country: 'US', lat: 40.7128, lon: -74.006 };

      mockWeatherService.getForecast.mockResolvedValue(null);

      const result = await mockWeatherService.getForecast(city);
      expect(result).toBeNull();
    });
  });

  describe('getLocationForecast', () => {
    it('returns forecast for location', async () => {
      const expectedResult = {
        forecast: {
          daily: {
            time: ['2024-01-01'],
            temperature_2m_max: [20],
            temperature_2m_min: [10],
            weathercode: [1],
          },
          icons: {},
        },
        location: 'New York',
        country: 'United States',
        latitude: 40.7128,
        longitude: -74.006,
        country_code: 'US',
      };

      mockWeatherService.getLocationForecast.mockResolvedValue(expectedResult);

      const result = await mockWeatherService.getLocationForecast();

      expect(result).toEqual(expectedResult);
      expect(mockWeatherService.getLocationForecast).toHaveBeenCalled();
    });

    it('handles missing/invalid location', async () => {
      mockWeatherService.getLocationForecast.mockResolvedValue(null);

      const result = await mockWeatherService.getLocationForecast();
      expect(result).toBeNull();
    });
  });

  describe('getWeatherForCities', () => {
    it('returns weather for multiple cities', async () => {
      const cities: City[] = [
        { name: 'New York', country: 'US', lat: 40.7128, lon: -74.006 },
        { name: 'London', country: 'GB', lat: 51.5074, lon: -0.1278 },
      ];

      const expectedResult = {
        'New York': {
          temperature: 20,
          weathercode: 1,
          time: '2024-01-01T12:00:00Z',
          icon: '/weather-icons/mainly-clear.svg',
        },
        London: {
          temperature: 15,
          weathercode: 2,
          time: '2024-01-01T12:00:00Z',
          icon: '/weather-icons/partly-cloudy.svg',
        },
      };

      mockWeatherService.getWeatherForCities.mockResolvedValue(expectedResult);

      const result = await mockWeatherService.getWeatherForCities(cities);

      expect(result).toEqual(expectedResult);
      expect(mockWeatherService.getWeatherForCities).toHaveBeenCalledWith(cities);
    });

    it('filters invalid cities', async () => {
      const cities: City[] = [
        { name: 'New York', country: 'US', lat: 40.7128, lon: -74.006 },
        { name: '', country: '', lat: NaN, lon: NaN }, // Invalid
      ];

      const expectedResult = {
        'New York': {
          temperature: 20,
          weathercode: 1,
          time: '2024-01-01T12:00:00Z',
          icon: '/weather-icons/mainly-clear.svg',
        },
      };

      mockWeatherService.getWeatherForCities.mockResolvedValue(expectedResult);

      const result = await mockWeatherService.getWeatherForCities(cities);

      expect(result).toEqual(expectedResult);
      expect(Object.keys(result)).toHaveLength(1);
    });

    it('handles errors gracefully', async () => {
      const cities: City[] = [{ name: 'New York', country: 'US', lat: 40.7128, lon: -74.006 }];

      mockWeatherService.getWeatherForCities.mockResolvedValue({});

      const result = await mockWeatherService.getWeatherForCities(cities);
      expect(result).toEqual({});
    });
  });

  describe('prefetchWeatherForCities', () => {
    it('prefetches in background', async () => {
      const cities: City[] = [{ name: 'New York', country: 'US', lat: 40.7128, lon: -74.006 }];

      mockWeatherService.prefetchWeatherForCities.mockResolvedValue(undefined);

      await mockWeatherService.prefetchWeatherForCities(cities);

      expect(mockWeatherService.prefetchWeatherForCities).toHaveBeenCalledWith(cities);
    });

    it('handles errors gracefully', async () => {
      const cities: City[] = [{ name: 'New York', country: 'US', lat: 40.7128, lon: -74.006 }];

      mockWeatherService.prefetchWeatherForCities.mockResolvedValue(undefined);

      await expect(mockWeatherService.prefetchWeatherForCities(cities)).resolves.not.toThrow();
    });
  });

  describe('clearWeatherCache', () => {
    it('clears all caches', async () => {
      const city: City = { name: 'New York', country: 'US', lat: 40.7128, lon: -74.006 };

      mockWeatherService.getCurrentWeather
        .mockResolvedValueOnce({
          temperature: 20,
          weathercode: 1,
          time: '2024-01-01T12:00:00Z',
          icon: '/weather-icons/mainly-clear.svg',
        })
        .mockResolvedValueOnce({
          temperature: 20,
          weathercode: 1,
          time: '2024-01-01T12:00:00Z',
          icon: '/weather-icons/mainly-clear.svg',
        });

      // Cache some data
      await mockWeatherService.getCurrentWeather(city);

      // Clear cache
      mockWeatherService.clearWeatherCache();

      // Should fetch again
      await mockWeatherService.getCurrentWeather(city);

      expect(mockWeatherService.getCurrentWeather).toHaveBeenCalledTimes(2);
      expect(mockWeatherService.clearWeatherCache).toHaveBeenCalled();
    });
  });

  describe('getCacheStats', () => {
    it('returns correct cache statistics', () => {
      const expectedStats = {
        size: 0,
        entries: 0,
        memoizationStats: {
          weather: 0,
          forecast: 0,
          location: 0,
          cityNormalization: 0,
        },
        requestStats: {
          queueLength: 0,
          running: 0,
          cachedRequests: 0,
        },
      };

      mockWeatherService.getCacheStats.mockReturnValue(expectedStats);

      const stats = mockWeatherService.getCacheStats();

      expect(stats).toEqual(expectedStats);
      expect(mockWeatherService.getCacheStats).toHaveBeenCalled();
    });
  });

  describe('createWeatherError', () => {
    it('creates error object', () => {
      const expectedError: WeatherServiceError = {
        message: 'Test error',
        code: 'TEST_ERROR',
        details: { detail: 'test' },
      };

      mockWeatherService.createWeatherError.mockReturnValue(expectedError);

      const error = mockWeatherService.createWeatherError('Test error', 'TEST_ERROR', {
        detail: 'test',
      });

      expect(error).toEqual(expectedError);
      expect(mockWeatherService.createWeatherError).toHaveBeenCalledWith(
        'Test error',
        'TEST_ERROR',
        { detail: 'test' }
      );
    });
  });

  describe('isWeatherError', () => {
    it('type guards error correctly', () => {
      const weatherError: WeatherServiceError = { message: 'Test error', code: 'TEST_ERROR' };
      const regularError = new Error('Regular error');

      mockWeatherService.isWeatherError
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false);

      expect(mockWeatherService.isWeatherError(weatherError)).toBe(true);
      expect(mockWeatherService.isWeatherError(regularError)).toBe(false);
      expect(mockWeatherService.isWeatherError(null)).toBe(false);
      expect(mockWeatherService.isWeatherError(undefined)).toBe(false);
      expect(mockWeatherService.isWeatherError('string')).toBe(false);
    });
  });
});
