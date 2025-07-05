<script lang="ts">
  import { safeCall } from '../lib/errorBoundary';

  export let date: string;
  export let mainIcon: string;
  export let minC: number;
  export let maxC: number;
  export let minIcon: string;
  export let maxIcon: string;
  export let mainIconSize: number = 56;
  export let textSize: string = '1em';
  export let minWidth: string = '80px';
  export let cardBg: string = 'var(--secondary)';
  export let cardMargin: string = '0 0.3em';
  export let humidity: number | undefined;
  export let windspeed: number | undefined;
  export let winddirection: number | undefined;
  export let precipitation: number | undefined;
  export let sunrise: string | undefined;
  export let sunset: string | undefined;
  export let uvIndex: number | undefined;

  // Validate and sanitize inputs
  $: safeMinC = safeCall(() => Number(minC) || 0, 0);
  $: safeMaxC = safeCall(() => Number(maxC) || 0, 0);
  $: safeDate = safeCall(() => String(date || ''), 'Unknown');
  $: safeMainIcon = safeCall(
    () => String(mainIcon || '/weather-icons/unknown.svg'),
    '/weather-icons/unknown.svg'
  );
  $: safeMinIcon = safeCall(
    () => String(minIcon || '/weather-icons/min-temp.svg'),
    '/weather-icons/min-temp.svg'
  );
  $: safeMaxIcon = safeCall(
    () => String(maxIcon || '/weather-icons/clear-day.svg'),
    '/weather-icons/clear-day.svg'
  );

  // Calculate Fahrenheit safely
  $: minF = safeCall(() => ((safeMinC * 9) / 5 + 32).toFixed(1), '0.0');
  $: maxF = safeCall(() => ((safeMaxC * 9) / 5 + 32).toFixed(1), '0.0');

  // Helper for wind direction
  function windDirText(deg: number | undefined): string {
    if (deg === undefined) return '';
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(((deg % 360) / 45)) % 8];
  }

  // Helper for UV color
  function uvColor(val: number | undefined): string {
    if (val === undefined) return '#bbb';
    if (val < 3) return '#4caf50'; // green
    if (val < 6) return '#ffeb3b'; // yellow
    if (val < 8) return '#ff9800'; // orange
    return '#f44336'; // red
  }

  // Helper for UV label
  function uvLabel(val: number | undefined): string {
    if (val === undefined) return '';
    if (val < 3) return 'Low';
    if (val < 6) return 'Moderate';
    if (val < 8) return 'High';
    return 'Very High';
  }
</script>

<div
  class="day"
  style="margin: {cardMargin}; font-size: {textSize}; min-width: {minWidth}; background: {cardBg};"
>
  <div>{safeDate}</div>
  <img
    class="big-weather-icon"
    src={safeMainIcon}
    alt="weather icon"
    width={mainIconSize}
    height={mainIconSize}
    on:error={() => (safeMainIcon = '/weather-icons/unknown.svg')}
  />
  <div class="temps">
    <span class="min-temp temp-block">
      <span class="temp-row"
        ><img
          class="temp-icon"
          src={safeMinIcon}
          alt="min temp"
          width="18"
          height="18"
          on:error={() => (safeMinIcon = '/weather-icons/min-temp.svg')}
        />
        {safeMinC}°C</span
      >
      <div class="temp-separator"></div>
      <span class="temp-row"
        ><img
          class="temp-icon"
          src={safeMinIcon}
          alt="min temp"
          width="18"
          height="18"
          on:error={() => (safeMinIcon = '/weather-icons/min-temp.svg')}
        />
        {minF}°F</span
      >
    </span>
    <span class="max-temp temp-block">
      <span class="temp-row"
        ><img
          class="temp-icon"
          src={safeMaxIcon}
          alt="max temp"
          width="18"
          height="18"
          on:error={() => (safeMaxIcon = '/weather-icons/clear-day.svg')}
        />
        {safeMaxC}°C</span
      >
      <div class="temp-separator"></div>
      <span class="temp-row"
        ><img
          class="temp-icon"
          src={safeMaxIcon}
          alt="max temp"
          width="18"
          height="18"
          on:error={() => (safeMaxIcon = '/weather-icons/clear-day.svg')}
        />
        {maxF}°F</span
      >
    </span>
  </div>
  {#if sunrise && sunset}
    <div class="sunrise-sunset-panel">
      <span class="sunrise-block">
        <img class="icon-img" src="/weather-icons/sunrise.svg" alt="sunrise" width="18" height="18" style="filter: drop-shadow(0 0 2px #FFD600);" />
        <span class="sunrise-time">{sunrise.slice(11, 16)}</span>
      </span>
      <span class="sunset-block">
        <img class="icon-img" src="/weather-icons/sunset.svg" alt="sunset" width="18" height="18" style="filter: drop-shadow(0 0 2px #FF9800);" />
        <span class="sunset-time">{sunset.slice(11, 16)}</span>
      </span>
    </div>
  {/if}
  {#if humidity !== undefined || windspeed !== undefined || precipitation !== undefined || uvIndex !== undefined}
    <div class="extra-weather-details">
      <div class="detail-row">
        {#if humidity !== undefined}
          <span class="detail-item"><span class="icon">💧</span> {humidity}%</span>
        {/if}
        {#if windspeed !== undefined}
          <span class="detail-item"><span class="icon">🌀</span> {windspeed} km/h {windDirText(winddirection)}</span>
        {/if}
      </div>
      <div class="detail-row">
        {#if precipitation !== undefined}
          <span class="detail-item"><span class="icon">☔</span> {precipitation} mm</span>
        {/if}
      </div>
      <div class="detail-row">
        {#if uvIndex !== undefined}
          <span class="detail-item"><span class="icon" style="color: {uvColor(uvIndex)};">●</span> UV: {uvIndex} ({uvLabel(uvIndex)})</span>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .day {
    border-radius: var(--border-radius, 1em);
    padding: 1em;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
  }
  .big-weather-icon {
    margin-bottom: 0.5em;
  }
  .temps {
    display: flex;
    gap: 0.5em;
  }
  .min-temp {
    color: #2196f3;
    font-weight: 500;
  }
  .max-temp {
    color: #f44336;
    font-weight: 500;
  }
  .temp-block {
    display: inline-block;
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
  .extra-weather-details {
    margin-top: 0.7em;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.2em;
    align-items: flex-start;
    font-size: 0.98em;
  }
  .detail-row {
    display: flex;
    flex-direction: row;
    gap: 1.2em;
    width: 100%;
    justify-content: flex-start;
  }
  .detail-item {
    display: flex;
    align-items: center;
    gap: 0.3em;
    color: #444;
    font-weight: 500;
  }
  .icon {
    font-size: 1.1em;
    vertical-align: middle;
  }
  .icon-img {
    display: inline-block;
    vertical-align: middle;
    margin: 0 0.1em;
  }
  .sunrise-sunset-panel {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.5em;
    font-size: 1em;
    font-weight: 500;
    margin: 0.5em 0 0.1em 0;
    letter-spacing: 0.5px;
  }
  .sunrise-block, .sunset-block {
    display: flex;
    align-items: center;
    gap: 5px;
    min-width: 70px;
    margin: 0.1em 0;
  }
  .sunrise-time {
    color: #FFD600;
    font-weight: 600;
    font-size: 1em;
    margin-left: 0.1em;
  }
  .sunset-time {
    color: #FF9800;
    font-weight: 600;
    font-size: 1em;
    margin-left: 0.1em;
  }
</style>
