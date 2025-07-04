<script lang="ts">
import { selectedCountry, selectedCity } from '../stores/appStore';
import { COUNTRY_CITIES } from '../lib/cityData';
import { fetch6DayForecast, type ForecastDay } from '../lib/weatherApi';
import { onMount } from 'svelte';
import { fly } from 'svelte/transition';
import { Chart } from 'svelte-chartjs';

let country: string;
let city: string;
let forecast: ForecastDay[] = [];
let loading = true;

selectedCountry.subscribe((c) => (country = c));
selectedCity.subscribe((c) => (city = c));

async function loadForecast() {
  loading = true;
  const cityObj = COUNTRY_CITIES[country].find((c) => c.name === city);
  if (cityObj) {
    forecast = await fetch6DayForecast(cityObj.lat, cityObj.lng);
  } else {
    forecast = [];
  }
  loading = false;
}

$: country, city, loadForecast();

function weekday(dt: number) {
  return new Date(dt * 1000).toLocaleDateString(undefined, { weekday: 'short' });
}

$: data = {
  labels: forecast.map(day => weekday(day.dt)),
  datasets: [
    {
      label: 'Temp (°C)',
      data: forecast.map(day => Math.round(day.temp)),
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37,99,235,0.2)',
      fill: true,
      tension: 0.4
    }
  ]
};

$: options = {
  responsive: true,
  plugins: {
    legend: { display: false },
    title: { display: true, text: 'Temperature Trend' }
  },
  scales: {
    y: {
      beginAtZero: false,
      ticks: { color: '#2563eb' }
    },
    x: {
      ticks: { color: '#2563eb' }
    }
  }
};
</script>

<div class="w-full max-w-3xl mx-auto mt-4">
  <h2 class="text-xl font-bold mb-2">6-Day Forecast for {city}</h2>
  {#if loading}
    <div class="text-gray-400">Loading forecast...</div>
  {:else if forecast.length > 0}
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
      {#each forecast as day, i (day.dt)}
        <div class="bg-white dark:bg-gray-800 rounded shadow p-2 flex flex-col items-center" transition:fly={{ y: 20, duration: 300 + i * 50 }}>
          <div class="font-semibold">{weekday(day.dt)}</div>
          <img src={`/weather-icons/${day.icon}.svg`} alt={day.description} class="w-12 h-12" />
          <div class="text-lg font-bold">{Math.round(day.temp)}°C</div>
          <div class="text-xs capitalize text-gray-500 dark:text-gray-300">{day.description}</div>
        </div>
      {/each}
    </div>
    <div class="mt-4">
      <Chart
        type="line"
        {options}
        {data}
      />
    </div>
  {:else}
    <div class="text-red-500">Forecast unavailable.</div>
  {/if}
</div>

<!-- Forecast panel UI will go here --> 