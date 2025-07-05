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
      population: undefined
    };
    dispatch('select', cityObj);
  }
</script>

{#if forecast}
  <div class="location-forecast">
    <div class="location-heading clickable" role="button" tabindex="0" title="Show on map" on:click={handleLocationClick}>
      <span class="location-label">Your Current Location:</span>
      <span class="location-city">{location}{country ? `, ${country}` : ''}</span>
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
  }
  .location-heading.clickable {
    cursor: pointer;
    transition: background 0.2s;
  }
  .location-heading.clickable:hover,
  .location-heading.clickable:focus {
    background: #f0f4ff;
    outline: 2px solid var(--primary);
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
