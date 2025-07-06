import { http, HttpResponse } from 'msw';
import { mockWeatherData, mockForecastData } from './data/weather';
import { mockCities } from './data/cities';
import { mockCountries } from './data/countries';
import { setupServer } from 'msw/node';

export const handlers = [
  // Weather API
  http.get('https://api.open-meteo.com/v1/forecast', ({ request }) => {
    const url = new URL(request.url);
    const currentWeather = url.searchParams.get('current_weather');

    if (currentWeather === 'true') {
      return HttpResponse.json({ current_weather: mockWeatherData });
    }

    return HttpResponse.json(mockForecastData);
  }),

  // Location API
  http.get('/api/location', () => {
    return HttpResponse.json({
      latitude: 51.5074,
      longitude: -0.1278,
      city: 'London',
      country_name: 'United Kingdom',
      country_code: 'GB',
    });
  }),

  // Countries API
  http.get('/api/countries', () => {
    return HttpResponse.json(mockCountries);
  }),

  // Cities API
  http.get('/api/cities', ({ request }) => {
    const url = new URL(request.url);
    const countryCode = url.searchParams.get('countryCode');
    const search = url.searchParams.get('search');

    if (search) {
      const filteredCities = mockCities.filter(city =>
        city.name.toLowerCase().includes(search.toLowerCase())
      );
      return HttpResponse.json(filteredCities.slice(0, 20));
    }

    if (countryCode) {
      const countryCities = mockCities.filter(city => city.country === countryCode);
      return HttpResponse.json(countryCities);
    }

    return HttpResponse.json(mockCities);
  }),
];

export const server = setupServer(...handlers);
