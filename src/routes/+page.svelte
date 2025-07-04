<script lang="ts">
  import CountrySelector from '../components/CountrySelector.svelte';
  import CitySelector from '../components/CitySelector.svelte';
  import MapView from '../components/MapView.svelte';
  import ForecastPanel from '../components/ForecastPanel.svelte';
  import LocationForecastCard from '../components/LocationForecastCard.svelte';
  import { appStore } from '../stores/appStore';
  import { countries } from '../lib/countries';
  import { cities } from '../lib/cities';
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
  let mapCenter: [number, number] = [20, 0];
  let mapZoom = 2;
  let cityWeather: Record<string, { temperature: number; icon: string }> = {};
  let forecast = null;
  let locationForecast = null;
  let locationName = '';
  let loadingCities = false;
  let loadingForecast = false;

  // Subscribe to store
  $: appState = $appStore;
  $: selectedCountry = appState.selectedCountry;
  $: selectedCity = appState.selectedCity;

  // Filter cities for selected country
  $: countryCities = selectedCountry ? cities.filter(c => c.country === selectedCountry.code) : [];

  // Set map center on country/city change
  $: if (selectedCity) {
    mapCenter = [selectedCity.lat, selectedCity.lon];
    mapZoom = 7;
  } else if (selectedCountry && countryCities.length) {
    // Center on first city in country
    mapCenter = [countryCities[0].lat, countryCities[0].lon];
    mapZoom = 5;
  } else {
    mapCenter = [20, 0];
    mapZoom = 2;
  }

  // Fetch weather for all cities in selected country
  async function loadCityWeather() {
    console.log('loadCityWeather called, countryCities:', countryCities);
    if (!countryCities.length) return;
    loadingCities = true;
    const results: Record<string, { temperature: number; icon: string }> = {};
    await Promise.all(
      countryCities.map(async (city) => {
        const weather = await fetchCurrentWeather(city.lat, city.lon);
        if (weather) {
          results[city.name] = {
            temperature: Math.round(weather.temperature),
            icon: iconMap[weather.weathercode] || iconMap[0],
          };
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
    console.log('handleCountrySelect', e.detail);
    appStore.setCountry(e.detail);
    appStore.setCity(null);
    forecast = null;
    cityWeather = {};
    await tick();
    console.log('After tick, countryCities:', countryCities);
    loadCityWeather();
  }
  function handleCitySelect(e) {
    appStore.setCity(e.detail);
  }

  // Geolocation for user forecast
  async function detectLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        locationForecast = await fetchForecast(latitude, longitude);
        // Try to find city name
        const city = cities.find(c => Math.abs(c.lat - latitude) < 0.5 && Math.abs(c.lon - longitude) < 0.5);
        locationName = city ? city.name : 'Your Location';
      }, async () => {
        // Fallback: use IP geolocation
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        locationForecast = await fetchForecast(data.latitude, data.longitude);
        locationName = data.city || 'Your Location';
      });
    }
  }

  onMount(() => {
    if (selectedCountry && countryCities.length) loadCityWeather();
    detectLocation();
  });

  // Reactively load forecast when selectedCity changes
  $: if (selectedCity) {
    loadForecast();
  }
</script>

<main>
  <h1 in:fly={{ y: -40, duration: 400 }}>Weather App</h1>
  <div class="selectors" in:fade>
    <CountrySelector {selectedCountry} on:select={handleCountrySelect} />
    <CitySelector {selectedCity} country={selectedCountry?.code} on:select={handleCitySelect} />
  </div>

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
      onMarkerClick={(city) => appStore.setCity(city)}
    />
  </div>

  <div class="forecast-section" in:fade>
    {#if selectedCity && forecast}
      <ForecastPanel {forecast} icons={iconMap} />
    {/if}
    {#if locationForecast}
      <LocationForecastCard forecast={locationForecast} location={locationName} icons={iconMap} />
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
</style>
