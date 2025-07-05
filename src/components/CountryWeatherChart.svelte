<script lang="ts">
  // @ts-ignore: HTMLCanvasElement is a global in browsers, but for linting, import it
  import type {} from 'svelte';
  import { onMount, onDestroy } from 'svelte';
  import { Chart, registerables } from 'chart.js';
  import type { City, ChartContainer } from '../lib/types';
  import { logDevError } from '../lib/utils';

  // Register all Chart.js components
  Chart.register(...registerables);

  export let cities: City[] = [];
  export let weatherData: Record<string, { temperature: number; icon: string }> = {};
  export let height: string = '300px';
  export let maxCities: number = 12;
  export let countryName: string = '';

  let chartContainer: ChartContainer;
  let chart: Chart | null = null;
  let chartId = `country-chart-${Math.random().toString(36).substr(2, 9)}`;
  let isDestroyed = false; // Track if component is being destroyed
  let pendingChartCreation: number | null = null; // Track pending chart creation
  let lastDataHash = ''; // Track data changes to prevent unnecessary updates

  // Create a hash of the current data to detect significant changes
  function createDataHash(): string {
    try {
      const citiesWithWeather = cities
        .filter(city => weatherData[city.name] && weatherData[city.name].temperature !== undefined)
        .slice(0, maxCities);

      return JSON.stringify({
        cities: citiesWithWeather.map(c => ({ name: c.name, lat: c.lat, lon: c.lon })),
        temperatures: citiesWithWeather.map(c => weatherData[c.name].temperature),
        maxCities,
        countryName,
      });
    } catch (error) {
      logDevError('Error creating data hash:', error);
      return '';
    }
  }

  // Enhanced cleanup function with error handling
  function destroyChart(): void {
    try {
      if (chart && !isDestroyed) {
        chart.destroy();
        chart = null;
        // Remove debug log to reduce console noise
        // logDevError('Chart destroyed successfully');
      }
    } catch (error) {
      logDevError('Error destroying chart:', error);
      // Force null even if destroy fails
      chart = null;
    }
  }

  // Cancel any pending chart creation
  function cancelPendingChartCreation(): void {
    if (pendingChartCreation !== null) {
      clearTimeout(pendingChartCreation);
      pendingChartCreation = null;
    }
  }

  function transformCityDataForChart() {
    try {
      // Filter cities that have weather data and limit to maxCities
      const citiesWithWeather = cities
        .filter(city => weatherData[city.name] && weatherData[city.name].temperature !== undefined)
        .slice(0, maxCities)
        .sort((a, b) => weatherData[b.name].temperature - weatherData[a.name].temperature); // Sort by temperature

      const labels = citiesWithWeather.map(city => city.name);
      const temperatures = citiesWithWeather.map(city => weatherData[city.name].temperature);

      // Color coding based on temperature
      const colors = temperatures.map(temp => {
        if (temp >= 25) return '#f44336'; // Hot - Red
        if (temp >= 15) return '#ff9800'; // Warm - Orange
        if (temp >= 5) return '#2196f3'; // Cool - Blue
        return '#3f51b5'; // Cold - Indigo
      });

      return {
        labels,
        datasets: [
          {
            label: 'Current Temperature',
            data: temperatures,
            backgroundColor: colors,
            borderColor: colors.map(color => color.replace('0.8', '1')),
            borderWidth: 2,
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: 50,
          },
        ],
      };
    } catch (error) {
      logDevError('Error transforming city data for chart:', error);
      return { labels: [], datasets: [] };
    }
  }

  function createChart(): void {
    try {
      // Cleanup guards - check if we should proceed
      if (isDestroyed || !chartContainer || cities.length === 0) {
        return;
      }

      // Destroy existing chart if it exists (reactive cleanup)
      destroyChart();

      const ctx = chartContainer.getContext('2d');
      if (!ctx) {
        logDevError('Could not get 2D context from canvas');
        return;
      }

      const chartData = transformCityDataForChart();

      // Don't create chart if no data
      if (chartData.labels.length === 0) {
        logDevError('No chart data available');
        return;
      }

      chart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: '#666',
              borderWidth: 1,
              cornerRadius: 8,
              padding: 12,
              callbacks: {
                title: function (context) {
                  return context[0].label;
                },
                label: function (context) {
                  const temperature = context.parsed.y;
                  return `Temperature: ${temperature}°C`;
                },
              },
            },
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Cities',
                font: {
                  size: 14,
                  weight: 'bold',
                },
                color: '#333',
              },
              grid: {
                display: false,
              },
              ticks: {
                maxRotation: 45,
                minRotation: 0,
                font: {
                  size: 11,
                },
              },
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Temperature (°C)',
                font: {
                  size: 14,
                  weight: 'bold',
                },
                color: '#333',
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.1)',
              },
              ticks: {
                callback: function (value) {
                  return `${value}°C`;
                },
                font: {
                  size: 11,
                },
              },
            },
          },
          elements: {
            bar: {
              borderWidth: 1,
            },
          },
          interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false,
          },
        },
      });

      // Remove debug log to reduce console noise
      // logDevError('Chart created successfully');
    } catch (error) {
      logDevError('Error creating country weather chart:', error);
      chart = null;
    }
  }

  function updateChart(): void {
    try {
      if (chart && !isDestroyed) {
        const chartData = transformCityDataForChart();
        if (chartData.labels.length > 0) {
          chart.data = chartData;
          chart.update('active');
        }
      }
    } catch (error) {
      logDevError('Error updating chart:', error);
    }
  }

  // Debounced chart creation to handle rapid changes
  function scheduleChartCreation(): void {
    cancelPendingChartCreation();

    if (isDestroyed) return;

    pendingChartCreation = setTimeout(() => {
      // Double-check if component is still alive before creating chart
      if (!isDestroyed && chartContainer) {
        createChart();
      }
      pendingChartCreation = null;
    }, 100); // 100ms debounce
  }

  onMount(() => {
    try {
      isDestroyed = false;
      // Use a shorter delay for initial mount to avoid race conditions
      pendingChartCreation = setTimeout(() => {
        if (!isDestroyed && chartContainer) {
          createChart();
        }
        pendingChartCreation = null;
      }, 50);
    } catch (error) {
      logDevError('Error in onMount:', error);
    }
  });

  onDestroy(() => {
    try {
      isDestroyed = true;
      cancelPendingChartCreation();
      destroyChart();
      // Remove the debug log to reduce console noise
      // logDevError('Component destroyed, cleanup completed');
    } catch (error) {
      logDevError('Error in onDestroy:', error);
    }
  });

  // Reactive cleanup and chart management
  $: if (!isDestroyed && cities.length > 0 && Object.keys(weatherData).length > 0) {
    const currentDataHash = createDataHash();

    // Only update if data has actually changed significantly
    if (currentDataHash !== lastDataHash) {
      lastDataHash = currentDataHash;

      if (chart) {
        // Update existing chart
        updateChart();
      } else {
        // Create new chart if none exists
        scheduleChartCreation();
      }
    }
  }

  // Handle component updates more safely - remove duplicate reactive statement
  // The above reactive statement handles all cases
</script>

<div class="country-weather-chart" style="height: {height};">
  <div class="chart-header">
    <h3>City Temperature Comparison</h3>
    <p class="chart-subtitle">
      Current temperatures across major cities in {countryName || 'selected country'}
    </p>
  </div>

  {#if cities.length > 0 && Object.keys(weatherData).length > 0}
    <div class="chart-container">
      <canvas bind:this={chartContainer} id={chartId}></canvas>
    </div>

    <div class="chart-legend">
      <div class="legend-item">
        <span class="legend-color hot"></span>
        <span>Hot (≥25°C)</span>
      </div>
      <div class="legend-item">
        <span class="legend-color warm"></span>
        <span>Warm (15-24°C)</span>
      </div>
      <div class="legend-item">
        <span class="legend-color cool"></span>
        <span>Cool (5-14°C)</span>
      </div>
      <div class="legend-item">
        <span class="legend-color cold"></span>
        <span>Cold (&lt;5°C)</span>
      </div>
    </div>
  {:else}
    <div class="no-data">
      <p>No weather data available for cities in this country.</p>
      <p>Try selecting a different country or wait for data to load.</p>
    </div>
  {/if}
</div>

<style>
  .country-weather-chart {
    width: 100%;
    max-width: 900px;
    margin: 1em auto;
    background: white;
    border-radius: 8px;
    padding: 1.5em;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    position: relative;
  }

  .chart-header {
    text-align: center;
    margin-bottom: 1.5em;
  }

  h3 {
    margin: 0 0 0.5em 0;
    color: #2563eb;
    font-size: 1.3em;
    font-weight: 600;
  }

  .chart-subtitle {
    margin: 0;
    color: #666;
    font-size: 0.9em;
  }

  .chart-container {
    position: relative;
    width: 100%;
    height: calc(100% - 120px);
    margin-bottom: 1em;
  }

  canvas {
    width: 100% !important;
    height: 100% !important;
  }

  .chart-legend {
    display: flex;
    justify-content: center;
    gap: 1.5em;
    flex-wrap: wrap;
    margin-top: 1em;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5em;
    font-size: 0.85em;
    color: #555;
  }

  .legend-color {
    width: 16px;
    height: 16px;
    border-radius: 3px;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }

  .legend-color.hot {
    background-color: #f44336;
  }

  .legend-color.warm {
    background-color: #ff9800;
  }

  .legend-color.cool {
    background-color: #2196f3;
  }

  .legend-color.cold {
    background-color: #3f51b5;
  }

  .no-data {
    text-align: center;
    padding: 2em;
    color: #666;
  }

  .no-data p {
    margin: 0.5em 0;
  }

  @media (max-width: 768px) {
    .country-weather-chart {
      padding: 1em;
      margin: 0.5em auto;
    }

    h3 {
      font-size: 1.1em;
    }

    .chart-legend {
      gap: 1em;
    }

    .legend-item {
      font-size: 0.8em;
    }
  }

  @media (max-width: 480px) {
    .chart-legend {
      flex-direction: column;
      align-items: center;
      gap: 0.5em;
    }
  }

  @media (max-width: 600px) {
    .chart-legend {
      flex-direction: row;
    }
    .country-weather-chart {
      padding-bottom: 2.7em;
    }
  }
</style>
