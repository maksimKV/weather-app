<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import maplibregl from 'maplibre-gl';
  import type { City } from '../lib/cities';
  import 'maplibre-gl/dist/maplibre-gl.css';

  export let cities: City[] = [];
  export let center: [number, number] = [0, 0];
  export let zoom: number = 5;
  export let selectedCity: City | null = null;
  export let weatherByCity: Record<string, { temperature: number; icon: string }> = {};
  export let onMarkerClick: (city: City) => void = () => {};

  let mapContainer: HTMLDivElement;
  let map: maplibregl.Map;
  let markers: maplibregl.Marker[] = [];

  function clearMarkers() {
    markers.forEach(m => m.remove());
    markers = [];
  }

  function addMarkers() {
    clearMarkers();
    
    // If a city is selected, only show that city
    const citiesToShow = selectedCity ? [selectedCity] : cities;
    
    for (const city of citiesToShow) {
      const el = document.createElement('div');
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.gap = '0.5em';
      el.style.cursor = 'pointer';
      el.style.background = 'white';
      el.style.borderRadius = '8px';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      el.style.padding = '2px 6px';
      el.tabIndex = 0;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `Select city ${city.name}`);
      el.onclick = () => onMarkerClick(city);
      el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') onMarkerClick(city); };
      const weather = weatherByCity[city.name];
      el.innerHTML = `
        <span>${city.name}</span>
        ${weather ? `<span>${weather.temperature}°C</span><img src="${weather.icon}" alt="icon" width="24" height="24" />` : ''}
      `;
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([(city as any).lng || city.lon, city.lat])
        .addTo(map);
      markers.push(marker);
    }
  }

  onMount(() => {
    map = new maplibregl.Map({
      container: mapContainer,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [center[1], center[0]],
      zoom,
      attributionControl: { compact: true }
    });
    return () => {
      map.remove();
    };
  });

  $: if (map && (cities || weatherByCity || selectedCity)) {
    addMarkers();
  }
  $: if (map && selectedCity) {
    map.flyTo({ center: [(selectedCity as any).lng || selectedCity.lon, selectedCity.lat], zoom: 8 });
  } else if (map && cities.length) {
    // Fit map to all city markers (country)
    const bounds = new maplibregl.LngLatBounds();
    for (const city of cities) {
      bounds.extend([(city as any).lng || city.lon, city.lat]);
    }
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 120, duration: 800 });
    }
  }
</script>

<div bind:this={mapContainer} style="height: 400px; width: 100%; border-radius: var(--border-radius);"></div>

<style>
:global(.maplibregl-canvas) {
  border-radius: var(--border-radius);
  min-height: 400px;
}
</style> 