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
    geolocatedCity,
    isSelectedCityGeolocated,
  } from '../stores';
  import {
    getCurrentWeather,
    getForecast,
    getLocationForecast,
    getWeatherForCities,
    clearWeatherCache,
    prefetchWeatherForCities,
    getCacheStats,
  } from '../lib/services/weatherService';
  import {
    initializeData,
    fetchCitiesForCountry,
    normalizeCity,
    getDataCacheStats,
  } from '../lib/services/dataService';
  import { fly, fade } from 'svelte/transition';
  import { onMount, tick } from 'svelte';
  import type { City, Country } from '../lib/types';

  // Weather icons are available via WEATHER_ICONS import

  let cityManuallySelected = false;
  let mapCenter: [number, number] = [20, 0];
  let mapZoom = 2;
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
    mapZoom = 7;
  } else if ($selectedCountry && countryCities.length) {
    // Center on first city in country
    mapCenter = [countryCities[0].lat, countryCities[0].lon];
    mapZoom = 5;
  } else {
    mapCenter = [20, 0];
    mapZoom = 2;
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
        console.warn('No valid cities found for weather fetch');
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
      console.error('Error loading city weather:', error);
      actions.setError(
        'weather',
        error instanceof Error ? error.message : 'Failed to load weather'
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
        console.warn('Invalid city data for weather fetch:', $selectedCity);
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
        console.warn('Invalid weather data received for city:', $selectedCity.name);
      }
    } catch (error) {
      console.error('Error loading selected city weather:', error);
      actions.setError(
        'weather',
        error instanceof Error ? error.message : 'Failed to load city weather'
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
        console.warn('Invalid city data for forecast fetch:', $selectedCity);
        actions.setCurrentForecast(null);
        return;
      }

      const forecastData = await getForecast($selectedCity);
      if (forecastData && validateWeatherData(forecastData)) {
        actions.setCurrentForecast(forecastData);
      } else {
        console.warn('Invalid forecast data received for city:', $selectedCity.name);
        actions.setCurrentForecast(null);
      }
    } catch (error) {
      console.error('Error loading forecast:', error);
      actions.setCurrentForecast(null);
      actions.setError(
        'weather',
        error instanceof Error ? error.message : 'Failed to load forecast'
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
        console.warn('Invalid country data received:', e.detail);
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
      console.error('Error handling country selection:', error);
      actions.setError(
        'cities',
        error instanceof Error ? error.message : 'Failed to load country data'
      );
    }
  }

  function handleCitySelect(e: CustomEvent<City>): void {
    try {
      const selectedCityData = e.detail;

      // Validate city data
      if (!selectedCityData || !validateCityData(selectedCityData)) {
        console.warn('Invalid city data received:', selectedCityData);
        return;
      }

      actions.setSelectedCity(selectedCityData);
      cityManuallySelected = true;
    } catch (error) {
      console.error('Error handling city selection:', error);
      actions.setError('weather', error instanceof Error ? error.message : 'Failed to select city');
    }
  }

  // IP-based geolocation for user forecast
  async function detectLocation(): Promise<void> {
    actions.setLoading('location', true);
    actions.setLocationData({ error: null });

    try {
      const locationData = await getLocationForecast();

      if (locationData) {
        actions.setLocationData({
          forecast: locationData.forecast,
          name: locationData.location,
          country: locationData.country,
          error: null,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          country_code: locationData.country_code
        });
        // Store the original geolocated city
        geolocatedCity.set({
          lat: locationData.latitude,
          lon: locationData.longitude,
          name: locationData.location,
          country: locationData.country,
          countryCode: locationData.country_code
        });
      } else {
        throw new Error('Failed to fetch location forecast');
      }
    } catch (error) {
      actions.setLocationData({
        forecast: null,
        name: 'Location unavailable',
        country: '',
        error: 'Unable to determine your location. Please select a city manually.',
        latitude: null,
        longitude: null,
        country_code: ''
      });
    }

    actions.setLoading('location', false);
  }

  onMount(async () => {
    // Setup global error handlers
    setupGlobalErrorHandlers();

    try {
      // Initialize data
      await initializeData();

      // If no city has been manually selected this session, reset selectedCity to null
      if (!cityManuallySelected) {
        actions.setSelectedCity(null);
      }

      // Add a small delay to ensure cities are loaded before geolocation
      setTimeout(() => {
        detectLocation();
      }, 500);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      // The error will be handled by the error boundary
    }
  });

  // Reactively load forecast when selectedCity changes
  $: if ($selectedCity) {
    loadSelectedCityWeather();
    loadForecast();
  }

  // Reactively load weather for cities when countryCities changes
  $: if (countryCities.length > 0 && $selectedCountry) {
    loadCityWeather();

    // Background prefetching for nearby cities
    if (countryCities.length > 10) {
      const nearbyCities = countryCities.slice(0, 20); // Prefetch first 20 cities
      prefetchWeatherForCities(nearbyCities);
    }
  }

  function clearCache(): void {
    clearWeatherCache();
  }

  // Performance monitoring
  function logPerformanceStats(): void {
    const weatherStats = getCacheStats();
    const dataStats = getDataCacheStats();

    console.log('=== Performance Stats ===');
    console.log('Weather Cache:', {
      size: weatherStats.size,
      entries: weatherStats.entries,
      memoization: weatherStats.memoizationStats,
      requests: weatherStats.requestStats,
    });
    console.log('Data Cache:', {
      countries: dataStats.countries,
      cities: dataStats.cities,
      search: dataStats.search,
      requests: dataStats.requestStats,
    });
  }

  function isSelectedCitySameAsGeolocated() {
    if (!$selectedCity || !$geolocatedCity) {
      return false;
    }
    const latEqual = Math.abs(Number($selectedCity.lat) - Number($geolocatedCity.lat)) < 0.0001;
    const lonEqual = Math.abs(Number($selectedCity.lon) - Number($geolocatedCity.lon)) < 0.0001;
    return latEqual && lonEqual;
  }
</script>

<main>
  <PerformanceMonitor />
  <ErrorBoundary>
    <h1 in:fly={{ y: -40, duration: 400 }}>Weather App</h1>
    <div style="display: flex; gap: 1em; justify-content: center; margin: 1em 0;">
      <button on:click={clearCache}>Clear Cache</button>
      <button on:click={logPerformanceStats}>Performance Stats</button>
    </div>

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
        onMarkerClick={(city: any) => {
          try {
            if (validateCityData(city)) {
              actions.setSelectedCity(city);
              cityManuallySelected = true;
            } else {
              console.warn('Invalid city data in marker click:', city);
            }
          } catch (error) {
            console.error('Error handling marker click:', error);
          }
        }}
      />
    </div>
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
        <p class="error-help">
          💡 Unable to determine your location automatically. You can still select cities and
          countries manually to get weather information.
        </p>
      </div>
    {/if}
  </ErrorBoundary>

  <ErrorBoundary>
    {#if !$isSelectedCityGeolocated}
      <div class="forecast-section" in:fade>
        {#if $selectedCity && cityManuallySelected}
          <!-- City selected - show forecast panel -->
          {#if loadingForecast}
            <div class="loading-message">
              <div class="loading-spinner"></div>
              <p>Loading forecast for {$selectedCity.name}...</p>
            </div>
          {:else if forecast && validateWeatherData(forecast)}
            <div class="city-forecast-title">
              Weather in {$selectedCity.name}
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
          <!-- Country selected but no city - show temperature chart -->
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
</main>

<style>
  main {
    max-width: 900px;
    margin: 0 auto;
    padding: 1em;
  }
  h1 {
    text-align: center;
    color: var(--primary);
    margin-bottom: 0.5em;
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
</style>
