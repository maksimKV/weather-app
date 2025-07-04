<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { countries, countriesLoaded } from '../stores';
  import type { Country, CountrySelectEvent } from '../lib/types';

  export let selected: Country | null = null;
  
  let search = '';
  let filtered: Country[] = [];
  const dispatch = createEventDispatcher<{
    select: Country;
  }>();
  let dropdownOpen = false;

  $: filtered = $countries.filter(c => c.countryName && c.countryName.toLowerCase().startsWith(search.toLowerCase()));

  function selectCountry(country: Country): void {
    dispatch('select', country);
    search = country.countryName;
    dropdownOpen = false;
  }

  onMount(() => {
    if (selected) search = selected.countryName;
  });

  $: if (selected === null) {
    search = '';
  }
</script>

<div class="country-selector">
  <input type="text" placeholder="Select country..." bind:value={search} 
    on:focus={() => dropdownOpen = true}
    on:input={() => dropdownOpen = true}
    on:blur={() => setTimeout(() => dropdownOpen = false, 200)}
    disabled={!$countriesLoaded}
  />
  {#if !$countriesLoaded}
    <div>Loading countries...</div>
  {:else if dropdownOpen}
    <ul>
      {#each filtered as country}
        <button type="button" on:mousedown={() => selectCountry(country)}>{country.countryName}</button>
      {/each}
    </ul>
  {/if}
</div>

<style>
.country-selector {
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