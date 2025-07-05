<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import WeatherCard from './WeatherCard.svelte';
  import { safeAccess, safeCall, validateWeatherData } from '../lib/errorBoundary';
  import { getDaysToShow, createResizeHandler, formatDate } from '../lib/utils';
  import type { WeatherData } from '../lib/types';

  export let forecast: WeatherData | null = null;

  let daysToShow = 12;
  let resizeHandler: (() => void) | null = null;

  function updateDaysToShow() {
    daysToShow = getDaysToShow();
  }

  onMount(() => {
    try {
      updateDaysToShow();
      resizeHandler = createResizeHandler(updateDaysToShow);
      window.addEventListener('resize', resizeHandler);
    } catch (error) {
      console.error('Error setting up ForecastPanel:', error);
    }
  });

  onDestroy(() => {
    try {
      if (resizeHandler && typeof window !== 'undefined') {
        window.removeEventListener('resize', resizeHandler);
      }
    } catch (error) {
      console.error('Error cleaning up ForecastPanel:', error);
    }
  });

  // Validate forecast data
  $: isValidForecast = forecast && validateWeatherData(forecast);
  $: dailyTime = safeAccess(forecast, ['daily', 'time'], []);
  $: dailyMin = safeAccess(forecast, ['daily', 'temperature_2m_min'], []);
  $: dailyMax = safeAccess(forecast, ['daily', 'temperature_2m_max'], []);
  $: dailyWeathercode = safeAccess(forecast, ['daily', 'weathercode'], []);
  $: icons = safeAccess(forecast, ['icons'], {});
  $: dailyHumidity = safeAccess(forecast, ['daily', 'relative_humidity_2m_max'], []);
  $: dailySunrise = safeAccess(forecast, ['daily', 'sunrise'], []);
  $: dailySunset = safeAccess(forecast, ['daily', 'sunset'], []);
  $: dailyUvIndex = safeAccess(forecast, ['daily', 'uv_index_max'], []);
</script>

{#if isValidForecast && dailyTime.length > 0}
  <div class="forecast-panel">
    {#each dailyTime.slice(0, daysToShow) as date, i}
      {#if i < dailyMin.length && i < dailyMax.length && i < dailyWeathercode.length}
        <WeatherCard
          date={safeCall(() => formatDate(date), 'Unknown')}
          mainIcon={safeAccess(icons, [dailyWeathercode[i]], '/weather-icons/unknown.svg') ||
            '/weather-icons/unknown.svg'}
          minC={dailyMin[i]}
          maxC={dailyMax[i]}
          minIcon="/weather-icons/min-temp.svg"
          maxIcon="/weather-icons/clear-day.svg"
          mainIconSize={32}
          textSize="1em"
          minWidth="70px"
          cardBg="#fff"
          cardMargin="0 0.3em"
          humidity={dailyHumidity[i]}
          sunrise={dailySunrise[i]}
          sunset={dailySunset[i]}
          uvIndex={dailyUvIndex[i]}
        />
      {/if}
    {/each}
  </div>
{:else if forecast}
  <div class="error-message">
    <p>⚠️ Invalid forecast data received</p>
  </div>
{/if}

<style>
  .forecast-panel {
    display: flex;
    gap: 0.5em;
    justify-content: center;
    margin-bottom: 1em;
    flex-wrap: wrap;
  }
</style>
