import { writable } from 'svelte/store';

export interface Country {
  code: string;
  name: string;
}

export interface City {
  name: string;
  lat: number;
  lon: number;
  country: string;
}

export interface AppState {
  selectedCountry: Country | null;
  selectedCity: City | null;
  weather: any;
}

function createAppStore() {
  const stored = localStorage.getItem('appState');
  const initial: AppState = stored
    ? JSON.parse(stored)
    : { selectedCountry: null, selectedCity: null, weather: null };
  const { subscribe, set, update } = writable<AppState>(initial);

  subscribe(value => {
    localStorage.setItem('appState', JSON.stringify(value));
  });

  return {
    subscribe,
    set,
    update,
    setCountry: (country: Country | null) => update(s => ({ ...s, selectedCountry: country })),
    setCity: (city: City | null) => update(s => ({ ...s, selectedCity: city })),
    setWeather: (weather: any) => update(s => ({ ...s, weather })),
  };
}

export const appStore = createAppStore();
