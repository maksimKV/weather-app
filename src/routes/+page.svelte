<script lang="ts">
  import CountrySelector from '../components/CountrySelector.svelte';
  import CitySelector from '../components/CitySelector.svelte';
  import MapView from '../components/MapView.svelte';
  import ForecastPanel from '../components/ForecastPanel.svelte';
  import LocationForecastCard from '../components/LocationForecastCard.svelte';
  import { 
    selectedCountry, 
    selectedCity, 
    citiesOfSelectedCountry, 
    weatherWithIcons, 
    currentForecast, 
    locationData, 
    loading, 
    errors, 
    actions 
  } from '../stores';
  import { getCurrentWeather, getForecast, getLocationForecast, getWeatherForCities, clearWeatherCache, WEATHER_ICONS } from '../lib/services/weatherService';
  import { initializeData, fetchCitiesForCountry } from '../lib/services/dataService';
  import { fly, fade } from 'svelte/transition';
  import { onMount, tick } from 'svelte';

  // Use weather icons from service
  const iconMap = WEATHER_ICONS;

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
  async function loadCityWeather() {
    if (!countryCities.length) {
      return;
    }
    actions.setLoading('weather', true);
    
    const weatherResults = await getWeatherForCities(countryCities);
    actions.setMultipleCityWeather(weatherResults);
    
    actions.setLoading('weather', false);
  }

  // Fetch weather for selected city
  async function loadSelectedCityWeather() {
    if (!$selectedCity) return;
    
    const weather = await getCurrentWeather($selectedCity);
    if (weather) {
      actions.setCityWeather($selectedCity.name, weather);
    }
  }

  // Fetch forecast for selected city
  async function loadForecast() {
    if (!$selectedCity) return;
    actions.setLoading('forecast', true);
    
    try {
      const forecastData = await getForecast($selectedCity);
      actions.setCurrentForecast(forecastData);
    } catch (error) {
      console.error('Error loading forecast:', error);
      actions.setCurrentForecast(null);
    }
    
    actions.setLoading('forecast', false);
  }

  // Handle country/city selection
  async function handleCountrySelect(e) {
    actions.setSelectedCountry(e.detail);
    cityManuallySelected = false;
    
    // Increment the clear counter to trigger CitySelector to clear
    clearCityInput++;
    
    await tick();
    
    // If no cities found for this country, fetch additional cities
    if (countryCities.length === 0) {
      await fetchCitiesForCountry(e.detail.countryCode);
      await tick(); // Wait for cities to update
    }
    
    // Load weather for cities
    if (countryCities.length > 0) {
      loadCityWeather();
    }
  }

  function handleCitySelect(e) {
    const selectedCityData = e.detail;
    actions.setSelectedCity(selectedCityData);
    cityManuallySelected = true;
  }

  // IP-based geolocation for user forecast
  async function detectLocation() {
    actions.setLoading('location', true);
    actions.setLocationData({ error: null });
    
    try {
      const locationData = await getLocationForecast();
      
      if (locationData) {
        actions.setLocationData({
          forecast: locationData.forecast,
          name: locationData.location,
          country: locationData.country,
          error: null
        });
      } else {
        throw new Error('Failed to fetch location forecast');
      }
    } catch (error) {
      console.error('IP geolocation failed:', error);
      actions.setLocationData({
        forecast: null,
        name: 'Location unavailable',
        country: '',
        error: 'Unable to determine your location. Please select a city manually.'
      });
    }
    
    actions.setLoading('location', false);
  }

  onMount(async () => {
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
  });

  // Reactively load forecast when selectedCity changes
  $: if ($selectedCity) {
    loadSelectedCityWeather();
    loadForecast();
  }

  // Reactively load weather for cities when countryCities changes
  $: if (countryCities.length > 0) {
    loadCityWeather();
  }

  function clearCache() {
    clearWeatherCache();
  }
</script>

<main>
  <h1 in:fly={{ y: -40, duration: 400 }}>Weather App</h1>
  <div style="display: flex; gap: 1em; justify-content: center; margin: 1em 0;">
    <button on:click={clearCache}>Clear Cache</button>
  </div>
  
  <div class="selectors" in:fade>
    <CountrySelector selected={$selectedCountry} on:select={handleCountrySelect} />
    <CitySelector selected={$selectedCity} country={$selectedCountry?.countryCode || null} clearTrigger={clearCityInput} on:select={handleCitySelect} />
  </div>
  
  {#if $errors.countries || $errors.cities}
    <div class="error-message" in:fade>
      <p>⚠️ {$errors.countries || $errors.cities}</p>
      <p class="error-help">Please check your .env file and ensure VITE_GEONAMES_USERNAME is set to a valid GeoNames username.</p>
    </div>
  {/if}

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
      onMarkerClick={(city) => {
        actions.setSelectedCity(city);
        cityManuallySelected = true;
      }}
    />
  </div>

  <div class="forecast-section" in:fade>
    {#if $selectedCity && cityManuallySelected}
      {#if loadingForecast}
        <div class="loading-message">
          <div class="loading-spinner"></div>
          <p>Loading forecast for {$selectedCity.name}...</p>
        </div>
      {:else if forecast}
        <div class="city-forecast-title">
          Weather in {$selectedCity.name}
        </div>
        <ForecastPanel {forecast} />
      {:else}
        <div class="loading-message">
          <p>No forecast data available for {$selectedCity.name}</p>
        </div>
      {/if}
    {/if}
    {#if loadingLocationForecast}
      <div class="loading-message">
        <div class="loading-spinner"></div>
        <p>Loading your location weather...</p>
      </div>
    {:else if locationForecast}
      <LocationForecastCard forecast={locationForecast} location={locationName} country={locationCountry} />
    {:else if locationError}
      <div class="error-message" in:fade>
        <p>⚠️ {locationError}</p>
        <p class="error-help">
          💡 Unable to determine your location automatically. You can still select cities and countries manually to get weather information.
        </p>
      </div>
    {/if}
  </div>
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
