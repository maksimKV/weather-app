<script>
  import '../styles/app.css';
  import { onMount } from 'svelte';
  import { initializeData } from '../lib/services/dataService';
  import { setupGlobalErrorHandlers } from '../lib/errorBoundary';
  import ErrorBoundary from '../components/ErrorBoundary.svelte';
  
  onMount(() => {
    // Setup global error handlers
    setupGlobalErrorHandlers();
    
    // Initialize data with error handling
    initializeData().catch(error => {
      console.error('Failed to initialize app data:', error);
    });
  });
</script>

<ErrorBoundary>
  <slot />
</ErrorBoundary> 