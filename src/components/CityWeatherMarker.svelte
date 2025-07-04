<script lang="ts">
  export let name: string;
  export let temperature: number;
  export let icon: string;
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