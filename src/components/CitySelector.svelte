<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { onMount } from 'svelte';
  import { cities, citiesLoaded } from '../stores/countryCityStore';

  export let selected: { name: string; lat: number; lon: number; country: string } | null = null;
  export let country: string | null = null;
  export let clearTrigger: number = 0; // New prop to trigger clearing
  let search = '';
  let filtered: any[] = [];
  const dispatch = createEventDispatcher();
  let dropdownOpen = false;
  let loading = false;
  let useCache = false;
  let lastSearch = ''; // Track the last search to prevent infinite loops

  // Watch for cache readiness
  $: useCache = $citiesLoaded && $cities.length > 1000; // Lowered threshold for better search experience

  // On-demand search function
  async function searchCities(query: string, country: string | null) {
    if (!query || query.length < 2) {
      filtered = [];
      return;
    }
    loading = true;
    let url = `/api/cities?q=${encodeURIComponent(query)}`;
    if (country && country !== '') url += `&country=${country}`;
    url += '&maxRows=50'; // Increased from 20 to get more suggestions
    try {
      const res = await fetch(url);
      const data = await res.json();
      filtered = Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error searching cities:', error);
      filtered = [];
    }
    loading = false;
  }

  // Reactively update filtered cities
  $: if (search && search.length >= 2 && search !== lastSearch) {
    lastSearch = search;
    if (useCache) {
      // Use local cache - if no country selected, search all cities
      const searchLower = search.toLowerCase();
      filtered = $cities.filter(c =>
        (!country || c.countryCode === country) &&
        c.name && c.name.toLowerCase().startsWith(searchLower)
      ).slice(0, 20);
    } else {
      // Use API search - if no country selected, don't pass country parameter
      const searchCountry = country || null;
      searchCities(search, searchCountry);
    }
  } else if (!search || search.length < 2) {
    filtered = [];
    lastSearch = '';
  }

  function selectCity(city: any) {
    const cityData = {
      name: city.name,
      lat: city.lat,
      lon: city.lon ?? city.lng,
      country: city.countryCode ?? city.country
    };
    dispatch('select', cityData);
    search = city.name;
    dropdownOpen = false;
  }

  onMount(() => {
    if (selected) search = selected.name;
  });

  // Clear search when selected city is cleared
  $: if (!selected) {
    search = '';
    filtered = [];
    lastSearch = '';
  }

  // Clear search when clearTrigger changes
  $: if (clearTrigger > 0) {
    search = '';
    filtered = [];
    lastSearch = '';
  }


</script>

<div class="city-selector">
  <input type="text" placeholder="Select city..." bind:value={search} 
    on:focus={() => dropdownOpen = true}
    on:input={() => dropdownOpen = true}
    on:blur={() => setTimeout(() => dropdownOpen = false, 200)}
    disabled={!$citiesLoaded && !useCache}
    autocomplete="off"
  />
  {#if loading}
    <div>Loading cities...</div>
  {:else if dropdownOpen && filtered.length}
    <ul>
      {#each filtered as city}
        <button type="button" on:mousedown={() => selectCity(city)}>{city.name} {#if city.countryCode}<span style="color:#888;font-size:0.9em">({city.countryCode})</span>{/if}</button>
      {/each}
    </ul>
  {:else if dropdownOpen && !loading}
    <div style="background: #f0f0f0; padding: 0.5em; font-size: 0.8em;">No cities found for "{search}"</div>
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
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
button:hover, button:focus {
  background: var(--secondary);
  outline: none;
}
</style> 