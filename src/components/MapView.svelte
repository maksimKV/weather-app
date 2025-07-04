<script lang="ts">
import { onMount } from 'svelte';
import { selectedCountry } from '../stores/appStore';
import { COUNTRY_MAP_DATA } from '../lib/countryMapData';
import { get } from 'svelte/store';
import { Map, TileLayer, Marker, Popup } from 'svelte-leaflet';
import { COUNTRY_CITIES } from '../lib/cityData';
import CityWeatherMarker from './CityWeatherMarker.svelte';

let country = get(selectedCountry);
let mapData = COUNTRY_MAP_DATA[country];

selectedCountry.subscribe((code) => {
  country = code;
  mapData = COUNTRY_MAP_DATA[code];
});

let mapRef: any;

onMount(() => {
  if (mapRef && mapRef.invalidateSize) {
    setTimeout(() => mapRef.invalidateSize(), 200);
  }
});
</script>

<div class="w-full h-96 rounded shadow overflow-hidden">
  {#if mapData}
    <Map
      bind:this={mapRef}
      options={{
        center: mapData.center,
        zoom: mapData.zoom,
        maxBounds: mapData.bounds,
        zoomControl: true,
        attributionControl: true
      }}
      class="w-full h-full"
    >
      <TileLayer
        url={'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
      />
      {#each COUNTRY_CITIES[country] as city}
        <CityWeatherMarker lat={city.lat} lng={city.lng} name={city.name} />
      {/each}
    </Map>
  {/if}
</div> 