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
  };
  icons?: Record<number, string>;
}

export interface LocationData {
  forecast: WeatherData | null;
  name: string;
  country: string;
  error: string | null;
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

export interface CitiesApiResponse extends Array<City> {}

export interface CountriesApiResponse extends Array<Country> {}

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
  };
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export interface CitySelectEvent extends CustomEvent<City> {}

export interface CountrySelectEvent extends CustomEvent<Country> {}

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