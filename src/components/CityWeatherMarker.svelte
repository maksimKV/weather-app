<script lang="ts">
  import { logDevError } from '../lib/utils';
  export let name: string;
  export let temperature: number;
  export let icon: string;

  if (typeof name !== 'string') {
    logDevError('Invalid name prop passed to CityWeatherMarker:', name);
  }
  if (typeof temperature !== 'number') {
    logDevError('Invalid temperature prop passed to CityWeatherMarker:', temperature);
  }
  if (typeof icon !== 'string') {
    logDevError('Invalid icon prop passed to CityWeatherMarker:', icon);
  }
</script>

<div class="marker">
  <span>{name}</span>
  <span>{temperature}°C</span>
  <img src={icon} alt="weather icon" width="32" height="32" />
</div>

<style>
  .marker {
    display: flex;
    align-items: center;
    gap: 0.5em;
  }
  span {
    font-size: 1em;
  }
</style>
