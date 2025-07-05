<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { errorStore, type ErrorBoundaryState } from '../lib/errorBoundary';

  export let fallback: ((error: Error, errorInfo: any) => any) | null = null;
  export let onError: (error: Error, errorInfo: any) => void = () => {};
  export let resetOnPropsChange = true;

  let hasError = false;
  let error: Error | null = null;
  let errorInfo: any = null;
  let componentStack = '';

  // Subscribe to error store
  const unsubscribe = errorStore.subscribe((state: ErrorBoundaryState) => {
    hasError = state.hasError;
    error = state.error;
    errorInfo = state.errorInfo;
    componentStack = state.componentStack || '';
  });

  function handleError(err: Error, info: any = {}) {
    hasError = true;
    error = err;
    errorInfo = info;

    // Call custom error handler
    onError(err, info);

    // Log error
    console.error('ErrorBoundary caught error:', {
      error: err.message,
      stack: err.stack,
      info,
      componentStack,
    });
  }

  function reset() {
    hasError = false;
    error = null;
    errorInfo = null;
    componentStack = '';
    errorStore.set({
      hasError: false,
      error: null,
      errorInfo: null,
      componentStack: undefined,
      timestamp: 0,
    });
  }

  function retry() {
    reset();
    window.location.reload();
  }

  onMount(() => {
    // Set up error handlers for this component
    if (typeof window !== 'undefined') {
      const originalErrorHandler = window.onerror;
      window.onerror = (message, source, lineno, colno, error) => {
        if (error) {
          handleError(error, { message, source, lineno, colno });
        }
        if (originalErrorHandler) {
          return originalErrorHandler(message, source, lineno, colno, error);
        }
        return false;
      };
    }
  });

  onDestroy(() => {
    unsubscribe();
  });
</script>

{#if hasError && error}
  <div class="error-boundary">
    <div class="error-content">
      <div class="error-icon">⚠️</div>
      <h3>Something went wrong</h3>
      <p class="error-message">{error.message}</p>
      <p class="error-type">Error Type: {error.name}</p>

      {#if errorInfo && errorInfo.component}
        <p class="error-component">Component: {errorInfo.component}</p>
      {/if}

      {#if componentStack}
        <details class="error-stack">
          <summary>Component Stack</summary>
          <pre>{componentStack}</pre>
        </details>
      {/if}

      <div class="error-actions">
        <button class="retry-button" on:click={retry}> Retry </button>
        <button class="reset-button" on:click={reset}> Reset </button>
      </div>
    </div>
  </div>
{:else}
  <slot />
{/if}

<style>
  .error-boundary {
    padding: 2rem;
    text-align: center;
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 8px;
    margin: 1rem 0;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  .error-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .error-icon {
    font-size: 3rem;
    margin-bottom: 0.5rem;
  }

  .error-message {
    color: #856404;
    margin: 0;
    font-weight: 500;
  }

  .error-type {
    font-size: 0.9rem;
    color: #666;
    margin: 0;
  }

  .error-component {
    font-size: 0.9rem;
    color: #666;
    margin: 0;
    background: #f8f9fa;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }

  .error-stack {
    width: 100%;
    max-width: 500px;
    text-align: left;
  }

  .error-stack summary {
    cursor: pointer;
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }

  .error-stack pre {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 4px;
    font-size: 0.8rem;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .error-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  .retry-button,
  .reset-button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color 0.2s;
  }

  .retry-button {
    background: #007bff;
    color: white;
  }

  .retry-button:hover {
    background: #0056b3;
  }

  .reset-button {
    background: #6c757d;
    color: white;
  }

  .reset-button:hover {
    background: #545b62;
  }
</style>
