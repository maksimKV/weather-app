<script lang="ts">
import { COUNTRIES, selectedCountry } from '../stores/appStore';
import { fly } from 'svelte/transition';
import { get } from 'svelte/store';

let current = get(selectedCountry);

function handleChange(e: Event) {
  const code = (e.target as HTMLSelectElement).value;
  selectedCountry.set(code);
  current = code;
}
</script>

<div class="w-full max-w-xs mx-auto" transition:fly={{ y: -20, duration: 400 }}>
  <label for="country" class="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">Country</label>
  <select
    id="country"
    class="block w-full rounded border-gray-300 dark:bg-gray-800 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
    bind:value={current}
    on:change={handleChange}
  >
    {#each COUNTRIES as country}
      <option value={country.code}>{country.name}</option>
    {/each}
  </select>
</div>

<!-- Country dropdown UI will go here --> 