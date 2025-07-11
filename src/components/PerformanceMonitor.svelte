<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { getCacheStats } from '../lib/services/weatherService';
  import { getDataCacheStats } from '../lib/services/dataService';
  import { actions } from '../stores';
  import type { CacheStats, DataCacheStats } from '../lib/types';
  import { logDevError } from '../lib/utils';

  let weatherStats: CacheStats = {
    size: 0,
    entries: 0,
    memoizationStats: {},
    requestStats: { queueLength: 0, running: 0, cachedRequests: 0 },
  };
  let dataStats: DataCacheStats = {
    countries: 0,
    cities: 0,
    search: 0,
    requestStats: { queueLength: 0, running: 0, cachedRequests: 0 },
  };
  let isVisible = false;
  let updateInterval: number;

  function updateStats() {
    try {
      weatherStats = getCacheStats();
      dataStats = getDataCacheStats();
    } catch (error) {
      logDevError('Error updating performance stats:', error);
    }
  }

  function toggleVisibility() {
    isVisible = !isVisible;
  }

  function clearAllCache() {
    try {
      actions.clearAllStorage();
      actions.resetApp();
      updateStats();
      console.log('All cache cleared successfully');

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      logDevError('Error clearing cache:', error);
    }
  }

  onMount(() => {
    updateStats();
    updateInterval = setInterval(updateStats, 5000); // Update every 5 seconds
  });

  onDestroy(() => {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
  });
</script>

<div class="performance-monitor">
  <button class="toggle-btn" on:click={toggleVisibility}>
    {isVisible ? 'Hide' : 'Show'} Performance Stats
  </button>

  {#if isVisible}
    <div class="stats-container">
      <div class="stats-section">
        <h4>Weather Service</h4>
        <div class="stat-row">
          <span>Cache Size:</span>
          <span>{weatherStats.size || 0}</span>
        </div>
        <div class="stat-row">
          <span>Cache Entries:</span>
          <span>{weatherStats.entries || 0}</span>
        </div>
        <div class="stat-row">
          <span>Weather Memo:</span>
          <span>{weatherStats.memoizationStats?.weather || 0}</span>
        </div>
        <div class="stat-row">
          <span>Forecast Memo:</span>
          <span>{weatherStats.memoizationStats?.forecast || 0}</span>
        </div>
        <div class="stat-row">
          <span>Queue Length:</span>
          <span>{weatherStats.requestStats?.queueLength || 0}</span>
        </div>
        <div class="stat-row">
          <span>Running Requests:</span>
          <span>{weatherStats.requestStats?.running || 0}</span>
        </div>
      </div>

      <div class="stats-section">
        <h4>Data Service</h4>
        <div class="stat-row">
          <span>Countries Cache:</span>
          <span>{dataStats.countries || 0}</span>
        </div>
        <div class="stat-row">
          <span>Cities Cache:</span>
          <span>{dataStats.cities || 0}</span>
        </div>
        <div class="stat-row">
          <span>Search Cache:</span>
          <span>{dataStats.search || 0}</span>
        </div>
        <div class="stat-row">
          <span>Queue Length:</span>
          <span>{dataStats.requestStats?.queueLength || 0}</span>
        </div>
        <div class="stat-row">
          <span>Running Requests:</span>
          <span>{dataStats.requestStats?.running || 0}</span>
        </div>
      </div>

      <div class="cache-controls">
        <button class="clear-cache-btn" on:click={clearAllCache}> Clear All Cache </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .performance-monitor {
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 10px;
    font-size: 0.8em;
    max-width: 300px;
  }

  .toggle-btn {
    background: var(--primary);
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8em;
    margin-bottom: 10px;
  }

  .stats-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .stats-section {
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 8px;
  }

  .stats-section h4 {
    margin: 0 0 8px 0;
    font-size: 0.9em;
    color: var(--primary);
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    margin: 2px 0;
    font-size: 0.8em;
  }

  .stat-row span:first-child {
    color: #666;
  }

  .stat-row span:last-child {
    font-weight: 600;
    color: var(--primary);
  }

  .cache-controls {
    display: flex;
    justify-content: center;
    margin-top: 10px;
  }

  .clear-cache-btn {
    background: var(--primary);
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8em;
  }

  @media (max-width: 767px) {
    .performance-monitor {
      display: none !important;
    }
  }
</style>
