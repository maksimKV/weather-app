<script lang="ts">
  export let date: string;
  export let mainIcon: string;
  export let minC: number;
  export let maxC: number;
  export let minIcon: string;
  export let maxIcon: string;
  export let mainIconSize: number = 56;
  export let textSize: string = '1em';
  export let margin: string = '0';
  export let minWidth: string = '80px';
  export let cardBg: string = 'var(--secondary)';
  export let cardMargin: string = '0 0.3em';
</script>

<div class="day" style="margin: {cardMargin}; font-size: {textSize}; min-width: {minWidth}; background: {cardBg};">
  <div>{date}</div>
  <img class="big-weather-icon" src={mainIcon} alt="icon" width={mainIconSize} height={mainIconSize} />
  <div class="temps">
    <span class="min-temp temp-block">
      <span class="temp-row"><img class="temp-icon" src={minIcon} alt="" width="18" height="18" /> {minC}°C</span>
      <div class="temp-separator"></div>
      <span class="temp-row"><img class="temp-icon" src={minIcon} alt="" width="18" height="18" /> {(minC * 9/5 + 32).toFixed(1)}°F</span>
    </span>
    <span class="max-temp temp-block">
      <span class="temp-row"><img class="temp-icon" src={maxIcon} alt="" width="18" height="18" /> {maxC}°C</span>
      <div class="temp-separator"></div>
      <span class="temp-row"><img class="temp-icon" src={maxIcon} alt="" width="18" height="18" /> {(maxC * 9/5 + 32).toFixed(1)}°F</span>
    </span>
  </div>
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
.min-temp { color: #2196f3; font-weight: 500; }
.max-temp { color: #f44336; font-weight: 500; }
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
</style> 