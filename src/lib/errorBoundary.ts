// ============================================================================
// ERROR BOUNDARY SYSTEM
// ============================================================================

/**
 * Error Handling Approach:
 * - UI errors are handled by ErrorBoundary.svelte and errorStore.
 * - Service/store errors should use actions.setError for user-facing errors.
 * - Use logDevError for dev-only logging instead of console.error.
 */
import { writable, type Writable } from 'svelte/store';
import type { ErrorInfo } from './types';
import { logDevError } from './utils';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  componentStack?: string;
  timestamp: number;
}

export interface ErrorBoundaryOptions {
  fallback?: (error: Error, errorInfo: ErrorInfo) => unknown;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
}

// ============================================================================
// ERROR STORE
// ============================================================================

export const errorStore: Writable<ErrorBoundaryState> = writable({
  hasError: false,
  error: null,
  errorInfo: null,
  componentStack: undefined,
  timestamp: 0,
});

// ============================================================================
// ERROR UTILITIES
// ============================================================================

export function isErrorRecoverable(error: Error): boolean {
  // Network errors are usually recoverable
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }

  // API errors are recoverable
  if (error.message.includes('HTTP') || error.message.includes('API')) {
    return true;
  }

  // Data parsing errors are recoverable
  if (error.name === 'SyntaxError' || error.message.includes('JSON')) {
    return true;
  }

  // Component rendering errors might be recoverable
  if (error.message.includes('Cannot read property') || error.message.includes('undefined')) {
    return true;
  }

  return false;
}

export function getErrorCategory(error: Error): string {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'NETWORK_ERROR';
  }
  if (error.message.includes('HTTP') || error.message.includes('API')) {
    return 'API_ERROR';
  }
  if (error.name === 'SyntaxError' || error.message.includes('JSON')) {
    return 'DATA_ERROR';
  }
  if (error.message.includes('Cannot read property') || error.message.includes('undefined')) {
    return 'RENDERING_ERROR';
  }
  if (error.message.includes('Map') || error.message.includes('maplibre')) {
    return 'MAP_ERROR';
  }
  return 'UNKNOWN_ERROR';
}

// Note: This function is kept for compatibility but the Svelte ErrorBoundary component
// is the preferred way to handle errors in this application
export function createErrorBoundary(options: ErrorBoundaryOptions = {}) {
  const { onError } = options;

  return {
    // Error handler
    handleError(error: Error, errorInfo: ErrorInfo = {}) {
      const errorState: ErrorBoundaryState = {
        hasError: true,
        error,
        errorInfo: errorInfo,
        timestamp: Date.now(),
      };

      errorStore.set(errorState);

      // Call custom error handler
      if (onError) {
        try {
          onError(error, errorInfo);
        } catch (_handlerError) {
          logDevError('Error in error handler:', _handlerError);
        }
      }

      // Log error for debugging
      logDevError('Error Boundary caught error:', {
        error: error.message,
        stack: error.stack,
        info: errorInfo,
        category: getErrorCategory(error),
        recoverable: isErrorRecoverable(error),
      });
    },

    // Reset error state
    reset() {
      errorStore.set({
        hasError: false,
        error: null,
        errorInfo: null,
        componentStack: undefined,
        timestamp: 0,
      });
    },
  };
}

// ============================================================================
// DEFAULT FALLBACK COMPONENTS
// ============================================================================

export function createDefaultFallback(error: Error, _errorInfo: unknown) {
  const category = getErrorCategory(error);
  const isRecoverable = isErrorRecoverable(error);

  return {
    component: {
      template: `
        <div class="error-boundary-fallback">
          <div class="error-icon">⚠️</div>
          <h3>Something went wrong</h3>
          <p class="error-message">${error.message}</p>
          <p class="error-category">Error Type: ${category}</p>
          ${isRecoverable ? '<p class="error-recoverable">This error should be recoverable. Try refreshing the page.</p>' : ''}
          <button class="error-retry" on:click={() => window.location.reload()}>
            Retry
          </button>
        </div>
      `,
      styles: `
        .error-boundary-fallback {
          padding: 2rem;
          text-align: center;
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          margin: 1rem 0;
        }
        .error-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        .error-message {
          color: #856404;
          margin: 1rem 0;
        }
        .error-category {
          font-size: 0.9rem;
          color: #666;
          margin: 0.5rem 0;
        }
        .error-recoverable {
          color: #155724;
          background: #d4edda;
          padding: 0.5rem;
          border-radius: 4px;
          margin: 1rem 0;
        }
        .error-retry {
          background: #007bff;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 1rem;
        }
        .error-retry:hover {
          background: #0056b3;
        }
      `,
    },
  };
}

// ============================================================================
// GLOBAL ERROR HANDLERS
// ============================================================================

export function setupGlobalErrorHandlers() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    logDevError('Unhandled promise rejection:', event.reason);
    errorStore.set({
      hasError: true,
      error: new Error(`Unhandled Promise Rejection: ${event.reason}`),
      errorInfo: { type: 'unhandledrejection', reason: event.reason },
      timestamp: Date.now(),
    });
    event.preventDefault();
  });

  // Handle global errors
  window.addEventListener('error', event => {
    logDevError('Global error:', event.error);
    errorStore.set({
      hasError: true,
      error: event.error || new Error(event.message),
      errorInfo: { type: 'global', filename: event.filename, lineno: event.lineno },
      timestamp: Date.now(),
    });
  });

  // Handle Svelte component errors
  if (typeof window !== 'undefined') {
    (
      window as unknown as { __SVELTE_ERROR_HANDLER__?: (error: Error) => void }
    ).__SVELTE_ERROR_HANDLER__ = (error: Error) => {
      logDevError('Svelte error:', error);
      errorStore.set({
        hasError: true,
        error,
        errorInfo: { type: 'svelte' },
        timestamp: Date.now(),
      });
    };
  }
}

// ============================================================================
// SAFE UTILITY FUNCTIONS
// ============================================================================

export function safeAccess<T>(obj: unknown, path: string[], defaultValue: T): T {
  try {
    let current: unknown = obj;
    for (const key of path) {
      if (typeof current !== 'object' || current === null) {
        return defaultValue;
      }
      current = (current as Record<string, unknown>)[key];
    }
    return current !== undefined ? (current as T) : defaultValue;
  } catch (error) {
    logDevError('Error in safeAccess:', error);
    return defaultValue;
  }
}

export function safeCall<T>(fn: () => T, defaultValue: T): T {
  try {
    return fn();
  } catch (error) {
    logDevError('Error in safeCall:', error);
    return defaultValue;
  }
}

export function safeAsyncCall<T>(fn: () => Promise<T>, defaultValue: T): Promise<T> {
  return fn().catch(() => defaultValue);
}

// ============================================================================
// DATA VALIDATION
// ============================================================================

export function validateWeatherData(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  // Check for required weather properties
  if (d.daily && typeof d.daily === 'object') {
    const daily = d.daily as Record<string, unknown>;
    const required = ['time', 'temperature_2m_min', 'temperature_2m_max', 'weathercode'];
    return required.every(prop => Array.isArray(daily[prop]));
  }
  // Check for current weather properties
  if (
    (d as Record<string, unknown>).temperature !== undefined &&
    (d as Record<string, unknown>).weathercode !== undefined
  ) {
    return true;
  }
  return false;
}

export function validateCityData(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;

  const city = data as Record<string, unknown>;

  // Check for required properties
  if (!city.name || typeof city.name !== 'string') return false;

  // Check for coordinates - allow both string and number types
  const lat = city.lat;
  const lon = city.lon || city.lng;

  if (lat === undefined || lat === null) return false;
  if (lon === undefined || lon === null) return false;

  // Convert to numbers and validate
  const latNum = Number(lat);
  const lonNum = Number(lon);

  if (isNaN(latNum) || isNaN(lonNum)) return false;
  if (latNum < -90 || latNum > 90) return false;
  if (lonNum < -180 || lonNum > 180) return false;

  return true;
}

export function validateCountryData(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;

  const country = data as Record<string, unknown>;
  const required = ['countryCode', 'countryName'];
  return required.every(prop => country[prop] !== undefined);
}
