<script lang="ts">
  export let forecast: any = null;
  export let icons: Record<number, string> = {};
</script>

{#if forecast}
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