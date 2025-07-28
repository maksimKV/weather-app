<script lang="ts">
  import CountrySelector from '../components/CountrySelector.svelte';
  import CitySelector from '../components/CitySelector.svelte';
  import MapView from '../components/MapView.svelte';
  import ForecastPanel from '../components/ForecastPanel.svelte';
  import LocationForecastCard from '../components/LocationForecastCard.svelte';
  import CountryWeatherChart from '../components/CountryWeatherChart.svelte';
  import ErrorBoundary from '../components/ErrorBoundary.svelte';
  import PerformanceMonitor from '../components/PerformanceMonitor.svelte';
  import {
    setupGlobalErrorHandlers,
    validateWeatherData,
    validateCityData,
    validateCountryData,
  } from '../lib/errorBoundary';
  import {
    selectedCountry,
    selectedCity,
    citiesOfSelectedCountry,
    weatherWithIcons,
    currentForecast,
    locationData,
    loading,
    errors,
    actions,
    isSelectedCityGeolocated,
  } from '../stores';
  import {
    getCurrentWeather,
    getForecast,
    getLocationForecast,
    getWeatherForCities,
    prefetchWeatherForCities,
  } from '../lib/services/weatherService';
  import {
    initializeData,
    fetchCitiesForCountry,
    normalizeCity,
  } from '../lib/services/dataService';
  import { fly, fade } from 'svelte/transition';
  import { onMount, tick } from 'svelte';
  import type { City, Country } from '../lib/types';
  import { logDevError } from '../lib/utils';
  import { MAP_CONFIG, ERROR_MESSAGES, CACHE_THRESHOLDS, ANIMATION_CONFIG } from '../lib/constants';

  // Weather icons are available via WEATHER_ICONS import

  let cityManuallySelected = false;
  let mapCenter: [number, number] = MAP_CONFIG.DEFAULT_CENTER;
  let mapZoom: number = MAP_CONFIG.DEFAULT_ZOOM;
  let clearCityInput = 0; // Counter to force CitySelector to clear

  // Derived values from stores
  $: countryCities = $citiesOfSelectedCountry;
  $: cityWeather = $weatherWithIcons;
  $: forecast = $currentForecast;
  $: locationForecast = $locationData.forecast;
  $: locationName = $locationData.name;
  $: locationCountry = $locationData.country;
  $: locationError = $locationData.error;
  $: loadingCities = $loading.weather;
  $: loadingForecast = $loading.forecast;
  $: loadingLocationForecast = $loading.location;

  // Set map center on country/city change
  $: if ($selectedCity) {
    mapCenter = [$selectedCity.lat, $selectedCity.lon];
    mapZoom = MAP_CONFIG.CITY_ZOOM;
  } else if ($selectedCountry && countryCities.length) {
    // Center on first city in country
    mapCenter = [countryCities[0].lat, countryCities[0].lon];
    mapZoom = MAP_CONFIG.COUNTRY_ZOOM;
  } else {
    mapCenter = MAP_CONFIG.DEFAULT_CENTER;
    mapZoom = MAP_CONFIG.DEFAULT_ZOOM;
  }

  // Fetch weather for all cities in selected country
  async function loadCityWeather(): Promise<void> {
    if (!countryCities.length) {
      return;
    }

    try {
      actions.setLoading('weather', true);

      // Validate cities before fetching weather
      const validCities = countryCities.filter(city => validateCityData(city));
      if (validCities.length === 0) {
        logDevError(ERROR_MESSAGES.WEATHER.NO_VALID_CITIES);
        return;
      }

      const weatherResults = await getWeatherForCities(validCities);

      // Validate weather results before setting
      const validWeatherResults: Record<string, any> = {};
      for (const [cityName, weather] of Object.entries(weatherResults)) {
        if (weather && typeof weather === 'object') {
          // Transform WeatherWithIcon to WeatherData structure
          const weatherData = {
            current: {
              temperature_2m: weather.temperature,
              weathercode: weather.weathercode,
              time: weather.time,
            },
            icons: {
              [weather.weathercode]: weather.icon,
            },
          };
          validWeatherResults[cityName] = weatherData;
        }
      }

      actions.setMultipleCityWeather(validWeatherResults);
    } catch (error) {
      logDevError('Error loading city weather:', error);
      actions.setError(
        'weather',
        error instanceof Error ? error.message : ERROR_MESSAGES.WEATHER.FETCH_FAILED
      );
    } finally {
      actions.setLoading('weather', false);
    }
  }

  // Fetch weather for selected city
  async function loadSelectedCityWeather(): Promise<void> {
    if (!$selectedCity) return;

    try {
      // Validate city data before fetching weather
      if (!validateCityData($selectedCity)) {
        logDevError(ERROR_MESSAGES.WEATHER.INVALID_CITY, $selectedCity);
        return;
      }

      const weather = await getCurrentWeather(normalizeCity($selectedCity));
      if (weather && validateWeatherData(weather)) {
        // Transform WeatherWithIcon to WeatherData structure
        const weatherData = {
          current: {
            temperature_2m: weather.temperature,
            weathercode: weather.weathercode,
            time: weather.time,
          },
          icons: {
            [weather.weathercode]: weather.icon,
          },
        };
        actions.setCityWeather($selectedCity.name, weatherData);
      } else {
        logDevError(ERROR_MESSAGES.WEATHER.INVALID_FORECAST, $selectedCity.name);
      }
    } catch (error) {
      logDevError('Error loading selected city weather:', error);
      actions.setError(
        'weather',
        error instanceof Error ? error.message : ERROR_MESSAGES.WEATHER.CITY_WEATHER_FAILED
      );
    }
  }

  // Fetch forecast for selected city
  async function loadForecast(): Promise<void> {
    if (!$selectedCity) return;

    try {
      actions.setLoading('forecast', true);

      // Validate city data before fetching forecast
      if (!validateCityData($selectedCity)) {
        logDevError(ERROR_MESSAGES.WEATHER.INVALID_CITY, $selectedCity);
        actions.setCurrentForecast(null);
        return;
      }

      const forecastData = await getForecast($selectedCity);
      if (forecastData && validateWeatherData(forecastData)) {
        actions.setCurrentForecast(forecastData);
      } else {
        logDevError(ERROR_MESSAGES.WEATHER.INVALID_FORECAST, $selectedCity.name);
        actions.setCurrentForecast(null);
      }
    } catch (error) {
      logDevError('Error loading forecast:', error);
      actions.setCurrentForecast(null);
      actions.setError(
        'weather',
        error instanceof Error ? error.message : ERROR_MESSAGES.WEATHER.FORECAST_FAILED
      );
    } finally {
      actions.setLoading('forecast', false);
    }
  }

  // Handle country/city selection
  async function handleCountrySelect(e: CustomEvent<Country>): Promise<void> {
    try {
      // Validate country data
      if (!e.detail || !validateCountryData(e.detail)) {
        logDevError(ERROR_MESSAGES.DATA.INVALID_COUNTRY, e.detail);
        return;
      }

      actions.setSelectedCountry(e.detail);
      cityManuallySelected = false;

      // Increment the clear counter to trigger CitySelector to clear
      clearCityInput++;

      await tick();

      // If few cities found for this country, fetch additional cities
      if (countryCities.length < 5) {
        await fetchCitiesForCountry(e.detail.countryCode);
        await tick(); // Wait for cities to update
      }

      // Load weather for cities
      if (countryCities.length > 0) {
        loadCityWeather();
      }
    } catch (error) {
      logDevError('Error handling country selection:', error);
      actions.setError(
        'cities',
        error instanceof Error ? error.message : ERROR_MESSAGES.DATA.LOAD_COUNTRY_FAILED
      );
    }
  }

  function handleCitySelect(e: CustomEvent<City>): void {
    try {
      const selectedCityData = e.detail;

      // Validate city data
      if (!selectedCityData || !validateCityData(selectedCityData)) {
        logDevError(ERROR_MESSAGES.DATA.INVALID_CITY, selectedCityData);
        return;
      }

      actions.setSelectedCity(selectedCityData);
      cityManuallySelected = true;
    } catch (error) {
      logDevError('Error handling city selection:', error);
      actions.setError(
        'weather',
        error instanceof Error ? error.message : ERROR_MESSAGES.DATA.SELECT_CITY_FAILED
      );
    }
  }

  // IP-based geolocation for user forecast
  async function getUserLocationForecast(): Promise<void> {
    actions.setLoading('location', true);
    actions.setLocationData({ error: null });

    try {
      const locationResult = await getLocationForecast();

      if (!locationResult) {
        throw new Error(ERROR_MESSAGES.WEATHER.LOCATION_FAILED);
      }

      actions.setLocationData({
        forecast: locationResult.forecast,
        name: locationResult.location,
        country: locationResult.country,
        error: null,
        latitude: locationResult.latitude,
        longitude: locationResult.longitude,
        country_code: locationResult.country_code,
      });

      // Set the geolocated city to enable duplicate detection
      // This will hide the forecast section if the same location is manually selected
      const geolocatedCityData = normalizeCity({
        name: locationResult.location.replace(/^(📍|🌐|⚠️)\s*/, ''), // Remove location method icons
        lat: locationResult.latitude,
        lon: locationResult.longitude,
        country: locationResult.country,
        countryCode: locationResult.country_code || '',
      });
      actions.setGeolocatedCity(geolocatedCityData);
    } catch (error) {
      logDevError('Error detecting user location for forecast:', error);

      // Handle rate limiting specifically
      let errorMessage = ERROR_MESSAGES.LOCATION.DETERMINE_FAILED;
      if (error instanceof Error && error.message.includes('Rate limit')) {
        errorMessage = ERROR_MESSAGES.LOCATION.RATE_LIMIT;
      }

      actions.setLocationData({
        forecast: null,
        name: ERROR_MESSAGES.LOCATION.UNAVAILABLE,
        country: 'Unknown',
        error: errorMessage,
      });

      // Clear geolocated city when location detection fails
      actions.setGeolocatedCity(null);
    } finally {
      actions.setLoading('location', false);
    }
  }

  // Initialize app data
  onMount(async () => {
    try {
      setupGlobalErrorHandlers();

      // Clear any stale state on app initialization
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const clearCache = urlParams.get('clearCache');

        if (clearCache === 'true' || import.meta.env.DEV) {
          actions.clearAllStorage();
          actions.resetApp();
          logDevError('Cache cleared on app initialization');
        }
      }

      await initializeData();

      setTimeout(() => {
        if (countryCities.length > CACHE_THRESHOLDS.PREFETCH_TRIGGER_COUNT) {
          const nearbyCities = countryCities.slice(0, CACHE_THRESHOLDS.PREFETCH_CITY_COUNT);
          prefetchWeatherForCities(nearbyCities);
        }
      }, 500);

      if (!cityManuallySelected) {
        getUserLocationForecast();
      }
    } catch (error) {
      logDevError(ERROR_MESSAGES.GENERAL.INIT_FAILED, error);
    }
  });

  $: if ($selectedCity) {
    loadSelectedCityWeather();
    loadForecast();
  }

  $: if (countryCities.length > 0 && $selectedCountry) {
    loadCityWeather();

    if (countryCities.length > 10) {
      const nearbyCities = countryCities.slice(0, 20);
      prefetchWeatherForCities(nearbyCities);
    }
  }
</script>

<svelte:head>
  <link
    href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;400&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<main>
  <PerformanceMonitor />

  {#if typeof window !== 'undefined' && $selectedCountry && !cityManuallySelected}
    <div class="cache-notice" in:fade>
      <p>
        <strong>Having issues?</strong> If the map or selections seem stuck,
        <a href="/clear-cache" target="_blank">clear the cache</a> to reset the app.
      </p>
    </div>
  {/if}

  <ErrorBoundary>
    <div class="weather-title-wrapper">
      <span class="weather-icon-spin">
        <img src="/weather-icons/clear-day.svg" alt="Weather Icon" height="48" width="48" />
      </span>
      <h1 in:fly={{ y: -40, duration: ANIMATION_CONFIG.DURATIONS.NORMAL }}>Weather App</h1>
    </div>
    <p class="subtitle">Your daily weather, at a glance!</p>

    <div class="selectors" in:fade>
      <ErrorBoundary>
        <CountrySelector selected={$selectedCountry} on:select={handleCountrySelect} />
      </ErrorBoundary>
      <ErrorBoundary>
        <CitySelector
          selected={$selectedCity}
          country={$selectedCountry?.countryCode || null}
          clearTrigger={clearCityInput}
          on:select={handleCitySelect}
        />
      </ErrorBoundary>
    </div>
  </ErrorBoundary>

  {#if $errors.countries || $errors.cities}
    <div class="error-message" in:fade>
      <p>⚠️ {$errors.countries || $errors.cities}</p>
      <p class="error-help">
        Please check your .env file and ensure VITE_GEONAMES_USERNAME is set to a valid GeoNames
        username.
      </p>
    </div>
  {/if}

  <ErrorBoundary>
    <div class="map-section" in:fade>
      {#if loadingCities}
        <p>Loading city weather...</p>
      {/if}
      <MapView
        cities={countryCities}
        center={mapCenter}
        zoom={mapZoom}
        selectedCity={$selectedCity}
        weatherByCity={cityWeather}
        onMarkerClick={(city: City) => {
          try {
            if (validateCityData(city)) {
              actions.setSelectedCity(city);
              cityManuallySelected = true;
            } else {
              logDevError(ERROR_MESSAGES.MAP.INVALID_CITY_CLICK, city);
            }
          } catch (error) {
            logDevError(ERROR_MESSAGES.MAP.MARKER_CLICK_FAILED, error);
          }
        }}
      />
    </div>
  </ErrorBoundary>

  <ErrorBoundary>
    {#if !$isSelectedCityGeolocated}
      <div class="forecast-section" in:fade>
        {#if $selectedCity && cityManuallySelected}
          {#if loadingForecast}
            <div class="loading-message">
              <div class="loading-spinner"></div>
              <p>Loading forecast for {$selectedCity.name}...</p>
            </div>
          {:else if forecast && validateWeatherData(forecast)}
            <div class="city-forecast-title">
              <h2>7-Day Forecast for {$selectedCity.name}</h2>
            </div>
            <ErrorBoundary>
              <ForecastPanel {forecast} />
            </ErrorBoundary>
          {:else}
            <div class="loading-message">
              <p>No forecast data available for {$selectedCity.name}</p>
            </div>
          {/if}
        {:else if $selectedCountry && countryCities.length > 0}
          <ErrorBoundary>
            <CountryWeatherChart
              cities={countryCities}
              weatherData={cityWeather}
              countryName={$selectedCountry.countryName}
              height="400px"
              maxCities={15}
            />
          </ErrorBoundary>
        {/if}
      </div>
    {/if}
  </ErrorBoundary>

  <ErrorBoundary>
    {#if loadingLocationForecast}
      <div class="loading-message">
        <div class="loading-spinner"></div>
        <p>Loading your location weather...</p>
      </div>
    {:else if locationForecast && validateWeatherData(locationForecast)}
      <LocationForecastCard
        forecast={locationForecast}
        location={locationName}
        country={locationCountry}
        lat={$locationData.latitude}
        lon={$locationData.longitude}
        countryCode={$locationData.country_code}
        on:select={e => {
          actions.setSelectedCity(e.detail);
          cityManuallySelected = true;
        }}
      />
    {:else if locationError}
      <div class="error-message" in:fade>
        <p>⚠️ {locationError}</p>
        <p class="error-help">Location services are unavailable. Please select a city manually.</p>
      </div>
    {/if}
  </ErrorBoundary>
</main>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;400&display=swap');

  main {
    max-width: 900px;
    margin: 0 auto;
    padding: 1em;
  }
  .weather-title-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.7em;
    margin-top: 0.5em;
    margin-bottom: 0.2em;
  }
  .weather-icon-spin {
    display: flex;
    align-items: center;
    animation: spin 4s linear infinite;
  }
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  h1 {
    font-family: 'Montserrat', system-ui, sans-serif;
    font-size: 2.7em;
    font-weight: 700;
    text-align: center;
    background: linear-gradient(90deg, #2a7de1, #007bff, #00c6fb);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    color: transparent;
    text-shadow: 2px 2px 8px rgba(42, 125, 225, 0.15);
    margin-bottom: 0.1em;
    margin-top: 0;
    letter-spacing: 1px;
  }
  .subtitle {
    font-family: 'Montserrat', system-ui, sans-serif;
    text-align: center;
    color: #555;
    font-size: 1.15em;
    margin-top: -0.5em;
    margin-bottom: 1em;
    letter-spacing: 0.5px;
    font-weight: 400;
  }
  .selectors {
    display: flex;
    gap: 1em;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 1em;
  }
  .map-section {
    margin-bottom: 2em;
  }
  .forecast-section {
    display: flex;
    flex-direction: column;
    gap: 1em;
    align-items: center;
  }
  @media (max-width: 600px) {
    .selectors {
      flex-direction: column;
      align-items: stretch;
    }
    main {
      padding: 0.5em;
    }
  }
  .city-forecast-title {
    text-align: center;
    font-size: 1.2em;
    font-weight: 600;
    margin-bottom: 0;
    color: var(--primary);
  }
  .loading-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1em;
    padding: 2em;
    background: #fff;
    border-radius: var(--border-radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    margin: 1em 0;
  }
  .loading-message p {
    margin: 0;
    color: #666;
    font-size: 1.1em;
  }
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  .error-message {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: var(--border-radius);
    padding: 1em;
    margin: 1em 0;
    text-align: center;
  }
  .error-message p {
    margin: 0.5em 0;
    color: #856404;
  }
  .error-help {
    font-size: 0.9em;
    color: #856404;
  }

  .cache-notice {
    background: #e3f2fd;
    border: 1px solid #90caf9;
    border-radius: var(--border-radius);
    padding: 0.75em 1em;
    margin-bottom: 1em;
    text-align: center;
    font-size: 0.9em;
  }

  .cache-notice p {
    margin: 0;
    color: #1976d2;
  }

  .cache-notice a {
    color: #1565c0;
    text-decoration: underline;
    font-weight: 600;
  }

  .cache-notice a:hover {
    color: #0d47a1;
  }
</style>
