<script lang="ts">
  export let forecast: any = null;
  export let icons: Record<number, string> = {};

  let daysToShow = 12;

  function updateDaysToShow() {
    if (window.innerWidth < 500) daysToShow = 4;
    else if (window.innerWidth < 700) daysToShow = 6;
    else if (window.innerWidth < 900) daysToShow = 8;
    else daysToShow = 12;
  }

  if (typeof window !== 'undefined') {
    updateDaysToShow();
    window.addEventListener('resize', updateDaysToShow);
  }
</script>

{#if forecast}
  <div class="forecast-panel">
    {#each forecast.daily.time.slice(0, daysToShow) as date, i}
      <div class="day">
        <div>{new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
        <img src={icons[forecast.daily.weathercode[i]] || icons[0]} alt="icon" width="32" height="32" />
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
{/if}

<style>
.forecast-panel {
  display: flex;
  gap: 1em;
  justify-content: center;
  margin: 1em 0;
  flex-wrap: wrap;
}
.day {
  background: #fff;
  border-radius: var(--border-radius);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  padding: 1em;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 90px;
}
.temps {
  display: flex;
  gap: 0.5em;
}
.min-temp img, .max-temp img { vertical-align: middle; margin-right: 0.2em; }
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