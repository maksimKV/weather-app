<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { cities, citiesLoaded } from '../stores';
  import type { City } from '../lib/types';
  import { logDevError, isCity } from '../lib/utils';
  import {
    UI_CONFIG,
    VALIDATION_CONFIG,
    CACHE_THRESHOLDS,
    ERROR_MESSAGES,
    API_CONFIG,
  } from '../lib/constants';

  export let selected: City | null = null;
  export let clearTrigger: number = 0;
  export let country: string | null = null;

  let search = '';
  let filtered: City[] = [];
  const dispatch = createEventDispatcher<{
    select: City;
  }>();
  let dropdownOpen = false;
  let loading = false;
  let useCache = false;
  let lastSearch = '';

  $: useCache = $citiesLoaded && $cities.length > CACHE_THRESHOLDS.CITIES_CACHE_MIN;

  // Runtime validation
  if (selected !== null && !isCity(selected)) {
    logDevError('Invalid selected prop passed to CitySelector:', selected);
  }
  if (country !== null && typeof country !== 'string') {
    logDevError('Invalid country prop passed to CitySelector:', country);
  }
  if (typeof clearTrigger !== 'number') {
    logDevError('Invalid clearTrigger prop passed to CitySelector:', clearTrigger);
  }

  async function searchCities(query: string): Promise<void> {
    if (!query || query.length < VALIDATION_CONFIG.MIN_SEARCH_LENGTH) {
      filtered = [];
      return;
    }
    loading = true;
    let url = `/api/cities?q=${encodeURIComponent(query)}&maxRows=${API_CONFIG.MAX_ROWS}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      filtered = Array.isArray(data) ? data : [];
    } catch (error) {
      logDevError(ERROR_MESSAGES.GENERAL.SEARCH_FAILED, error);
      filtered = [];
    }
    loading = false;
  }

  $: if (search && search.length >= VALIDATION_CONFIG.MIN_SEARCH_LENGTH && search !== lastSearch) {
    lastSearch = search;
    if (useCache) {
      const searchLower = search.toLowerCase();
      filtered = $cities
        .filter(
          c =>
            c.name &&
            c.name.toLowerCase().startsWith(searchLower) &&
            (!country || c.countryCode === country)
        )
        .slice(0, VALIDATION_CONFIG.MAX_SEARCH_RESULTS);
    } else {
      searchCities(search);
    }
  } else if (!search || search.length < VALIDATION_CONFIG.MIN_SEARCH_LENGTH) {
    filtered = [];
    lastSearch = '';
  }

  function selectCity(city: City): void {
    const cityData: City = {
      name: city.name,
      lat: city.lat,
      lon: city.lon ?? city.lng ?? 0,
      country: city.countryCode ?? city.country ?? 'Unknown',
    };
    dispatch('select', cityData);
    search = city.name;
    dropdownOpen = false;
  }

  onMount(() => {
    if (selected) search = selected.name;
  });

  $: if (!selected) {
    search = '';
    filtered = [];
    lastSearch = '';
  }
  $: if (clearTrigger > 0) {
    search = '';
    filtered = [];
    lastSearch = '';
  }
</script>

<div class="city-selector">
  <input
    type="text"
    placeholder="Select city..."
    bind:value={search}
    on:focus={() => (dropdownOpen = true)}
    on:input={() => (dropdownOpen = true)}
    on:blur={() => setTimeout(() => (dropdownOpen = false), UI_CONFIG.DROPDOWN_DELAY)}
    disabled={!$citiesLoaded && !useCache}
    autocomplete="off"
  />
  {#if loading}
    <div>Loading cities...</div>
  {:else if dropdownOpen && filtered.length}
    <ul>
      {#each filtered as city}
        <button type="button" on:mousedown={() => selectCity(city)}
          >{city.name}
          {#if city.countryCode}<span style="color:#888;font-size:0.9em">({city.countryCode})</span
            >{/if}</button
        >
      {/each}
    </ul>
  {:else if dropdownOpen && !loading}
    <div style="background: #f0f0f0; padding: 0.5em; font-size: 0.8em;">
      No cities found for "{search}"
    </div>
  {/if}
</div>

<style>
  .city-selector {
    position: relative;
    width: 100%;
    max-width: 320px;
  }
  input {
    width: 100%;
    padding: 0.5em;
    border-radius: var(--border-radius);
    border: 1px solid #ccc;
    font-size: 1em;
  }
  ul {
    position: absolute;
    width: 100%;
    background: #fff;
    border: 1px solid #eee;
    border-radius: var(--border-radius);
    margin: 0;
    padding: 0;
    z-index: 10;
    max-height: 200px;
    overflow-y: auto;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  button {
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    list-style: none;
    padding: 0.5em;
    cursor: pointer;
    transition: background 0.2s;
    font-size: 1em;
    border-radius: var(--border-radius);
  }
  button:hover,
  button:focus {
    background: var(--secondary);
    outline: none;
  }
</style>
