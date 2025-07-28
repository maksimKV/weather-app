<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import WeatherCard from './WeatherCard.svelte';
  import {
    getDaysToShow,
    createResizeHandler,
    formatDate,
    normalizeCity,
    isValidWeatherData,
    logDevError,
  } from '../lib/utils';
  import type { WeatherData, City } from '../lib/types';

  export let forecast: WeatherData | null = null;
  export let location: string = '';
  export let country: string = '';
  export let lat: number | null | undefined;
  export let lon: number | null | undefined;
  export let countryCode: string | undefined;

  if (forecast !== null && !isValidWeatherData(forecast)) {
    logDevError('Invalid forecast prop passed to LocationForecastCard:', forecast);
  }
  if (typeof location !== 'string') {
    logDevError('Invalid location prop passed to LocationForecastCard:', location);
  }
  if (typeof country !== 'string') {
    logDevError('Invalid country prop passed to LocationForecastCard:', country);
  }
  if (lat !== null && lat !== undefined && typeof lat !== 'number') {
    logDevError('Invalid lat prop passed to LocationForecastCard:', lat);
  }
  if (lon !== null && lon !== undefined && typeof lon !== 'number') {
    logDevError('Invalid lon prop passed to LocationForecastCard:', lon);
  }
  if (countryCode !== undefined && typeof countryCode !== 'string') {
    logDevError('Invalid countryCode prop passed to LocationForecastCard:', countryCode);
  }

  let daysToShow = 10;
  let resizeHandler: (() => void) | null = null;

  const dispatch = createEventDispatcher<{
    select: City;
  }>();

  function updateDaysToShow() {
    daysToShow = getDaysToShow();
  }

  onMount(() => {
    updateDaysToShow();
    resizeHandler = createResizeHandler(updateDaysToShow);
    window.addEventListener('resize', resizeHandler);
  });

  onDestroy(() => {
    if (resizeHandler && typeof window !== 'undefined') {
      window.removeEventListener('resize', resizeHandler);
    }
  });

  function handleLocationClick() {
    if (lat == null || lon == null) {
      return;
    }

    const cityObj = normalizeCity({
      name: location,
      lat,
      lon,
      country: country || 'Unknown',
      countryCode: countryCode || '',
    });

    dispatch('select', cityObj);
  }
</script>

{#if forecast}
  <div class="location-forecast">
    <div class="location-heading">
      <span class="location-label">Your Current Location:</span>
      <button
        type="button"
        class="location-city clickable"
        on:click={handleLocationClick}
        aria-label="Show on map"
      >
        <svg
          class="pin-icon"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          style="vertical-align: middle; margin-right: 0.3em;"
        >
          <path
            d="M8 15s6-5.686 6-9.5A6 6 0 1 0 2 5.5C2 9.314 8 15 8 15zm0-7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"
          />
        </svg>
        {location}{country ? `, ${country}` : ''}
      </button>
    </div>

    <!-- Location method info -->
    {#if location.includes('📍')}
      <div class="location-info precise">
        <span class="info-icon">✅</span>
        <span>Precise location from your device's GPS/WiFi</span>
      </div>
    {:else if location.includes('🌐')}
      <div class="location-info approximate">
        <span class="info-icon">ℹ️</span>
        <span>Approximate location based on your internet connection</span>
        <button
          class="refresh-btn"
          on:click={() => window.location.reload()}
          title="Refresh to try precise location"
        >
          🔄 Try precise location
        </button>
      </div>
    {:else if location.includes('⚠️')}
      <div class="location-info fallback">
        <span class="info-icon">⚠️</span>
        <span>Using fallback location - location services unavailable</span>
        <button
          class="refresh-btn"
          on:click={() => window.location.reload()}
          title="Refresh to retry location"
        >
          🔄 Retry location
        </button>
      </div>
    {/if}
    <div class="forecast-panel">
      {#each forecast.daily?.time?.slice(0, daysToShow) || [] as date, i}
        <WeatherCard
          date={formatDate(date)}
          mainIcon={forecast.icons?.[forecast.daily?.weathercode?.[i] || 0] ||
            '/weather-icons/unknown.svg'}
          minC={forecast.daily?.temperature_2m_min?.[i] || 0}
          maxC={forecast.daily?.temperature_2m_max?.[i] || 0}
          minIcon="/weather-icons/min-temp.svg"
          maxIcon="/weather-icons/clear-day.svg"
          mainIconSize={56}
          textSize="1.1em"
          minWidth="80px"
          cardBg="var(--secondary)"
          cardMargin="0 0.3em"
          humidity={forecast.daily?.relative_humidity_2m_max?.[i]}
          sunrise={forecast.daily?.sunrise?.[i]}
          sunset={forecast.daily?.sunset?.[i]}
          uvIndex={forecast.daily?.uv_index_max?.[i]}
        />
      {/each}
    </div>
  </div>
{/if}

<style>
  .location-forecast {
    margin: 1em 0;
    background: #fff;
    border-radius: var(--border-radius);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    padding: 1em;
  }
  .location-heading {
    text-align: center;
    font-size: 1.2em;
    font-weight: 600;
    margin-bottom: 0.5em;
    color: var(--primary);
  }
  .location-label {
    font-weight: 400;
    color: #555;
  }
  .location-city {
    font-weight: 700;
    color: var(--primary);
    display: inline-flex;
    align-items: center;
  }
  .location-city.clickable {
    background: none;
    border: none;
    padding: 0.1em 0.3em;
    font: inherit;
    cursor: pointer;
    color: var(--accent, #007bff);
    text-decoration: underline;
    border-radius: 4px;
    transition:
      background 0.2s,
      color 0.2s;
    outline: none;
    display: inline-flex;
    align-items: center;
  }
  .location-city.clickable:hover,
  .location-city.clickable:focus {
    background: #e0e7ff;
    color: var(--accent, #007bff);
    text-decoration: underline;
  }
  .pin-icon {
    margin-right: 0.3em;
    color: var(--accent, #007bff);
  }

  .location-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5em;
    margin: 0.5em 0;
    padding: 0.5em;
    border-radius: 6px;
    font-size: 0.9em;
    text-align: center;
    flex-wrap: wrap;
  }

  .location-info.precise {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .location-info.approximate {
    background: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
  }

  .location-info.fallback {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }

  .info-icon {
    font-size: 1.1em;
  }

  .refresh-btn {
    background: none;
    border: 1px solid currentColor;
    color: inherit;
    padding: 0.2em 0.5em;
    border-radius: 4px;
    font-size: 0.8em;
    cursor: pointer;
    transition: all 0.2s;
    margin-left: 0.5em;
  }

  .refresh-btn:hover {
    background: currentColor;
    color: white;
  }
  .forecast-panel {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.7em;
    justify-items: center;
    margin: 0 auto;
    background: unset;
  }
  @media (max-width: 900px) {
    .forecast-panel {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  @media (max-width: 700px) {
    .forecast-panel {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 450px) {
    .forecast-panel {
      grid-template-columns: 1fr;
    }
    .location-forecast {
      padding: 0.5em;
    }
    .location-heading {
      font-size: 1em;
    }
  }
</style>
