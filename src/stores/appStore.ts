// Svelte stores for selected country, city, and forecast will be implemented here 

import { writable } from 'svelte/store';
import { COUNTRY_CITIES } from '../lib/cityData';

export type Country = {
  code: string;
  name: string;
};

export const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'JP', name: 'Japan' },
  { code: 'AU', name: 'Australia' },
  { code: 'BR', name: 'Brazil' }
];

const LOCAL_KEY = 'selectedCountry';

function createCountryStore() {
  let initial = COUNTRIES[0].code;
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved && COUNTRIES.some(c => c.code === saved)) initial = saved;
  }
  const { subscribe, set } = writable<string>(initial);

  return {
    subscribe,
    set: (code: string) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LOCAL_KEY, code);
      }
      set(code);
    }
  };
}

export const selectedCountry = createCountryStore(); 

const CITY_LOCAL_KEY = 'selectedCity';

function createCityStore(selectedCountryStore: typeof selectedCountry) {
  let initial = COUNTRY_CITIES[COUNTRIES[0].code][0].name;
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(CITY_LOCAL_KEY);
    if (saved) initial = saved;
  }
  const { subscribe, set, update } = writable<string>(initial);

  // Update city when country changes
  selectedCountryStore.subscribe((countryCode) => {
    const cities = COUNTRY_CITIES[countryCode];
    if (cities && cities.length > 0) {
      set(cities[0].name);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(CITY_LOCAL_KEY, cities[0].name);
      }
    }
  });

  return {
    subscribe,
    set: (city: string) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(CITY_LOCAL_KEY, city);
      }
      set(city);
    }
  };
}

export const selectedCity = createCityStore(selectedCountry); 