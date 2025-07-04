<script lang="ts">
  import { cities } from '../lib/cities';
  import type { City } from '../lib/cities';
  import { createEventDispatcher } from 'svelte';
  import { onMount } from 'svelte';

  export let selected: City | null = null;
  export let country: string | null = null;
  let search = '';
  let filtered: City[] = [];
  const dispatch = createEventDispatcher();

  $: filtered = cities.filter(c =>
    (!country || c.country === country) &&
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  function selectCity(city: City) {
    dispatch('select', city);
    search = city.name;
  }

  onMount(() => {
    if (selected) search = selected.name;
  });
</script>

<div class="city-selector">
  <input type="text" placeholder="Select city..." bind:value={search} />
  {#if search && filtered.length}
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