<script>
  import '../styles/app.css';
  import { onMount } from 'svelte';
  import { initializeData } from '../lib/services/dataService';
  onMount(() => {
    initializeData();
  });
</script>

<slot /> 