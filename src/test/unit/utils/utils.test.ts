import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getUvLabel,
  getComfortLevelColor,
  getHumidityLabel,
  celsiusToFahrenheit,
  formatDate,
  getDaysToShow,
  createResizeHandler,
  normalizeCity,
  createCityKey,
  isCity,
  isValidCityArray,
  isValidWeatherData,
  isValidCountryArray,
  isErrorRecoverable,
  getErrorCategory,
  logDevError,
} from '../../../lib/utils';

// Mock console.error for testing logDevError
const mockConsoleError = vi.fn();
global.console.error = mockConsoleError;

// Mock window for responsive utilities
const mockWindow = {
  innerWidth: 1024,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

describe('Weather Utilities', () => {
  describe('getUvLabel', () => {
    it('returns correct label for all UV ranges', () => {
      expect(getUvLabel(0)).toBe('Low');
      expect(getUvLabel(1)).toBe('Low');
      expect(getUvLabel(2)).toBe('Low');
      expect(getUvLabel(3)).toBe('Moderate');
      expect(getUvLabel(4)).toBe('Moderate');
      expect(getUvLabel(5)).toBe('Moderate');
      expect(getUvLabel(6)).toBe('High');
      expect(getUvLabel(7)).toBe('High');
      expect(getUvLabel(8)).toBe('Very High');
      expect(getUvLabel(9)).toBe('Very High');
      expect(getUvLabel(10)).toBe('Very High');
      expect(getUvLabel(15)).toBe('Very High');
    });

    it('handles undefined input', () => {
      expect(getUvLabel(undefined)).toBe('');
    });
  });

  describe('getComfortLevelColor', () => {
    it('returns correct color for all ranges', () => {
      expect(getComfortLevelColor(0)).toBe('#2196f3'); // blue (dry/low)
      expect(getComfortLevelColor(15)).toBe('#2196f3'); // blue (dry/low)
      expect(getComfortLevelColor(30)).toBe('#2196f3'); // blue (dry/low)
      expect(getComfortLevelColor(31)).toBe('#4caf50'); // green (comfortable/moderate)
      expect(getComfortLevelColor(45)).toBe('#4caf50'); // green (comfortable/moderate)
      expect(getComfortLevelColor(60)).toBe('#4caf50'); // green (comfortable/moderate)
      expect(getComfortLevelColor(61)).toBe('#ff9800'); // orange (humid/high)
      expect(getComfortLevelColor(70)).toBe('#ff9800'); // orange (humid/high)
      expect(getComfortLevelColor(80)).toBe('#ff9800'); // orange (humid/high)
      expect(getComfortLevelColor(81)).toBe('#f44336'); // red (very humid/very high)
      expect(getComfortLevelColor(90)).toBe('#f44336'); // red (very humid/very high)
      expect(getComfortLevelColor(100)).toBe('#f44336'); // red (very humid/very high)
    });

    it('handles undefined input', () => {
      expect(getComfortLevelColor(undefined)).toBe('#bbb');
    });
  });

  describe('getHumidityLabel', () => {
    it('returns correct label for all humidity ranges', () => {
      expect(getHumidityLabel(0)).toBe('Low');
      expect(getHumidityLabel(15)).toBe('Low');
      expect(getHumidityLabel(30)).toBe('Low');
      expect(getHumidityLabel(31)).toBe('Moderate');
      expect(getHumidityLabel(45)).toBe('Moderate');
      expect(getHumidityLabel(60)).toBe('Moderate');
      expect(getHumidityLabel(61)).toBe('High');
      expect(getHumidityLabel(70)).toBe('High');
      expect(getHumidityLabel(80)).toBe('High');
      expect(getHumidityLabel(81)).toBe('Very High');
      expect(getHumidityLabel(90)).toBe('Very High');
      expect(getHumidityLabel(100)).toBe('Very High');
    });

    it('handles undefined input', () => {
      expect(getHumidityLabel(undefined)).toBe('');
    });
  });

  describe('celsiusToFahrenheit', () => {
    it('converts correctly', () => {
      expect(celsiusToFahrenheit(0)).toBe('32.0');
      expect(celsiusToFahrenheit(100)).toBe('212.0');
      expect(celsiusToFahrenheit(20)).toBe('68.0');
      expect(celsiusToFahrenheit(-40)).toBe('-40.0');
      expect(celsiusToFahrenheit(37)).toBe('98.6');
      expect(celsiusToFahrenheit(-273.15)).toBe('-459.7');
    });
  });

  describe('formatDate', () => {
    it('formats valid dates', () => {
      const date = '2024-01-15';
      const formatted = formatDate(date);
      expect(formatted).toMatch(/\d{1,2}/); // Contains at least one digit
      expect(formatted).not.toBe('Unknown');
      expect(formatted).not.toBe('Invalid Date');
    });

    it('handles invalid dates', () => {
      // Test different types of invalid dates
      expect(formatDate('2024-13-45')).toBe('Invalid Date');
      expect(formatDate('not-a-date')).toBe('Invalid Date');
      expect(formatDate('2024-13-01')).toBe('Invalid Date'); // Invalid month
      // Do NOT test '2024-02-30' because JS Date will roll it over to March 1
    });
  });
});

describe('Responsive Utilities', () => {
  describe('getDaysToShow', () => {
    beforeEach(() => {
      // Reset window mock
      Object.defineProperty(global, 'window', {
        value: mockWindow,
        writable: true,
      });
    });

    it('returns correct value for different window sizes', () => {
      // Test mobile size
      mockWindow.innerWidth = 400;
      expect(getDaysToShow()).toBe(4);

      // Test tablet size
      mockWindow.innerWidth = 700;
      expect(getDaysToShow()).toBe(6);

      // Test desktop size
      mockWindow.innerWidth = 1200;
      expect(getDaysToShow()).toBe(8);
    });

    it('handles undefined window', () => {
      // Mock window as undefined (SSR scenario)
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
      });
      expect(getDaysToShow()).toBe(8);
    });
  });

  describe('createResizeHandler', () => {
    it('calls callback', () => {
      const mockCallback = vi.fn();
      const handler = createResizeHandler(mockCallback);

      handler();
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('handles errors', () => {
      const mockCallback = vi.fn(() => {
        throw new Error('Test error');
      });
      const handler = createResizeHandler(mockCallback);

      // Should not throw
      expect(() => handler()).not.toThrow();
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });
  });
});

describe('City Utilities', () => {
  describe('normalizeCity', () => {
    it('normalizes various city input formats', () => {
      // Test with string coordinates
      const input1 = {
        name: 'London',
        lat: '51.5074',
        lon: '-0.1278',
        country: 'GB',
        countryCode: 'GB',
        geonameId: '2643743',
        population: '8982000',
      };
      const result1 = normalizeCity(input1);
      expect(result1).toEqual({
        name: 'London',
        lat: 51.5074,
        lon: -0.1278,
        country: 'GB',
        countryCode: 'GB',
        geonameId: '2643743',
        population: '8982000',
      });

      // Test with lng field instead of lon
      const input2 = {
        name: 'Paris',
        lat: 48.8566,
        lng: 2.3522,
        countryCode: 'FR',
      };
      const result2 = normalizeCity(input2);
      expect(result2).toEqual({
        name: 'Paris',
        lat: 48.8566,
        lon: 2.3522,
        country: 'FR',
        countryCode: 'FR',
        geonameId: undefined,
        population: undefined,
      });

      // Test with missing coordinates (should default to 0)
      const input3 = {
        name: 'Berlin',
        lat: 52.52,
        country: 'DE',
      };
      const result3 = normalizeCity(input3);
      expect(result3).toEqual({
        name: 'Berlin',
        lat: 52.52,
        lon: 0,
        country: 'DE',
        countryCode: undefined,
        geonameId: undefined,
        population: undefined,
      });
    });

    it('throws on invalid input', () => {
      expect(() => normalizeCity(null)).toThrow('Invalid city object');
      expect(() => normalizeCity(undefined)).toThrow('Invalid city object');
      expect(() => normalizeCity({})).toThrow('Invalid city object');
      expect(() => normalizeCity({ name: 'Test' })).toThrow('Invalid city object');
      expect(() => normalizeCity({ lat: 0 })).toThrow('Invalid city object');
      expect(() => normalizeCity('not an object')).toThrow('Invalid city object');
    });
  });

  describe('createCityKey', () => {
    it('generates consistent keys', () => {
      const city1 = { name: 'London', lat: 51.5074, lon: -0.1278 };
      const city2 = { name: 'London', lat: 51.5074, lon: -0.1278 };
      const city3 = { name: 'Paris', lat: 48.8566, lon: 2.3522 };

      const key1 = createCityKey(city1);
      const key2 = createCityKey(city2);
      const key3 = createCityKey(city3);

      expect(key1).toBe('London|51.5074|-0.1278');
      expect(key2).toBe('London|51.5074|-0.1278');
      expect(key3).toBe('Paris|48.8566|2.3522');
      expect(key1).toBe(key2); // Same city should have same key
      expect(key1).not.toBe(key3); // Different cities should have different keys
    });
  });

  describe('isCity', () => {
    it('validates city objects', () => {
      const validCity = {
        name: 'London',
        lat: 51.5074,
        lon: -0.1278,
        country: 'GB',
        countryCode: 'GB',
        geonameId: 2643743,
        population: 8982000,
      };
      const invalidCity1 = { name: 'London' };
      const invalidCity2 = { lat: 51.5074, lon: -0.1278 };
      const invalidCity3 = { name: 123, lat: 51.5074, lon: -0.1278 };

      expect(isCity(validCity)).toBe(true);
      expect(isCity(invalidCity1)).toBe(false);
      expect(isCity(invalidCity2)).toBe(false);
      expect(isCity(invalidCity3)).toBe(false);
      expect(isCity(null)).toBe(false);
      expect(isCity(undefined)).toBe(false);
      expect(isCity('not an object')).toBe(false);
    });
  });

  describe('isValidCityArray', () => {
    it('validates city arrays', () => {
      const validCities = [
        { name: 'London', lat: 51.5074, lon: -0.1278, country: 'GB' },
        { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR' },
      ];
      const invalidCities1 = [
        { name: 'London', lat: 51.5074, lon: -0.1278, country: 'GB' },
        { name: 'Paris' }, // Missing required fields
      ];
      const invalidCities2 = [
        { name: 'London', lat: '51.5074', lon: -0.1278, country: 'GB' }, // lat should be number
      ];

      expect(isValidCityArray(validCities)).toBe(true);
      expect(isValidCityArray(invalidCities1)).toBe(false);
      expect(isValidCityArray(invalidCities2)).toBe(false);
      expect(isValidCityArray([])).toBe(true); // Empty array is valid
      expect(isValidCityArray(null)).toBe(false);
      expect(isValidCityArray(undefined)).toBe(false);
      expect(isValidCityArray('not an array')).toBe(false);
    });
  });
});

describe('Data Validation', () => {
  describe('isValidWeatherData', () => {
    it('validates weather and forecast data', () => {
      // Valid current weather data
      const validWeather = {
        temperature: 20,
        weathercode: 1,
        time: '2024-01-01T12:00:00Z',
        humidity: 65,
        windspeed: 10,
      };

      // Valid forecast data
      const validForecast = {
        daily: {
          time: ['2024-01-01', '2024-01-02'],
          temperature_2m_min: [15, 16],
          temperature_2m_max: [25, 26],
          weathercode: [1, 2],
        },
      };

      // Invalid data
      const invalidData1 = { temperature: 20 }; // Missing weathercode
      const invalidData2 = { weathercode: 1 }; // Missing temperature
      const invalidData3 = {
        daily: {
          time: ['2024-01-01'],
          temperature_2m_min: [15],
          // Missing temperature_2m_max and weathercode
        },
      };

      expect(isValidWeatherData(validWeather)).toBe(true);
      expect(isValidWeatherData(validForecast)).toBe(true);
      expect(isValidWeatherData(invalidData1)).toBe(false);
      expect(isValidWeatherData(invalidData2)).toBe(false);
      expect(isValidWeatherData(invalidData3)).toBe(false);
      expect(isValidWeatherData(null)).toBe(false);
      expect(isValidWeatherData(undefined)).toBe(false);
      expect(isValidWeatherData('not an object')).toBe(false);
    });
  });

  describe('isValidCountryArray', () => {
    it('validates country arrays', () => {
      const validCountries = [
        { countryCode: 'GB', countryName: 'United Kingdom' },
        { countryCode: 'FR', countryName: 'France' },
        { countryCode: 'US', countryName: 'United States' },
      ];
      const invalidCountries1 = [
        { countryCode: 'GB', countryName: 'United Kingdom' },
        { countryCode: 'FR' }, // Missing countryName
      ];
      const invalidCountries2 = [
        { countryCode: 123, countryName: 'United Kingdom' }, // countryCode should be string
      ];

      expect(isValidCountryArray(validCountries)).toBe(true);
      expect(isValidCountryArray(invalidCountries1)).toBe(false);
      expect(isValidCountryArray(invalidCountries2)).toBe(false);
      expect(isValidCountryArray([])).toBe(true); // Empty array is valid
      expect(isValidCountryArray(null)).toBe(false);
      expect(isValidCountryArray(undefined)).toBe(false);
      expect(isValidCountryArray('not an array')).toBe(false);
    });
  });
});

describe('Error Handling', () => {
  describe('isErrorRecoverable', () => {
    it('identifies recoverable errors', () => {
      // Network errors
      const networkError = new TypeError('fetch failed');
      expect(isErrorRecoverable(networkError)).toBe(true);

      // API errors
      const apiError1 = new Error('HTTP 500: Internal Server Error');
      const apiError2 = new Error('API rate limit exceeded');
      expect(isErrorRecoverable(apiError1)).toBe(true);
      expect(isErrorRecoverable(apiError2)).toBe(true);

      // Data parsing errors
      const syntaxError = new SyntaxError('Unexpected token in JSON');
      const jsonError = new Error('Invalid JSON response');
      expect(isErrorRecoverable(syntaxError)).toBe(true);
      expect(isErrorRecoverable(jsonError)).toBe(true);

      // Component rendering errors
      const renderError1 = new Error('Cannot read property "name" of undefined');
      const renderError2 = new Error('undefined is not a function');
      expect(isErrorRecoverable(renderError1)).toBe(true);
      expect(isErrorRecoverable(renderError2)).toBe(true);
    });

    it('identifies non-recoverable errors', () => {
      const unrecoverableError1 = new Error('Critical system failure');
      const unrecoverableError2 = new Error('Database connection lost permanently');
      const unrecoverableError3 = new Error('Authentication failed');

      expect(isErrorRecoverable(unrecoverableError1)).toBe(false);
      expect(isErrorRecoverable(unrecoverableError2)).toBe(false);
      expect(isErrorRecoverable(unrecoverableError3)).toBe(false);
    });
  });

  describe('getErrorCategory', () => {
    it('categorizes errors', () => {
      // Type errors
      const typeError = new TypeError('Cannot read property of undefined');
      expect(getErrorCategory(typeError)).toBe('Type Error');

      // Syntax errors
      const syntaxError = new SyntaxError('Unexpected token');
      expect(getErrorCategory(syntaxError)).toBe('Syntax Error');

      // Reference errors
      const referenceError = new ReferenceError('variable is not defined');
      expect(getErrorCategory(referenceError)).toBe('Reference Error');

      // Range errors
      const rangeError = new RangeError('Maximum call stack size exceeded');
      expect(getErrorCategory(rangeError)).toBe('Range Error');

      // Network errors
      const networkError = new Error('fetch failed');
      expect(getErrorCategory(networkError)).toBe('Network Error');

      // API errors
      const apiError = new Error('API request failed');
      expect(getErrorCategory(apiError)).toBe('API Error');

      // Data errors
      const dataError = new Error('Invalid JSON response');
      expect(getErrorCategory(dataError)).toBe('Data Error');

      // Unknown errors
      const unknownError = new Error('Some other error');
      expect(getErrorCategory(unknownError)).toBe('Unknown Error');
    });
  });

  describe('logDevError', () => {
    beforeEach(() => {
      mockConsoleError.mockClear();
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.clearAllMocks();
    });

    it('logs in dev mode', () => {
      // Create a mock that returns true for DEV
      const mockImportMeta = { env: { DEV: true } };
      vi.stubGlobal('import.meta', mockImportMeta);

      logDevError('Test error message', new Error('Test error'));

      expect(mockConsoleError).toHaveBeenCalledWith('Test error message', expect.any(Error));
    });

    it('handles multiple arguments', () => {
      const mockImportMeta = { env: { DEV: true } };
      vi.stubGlobal('import.meta', mockImportMeta);

      logDevError('Error occurred', 'additional info', { data: 'test' }, 123);

      expect(mockConsoleError).toHaveBeenCalledWith(
        'Error occurred',
        'additional info',
        { data: 'test' },
        123
      );
    });
  });
});
