<script lang="ts">
  export let forecast: any = null;
  export let location: string = '';
  export let icons: Record<number, string> = {};
</script>

{#if forecast}
  <div class="location-forecast">
    <h3>Weather in {location}</h3>
    <div class="forecast-panel">
      {#each forecast.daily.time as date, i}
        <div class="day">
          <div>{new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
          <img src={icons[forecast.daily.weathercode[i]] || icons[0]} alt="icon" width="32" height="32" />
          <div class="temps">
            <span>{forecast.daily.temperature_2m_max[i]}°</span>
            <span>{forecast.daily.temperature_2m_min[i]}°</span>
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
.temps {
  display: flex;
  gap: 0.5em;
}
</style> 