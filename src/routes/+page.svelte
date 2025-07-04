<script lang="ts">
  import CountrySelector from '../components/CountrySelector.svelte';
  import CitySelector from '../components/CitySelector.svelte';
  import MapView from '../components/MapView.svelte';
  import ForecastPanel from '../components/ForecastPanel.svelte';
  import LocationForecastCard from '../components/LocationForecastCard.svelte';
  import { appStore } from '../stores/appStore';
  import { countries, cities, countryCityError, fetchCitiesForCountry } from '../stores/countryCityStore';
  import { fetchCurrentWeather, fetchForecast, getCurrentWeatherWithCache, getForecastWithCache } from '../lib/weatherApi';
  import { fly, fade } from 'svelte/transition';
  import { onMount, tick } from 'svelte';
  import { get } from 'svelte/store';
  import { weatherCacheStore } from '../stores/weatherCacheStore';

  // Weather icon mapping (Open-Meteo weather codes to SVGs)
  const iconMap: Record<number, string> = {
    0: '/weather-icons/clear-day.svg',
    1: '/weather-icons/mainly-clear.svg',
    2: '/weather-icons/partly-cloudy.svg',
    3: '/weather-icons/overcast.svg',
    45: '/weather-icons/fog.svg',
    48: '/weather-icons/depositing-rime-fog.svg',
    51: '/weather-icons/drizzle.svg',
    53: '/weather-icons/drizzle.svg',
    55: '/weather-icons/drizzle.svg',
    56: '/weather-icons/freezing-drizzle.svg',
    57: '/weather-icons/freezing-drizzle.svg',
    61: '/weather-icons/rain.svg',
    63: '/weather-icons/rain.svg',
    65: '/weather-icons/rain.svg',
    66: '/weather-icons/freezing-rain.svg',
    67: '/weather-icons/freezing-rain.svg',
    71: '/weather-icons/snow.svg',
    73: '/weather-icons/snow.svg',
    75: '/weather-icons/snow.svg',
    77: '/weather-icons/snow-grains.svg',
    80: '/weather-icons/showers.svg',
    81: '/weather-icons/showers.svg',
    82: '/weather-icons/showers.svg',
    85: '/weather-icons/snow-showers.svg',
    86: '/weather-icons/snow-showers.svg',
    95: '/weather-icons/thunderstorm.svg',
    96: '/weather-icons/thunderstorm-hail.svg',
    99: '/weather-icons/thunderstorm-hail.svg',
  };

  let selectedCountry = null;
  let selectedCity = null;
  let cityManuallySelected = false;
  let mapCenter: [number, number] = [20, 0];
  let mapZoom = 2;
  let cityWeather: Record<string, { temperature: number; icon: string }> = {};
  let forecast: any = null;
  let locationForecast: any = null;
  let locationName = '';
  let locationCountry = '';
  let locationError = ''; // Add this to track geolocation errors
  let loadingCities = false;
  let loadingForecast = false;
  let loadingLocationForecast = false;
  let fetchingAdditionalCities = false;
  let clearCityInput = 0; // Counter to force CitySelector to clear

  // Subscribe to store
  $: appState = $appStore;
  $: selectedCountry = appState.selectedCountry;
  $: selectedCity = appState.selectedCity;

  // Function to determine city limit based on country size
  function getCityLimit(country: any): number {
    if (!country || !country.population) return 10; // Default fallback
    
    const population = parseInt(country.population);
    
    if (population > 100000000) return 25; // Very large countries (China, India, etc.)
    if (population > 50000000) return 20;  // Large countries (US, Brazil, etc.)
    if (population > 20000000) return 15;  // Medium-large countries
    if (population > 10000000) return 12;  // Medium countries
    if (population > 5000000) return 10;   // Small-medium countries
    if (population > 1000000) return 8;    // Small countries
    return 5; // Very small countries
  }

  // Filter cities for selected country (for map display)
  $: countryCities = selectedCountry ? 
    $cities.filter(c => c.countryCode === selectedCountry.code).slice(0, getCityLimit(selectedCountry)) : 
    selectedCity ? [selectedCity] : [];

  // Set map center on country/city change
  $: if (selectedCity) {
    mapCenter = [selectedCity.lat, selectedCity.lon ?? selectedCity.lng];
    mapZoom = 7;
  } else if (selectedCountry && countryCities.length) {
    // Center on first city in country
    mapCenter = [countryCities[0].lat, countryCities[0].lng];
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
    loadingCities = true;
    const results: Record<string, { temperature: number; icon: string }> = {};
    
    // Process cities sequentially with delays to avoid rate limiting
    for (const city of countryCities) {
      const weather = await getCurrentWeatherWithCache(city);
      if (weather) {
        results[city.name] = {
          temperature: Math.round(weather.temperature),
          icon: iconMap[weather.weathercode] || iconMap[0],
        };
      }
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    cityWeather = results;
    loadingCities = false;
  }

  // Fetch weather for selected city
  async function loadSelectedCityWeather() {
    if (!selectedCity) return;
    
    const weather = await getCurrentWeatherWithCache(selectedCity);
    if (weather) {
      cityWeather = {
        ...cityWeather,
        [selectedCity.name]: {
          temperature: Math.round(weather.temperature),
          icon: iconMap[weather.weathercode] || iconMap[0],
        }
      };
    }
  }

  // Fetch forecast for selected city
  async function loadForecast() {
    if (!selectedCity) return;
    loadingForecast = true;
    
    try {
      forecast = await getForecastWithCache(selectedCity);
    } catch (error) {
      console.error('Error loading forecast:', error);
      forecast = null;
    }
    loadingForecast = false;
  }

  // Handle country/city selection
  async function handleCountrySelect(e) {
    appStore.setCountry(e.detail);
    appStore.setCity(null);
    forecast = null;
    cityWeather = {};
    cityManuallySelected = false;
    
    // Increment the clear counter to trigger CitySelector to clear
    clearCityInput++;
    
    await tick();
    
    // If no cities found for this country, fetch additional cities
    if (countryCities.length === 0 && !fetchingAdditionalCities) {
      fetchingAdditionalCities = true;
      await fetchCitiesForCountry(e.detail.code);
      await tick(); // Wait for cities to update
    }
    
    // Load weather for cities
    if (countryCities.length > 0) {
      loadCityWeather();
    }
  }
  function handleCitySelect(e) {
    const selectedCityData = e.detail;
    appStore.setCity(selectedCityData);
    
    // Clear the country when a city is selected
    // This allows independent city selection
    appStore.setCountry(null);
    
    cityManuallySelected = true;
  }

  // IP-based geolocation for user forecast
  async function detectLocation() {
    loadingLocationForecast = true;
    locationError = ''; // Clear any previous errors
    
    try {
      const response = await fetch('https://ipapi.co/json/');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.latitude && data.longitude) {
          locationForecast = await fetchForecast(data.latitude, data.longitude);
          
          locationName = data.city || 'Your Location (Approximate)';
          locationCountry = data.country_name || '';
        } else {
          throw new Error('No coordinates in IP response');
        }
      } else {
        throw new Error(`IP API responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('IP geolocation failed:', error);
      locationForecast = null;
      locationName = 'Location unavailable';
      locationCountry = '';
      locationError = 'Unable to determine your location. Please select a city manually.';
    }
    
    loadingLocationForecast = false;
  }

  onMount(() => {
    if (selectedCountry && countryCities.length) loadCityWeather();
    // If no city has been manually selected this session, reset selectedCity to null
    if (!cityManuallySelected) {
      appStore.setCity(null);
    }
    // Add a small delay to ensure cities are loaded before geolocation
    setTimeout(() => {
      detectLocation();
    }, 500);
  });

  // Reactively load forecast when selectedCity changes
  $: if (selectedCity) {
    loadSelectedCityWeather();
    loadForecast();
  }

  // Reactively load weather for cities when countryCities changes
  $: if (countryCities.length > 0 && selectedCountry) {
    loadCityWeather();
  }

  // Reset fetching flag when cities are updated
  $: if ($cities.length > 0) {
    fetchingAdditionalCities = false;
  }

  function clearCache() {
    localStorage.clear();
    location.reload();
  }


</script>

<main>
  <h1 in:fly={{ y: -40, duration: 400 }}>Weather App</h1>
  <div style="display: flex; gap: 1em; justify-content: center; margin: 1em 0;">
    <button on:click={clearCache}>Clear Cache</button>
  </div>
  
  <div class="selectors" in:fade>
    <CountrySelector selected={selectedCountry} on:select={handleCountrySelect} />
    <CitySelector selected={selectedCity} country={selectedCountry?.code || null} clearTrigger={clearCityInput} on:select={handleCitySelect} />
  </div>
  
  {#if $countryCityError}
    <div class="error-message" in:fade>
      <p>⚠️ {$countryCityError}</p>
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
      selectedCity={selectedCity}
      weatherByCity={cityWeather}
      onMarkerClick={(city) => {
        appStore.setCity(city);
        appStore.setCountry(null); // Clear country when city is selected via map
        cityManuallySelected = true;
      }}
    />
  </div>

  <div class="forecast-section" in:fade>
    {#if selectedCity && cityManuallySelected}
      {#if loadingForecast}
        <div class="loading-message">
          <div class="loading-spinner"></div>
          <p>Loading forecast for {selectedCity.name}...</p>
        </div>
      {:else if forecast}
        <div class="city-forecast-title">
          Weather in {selectedCity.name}
        </div>
        <ForecastPanel {forecast} icons={iconMap} />
      {:else}
        <div class="loading-message">
          <p>No forecast data available for {selectedCity.name}</p>
        </div>
      {/if}
    {/if}
    {#if loadingLocationForecast}
      <div class="loading-message">
        <div class="loading-spinner"></div>
        <p>Loading your location weather...</p>
      </div>
    {:else if locationForecast}
      <LocationForecastCard forecast={locationForecast} location={locationName} country={locationCountry} icons={iconMap} />
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
  background: #ffebee;
  border: 1px solid #f44336;
  border-radius: var(--border-radius);
  padding: 1em;
  margin: 1em 0;
  text-align: center;
}
.error-message p {
  margin: 0.5em 0;
  color: #d32f2f;
}
.error-help {
  font-size: 0.9em;
  color: #666 !important;
  text-align: left;
  margin-top: 1em;
}

.error-help ul {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.error-help li {
  margin: 0.3em 0;
  line-height: 1.4;
}
</style>
