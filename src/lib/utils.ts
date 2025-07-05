// ============================================================================
// SHARED UTILITIES
// ============================================================================

// ============================================================================
// WEATHER UTILITIES
// ============================================================================

/**
 * Get UV index label based on value
 */
export function getUvLabel(val: number | undefined): string {
  if (val === undefined) return '';
  if (val < 3) return 'Low';
  if (val < 6) return 'Moderate';
  if (val < 8) return 'High';
  return 'Very High';
}

/**
 * Get comfort level color based on humidity or UV value
 */
export function getComfortLevelColor(val: number | undefined): string {
  if (val === undefined) return '#bbb';
  if (val < 31) return '#2196f3'; // blue (dry/low)
  if (val < 61) return '#4caf50'; // green (comfortable/moderate)
  if (val < 81) return '#ff9800'; // orange (humid/high)
  return '#f44336'; // red (very humid/very high)
}

/**
 * Get humidity label based on value
 */
export function getHumidityLabel(val: number | undefined): string {
  if (val === undefined) return '';
  if (val < 31) return 'Low';
  if (val < 61) return 'Moderate';
  if (val < 81) return 'High';
  return 'Very High';
}

/**
 * Convert Celsius to Fahrenheit
 */
export function celsiusToFahrenheit(celsius: number): string {
  return ((celsius * 9) / 5 + 32).toFixed(1);
}

/**
 * Format date for display
 */
export function formatDate(date: string): string {
  try {
    return new Date(date).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Unknown';
  }
}

// ============================================================================
// RESPONSIVE UTILITIES
// ============================================================================

/**
 * Get number of days to show based on screen width
 */
export function getDaysToShow(): number {
  if (typeof window === 'undefined') return 8;

  if (window.innerWidth < 500) return 4;
  if (window.innerWidth < 900) return 6;
  return 8;
}

/**
 * Create a responsive resize handler
 */
export function createResizeHandler(callback: () => void): () => void {
  return () => {
    try {
      callback();
    } catch (error) {
      console.error('Error in resize handler:', error);
    }
  };
}

// ============================================================================
// CITY UTILITIES
// ============================================================================

/**
 * Normalize city object to ensure consistent structure
 */
export function normalizeCity(city: unknown): {
  name: string;
  lat: number;
  lon: number;
  country: string;
  countryCode?: string;
  geonameId?: number;
  population?: number;
} {
  if (typeof city === 'object' && city !== null && 'name' in city && 'lat' in city) {
    const c = city as {
      name: string;
      lat: number;
      lon?: number;
      lng?: number;
      country?: string;
      countryCode?: string;
      geonameId?: number;
      population?: number;
    };

    return {
      name: c.name,
      lat: Number(c.lat),
      lon: Number(c.lon ?? c.lng ?? 0),
      country: c.countryCode ?? c.country ?? 'Unknown',
      countryCode: c.countryCode,
      geonameId: c.geonameId,
      population: c.population,
    };
  }

  throw new Error('Invalid city object');
}

/**
 * Create a unique key for a city
 */
export function createCityKey(city: { name: string; lat: number; lon: number }): string {
  return `${city.name}|${city.lat}|${city.lon}`;
}

/**
 * Type guard for City objects
 */
export function isCity(obj: unknown): obj is {
  name: string;
  lat: number;
  lon: number;
  country: string;
  countryCode?: string;
  geonameId?: number;
  population?: number;
} {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    'lat' in obj &&
    typeof (obj as Record<string, unknown>).name === 'string' &&
    typeof (obj as Record<string, unknown>).lat === 'number'
  );
}

// ============================================================================
// ERROR UTILITIES
// ============================================================================

/**
 * Check if an error is recoverable
 */
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

/**
 * Get error category for better error handling
 */
export function getErrorCategory(error: Error): string {
  if (error.name === 'TypeError') return 'Type Error';
  if (error.name === 'SyntaxError') return 'Syntax Error';
  if (error.name === 'ReferenceError') return 'Reference Error';
  if (error.name === 'RangeError') return 'Range Error';
  if (error.message.includes('fetch')) return 'Network Error';
  if (error.message.includes('API')) return 'API Error';
  if (error.message.includes('JSON')) return 'Data Error';
  return 'Unknown Error';
}
