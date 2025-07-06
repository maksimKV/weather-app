import { describe, it, expect } from 'vitest';
import {
  getUvLabel,
  getComfortLevelColor,
  getHumidityLabel,
  celsiusToFahrenheit,
  formatDate,
  normalizeCity,
  createCityKey,
  isCity,
  isValidWeatherData,
} from '../../../lib/utils';

describe('Weather Utilities', () => {
  describe('getUvLabel', () => {
    it('returns correct labels for all UV ranges', () => {
      expect(getUvLabel(0)).toBe('Low');
      expect(getUvLabel(2)).toBe('Low');
      expect(getUvLabel(3)).toBe('Moderate');
      expect(getUvLabel(5)).toBe('Moderate');
      expect(getUvLabel(6)).toBe('High');
      expect(getUvLabel(7)).toBe('High');
      expect(getUvLabel(8)).toBe('Very High');
      expect(getUvLabel(10)).toBe('Very High');
    });

    it('returns empty string for undefined input', () => {
      expect(getUvLabel(undefined)).toBe('');
    });
  });

  describe('getComfortLevelColor', () => {
    it('returns correct colors for all comfort levels', () => {
      expect(getComfortLevelColor(30)).toBe('#2196f3'); // blue (dry/low)
      expect(getComfortLevelColor(45)).toBe('#4caf50'); // green (comfortable/moderate)
      expect(getComfortLevelColor(70)).toBe('#ff9800'); // orange (humid/high)
      expect(getComfortLevelColor(85)).toBe('#f44336'); // red (very humid/very high)
    });

    it('returns default color for undefined input', () => {
      expect(getComfortLevelColor(undefined)).toBe('#bbb');
    });
  });

  describe('getHumidityLabel', () => {
    it('returns correct labels for all humidity ranges', () => {
      expect(getHumidityLabel(25)).toBe('Low');
      expect(getHumidityLabel(45)).toBe('Moderate');
      expect(getHumidityLabel(70)).toBe('High');
      expect(getHumidityLabel(85)).toBe('Very High');
    });

    it('returns empty string for undefined input', () => {
      expect(getHumidityLabel(undefined)).toBe('');
    });
  });

  describe('celsiusToFahrenheit', () => {
    it('converts Celsius to Fahrenheit correctly', () => {
      expect(celsiusToFahrenheit(0)).toBe('32.0');
      expect(celsiusToFahrenheit(100)).toBe('212.0');
      expect(celsiusToFahrenheit(20)).toBe('68.0');
      expect(celsiusToFahrenheit(-40)).toBe('-40.0');
    });
  });

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = '2024-01-15';
      const formatted = formatDate(date);
      // Test that it returns a formatted date string (locale-independent)
      expect(formatted).toMatch(/\d{1,2}/); // Contains at least one digit
      expect(formatted).not.toBe('Unknown');
    });

    it('handles invalid date gracefully', () => {
      expect(formatDate('invalid-date')).toBe('Invalid Date');
    });
  });
});

describe('City Utilities', () => {
  describe('normalizeCity', () => {
    it('normalizes city data correctly', () => {
      const input = {
        name: 'London',
        lat: '51.5074',
        lon: '-0.1278',
        country: 'GB',
      };

      const result = normalizeCity(input);
      expect(result).toEqual({
        name: 'London',
        lat: 51.5074,
        lon: -0.1278,
        country: 'GB',
        countryCode: undefined,
        geonameId: undefined,
        population: undefined,
      });
    });

    it('handles lng field instead of lon', () => {
      const input = {
        name: 'Paris',
        lat: 48.8566,
        lng: 2.3522,
        country: 'FR',
      };

      const result = normalizeCity(input);
      expect(result.lon).toBe(2.3522);
    });

    it('throws error for invalid city object', () => {
      expect(() => normalizeCity(null as any)).toThrow('Invalid city object');
      expect(() => normalizeCity({} as any)).toThrow('Invalid city object');
    });
  });

  describe('createCityKey', () => {
    it('creates consistent keys', () => {
      const city = { name: 'London', lat: 51.5074, lon: -0.1278 };
      const key = createCityKey(city);
      expect(key).toBe('London|51.5074|-0.1278');
    });
  });

  describe('isCity', () => {
    it('validates city objects correctly', () => {
      const validCity = { name: 'London', lat: 51.5074, lon: -0.1278, country: 'GB' };
      const invalidCity = { name: 'London' };

      expect(isCity(validCity)).toBe(true);
      expect(isCity(invalidCity)).toBe(false);
      expect(isCity(null)).toBe(false);
      expect(isCity(undefined)).toBe(false);
    });
  });
});

describe('Data Validation', () => {
  describe('isValidWeatherData', () => {
    it('validates weather data correctly', () => {
      const validWeather = {
        temperature: 20,
        weathercode: 1,
        time: '2024-01-01T12:00:00Z',
      };

      const validForecast = {
        daily: {
          time: ['2024-01-01'],
          temperature_2m_min: [15],
          temperature_2m_max: [25],
          weathercode: [1],
        },
      };

      expect(isValidWeatherData(validWeather)).toBe(true);
      expect(isValidWeatherData(validForecast)).toBe(true);
      expect(isValidWeatherData(null)).toBe(false);
      expect(isValidWeatherData({})).toBe(false);
    });
  });
});
