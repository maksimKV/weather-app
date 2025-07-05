<script lang="ts">
  import { onMount } from 'svelte';
  import maplibregl from 'maplibre-gl';
  import type { City } from '../lib/types';
  import { safeCall, validateCityData } from '../lib/errorBoundary';
  import { logDevError, isValidCityArray, isCity } from '../lib/utils';
  import 'maplibre-gl/dist/maplibre-gl.css';

  export let cities: City[] = [];
  export let center: [number, number] = [0, 0];
  export let zoom: number = 5;
  export let selectedCity: City | null = null;
  export let weatherByCity: Record<string, { temperature: number; icon: string }> = {};
  // eslint-disable-next-line no-unused-vars
  export let onMarkerClick: (city: City) => void;

  if (!isValidCityArray(cities)) {
    logDevError('Invalid cities prop passed to MapView:', cities);
  }
  if (
    !Array.isArray(center) ||
    center.length !== 2 ||
    typeof center[0] !== 'number' ||
    typeof center[1] !== 'number'
  ) {
    logDevError('Invalid center prop passed to MapView:', center);
  }
  if (typeof zoom !== 'number') {
    logDevError('Invalid zoom prop passed to MapView:', zoom);
  }
  if (selectedCity !== null && !isCity(selectedCity)) {
    logDevError('Invalid selectedCity prop passed to MapView:', selectedCity);
  }
  if (typeof weatherByCity !== 'object' || weatherByCity === null) {
    logDevError('Invalid weatherByCity prop passed to MapView:', weatherByCity);
  }
  if (typeof onMarkerClick !== 'function') {
    logDevError('Invalid onMarkerClick prop passed to MapView:', onMarkerClick);
  }

  let mapContainer: HTMLDivElement;
  let map: maplibregl.Map | null = null;
  let markers: maplibregl.Marker[] = [];
  let mapError = false;

  function clearMarkers() {
    try {
      markers.forEach(m => m.remove());
      markers = [];
    } catch (error) {
      logDevError('Error clearing markers:', error);
    }
  }

  function addMarkers() {
    if (!map) return;

    try {
      clearMarkers();

      // Validate cities before adding markers
      const validCities = (selectedCity ? [selectedCity] : cities).filter(city =>
        validateCityData(city as unknown as Record<string, unknown>)
      );

      for (const city of validCities) {
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

        el.onclick = () => {
          try {
            onMarkerClick(city);
          } catch (error) {
            logDevError('Error in marker click handler:', error);
          }
        };

        el.onkeydown = e => {
          if (e.key === 'Enter' || e.key === ' ') {
            try {
              onMarkerClick(city);
            } catch (error) {
              logDevError('Error in marker keydown handler:', error);
            }
          }
        };

        const weather = safeCall(() => weatherByCity[city.name], null);
        const weatherHtml = weather
          ? `<span>${weather.temperature}°C</span><img src="${weather.icon}" alt="icon" width="24" height="24" onerror="this.src='/weather-icons/unknown.svg'" />`
          : '';

        el.innerHTML = `
          <span>${safeCall(() => city.name, 'Unknown City')}</span>
          ${weatherHtml}
        `;

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([
            safeCall(() => (city as any).lng || city.lon, 0),
            safeCall(() => city.lat, 0),
          ])
          .addTo(map);
        markers.push(marker);
      }
    } catch (error) {
      logDevError('Error adding markers:', error);
      mapError = true;
    }
  }

  onMount(() => {
    try {
      map = new maplibregl.Map({
        container: mapContainer,
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center: [center[1], center[0]],
        zoom,
        attributionControl: { compact: true },
      });

      map.on('error', e => {
        logDevError('Map error:', e);
        mapError = true;
      });

      return () => {
        if (map) {
          try {
            map.remove();
          } catch (error) {
            logDevError('Error removing map:', error);
          }
        }
      };
    } catch (error) {
      logDevError('Error initializing map:', error);
      mapError = true;
    }
  });

  $: if (map && !mapError && (cities || weatherByCity || selectedCity)) {
    addMarkers();
  }
  $: if (
    map &&
    !mapError &&
    selectedCity &&
    validateCityData(selectedCity as unknown as Record<string, unknown>)
  ) {
    try {
      map.flyTo({
        center: [
          safeCall(() => (selectedCity as any).lng || selectedCity.lon, 0),
          safeCall(() => selectedCity.lat, 0),
        ],
        zoom: 8,
      });
    } catch (error) {
      logDevError('Error flying to selected city:', error);
    }
  } else if (map && !mapError && cities.length) {
    try {
      // Fit map to all city markers (country)
      const bounds = new maplibregl.LngLatBounds();
      const validCities = cities.filter(city =>
        validateCityData(city as unknown as Record<string, unknown>)
      );

      for (const city of validCities) {
        bounds.extend([
          safeCall(() => (city as any).lng || city.lon, 0),
          safeCall(() => city.lat, 0),
        ]);
      }

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 120, duration: 800 });
      }
    } catch (error) {
      logDevError('Error fitting map bounds:', error);
    }
  }
</script>

{#if mapError}
  <div class="map-error">
    <p>⚠️ Map failed to load</p>
    <button
      on:click={() => {
        mapError = false;
        window.location.reload();
      }}>Retry</button
    >
  </div>
{:else}
  <div
    bind:this={mapContainer}
    style="height: 400px; width: 100%; border-radius: var(--border-radius);"
  ></div>
{/if}

<style>
  :global(.maplibregl-canvas) {
    border-radius: var(--border-radius);
    min-height: 400px;
  }

  .map-error {
    height: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: var(--border-radius);
    color: #6c757d;
  }

  .map-error button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .map-error button:hover {
    background: #0056b3;
  }
</style>
