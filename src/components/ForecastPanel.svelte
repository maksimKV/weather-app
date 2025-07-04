<script lang="ts">
  export let forecast: any = null;
  import WeatherCard from './WeatherCard.svelte';

  let daysToShow = 12;

  function updateDaysToShow() {
    if (window.innerWidth < 500) daysToShow = 4;
    else if (window.innerWidth < 900) daysToShow = 6;
    else daysToShow = 8;
  }

  if (typeof window !== 'undefined') {
    updateDaysToShow();
    window.addEventListener('resize', updateDaysToShow);
  }


</script>

{#if forecast}
  <div class="forecast-panel">
    {#each forecast.daily.time.slice(0, daysToShow) as date, i}
              <WeatherCard
          date={new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          mainIcon={forecast.icons[forecast.daily.weathercode[i]] || forecast.icons[0]}
          minC={forecast.daily.temperature_2m_min[i]}
          maxC={forecast.daily.temperature_2m_max[i]}
        minIcon="/weather-icons/min-temp.svg"
        maxIcon="/weather-icons/clear-day.svg"
        mainIconSize={32}
        textSize="1em"
        minWidth="70px"
        cardBg="#fff"
        cardMargin="0 0.3em"
      />
    {/each}
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