<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { onMount } from 'svelte';
  import { cities, citiesLoaded } from '../stores/countryCityStore';

  export let selected: { name: string; lat: number; lon: number; country: string } | null = null;
  export let country: string | null = null;
  let search = '';
  let filtered: { name: string; lat: number; lon: number; country: string }[] = [];
  const dispatch = createEventDispatcher();
  let dropdownOpen = false;

  $: filtered = $cities.filter(c =>
    (!country || c.countryCode === country) &&
    c.name && c.name.toLowerCase().includes(search.toLowerCase())
  );

  function selectCity(city: any) {
    dispatch('select', { 
      name: city.name, 
      lat: city.lat, 
      lon: city.lon, 
      country: city.countryCode 
    });
    search = city.name;
    dropdownOpen = false;
  }

  onMount(() => {
    if (selected) search = selected.name;
  });
</script>

<div class="city-selector">
  <input type="text" placeholder="Select city..." bind:value={search} 
    on:focus={() => dropdownOpen = true}
    on:input={() => dropdownOpen = true}
    on:blur={() => setTimeout(() => dropdownOpen = false, 100)}
    disabled={!$citiesLoaded}
  />
  {#if !$citiesLoaded}
    <div>Loading cities...</div>
  {:else if dropdownOpen}
    <ul>
      {#each filtered as city}
        <button type="button" on:click={() => selectCity(city)}>{city.name}</button>
      {/each}
    </ul>
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