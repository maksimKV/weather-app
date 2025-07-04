<script lang="ts">
  export let forecast: any = null;
  export let location: string = '';
  export let country: string = '';

  let daysToShow = 10;

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
</script>

{#if forecast}
  <div class="location-forecast">
    <div class="location-heading">
      <span class="location-label">Your Current Location:</span>
      <span class="location-city">{location}{country ? `, ${country}` : ''}</span>
    </div>
    <div class="forecast-panel">
      {#each forecast.daily.time.slice(0, daysToShow) as date, i}
        <WeatherCard
          date={new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
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
.location-country {
  font-weight: 400;
  color: #888;
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
.day {
  background: var(--secondary);
  border-radius: var(--border-radius);
  padding: 1em;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
  box-sizing: border-box;
}
.big-weather-icon {
  width: 56px;
  height: 56px;
  margin-bottom: 0.5em;
}
.temps {
  display: flex;
  gap: 0.5em;
}
.min-temp { color: #2196f3; font-weight: 500; }
.max-temp { color: #f44336; font-weight: 500; }
.temp-block {
  display: inline-block;
  margin: 0 0.3em;
}
.temp-row {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 70px;
  margin: 0.1em 0;
}
.temp-separator {
  border-bottom: 2.5px solid #bdbdbd;
  margin: 0.28em 0 0.28em 0;
  width: 100%;
}
.temp-icon {
  vertical-align: middle;
  position: relative;
  top: 2px;
}
</style> 