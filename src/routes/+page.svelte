<script lang="ts">
import CountrySelector from '../components/CountrySelector.svelte';
import MapView from '../components/MapView.svelte';
import ForecastPanel from '../components/ForecastPanel.svelte';
import LocationForecastCard from '../components/LocationForecastCard.svelte';
</script>

<main class="min-h-screen flex flex-col gap-4 p-4">
  <CountrySelector />
  <MapView />
  <ForecastPanel />
  <LocationForecastCard />
</main>
