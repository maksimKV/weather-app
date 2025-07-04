<script lang="ts">
import { onMount } from 'svelte';
import { fetchCurrentWeather } from '../lib/weatherApi';
import type { WeatherData } from '../lib/weatherApi';
import { Marker, Popup } from 'svelte-leaflet';

export let lat: number;
export let lng: number;
export let name: string;

let weather: WeatherData | null = null;
let loading = true;

onMount(async () => {
  loading = true;
  weather = await fetchCurrentWeather(lat, lng);
  loading = false;
});
</script>

<Marker latLng={[lat, lng]}>
  <Popup>
    <div class="flex flex-col items-center min-w-[120px]">
      <div class="font-semibold">{name}</div>
      {#if loading}
        <div class="text-xs text-gray-400">Loading...</div>
      {:else if weather}
        <img src={`/weather-icons/${weather.icon}.svg`} alt={weather.description} class="w-10 h-10" />
        <div class="text-lg font-bold">{Math.round(weather.temp)}°C</div>
        <div class="text-xs capitalize">{weather.description}</div>
      {:else}
        <div class="text-xs text-red-500">Weather unavailable</div>
      {/if}
    </div>
  </Popup>
</Marker> 