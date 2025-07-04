<script lang="ts">
import { onMount } from 'svelte';
import { selectedCountry } from '../stores/appStore';
import { COUNTRY_MAP_DATA } from '../lib/countryMapData';
import { COUNTRY_CITIES } from '../lib/cityData';
import { get } from 'svelte/store';

let country = get(selectedCountry);
let mapData = COUNTRY_MAP_DATA[country];
let mapRef: HTMLDivElement;
let map: any;
let markers: any[] = [];

selectedCountry.subscribe((code) => {
  country = code;
  mapData = COUNTRY_MAP_DATA[code];
  if (map) {
    map.setView(mapData.center, mapData.zoom);
    updateMarkers();
  }
});

function updateMarkers() {
  markers.forEach((m) => m.remove());
  markers = [];
  COUNTRY_CITIES[country].forEach((city) => {
    const marker = window.L.marker([city.lat, city.lng]).addTo(map);
    marker.bindPopup(`<b>${city.name}</b>`);
    markers.push(marker);
  });
}

onMount(async () => {
  // Dynamically import Leaflet and its CSS
  const L = (await import('leaflet')).default;
  await import('leaflet/dist/leaflet.css');
  // Attach L to window for marker usage
  window.L = L;

  map = L.map(mapRef, {
    center: mapData.center,
    zoom: mapData.zoom,
    maxBounds: mapData.bounds,
    zoomControl: true,
    attributionControl: true
  });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  updateMarkers();
  setTimeout(() => map.invalidateSize(), 200);
});
</script>

<div class="w-full h-96 rounded shadow overflow-hidden">
  <div bind:this={mapRef} class="w-full h-full"></div>
</div> 