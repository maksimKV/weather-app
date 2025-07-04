<script>
  import '../styles/app.css';
  import { onMount } from 'svelte';
  import { fetchAndCacheCountriesCities } from '../stores/countryCityStore';
  onMount(() => {
    fetchAndCacheCountriesCities();
  });
</script>

<slot /> 