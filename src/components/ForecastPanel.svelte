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
          <span>{forecast.daily.temperature_2m_max[i]}°C</span>
          <span>{forecast.daily.temperature_2m_min[i]}°C</span>
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
</style> 