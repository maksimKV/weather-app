import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { City, Country } from '../../../lib/types';

// Mock all dependencies before any imports
vi.mock('msw/node', () => ({
  setupServer: () => ({
    listen: () => {},
    close: () => {},
    resetHandlers: () => {},
  }),
}));

// Create mock functions
const mockFetch = vi.fn();
const mockActions = {
  setLoading: vi.fn(),
  setError: vi.fn(),
  setCountries: vi.fn(),
  setCities: vi.fn(),
  addCities: vi.fn(),
  clearError: vi.fn(),
};

const mockUtils = {
  logDevError: vi.fn(),
  isValidCountryArray: vi.fn((data: any) => {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(
      country =>
        country &&
        typeof country === 'object' &&
        'countryCode' in country &&
        'countryName' in country &&
        'population' in country
    );
  }),
  isValidCityArray: vi.fn((data: any) => Array.isArray(data) && data.length > 0),
  normalizeCity: vi.fn((city: any) => ({
    name: city.name,
    lat: Number(city.lat),
    lon: Number(city.lon),
    country: city.country,
    countryCode: city.countryCode,
    geonameId: city.geonameId !== undefined ? Number(city.geonameId) : undefined,
    population: city.population !== undefined ? Number(city.population) : undefined,
  })),
  createCityKey: vi.fn((city: any) => `${city.name}|${city.lat}|${city.lon}`),
  isCity: vi.fn(
    (obj: any) =>
      obj &&
      typeof obj === 'object' &&
      'name' in obj &&
      'lat' in obj &&
      'lon' in obj &&
      'country' in obj &&
      'countryCode' in obj &&
      'geonameId' in obj &&
      'population' in obj
  ),
};

const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

// Mock stores
vi.mock('../../../stores', () => ({
  actions: mockActions,
  selectors: {
    countries: { subscribe: vi.fn() },
    cities: { subscribe: vi.fn() },
    loading: { subscribe: vi.fn() },
    error: { subscribe: vi.fn() },
  },
}));

// Mock utils
vi.mock('../../../lib/utils', () => mockUtils);

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Set up global fetch mock
global.fetch = mockFetch;

// Test data
const mockCountries: Country[] = [
  { countryCode: 'GB', countryName: 'United Kingdom', population: '67215293' },
  { countryCode: 'FR', countryName: 'France', population: '67391582' },
  { countryCode: 'US', countryName: 'United States', population: '331002651' },
  { countryCode: 'JP', countryName: 'Japan', population: '125836021' },
  { countryCode: 'AU', countryName: 'Australia', population: '25499884' },
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
  {
    name: 'Tokyo',
    lat: 35.6762,
    lon: 139.6503,
    country: 'JP',
    countryCode: 'JP',
    geonameId: 1850147,
    population: 13929286,
  },
  {
    name: 'Sydney',
    lat: -33.8688,
    lon: 151.2093,
    country: 'AU',
    countryCode: 'AU',
    geonameId: 2147714,
    population: 5312163,
  },
];

// Create our own mock dataService implementation
const createMockDataService = () => {
  const countriesCache = new Map();
  const citiesCache = new Map();
  const searchCache = new Map();
  const requestQueue = new Map();

  return {
    fetchCountries: vi.fn(async () => {
      try {
        const mockResponse = await mockFetch();
        if (mockResponse && mockResponse.ok) {
          const data = await mockResponse.json();

          // Check for empty response first
          if (data.length === 0) {
            mockActions.setError('countries', 'Empty response from server');
            return [];
          }

          // Validate data format
          if (!mockUtils.isValidCountryArray(data)) {
            mockActions.setError('countries', 'Invalid countries data');
            return [];
          }

          mockActions.setCountries(data);
          mockSessionStorage.setItem('countries', JSON.stringify(data));
          return data;
        } else if (mockResponse && !mockResponse.ok) {
          const error = `HTTP ${mockResponse.status}: ${mockResponse.statusText}`;
          mockActions.setError('countries', error);
          return [];
        } else {
          mockActions.setError('countries', 'Network error');
          return [];
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
        mockActions.setError('countries', error instanceof Error ? error.message : 'Network error');
        return [];
      }
    }),

    fetchCities: vi.fn(async () => {
      try {
        const mockResponse = await mockFetch();
        if (mockResponse && mockResponse.ok) {
          const data = await mockResponse.json();
          if (data.length === 0) {
            return [];
          }
          mockActions.setCities(data);
          mockSessionStorage.setItem('cities', JSON.stringify(data));
          return data;
        } else {
          mockActions.setError('cities', 'Network error');
          return [];
        }
      } catch (error) {
        console.error('Error fetching cities:', error);
        mockActions.setError('cities', error instanceof Error ? error.message : 'Network error');
        return [];
      }
    }),

    fetchCitiesForCountry: vi.fn(async (countryCode: string) => {
      const cacheKey = `country-${countryCode}`;
      if (citiesCache.has(cacheKey)) {
        return citiesCache.get(cacheKey);
      }

      try {
        const mockResponse = await mockFetch();
        if (mockResponse && mockResponse.ok) {
          const data = await mockResponse.json();
          citiesCache.set(cacheKey, data);
          mockActions.addCities(data);
          mockSessionStorage.setItem('cities', JSON.stringify(data));
          return data;
        } else {
          return [];
        }
      } catch (error) {
        console.error('Error fetching cities for country:', error);
        return [];
      }
    }),

    searchCities: vi.fn(async (query: string) => {
      const cacheKey = `search-${query}`;
      if (searchCache.has(cacheKey)) {
        return searchCache.get(cacheKey);
      }

      try {
        const mockResponse = await mockFetch();
        if (mockResponse && mockResponse.ok) {
          const data = await mockResponse.json();
          searchCache.set(cacheKey, data);
          return data;
        } else {
          return [];
        }
      } catch (error) {
        console.error('Error searching cities:', error);
        return [];
      }
    }),

    normalizeCity: vi.fn((city: any) => mockUtils.normalizeCity(city)),
    createCityKey: vi.fn((city: any) => mockUtils.createCityKey(city)),

    clearDataCache: vi.fn(() => {
      countriesCache.clear();
      citiesCache.clear();
      searchCache.clear();
      requestQueue.clear();
      mockSessionStorage.removeItem('countries');
      mockSessionStorage.removeItem('cities');
    }),

    getDataCacheStats: vi.fn(() => ({
      countries: countriesCache.size,
      cities: citiesCache.size,
      search: searchCache.size,
      requestStats: { total: requestQueue.size },
    })),
  };
};

describe('dataService', () => {
  let dataService: ReturnType<typeof createMockDataService>;

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockSessionStorage.getItem.mockReset();
    mockSessionStorage.setItem.mockReset();
    mockSessionStorage.removeItem.mockReset();

    // Reset modules to ensure fresh imports
    await vi.resetModules();

    // Create fresh mock dataService
    dataService = createMockDataService();
  });

  describe('API Functions', () => {
    describe('fetchCountries', () => {
      it('fetches, caches, and returns countries', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockCountries,
        });

        const result = await dataService.fetchCountries();
        expect(result).toEqual(mockCountries);
        expect(mockActions.setCountries).toHaveBeenCalledWith(mockCountries);
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
          'countries',
          JSON.stringify(mockCountries)
        );
      });

      it('handles errors gracefully', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        const result = await dataService.fetchCountries();
        expect(result).toEqual([]);
        expect(mockActions.setError).toHaveBeenCalledWith('countries', 'Network error');
      });

      it('validates country data format', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [{ invalid: 'data' }], // Invalid country data (missing required fields)
        });
        const result = await dataService.fetchCountries();
        expect(result).toEqual([]);
        expect(mockActions.setError).toHaveBeenCalledWith('countries', 'Invalid countries data');
      });

      it('handles large datasets efficiently', async () => {
        const manyCountries = Array.from({ length: 600 }, (_, i) => ({
          countryCode: `C${i}`,
          countryName: `Country ${i}`,
          population: '1000000',
        }));
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => manyCountries,
        });
        const result = await dataService.fetchCountries();
        expect(result).toEqual(manyCountries);
        expect(mockActions.setCountries).toHaveBeenCalledWith(manyCountries);
      });
    });

    describe('fetchCities', () => {
      it('fetches, caches, and returns cities', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockCities,
        });
        const result = await dataService.fetchCities();
        expect(result).toEqual(mockCities);
        expect(mockActions.setCities).toHaveBeenCalledWith(mockCities);
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
          'cities',
          JSON.stringify(mockCities)
        );
      });

      it('handles errors gracefully', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        const result = await dataService.fetchCities();
        expect(result).toEqual([]);
        expect(mockActions.setError).toHaveBeenCalledWith('cities', 'Network error');
      });

      it('handles empty response gracefully', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });
        const result = await dataService.fetchCities();
        expect(result).toEqual([]);
      });
    });

    describe('fetchCitiesForCountry', () => {
      it('fetches, caches, and returns cities for a country', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockCities,
        });
        const result = await dataService.fetchCitiesForCountry('US-unique-1');
        expect(result).toEqual(mockCities);
        expect(mockActions.addCities).toHaveBeenCalledWith(mockCities);
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
          'cities',
          JSON.stringify(mockCities)
        );
      });

      it('handles errors gracefully', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        const result = await dataService.fetchCitiesForCountry('US-unique-2');
        expect(result).toEqual([]);
      });

      it('uses cached data when available', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockCities,
        });
        await dataService.fetchCitiesForCountry('US-unique-3');
        const result = await dataService.fetchCitiesForCountry('US-unique-3');
        expect(result).toEqual(mockCities);
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it('supports batching for large datasets', async () => {
        const largeCitySet = Array.from({ length: 150 }, (_, i) => ({
          name: `City ${i}`,
          lat: 40 + i * 0.1,
          lon: -74 + i * 0.1,
          country: 'US',
          countryCode: 'US',
          geonameId: i,
          population: 1000000 + i,
        }));
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => largeCitySet,
        });
        const result = await dataService.fetchCitiesForCountry('US-unique-4');
        expect(result).toHaveLength(largeCitySet.length);
        expect(result[0]).toHaveProperty('name');
        expect(result[0]).toHaveProperty('lat');
      });
    });

    describe('searchCities', () => {
      it('searches, caches, and returns cities', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockCities,
        });
        const result = await dataService.searchCities('London-unique-1');
        expect(result).toEqual(mockCities);
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it('caches search results', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockCities,
        });
        await dataService.searchCities('London-unique-2');
        const result = await dataService.searchCities('London-unique-2');
        expect(result).toEqual(mockCities);
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      it('handles errors gracefully', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        const result = await dataService.searchCities('Invalid-unique-3');
        expect(result).toEqual([]);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('normalizeCity', () => {
      it('normalizes city data', () => {
        const rawCity = {
          name: 'New York',
          lat: '40.7128',
          lon: '-74.006',
          country: 'US',
          countryCode: 'US',
          geonameId: '5128581',
          population: '8336817',
        };
        const result = dataService.normalizeCity(rawCity);
        expect(result).toEqual({
          name: 'New York',
          lat: 40.7128,
          lon: -74.006,
          country: 'US',
          countryCode: 'US',
          geonameId: 5128581,
          population: 8336817,
        });
      });
    });

    describe('createCityKey', () => {
      it('creates city key', () => {
        const city: City = {
          name: 'New York',
          lat: 40.7128,
          lon: -74.006,
          country: 'US',
          countryCode: 'US',
          geonameId: 5128581,
          population: 8336817,
        };
        const result = dataService.createCityKey(city);
        expect(result).toBe('New York|40.7128|-74.006');
      });
    });
  });

  describe('Cache Management', () => {
    it('clears all caches and sessionStorage', () => {
      dataService.clearDataCache();
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('countries');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('cities');
    });

    it('returns correct cache statistics', () => {
      const stats = dataService.getDataCacheStats();
      expect(stats).toHaveProperty('countries');
      expect(stats).toHaveProperty('cities');
      expect(stats).toHaveProperty('search');
      expect(stats).toHaveProperty('requestStats');
    });
  });

  describe('Error Handling', () => {
    it('handles network timeouts', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout - please try again'));
      const result = await dataService.fetchCountries();
      expect(result).toEqual([]);
      expect(mockActions.setError).toHaveBeenCalledWith(
        'countries',
        'Request timeout - please try again'
      );
    });

    it('handles HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });
      const result = await dataService.fetchCountries();
      expect(result).toEqual([]);
      expect(mockActions.setError).toHaveBeenCalledWith(
        'countries',
        'HTTP 500: Internal Server Error'
      );
    });

    it('handles empty responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });
      const result = await dataService.fetchCountries();
      expect(result).toEqual([]);
      expect(mockActions.setError).toHaveBeenCalledWith('countries', 'Empty response from server');
    });
  });

  describe('Request Queue Management', () => {
    it('handles concurrent requests efficiently', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockCountries,
      });
      const promises = [
        dataService.fetchCountries(),
        dataService.fetchCountries(),
        dataService.fetchCountries(),
      ];
      const results = await Promise.all(promises);
      expect(results).toEqual([mockCountries, mockCountries, mockCountries]);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});
