<script lang="ts">
  import CountrySelector from '../components/CountrySelector.svelte';
  import CitySelector from '../components/CitySelector.svelte';
  import MapView from '../components/MapView.svelte';
  import ForecastPanel from '../components/ForecastPanel.svelte';
  import LocationForecastCard from '../components/LocationForecastCard.svelte';
  import { appStore } from '../stores/appStore';
  import { countries, cities, countryCityError, fetchCitiesForCountry } from '../stores/countryCityStore';
  import { fetchCurrentWeather, fetchForecast } from '../lib/weatherApi';
  import { fly, fade } from 'svelte/transition';
  import { onMount, tick } from 'svelte';
  import { get } from 'svelte/store';

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
  let forecast = null;
  let locationForecast = null;
  let locationName = '';
  let locationCountry = '';
  let loadingCities = false;
  let loadingForecast = false;
  let loadingLocationForecast = false;
  let fetchingAdditionalCities = false;

  // Subscribe to store
  $: appState = $appStore;
  $: selectedCountry = appState.selectedCountry;
  $: selectedCity = appState.selectedCity;
  $: console.log('Data check:', { 
    countriesCount: $countries.length, 
    citiesCount: $cities.length,
    countriesLoaded: $countries.length > 0,
    citiesLoaded: $cities.length > 0,
    error: $countryCityError
  });

  // Filter cities for selected country
  $: countryCities = selectedCountry ? $cities.filter(c => c.countryCode === selectedCountry.code) : [];

  // Set map center on country/city change
  $: if (selectedCity) {
    mapCenter = [selectedCity.lat, selectedCity.lon];
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
    console.log('loadCityWeather called, countryCities:', countryCities);
    if (!countryCities.length) {
      console.log('No cities to load weather for');
      return;
    }
    loadingCities = true;
    const results: Record<string, { temperature: number; icon: string }> = {};
    console.log('Starting weather fetch for', countryCities.length, 'cities');
    await Promise.all(
      countryCities.map(async (city) => {
        console.log('Fetching weather for:', city.name);
        const weather = await fetchCurrentWeather(city.lat, city.lng);
        if (weather) {
          results[city.name] = {
            temperature: Math.round(weather.temperature),
            icon: iconMap[weather.weathercode] || iconMap[0],
          };
          console.log('Weather for', city.name, ':', results[city.name]);
        } else {
          console.log('No weather data for:', city.name);
        }
      })
    );
    console.log('Weather fetch results:', results);
    cityWeather = results;
    loadingCities = false;
  }

  // Fetch forecast for selected city
  async function loadForecast() {
    if (!selectedCity) return;
    loadingForecast = true;
    forecast = await fetchForecast(selectedCity.lat, selectedCity.lon);
    loadingForecast = false;
  }

  // Handle country/city selection
  async function handleCountrySelect(e) {
    console.log('=== handleCountrySelect CALLED ===', e.detail);
    appStore.setCountry(e.detail);
    appStore.setCity(null);
    forecast = null;
    cityWeather = {};
    cityManuallySelected = false;
    await tick();
    console.log('After tick, countryCities:', countryCities);
    console.log('Cities loaded:', $cities.length);
    
    // If no cities found for this country, fetch additional cities
    if (countryCities.length === 0 && !fetchingAdditionalCities) {
      console.log('No cities found for', e.detail.name, '- fetching additional cities');
      fetchingAdditionalCities = true;
      await fetchCitiesForCountry(e.detail.code);
      await tick(); // Wait for cities to update
      console.log('After fetching additional cities, countryCities:', countryCities);
    }
    
    // Load weather for cities
    if (countryCities.length > 0) {
      console.log('Loading weather for', countryCities.length, 'cities');
      loadCityWeather();
    } else {
      console.log('Still no cities found after fetching additional cities');
    }
  }
  function handleCitySelect(e) {
    appStore.setCity(e.detail);
    cityManuallySelected = true;
  }

  // Geolocation for user forecast
  async function detectLocation() {
    loadingLocationForecast = true;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        locationForecast = await fetchForecast(latitude, longitude);
        // Try to find city name and country
        const city = $cities.find(c => Math.abs(c.lat - latitude) < 0.5 && Math.abs((c.lng || c.lon) - longitude) < 0.5);
        locationName = city ? city.name : 'Your Location';
        locationCountry = city ? ($countries.find(cn => cn.countryCode === city.countryCode)?.countryName || '') : '';
        loadingLocationForecast = false;
      }, async () => {
        // Fallback: use IP geolocation
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        locationForecast = await fetchForecast(data.latitude, data.longitude);
        locationName = data.city || 'Your Location';
        locationCountry = data.country_name || '';
        loadingLocationForecast = false;
      });
    } else {
      loadingLocationForecast = false;
    }
  }

  onMount(() => {
    if (selectedCountry && countryCities.length) loadCityWeather();
    // If no city has been manually selected this session, reset selectedCity to null
    if (!cityManuallySelected) {
      appStore.setCity(null);
    }
    detectLocation();
  });

  // Reactively load forecast when selectedCity changes
  $: if (selectedCity) {
    loadForecast();
  }

  // Reset fetching flag when cities are updated
  $: if ($cities.length > 0) {
    fetchingAdditionalCities = false;
  }
</script>

<main>
  <h1 in:fly={{ y: -40, duration: 400 }}>Weather App</h1>
  <div class="selectors" in:fade>
    <CountrySelector {selectedCountry} on:select={handleCountrySelect} />
    <CitySelector {selectedCity} country={selectedCountry?.code} on:select={handleCitySelect} />
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
      {/if}
    {/if}
    {#if loadingLocationForecast}
      <div class="loading-message">
        <div class="loading-spinner"></div>
        <p>Loading your location weather...</p>
      </div>
    {:else if locationForecast}
      <LocationForecastCard forecast={locationForecast} location={locationName} country={locationCountry} icons={iconMap} />
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
}
</style>
