<script lang="ts">
  export let forecast: any = null;
  export let location: string = '';
  export let icons: Record<number, string> = {};
  export let country: string = '';

  let daysToShow = 10;

  function updateDaysToShow() {
    if (window.innerWidth < 500) daysToShow = 4;
    else if (window.innerWidth < 700) daysToShow = 6;
    else if (window.innerWidth < 900) daysToShow = 8;
    else daysToShow = 10;
  }

  if (typeof window !== 'undefined') {
    updateDaysToShow();
    window.addEventListener('resize', updateDaysToShow);
  }
</script>

{#if forecast}
  <div class="location-forecast">
    <div class="location-heading">
      <span class="location-label">Your Current Location:</span>
      <span class="location-city">{location}</span>
      {#if country}
        <span class="location-country">, {country}</span>
      {/if}
    </div>
    <div class="forecast-panel">
      {#each forecast.daily.time.slice(0, daysToShow) as date, i}
        <div class="day">
          <div>{new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
          <img class="big-weather-icon" src={icons[forecast.daily.weathercode[i]] || icons[0]} alt="icon" width="56" height="56" />
          <div class="temps">
            <span class="min-temp temp-block">
              <span class="temp-row"><img src="/weather-icons/min-temp.svg" alt="" width="18" height="18" /> {forecast.daily.temperature_2m_min[i]}°C</span>
              <div class="temp-separator"></div>
              <span class="temp-row"><img src="/weather-icons/min-temp.svg" alt="" width="18" height="18" /> {(forecast.daily.temperature_2m_min[i] * 9/5 + 32).toFixed(1)}°F</span>
            </span>
            <span class="max-temp temp-block">
              <span class="temp-row"><img src="/weather-icons/clear-day.svg" alt="" width="18" height="18" /> {forecast.daily.temperature_2m_max[i]}°C</span>
              <div class="temp-separator"></div>
              <span class="temp-row"><img src="/weather-icons/clear-day.svg" alt="" width="18" height="18" /> {(forecast.daily.temperature_2m_max[i] * 9/5 + 32).toFixed(1)}°F</span>
            </span>
          </div>
        </div>
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
  display: flex;
  gap: 1em;
  justify-content: center;
  flex-wrap: wrap;
}
.day {
  background: var(--secondary);
  border-radius: var(--border-radius);
  padding: 1em;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 90px;
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
  gap: 0.3em;
  min-width: 70px;
  margin: 0.1em 0;
}
.temp-separator {
  border-bottom: 2.5px solid #bdbdbd;
  margin: 0.28em 0 0.28em 0;
  width: 100%;
}
</style> 