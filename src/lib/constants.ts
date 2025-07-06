// ============================================================================
// WEATHER APP CONSTANTS
// ============================================================================

// ============================================================================
// API CONFIGURATION
// ============================================================================

export const API_CONFIG = {
  TIMEOUT_MS: 30000,
  MAX_ROWS: 50,
  BATCH_SIZE: 100,
  MAX_BATCHES: 3,
  REQUEST_DELAY_MS: 50,
  MAX_CONCURRENT_REQUESTS: 4,
  CACHE_DURATION_MS: 30 * 60 * 1000, // 30 minutes
} as const;

// ============================================================================
// MAP CONFIGURATION
// ============================================================================

export const MAP_CONFIG = {
  DEFAULT_CENTER: [20, 0] as [number, number],
  DEFAULT_ZOOM: 2,
  CITY_ZOOM: 7,
  COUNTRY_ZOOM: 5,
  MAP_STYLE: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  MARKER_PADDING: 120,
  MARKER_DURATION: 800,
} as const;

// ============================================================================
// UI CONFIGURATION
// ============================================================================

export const UI_CONFIG = {
  // Animation durations
  FLY_DURATION: 400,
  FADE_DURATION: 200,
  DEBOUNCE_DELAY: 200,
  DROPDOWN_DELAY: 200,

  // Chart configuration
  CHART_DEBOUNCE: 100,
  CHART_UPDATE_DELAY: 50,
  MAX_CHART_CITIES: 12,
  CHART_HEIGHT: '300px',
  CHART_MAX_BAR_THICKNESS: 50,

  // Weather card defaults
  DEFAULT_ICON_SIZE: 56,
  DEFAULT_TEXT_SIZE: '1em',
  DEFAULT_MIN_WIDTH: '80px',
  DEFAULT_CARD_BG: 'var(--secondary)',
  DEFAULT_CARD_MARGIN: '0 0.3em',
  SMALL_ICON_SIZE: 32,
  SMALL_MIN_WIDTH: '70px',

  // Icon sizes
  ICON_SIZE_SMALL: 18,
  ICON_SIZE_MEDIUM: 24,
  ICON_SIZE_LARGE: 48,

  // Z-index values
  DROPDOWN_Z_INDEX: 10,

  // Max dimensions
  MAX_DROPDOWN_HEIGHT: 200,
  MAX_SELECTOR_WIDTH: 320,
} as const;

// ============================================================================
// WEATHER THRESHOLDS
// ============================================================================

export const WEATHER_THRESHOLDS = {
  TEMPERATURE: {
    HOT: 25,
    WARM: 15,
    COOL: 5,
  },
  UV: {
    HIGH: 6,
  },
} as const;

// ============================================================================
// COLOR PALETTE
// ============================================================================

export const COLORS = {
  // Temperature colors
  TEMPERATURE: {
    HOT: '#f44336',
    WARM: '#ff9800',
    COOL: '#2196f3',
    COLD: '#3f51b5',
  },

  // UI colors
  UI: {
    PRIMARY: '#2a7de1',
    SECONDARY: '#007bff',
    ACCENT: '#00c6fb',
    SUCCESS: '#4caf50',
    WARNING: '#ff9800',
    ERROR: '#f44336',
    INFO: '#2196f3',
    TEXT_PRIMARY: '#333',
    TEXT_SECONDARY: '#666',
    TEXT_MUTED: '#888',
    BORDER: '#ccc',
    BACKGROUND: '#fff',
    SHADOW: 'rgba(0, 0, 0, 0.05)',
    SHADOW_DARK: 'rgba(0, 0, 0, 0.1)',
    OVERLAY: 'rgba(0, 0, 0, 0.9)',
  },

  // Chart colors
  CHART: {
    BACKGROUND: 'rgba(0, 0, 0, 0.9)',
    BORDER: '#666',
    GRID: 'rgba(0, 0, 0, 0.1)',
  },
} as const;

// ============================================================================
// ICON PATHS
// ============================================================================

export const ICON_PATHS = {
  WEATHER: {
    UNKNOWN: '/weather-icons/unknown.svg',
    CLEAR_DAY: '/weather-icons/clear-day.svg',
    MIN_TEMP: '/weather-icons/min-temp.svg',
    SUNRISE: '/weather-icons/sunrise.svg',
    SUNSET: '/weather-icons/sunset.svg',
    HUMIDITY: '/weather-icons/humidity.svg',
    UV: '/weather-icons/uv.svg',
  },
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const ERROR_MESSAGES = {
  WEATHER: {
    FETCH_FAILED: 'Failed to load weather',
    CITY_WEATHER_FAILED: 'Failed to load city weather',
    FORECAST_FAILED: 'Failed to load forecast',
    LOCATION_FAILED: 'Failed to fetch location forecast',
    INVALID_CITY: 'Invalid city data for weather fetch',
    INVALID_FORECAST: 'Invalid forecast data received for city',
    NO_VALID_CITIES: 'No valid cities found for weather fetch',
  },
  LOCATION: {
    UNAVAILABLE: 'Location unavailable',
    DETERMINE_FAILED: 'Unable to determine your location. Please select a city manually.',
    RATE_LIMIT:
      'Location service is temporarily unavailable due to high traffic. Please try again in a few minutes.',
  },
  DATA: {
    INVALID_COUNTRY: 'Invalid country data received',
    INVALID_CITY: 'Invalid city data received',
    LOAD_COUNTRY_FAILED: 'Failed to load country data',
    SELECT_CITY_FAILED: 'Failed to select city',
  },
  MAP: {
    INVALID_CITY_CLICK: 'Invalid city data in marker click',
    MARKER_CLICK_FAILED: 'Error handling marker click',
  },
  GENERAL: {
    INIT_FAILED: 'Failed to initialize app',
    SEARCH_FAILED: 'Error searching cities',
    RATE_LIMIT: 'Service temporarily unavailable due to high traffic. Please try again later.',
  },
} as const;

// ============================================================================
// CACHE THRESHOLDS
// ============================================================================

export const CACHE_THRESHOLDS = {
  CITIES_CACHE_MIN: 1000,
  PREFETCH_CITY_COUNT: 20,
  PREFETCH_TRIGGER_COUNT: 10,
} as const;

// ============================================================================
// RESPONSIVE BREAKPOINTS
// ============================================================================

export const BREAKPOINTS = {
  MOBILE: 600,
  TABLET: 768,
  DESKTOP: 1024,
  LARGE_DESKTOP: 1200,
} as const;

// ============================================================================
// FONT CONFIGURATION
// ============================================================================

export const FONT_CONFIG = {
  PRIMARY: "'Montserrat', system-ui, sans-serif",
  WEIGHTS: {
    NORMAL: 400,
    MEDIUM: 500,
    SEMIBOLD: 600,
    BOLD: 700,
  },
  SIZES: {
    SMALL: '0.8em',
    NORMAL: '1em',
    LARGE: '1.15em',
    TITLE: '1.5em',
  },
} as const;

// ============================================================================
// ANIMATION CONFIGURATION
// ============================================================================

export const ANIMATION_CONFIG = {
  DURATIONS: {
    FAST: 200,
    NORMAL: 400,
    SLOW: 800,
  },
  EASINGS: {
    EASE_IN_OUT: 'ease-in-out',
    EASE_OUT: 'ease-out',
  },
} as const;

// ============================================================================
// VALIDATION CONFIGURATION
// ============================================================================

export const VALIDATION_CONFIG = {
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_RESULTS: 20,
  COORDINATE_LIMITS: {
    LAT_MIN: -90,
    LAT_MAX: 90,
    LON_MIN: -180,
    LON_MAX: 180,
  },
} as const;
