export interface City {
  name: string;
  lat: number;
  lon: number;
  country: string;
}

export const cities: City[] = [
  // United States
  { name: 'New York', lat: 40.7128, lon: -74.006, country: 'US' },
  { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, country: 'US' },
  { name: 'Chicago', lat: 41.8781, lon: -87.6298, country: 'US' },
  { name: 'Houston', lat: 29.7604, lon: -95.3698, country: 'US' },
  { name: 'Phoenix', lat: 33.4484, lon: -112.074, country: 'US' },
  // Canada
  { name: 'Toronto', lat: 43.65107, lon: -79.347015, country: 'CA' },
  { name: 'Montreal', lat: 45.5017, lon: -73.5673, country: 'CA' },
  { name: 'Vancouver', lat: 49.2827, lon: -123.1207, country: 'CA' },
  { name: 'Calgary', lat: 51.0447, lon: -114.0719, country: 'CA' },
  { name: 'Edmonton', lat: 53.5461, lon: -113.4938, country: 'CA' },
  // United Kingdom
  { name: 'London', lat: 51.5074, lon: -0.1278, country: 'GB' },
  { name: 'Birmingham', lat: 52.4862, lon: -1.8904, country: 'GB' },
  { name: 'Manchester', lat: 53.4808, lon: -2.2426, country: 'GB' },
  { name: 'Glasgow', lat: 55.8642, lon: -4.2518, country: 'GB' },
  { name: 'Liverpool', lat: 53.4084, lon: -2.9916, country: 'GB' },
  // Germany
  { name: 'Berlin', lat: 52.52, lon: 13.405, country: 'DE' },
  { name: 'Hamburg', lat: 53.5511, lon: 9.9937, country: 'DE' },
  { name: 'Munich', lat: 48.1351, lon: 11.582, country: 'DE' },
  { name: 'Cologne', lat: 50.9375, lon: 6.9603, country: 'DE' },
  { name: 'Frankfurt', lat: 50.1109, lon: 8.6821, country: 'DE' },
  // France
  { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'FR' },
  { name: 'Marseille', lat: 43.2965, lon: 5.3698, country: 'FR' },
  { name: 'Lyon', lat: 45.764, lon: 4.8357, country: 'FR' },
  { name: 'Toulouse', lat: 43.6047, lon: 1.4442, country: 'FR' },
  { name: 'Nice', lat: 43.7102, lon: 7.262, country: 'FR' },
  // Italy
  { name: 'Rome', lat: 41.9028, lon: 12.4964, country: 'IT' },
  { name: 'Milan', lat: 45.4642, lon: 9.19, country: 'IT' },
  { name: 'Naples', lat: 40.8518, lon: 14.2681, country: 'IT' },
  { name: 'Turin', lat: 45.0703, lon: 7.6869, country: 'IT' },
  { name: 'Palermo', lat: 38.1157, lon: 13.3615, country: 'IT' },
  // Spain
  { name: 'Madrid', lat: 40.4168, lon: -3.7038, country: 'ES' },
  { name: 'Barcelona', lat: 41.3851, lon: 2.1734, country: 'ES' },
  { name: 'Valencia', lat: 39.4699, lon: -0.3763, country: 'ES' },
  { name: 'Seville', lat: 37.3891, lon: -5.9845, country: 'ES' },
  { name: 'Zaragoza', lat: 41.6488, lon: -0.8891, country: 'ES' },
  // Japan
  { name: 'Tokyo', lat: 35.6895, lon: 139.6917, country: 'JP' },
  { name: 'Yokohama', lat: 35.4437, lon: 139.638, country: 'JP' },
  { name: 'Osaka', lat: 34.6937, lon: 135.5023, country: 'JP' },
  { name: 'Nagoya', lat: 35.1815, lon: 136.9066, country: 'JP' },
  { name: 'Sapporo', lat: 43.0621, lon: 141.3544, country: 'JP' },
  // Australia
  { name: 'Sydney', lat: -33.8688, lon: 151.2093, country: 'AU' },
  { name: 'Melbourne', lat: -37.8136, lon: 144.9631, country: 'AU' },
  { name: 'Brisbane', lat: -27.4698, lon: 153.0251, country: 'AU' },
  { name: 'Perth', lat: -31.9505, lon: 115.8605, country: 'AU' },
  { name: 'Adelaide', lat: -34.9285, lon: 138.6007, country: 'AU' },
  // Brazil
  { name: 'São Paulo', lat: -23.5505, lon: -46.6333, country: 'BR' },
  { name: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729, country: 'BR' },
  { name: 'Brasília', lat: -15.7939, lon: -47.8828, country: 'BR' },
  { name: 'Salvador', lat: -12.9777, lon: -38.5016, country: 'BR' },
  { name: 'Fortaleza', lat: -3.7172, lon: -38.5431, country: 'BR' },
]; 