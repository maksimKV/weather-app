// ============================================================================
// ERROR BOUNDARY SYSTEM
// ============================================================================

import { writable, type Writable } from 'svelte/store';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
  componentStack?: string;
  timestamp: number;
}

export interface ErrorBoundaryOptions {
  fallback?: (error: Error, errorInfo: any) => any;
  onError?: (error: Error, errorInfo: any) => void;
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
  const { fallback, onError, resetOnPropsChange = true } = options;

  return {
    // Error handler
    handleError(error: Error, errorInfo: any = {}) {
      const errorState: ErrorBoundaryState = {
        hasError: true,
        error,
        errorInfo,
        timestamp: Date.now(),
      };

      errorStore.set(errorState);

      // Call custom error handler
      if (onError) {
        try {
          onError(error, errorInfo);
        } catch (handlerError) {
          console.error('Error in error handler:', handlerError);
        }
      }

      // Log error for debugging
      console.error('Error Boundary caught error:', {
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

export function createDefaultFallback(error: Error, errorInfo: any) {
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
    console.error('Unhandled promise rejection:', event.reason);
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
    console.error('Global error:', event.error);
    errorStore.set({
      hasError: true,
      error: event.error || new Error(event.message),
      errorInfo: { type: 'global', filename: event.filename, lineno: event.lineno },
      timestamp: Date.now(),
    });
  });

  // Handle Svelte component errors
  if (typeof window !== 'undefined') {
    (window as any).__SVELTE_ERROR_HANDLER__ = (error: Error) => {
      console.error('Svelte error:', error);
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

export function safeAccess<T>(obj: any, path: string[], defaultValue: T): T {
  try {
    let current = obj;
    for (const key of path) {
      if (current == null || typeof current !== 'object') {
        return defaultValue;
      }
      current = current[key];
    }
    return current !== undefined ? current : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function safeCall<T>(fn: () => T, defaultValue: T): T {
  try {
    return fn();
  } catch {
    return defaultValue;
  }
}

export function safeAsyncCall<T>(fn: () => Promise<T>, defaultValue: T): Promise<T> {
  return fn().catch(() => defaultValue);
}

// ============================================================================
// DATA VALIDATION
// ============================================================================

export function validateWeatherData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;

  // Check for required weather properties
  if (data.daily && typeof data.daily === 'object') {
    const required = ['time', 'temperature_2m_min', 'temperature_2m_max', 'weathercode'];
    return required.every(prop => Array.isArray(data.daily[prop]));
  }

  // Check for current weather properties
  if (data.temperature !== undefined && data.weathercode !== undefined) {
    return true;
  }

  return false;
}

export function validateCityData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;

  // Check for required properties
  if (!data.name || typeof data.name !== 'string') return false;

  // Check for coordinates - allow both string and number types
  const lat = data.lat;
  const lon = data.lon || data.lng;

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

export function validateCountryData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;

  const required = ['countryCode', 'countryName'];
  return required.every(prop => data[prop] !== undefined);
}
