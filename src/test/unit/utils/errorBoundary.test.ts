import { describe, it, expect, vi } from 'vitest';
import {
  isErrorRecoverable,
  getErrorCategory,
  safeAccess,
  safeCall,
  safeAsyncCall,
  validateWeatherData,
  validateCityData,
  validateCountryData,
  createErrorBoundary,
  createDefaultFallback,
  errorStore,
} from '../../../lib/errorBoundary';

// Error Utilities

describe('Error Utilities', () => {
  describe('isErrorRecoverable', () => {
    it('identifies recoverable errors', () => {
      expect(isErrorRecoverable(new TypeError('fetch failed'))).toBe(true);
      expect(isErrorRecoverable(new Error('HTTP 500: Internal Server Error'))).toBe(true);
      expect(isErrorRecoverable(new SyntaxError('Unexpected token in JSON'))).toBe(true);
      expect(isErrorRecoverable(new Error('Cannot read property "foo" of undefined'))).toBe(true);
    });
    it('identifies non-recoverable errors', () => {
      expect(isErrorRecoverable(new Error('Critical system failure'))).toBe(false);
    });
  });

  describe('getErrorCategory', () => {
    it('categorizes errors', () => {
      expect(getErrorCategory(new TypeError('fetch failed'))).toBe('NETWORK_ERROR');
      expect(getErrorCategory(new Error('HTTP 500: Internal Server Error'))).toBe('API_ERROR');
      expect(getErrorCategory(new SyntaxError('Unexpected token in JSON'))).toBe('DATA_ERROR');
      expect(getErrorCategory(new Error('Cannot read property "foo" of undefined'))).toBe(
        'RENDERING_ERROR'
      );
      expect(getErrorCategory(new Error('Map failed to load'))).toBe('MAP_ERROR');
      expect(getErrorCategory(new Error('Some unknown error'))).toBe('UNKNOWN_ERROR');
    });
  });

  describe('safeAccess', () => {
    it('safely accesses nested properties', () => {
      const obj = { a: { b: { c: 42 } } };
      expect(safeAccess(obj, ['a', 'b', 'c'], 0)).toBe(42);
      expect(safeAccess(obj, ['a', 'b', 'd'], 'default')).toBe('default');
      expect(safeAccess(obj, ['a', 'x', 'y'], null)).toBe(null);
      expect(safeAccess(null, ['a', 'b'], 'fallback')).toBe('fallback');
    });
    it('returns defaultValue on error', () => {
      expect(safeAccess(undefined, ['a'], 123)).toBe(123);
    });
  });

  describe('safeCall', () => {
    it('executes functions safely', () => {
      expect(safeCall(() => 5 + 5, 0)).toBe(10);
      expect(
        safeCall(() => {
          throw new Error('fail');
        }, 42)
      ).toBe(42);
    });
  });

  describe('safeAsyncCall', () => {
    it('handles async functions safely', async () => {
      const good = async () => 123;
      const bad = async () => {
        throw new Error('fail');
      };
      await expect(safeAsyncCall(good, 0)).resolves.toBe(123);
      await expect(safeAsyncCall(bad, 99)).resolves.toBe(99);
    });
  });

  describe('validateWeatherData', () => {
    it('validates correct weather and forecast data', () => {
      const validWeather = { temperature: 20, weathercode: 1 };
      const validForecast = {
        daily: {
          time: ['2024-01-01'],
          temperature_2m_min: [15],
          temperature_2m_max: [25],
          weathercode: [1],
        },
      };
      expect(validateWeatherData(validWeather)).toBe(true);
      expect(validateWeatherData(validForecast)).toBe(true);
    });
    it('invalidates incorrect data', () => {
      expect(validateWeatherData(null)).toBe(false);
      expect(validateWeatherData({})).toBe(false);
      expect(validateWeatherData({ temperature: 20 })).toBe(false);
      expect(validateWeatherData({ weathercode: 1 })).toBe(false);
    });
  });

  describe('validateCityData', () => {
    it('validates correct city data', () => {
      expect(validateCityData({ name: 'London', lat: 51.5, lon: -0.1 })).toBe(true);
      expect(validateCityData({ name: 'Paris', lat: '48.8', lng: '2.3' })).toBe(true);
    });
    it('invalidates incorrect city data', () => {
      expect(validateCityData(null)).toBe(false);
      expect(validateCityData({})).toBe(false);
      expect(validateCityData({ name: 'London' })).toBe(false);
      expect(validateCityData({ lat: 51.5, lon: -0.1 })).toBe(false);
      expect(validateCityData({ name: 'London', lat: 'invalid', lon: 0 })).toBe(false);
      expect(validateCityData({ name: 'London', lat: 91, lon: 0 })).toBe(false);
      expect(validateCityData({ name: 'London', lat: 0, lon: 181 })).toBe(false);
    });
  });

  describe('validateCountryData', () => {
    it('validates correct country data', () => {
      expect(validateCountryData({ countryCode: 'GB', countryName: 'United Kingdom' })).toBe(true);
    });
    it('invalidates incorrect country data', () => {
      expect(validateCountryData(null)).toBe(false);
      expect(validateCountryData({})).toBe(false);
      expect(validateCountryData({ countryCode: 'GB' })).toBe(false);
      expect(validateCountryData({ countryName: 'UK' })).toBe(false);
    });
  });
});

// ErrorBoundary

describe('ErrorBoundary', () => {
  describe('createErrorBoundary', () => {
    it('handles errors and sets errorStore', () => {
      const boundary = createErrorBoundary();
      const error = new Error('Test error');
      boundary.handleError(error, { info: 'test' });
      let state: any = {
        hasError: false,
        error: null,
        errorInfo: null,
        componentStack: undefined,
        timestamp: 0,
      };
      errorStore.subscribe(s => {
        state = s;
      })();
      expect(state.hasError).toBe(true);
      expect(state.error).toBe(error);
      expect(state.errorInfo).toEqual({ info: 'test' });
    });
    it('resets state', () => {
      const boundary = createErrorBoundary();
      boundary.handleError(new Error('err'), {});
      boundary.reset();
      let state: any = {
        hasError: false,
        error: null,
        errorInfo: null,
        componentStack: undefined,
        timestamp: 0,
      };
      errorStore.subscribe(s => {
        state = s;
      })();
      expect(state.hasError).toBe(false);
      expect(state.error).toBe(null);
      expect(state.errorInfo).toBe(null);
    });
    it('calls custom handler', () => {
      const onError = vi.fn();
      const boundary = createErrorBoundary({ onError });
      const error = new Error('Custom handler error');
      boundary.handleError(error, { info: 'custom' });
      expect(onError).toHaveBeenCalledWith(error, { info: 'custom' });
    });
  });

  describe('createDefaultFallback', () => {
    it('returns correct fallback UI structure', () => {
      const error = new Error('Something failed');
      const fallback = createDefaultFallback(error, {});
      expect(fallback).toHaveProperty('component');
      expect(fallback.component).toHaveProperty('template');
      expect(fallback.component.template).toContain('Something went wrong');
      expect(fallback.component.template).toContain('Something failed');
      expect(fallback.component.template).toContain('Error Type:');
      expect(fallback.component.template).toContain('Retry');
      expect(fallback.component).toHaveProperty('styles');
    });
    it('shows recoverable message for recoverable errors', () => {
      const error = new TypeError('fetch failed');
      const fallback = createDefaultFallback(error, {});
      expect(fallback.component.template).toContain('This error should be recoverable');
    });
    it('does not show recoverable message for non-recoverable errors', () => {
      const error = new Error('Critical system failure');
      const fallback = createDefaultFallback(error, {});
      expect(fallback.component.template).not.toContain('This error should be recoverable');
    });
  });
});
