<script lang="ts">
  import { onMount } from 'svelte';
  import { actions } from '../../stores';
  import { logDevError } from '../../lib/utils';

  let isClearing = true;
  let error = false;

  onMount(async () => {
    try {
      actions.clearAllStorage();
      actions.resetApp();

      await new Promise(resolve => setTimeout(resolve, 500));

      window.location.href = '/';
    } catch (err) {
      logDevError('Error clearing cache:', err);
      error = true;
      isClearing = false;
    }
  });
</script>

<svelte:head>
  <title>Clearing Cache - Weather App</title>
</svelte:head>

<main class="cache-clearing">
  {#if isClearing}
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <h1>Clearing Cache...</h1>
      <p>Please wait while we clear all cached data and reset the app.</p>
    </div>
  {:else if error}
    <div class="error-container">
      <h1>⚠️ Error Clearing Cache</h1>
      <p>There was an error clearing the cache. Please try again or use browser developer tools.</p>
      <div class="actions">
        <button on:click={() => window.location.reload()}>Try Again</button>
        <button on:click={() => (window.location.href = '/')}>Go to Main App</button>
      </div>
    </div>
  {/if}
</main>
