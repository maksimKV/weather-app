<script lang="ts">
  import { safeCall } from '../lib/errorBoundary';
  import {
    getUvLabel,
    getComfortLevelColor,
    getHumidityLabel,
    celsiusToFahrenheit,
    logDevError,
  } from '../lib/utils';
  import { UI_CONFIG, ICON_PATHS, WEATHER_THRESHOLDS } from '../lib/constants';

  export let date: string;
  export let mainIcon: string;
  export let minC: number;
  export let maxC: number;
  export let minIcon: string;
  export let maxIcon: string;
  export let mainIconSize: number = UI_CONFIG.DEFAULT_ICON_SIZE;
  export let textSize: string = UI_CONFIG.DEFAULT_TEXT_SIZE;
  export let minWidth: string = UI_CONFIG.DEFAULT_MIN_WIDTH;
  export let cardBg: string = UI_CONFIG.DEFAULT_CARD_BG;
  export let cardMargin: string = UI_CONFIG.DEFAULT_CARD_MARGIN;
  export let humidity: number | undefined;
  export let sunrise: string | undefined;
  export let sunset: string | undefined;
  export let uvIndex: number | undefined;

  if (typeof date !== 'string') logDevError('Invalid date prop passed to WeatherCard:', date);
  if (typeof mainIcon !== 'string')
    logDevError('Invalid mainIcon prop passed to WeatherCard:', mainIcon);
  if (typeof minC !== 'number') logDevError('Invalid minC prop passed to WeatherCard:', minC);
  if (typeof maxC !== 'number') logDevError('Invalid maxC prop passed to WeatherCard:', maxC);
  if (typeof minIcon !== 'string')
    logDevError('Invalid minIcon prop passed to WeatherCard:', minIcon);
  if (typeof maxIcon !== 'string')
    logDevError('Invalid maxIcon prop passed to WeatherCard:', maxIcon);
  if (typeof mainIconSize !== 'number')
    logDevError('Invalid mainIconSize prop passed to WeatherCard:', mainIconSize);
  if (typeof textSize !== 'string')
    logDevError('Invalid textSize prop passed to WeatherCard:', textSize);
  if (typeof minWidth !== 'string')
    logDevError('Invalid minWidth prop passed to WeatherCard:', minWidth);
  if (typeof cardBg !== 'string') logDevError('Invalid cardBg prop passed to WeatherCard:', cardBg);
  if (typeof cardMargin !== 'string')
    logDevError('Invalid cardMargin prop passed to WeatherCard:', cardMargin);
  if (humidity !== undefined && typeof humidity !== 'number')
    logDevError('Invalid humidity prop passed to WeatherCard:', humidity);
  if (sunrise !== undefined && typeof sunrise !== 'string')
    logDevError('Invalid sunrise prop passed to WeatherCard:', sunrise);
  if (sunset !== undefined && typeof sunset !== 'string')
    logDevError('Invalid sunset prop passed to WeatherCard:', sunset);
  if (uvIndex !== undefined && typeof uvIndex !== 'number')
    logDevError('Invalid uvIndex prop passed to WeatherCard:', uvIndex);

  // Optimized safe value calculations - consolidate related calculations
  $: safeValues = {
    minC: safeCall(() => Number(minC) || 0, 0),
    maxC: safeCall(() => Number(maxC) || 0, 0),
    date: safeCall(() => String(date || ''), 'Unknown'),
    mainIcon: safeCall(
      () => String(mainIcon || ICON_PATHS.WEATHER.UNKNOWN),
      ICON_PATHS.WEATHER.UNKNOWN
    ),
    minIcon: safeCall(
      () => String(minIcon || ICON_PATHS.WEATHER.MIN_TEMP),
      ICON_PATHS.WEATHER.MIN_TEMP
    ),
    maxIcon: safeCall(
      () => String(maxIcon || ICON_PATHS.WEATHER.CLEAR_DAY),
      ICON_PATHS.WEATHER.CLEAR_DAY
    ),
  };

  // Calculate Fahrenheit safely using shared utility
  $: minF = safeCall(() => celsiusToFahrenheit(safeValues.minC), '0.0');
  $: maxF = safeCall(() => celsiusToFahrenheit(safeValues.maxC), '0.0');
</script>

<div
  class="day"
  style="margin: {cardMargin}; font-size: {textSize}; min-width: {minWidth}; background: {cardBg};"
>
  <div>{safeValues.date}</div>
  <img
    class="big-weather-icon"
    src={safeValues.mainIcon}
    alt="weather icon"
    width={mainIconSize}
    height={mainIconSize}
    on:error={() => (safeValues.mainIcon = ICON_PATHS.WEATHER.UNKNOWN)}
  />
  <div class="weather-columns">
    <div class="weather-col">
      <span class="min-temp temp-block">
        <span class="temp-row">
          <img
            class="temp-icon"
            src={safeValues.minIcon}
            alt="min temp"
            width="18"
            height="18"
            on:error={() => (safeValues.minIcon = ICON_PATHS.WEATHER.MIN_TEMP)}
          />
          {safeValues.minC}°C
        </span>
        <div class="temp-separator"></div>
        <span class="temp-row">
          <img
            class="temp-icon"
            src={safeValues.minIcon}
            alt="min temp"
            width="18"
            height="18"
            on:error={() => (safeValues.minIcon = ICON_PATHS.WEATHER.MIN_TEMP)}
          />
          {minF}°F
        </span>
      </span>
      {#if sunrise}
        <span class="temp-row">
          <img
            class="temp-icon"
            src={ICON_PATHS.WEATHER.SUNRISE}
            alt="sunrise"
            width={UI_CONFIG.ICON_SIZE_SMALL}
            height={UI_CONFIG.ICON_SIZE_SMALL}
          />
          <span class="sunrise-time">{sunrise.slice(11, 16)}</span>
        </span>
      {/if}
    </div>
    <div class="weather-col">
      <span class="max-temp temp-block">
        <span class="temp-row">
          <img
            class="temp-icon"
            src={safeValues.maxIcon}
            alt="max temp"
            width={UI_CONFIG.ICON_SIZE_SMALL}
            height={UI_CONFIG.ICON_SIZE_SMALL}
            on:error={() => (safeValues.maxIcon = ICON_PATHS.WEATHER.CLEAR_DAY)}
          />
          {safeValues.maxC}°C
        </span>
        <div class="temp-separator"></div>
        <span class="temp-row">
          <img
            class="temp-icon"
            src={safeValues.maxIcon}
            alt="max temp"
            width={UI_CONFIG.ICON_SIZE_SMALL}
            height={UI_CONFIG.ICON_SIZE_SMALL}
            on:error={() => (safeValues.maxIcon = ICON_PATHS.WEATHER.CLEAR_DAY)}
          />
          {maxF}°F
        </span>
      </span>
      {#if sunset}
        <span class="temp-row">
          <img
            class="temp-icon"
            src={ICON_PATHS.WEATHER.SUNSET}
            alt="sunset"
            width={UI_CONFIG.ICON_SIZE_SMALL}
            height={UI_CONFIG.ICON_SIZE_SMALL}
          />
          <span class="sunset-time">{sunset.slice(11, 16)}</span>
        </span>
      {/if}
    </div>
  </div>
  {#if humidity !== undefined || uvIndex !== undefined}
    <div class="extra-weather-details">
      <div class="detail-row">
        {#if humidity !== undefined}
          <span class="detail-item">
            <img
              class="icon-img"
              src={ICON_PATHS.WEATHER.HUMIDITY}
              alt="humidity"
              width={UI_CONFIG.ICON_SIZE_SMALL}
              height={UI_CONFIG.ICON_SIZE_SMALL}
            />
            <span
              style="color: {getComfortLevelColor(humidity)}; font-weight: bold; font-size: 14px;"
            >
              RH:
            </span>
            <span style="color: {getComfortLevelColor(humidity)}; font-size: 14px;">
              {humidity}% ({getHumidityLabel(humidity)})
            </span>
          </span>
        {/if}
      </div>
      <div class="detail-row">
        <!-- Precipitation removed -->
      </div>
      <div class="detail-row">
        {#if uvIndex !== undefined}
          <span class="detail-item">
            <img
              class="icon-img"
              src={ICON_PATHS.WEATHER.UV}
              alt="uv index"
              width={UI_CONFIG.ICON_SIZE_SMALL}
              height={UI_CONFIG.ICON_SIZE_SMALL}
            />
            <span
              style="color: {getComfortLevelColor(uvIndex)}; font-weight: bold; font-size: 14px;"
              title={uvIndex >= WEATHER_THRESHOLDS.UV.HIGH
                ? 'Wear sunscreen and limit sun exposure!'
                : ''}
            >
              UV: {uvIndex} ({getUvLabel(uvIndex)})
            </span>
          </span>
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

  @media (min-width: 1024px) {
    .day {
      padding: 0.5em;
    }
  }

  .big-weather-icon {
    margin-bottom: 0.5em;
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
    padding-bottom: 0.5em;
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
  .icon-img {
    display: inline-block;
    vertical-align: middle;
    margin: 0 0.1em;
  }
  .weather-columns {
    display: flex;
    flex-direction: row;
    gap: 0.5em;
    justify-content: center;
    margin-bottom: 0.2em;
  }

  @media (min-width: 1024px) {
    .weather-columns {
      gap: 0;
    }
  }

  .weather-col {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3em;
    min-width: 90px;
  }
  .sunrise-time {
    color: #ffd600;
    font-weight: 600;
    font-size: 1em;
  }
  .sunset-time {
    color: #ff9800;
    font-weight: 600;
    font-size: 1em;
  }
</style>
