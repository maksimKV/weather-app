<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let forecast: any = null;
  export let location: string = '';
  export let country: string = '';
  export let lat: number | undefined;
  export let lon: number | undefined;
  export let countryCode: string | undefined;

  let daysToShow = 10;

  const dispatch = createEventDispatcher();

  function updateDaysToShow() {
    if (window.innerWidth < 500) daysToShow = 4;
    else if (window.innerWidth < 900) daysToShow = 6;
    else daysToShow = 8;
  }

  if (typeof window !== 'undefined') {
    updateDaysToShow();
    window.addEventListener('resize', updateDaysToShow);
  }

  import WeatherCard from './WeatherCard.svelte';

  function handleLocationClick() {
    if (lat == null || lon == null) {
      return;
    }
    const cityObj = {
      name: location,
      lat,
      lon,
      country: country || 'Unknown',
      countryCode: countryCode || '',
      geonameId: undefined,
      population: undefined,
    };
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
    <div class="forecast-panel">
      {#each forecast.daily.time.slice(0, daysToShow) as date, i}
        <WeatherCard
          date={new Date(date).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
          mainIcon={forecast.icons[forecast.daily.weathercode[i]] || forecast.icons[0]}
          minC={forecast.daily.temperature_2m_min[i]}
          maxC={forecast.daily.temperature_2m_max[i]}
          minIcon="/weather-icons/min-temp.svg"
          maxIcon="/weather-icons/clear-day.svg"
          mainIconSize={56}
          textSize="1.1em"
          minWidth="80px"
          cardBg="var(--secondary)"
          cardMargin="0 0.3em"
          humidity={forecast.daily.relative_humidity_2m_max ? forecast.daily.relative_humidity_2m_max[i] : undefined}
          sunrise={forecast.daily.sunrise ? forecast.daily.sunrise[i] : undefined}
          sunset={forecast.daily.sunset ? forecast.daily.sunset[i] : undefined}
          uvIndex={forecast.daily.uv_index_max ? forecast.daily.uv_index_max[i] : undefined}
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
