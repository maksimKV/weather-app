// ============================================================================
// WEATHER APP TYPE DEFINITIONS
// ============================================================================

// ============================================================================
// CORE DATA TYPES
// ============================================================================

export interface City {
  name: string;
  lat: number;
  lon: number;
  lng?: number;
  countryCode?: string;
  country: string;
  geonameId?: number;
  population?: number;
}

export interface Country {
  countryCode: string;
  countryName: string;
  population?: string;
}

export interface WeatherData {
  current?: {
    temperature_2m: number;
    weathercode: number;
    time: string;
  };
  daily?: {
    time: string[];
    temperature_2m_min: number[];
    temperature_2m_max: number[];
    weathercode: number[];
    relative_humidity_2m_max?: number[];
    relative_humidity_2m_min?: number[];
    sunrise?: string[];
    sunset?: string[];
    uv_index_max?: number[];
  };
  icons?: Record<number, string>;
}

export interface LocationData {
  forecast: WeatherData | null;
  name: string;
  country: string;
  error: string | null;
  latitude?: number;
  longitude?: number;
  country_code?: string;
}

// ============================================================================
// COMPONENT PROPS TYPES
// ============================================================================

export interface CitySelectorProps {
  selected: City | null;
  country: string | null;
  clearTrigger: number;
}

export interface CountrySelectorProps {
  selected: Country | null;
}

export interface WeatherCardProps {
  date: string;
  mainIcon: string;
  minC: number;
  maxC: number;
  minIcon?: string;
  maxIcon?: string;
  mainIconSize?: number;
  textSize?: string;
  margin?: string;
  minWidth?: string;
  cardBg?: string;
  cardMargin?: string;
  showFahrenheit?: boolean;
  compact?: boolean;
  humidity?: number;
  sunrise?: string;
  sunset?: string;
  uvIndex?: number;
}

export interface ForecastPanelProps {
  forecast: WeatherData | null;
  loading?: boolean;
  error?: string | null;
  title?: string | null;
  compact?: boolean;
}

export interface LocationForecastCardProps {
  forecast: WeatherData | null;
  location: string;
  country: string;
  lat?: number | null;
  lon?: number | null;
  countryCode?: string;
}

export interface PerformanceMonitorProps {
  weatherStats: CacheStats;
  dataStats: DataCacheStats;
}

// ============================================================================
// STORE TYPES
// ============================================================================

export interface AppState {
  selectedCountry: Country | null;
  selectedCity: City | null;
  citiesOfSelectedCountry: City[];
  weatherWithIcons: Record<string, WeatherData>;
  currentForecast: WeatherData | null;
  locationData: LocationData;
  loading: {
    weather: boolean;
    forecast: boolean;
    location: boolean;
  };
  errors: {
    countries: string | null;
    cities: string | null;
    weather: string | null;
  };
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export type CitiesApiResponse = City[];

export type CountriesApiResponse = Country[];

export interface WeatherApiResponse {
  current: {
    temperature_2m: number;
    weathercode: number;
    time: string;
  };
  daily: {
    time: string[];
    temperature_2m_min: number[];
    temperature_2m_max: number[];
    weathercode: number[];
    relative_humidity_2m_max?: number[];
    relative_humidity_2m_min?: number[];
    sunrise?: string[];
    sunset?: string[];
    uv_index_max?: number[];
  };
}

// ============================================================================
// EVENT TYPES
// ============================================================================

// Event types are now direct type aliases
export type CitySelectEvent = CustomEvent<City>;
export type CountrySelectEvent = CustomEvent<Country>;

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type WeatherCode = number;

export type TemperatureUnit = 'C' | 'F';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface CacheStats {
  size: number;
  entries: number;
  memoizationStats: Record<string, number>;
  requestStats: Record<string, number>;
}

export interface DataCacheStats {
  countries: number;
  cities: number;
  search: number;
  requestStats: Record<string, number>;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ErrorInfo {
  component?: string;
  message?: string;
  source?: string;
  lineno?: number;
  colno?: number;
  [key: string]: unknown;
}

// ============================================================================
// CHART TYPES
// ============================================================================

export type ChartContainer = HTMLCanvasElement;
