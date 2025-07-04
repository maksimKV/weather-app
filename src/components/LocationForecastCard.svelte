<script lang="ts">
import { fetch6DayForecast, fetchLocationByIP, type ForecastDay } from '../lib/weatherApi';
import { onMount } from 'svelte';
import { fly } from 'svelte/transition';

let lat: number | null = null;
let lon: number | null = null;
let city: string | null = null;
let forecast: ForecastDay[] = [];
let loading = true;
let error: string | null = null;

async function detectLocation() {
  loading = true;
  error = null;
  // Try browser geolocation
  if (navigator.geolocation) {
    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          lat = pos.coords.latitude;
          lon = pos.coords.longitude;
          city = null;
          resolve();
        },
        async () => {
          // Fallback to IP-based
          const loc = await fetchLocationByIP();
          if (loc) {
            lat = loc.lat;
            lon = loc.lon;
            city = loc.city;
          } else {
            error = 'Could not detect location.';
          }
          resolve();
        }
      );
    });
  } else {
    // Fallback to IP-based
    const loc = await fetchLocationByIP();
    if (loc) {
      lat = loc.lat;
      lon = loc.lon;
      city = loc.city;
    } else {
      error = 'Could not detect location.';
    }
  }
  loading = false;
}

async function loadForecast() {
  if (lat !== null && lon !== null) {
    forecast = await fetch6DayForecast(lat, lon);
  } else {
    forecast = [];
  }
}

onMount(async () => {
  await detectLocation();
  await loadForecast();
});

$: lat, lon, loadForecast();
</script>

<div class="w-full max-w-2xl mx-auto mt-6">
  <h2 class="text-lg font-bold mb-2">Your Local 6-Day Forecast {#if city}({city}){/if}</h2>
  {#if loading}
    <div class="text-gray-400">Detecting location and loading forecast...</div>
  {:else if error}
    <div class="text-red-500">{error}</div>
  {:else if forecast.length > 0}
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
      {#each forecast as day, i (day.dt)}
        <div class="bg-blue-50 dark:bg-blue-900 rounded shadow p-2 flex flex-col items-center" transition:fly={{ y: 20, duration: 300 + i * 50 }}>
          <div class="font-semibold">{new Date(day.dt * 1000).toLocaleDateString(undefined, { weekday: 'short' })}</div>
          <img src={`/weather-icons/${day.icon}.svg`} alt={day.description} class="w-12 h-12" />
          <div class="text-lg font-bold">{Math.round(day.temp)}°C</div>
          <div class="text-xs capitalize text-gray-500 dark:text-gray-300">{day.description}</div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="text-red-500">Forecast unavailable.</div>
  {/if}
</div> 