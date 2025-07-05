<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import WeatherCard from './WeatherCard.svelte';
  import { safeAccess, safeCall, validateWeatherData } from '../lib/errorBoundary';

  export let forecast: any = null;

  let daysToShow = 12;
  let resizeHandler: (() => void) | null = null;

  function updateDaysToShow() {
    try {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 500) daysToShow = 4;
        else if (window.innerWidth < 900) daysToShow = 6;
        else daysToShow = 8;
      }
    } catch (error) {
      console.error('Error updating days to show:', error);
      daysToShow = 8; // fallback
    }
  }

  onMount(() => {
    try {
      updateDaysToShow();
      resizeHandler = updateDaysToShow;
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
</script>

{#if isValidForecast && dailyTime.length > 0}
  <div class="forecast-panel">
    {#each dailyTime.slice(0, daysToShow) as date, i}
      {#if i < dailyMin.length && i < dailyMax.length && i < dailyWeathercode.length}
        <WeatherCard
          date={safeCall(
            () =>
              new Date(date).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              }),
            'Unknown'
          )}
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
    gap: 1em;
    justify-content: center;
    margin-bottom: 1em;
    flex-wrap: wrap;
  }
</style>
