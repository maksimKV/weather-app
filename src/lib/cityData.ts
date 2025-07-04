export type City = {
  name: string;
  lat: number;
  lng: number;
};

export const COUNTRY_CITIES: Record<string, City[]> = {
  US: [
    { name: 'New York', lat: 40.7128, lng: -74.006 },
    { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
    { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
    { name: 'Houston', lat: 29.7604, lng: -95.3698 },
    { name: 'Phoenix', lat: 33.4484, lng: -112.074 },
    { name: 'Philadelphia', lat: 39.9526, lng: -75.1652 },
    { name: 'San Antonio', lat: 29.4241, lng: -98.4936 },
    { name: 'San Diego', lat: 32.7157, lng: -117.1611 },
    { name: 'Dallas', lat: 32.7767, lng: -96.797 },
    { name: 'San Jose', lat: 37.3382, lng: -121.8863 }
  ],
  CA: [
    { name: 'Toronto', lat: 43.65107, lng: -79.347015 },
    { name: 'Montreal', lat: 45.501689, lng: -73.567256 },
    { name: 'Vancouver', lat: 49.282729, lng: -123.120738 },
    { name: 'Calgary', lat: 51.044733, lng: -114.071883 },
    { name: 'Edmonton', lat: 53.546124, lng: -113.493823 },
    { name: 'Ottawa', lat: 45.42153, lng: -75.697193 },
    { name: 'Winnipeg', lat: 49.895136, lng: -97.138374 },
    { name: 'Quebec City', lat: 46.813878, lng: -71.207981 },
    { name: 'Hamilton', lat: 43.255721, lng: -79.871102 },
    { name: 'Kitchener', lat: 43.451639, lng: -80.492533 }
  ],
  GB: [
    { name: 'London', lat: 51.5074, lng: -0.1278 },
    { name: 'Birmingham', lat: 52.4862, lng: -1.8904 },
    { name: 'Manchester', lat: 53.4808, lng: -2.2426 },
    { name: 'Glasgow', lat: 55.8642, lng: -4.2518 },
    { name: 'Liverpool', lat: 53.4084, lng: -2.9916 },
    { name: 'Bristol', lat: 51.4545, lng: -2.5879 },
    { name: 'Sheffield', lat: 53.3811, lng: -1.4701 },
    { name: 'Leeds', lat: 53.8008, lng: -1.5491 },
    { name: 'Edinburgh', lat: 55.9533, lng: -3.1883 },
    { name: 'Leicester', lat: 52.6369, lng: -1.1398 }
  ],
  DE: [
    { name: 'Berlin', lat: 52.52, lng: 13.405 },
    { name: 'Hamburg', lat: 53.5511, lng: 9.9937 },
    { name: 'Munich', lat: 48.1351, lng: 11.582 },
    { name: 'Cologne', lat: 50.9375, lng: 6.9603 },
    { name: 'Frankfurt', lat: 50.1109, lng: 8.6821 },
    { name: 'Stuttgart', lat: 48.7758, lng: 9.1829 },
    { name: 'Düsseldorf', lat: 51.2277, lng: 6.7735 },
    { name: 'Dortmund', lat: 51.5136, lng: 7.4653 },
    { name: 'Essen', lat: 51.4556, lng: 7.0116 },
    { name: 'Leipzig', lat: 51.3397, lng: 12.3731 }
  ],
  FR: [
    { name: 'Paris', lat: 48.8566, lng: 2.3522 },
    { name: 'Marseille', lat: 43.2965, lng: 5.3698 },
    { name: 'Lyon', lat: 45.764, lng: 4.8357 },
    { name: 'Toulouse', lat: 43.6047, lng: 1.4442 },
    { name: 'Nice', lat: 43.7102, lng: 7.262 },
    { name: 'Nantes', lat: 47.2184, lng: -1.5536 },
    { name: 'Strasbourg', lat: 48.5734, lng: 7.7521 },
    { name: 'Montpellier', lat: 43.6119, lng: 3.8777 },
    { name: 'Bordeaux', lat: 44.8378, lng: -0.5792 },
    { name: 'Lille', lat: 50.6292, lng: 3.0573 }
  ],
  IT: [
    { name: 'Rome', lat: 41.9028, lng: 12.4964 },
    { name: 'Milan', lat: 45.4642, lng: 9.19 },
    { name: 'Naples', lat: 40.8518, lng: 14.2681 },
    { name: 'Turin', lat: 45.0703, lng: 7.6869 },
    { name: 'Palermo', lat: 38.1157, lng: 13.3615 },
    { name: 'Genoa', lat: 44.4056, lng: 8.9463 },
    { name: 'Bologna', lat: 44.4949, lng: 11.3426 },
    { name: 'Florence', lat: 43.7696, lng: 11.2558 },
    { name: 'Bari', lat: 41.1171, lng: 16.8719 },
    { name: 'Catania', lat: 37.5079, lng: 15.083 }
  ],
  ES: [
    { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
    { name: 'Barcelona', lat: 41.3851, lng: 2.1734 },
    { name: 'Valencia', lat: 39.4699, lng: -0.3763 },
    { name: 'Seville', lat: 37.3891, lng: -5.9845 },
    { name: 'Zaragoza', lat: 41.6488, lng: -0.8891 },
    { name: 'Málaga', lat: 36.7213, lng: -4.4214 },
    { name: 'Murcia', lat: 37.9922, lng: -1.1307 },
    { name: 'Palma', lat: 39.5696, lng: 2.6502 },
    { name: 'Las Palmas', lat: 28.1235, lng: -15.4363 },
    { name: 'Bilbao', lat: 43.263, lng: -2.935 }
  ],
  JP: [
    { name: 'Tokyo', lat: 35.6895, lng: 139.6917 },
    { name: 'Yokohama', lat: 35.4437, lng: 139.638 },
    { name: 'Osaka', lat: 34.6937, lng: 135.5023 },
    { name: 'Nagoya', lat: 35.1815, lng: 136.9066 },
    { name: 'Sapporo', lat: 43.0621, lng: 141.3544 },
    { name: 'Fukuoka', lat: 33.5902, lng: 130.4017 },
    { name: 'Kobe', lat: 34.6901, lng: 135.1955 },
    { name: 'Kyoto', lat: 35.0116, lng: 135.7681 },
    { name: 'Kawasaki', lat: 35.5308, lng: 139.7036 },
    { name: 'Saitama', lat: 35.8617, lng: 139.6455 }
  ],
  AU: [
    { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
    { name: 'Melbourne', lat: -37.8136, lng: 144.9631 },
    { name: 'Brisbane', lat: -27.4698, lng: 153.0251 },
    { name: 'Perth', lat: -31.9505, lng: 115.8605 },
    { name: 'Adelaide', lat: -34.9285, lng: 138.6007 },
    { name: 'Gold Coast', lat: -28.0167, lng: 153.4 },
    { name: 'Canberra', lat: -35.2809, lng: 149.13 },
    { name: 'Newcastle', lat: -32.9283, lng: 151.7817 },
    { name: 'Wollongong', lat: -34.4278, lng: 150.8931 },
    { name: 'Logan City', lat: -27.6392, lng: 153.1094 }
  ],
  BR: [
    { name: 'São Paulo', lat: -23.5505, lng: -46.6333 },
    { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 },
    { name: 'Brasília', lat: -15.7939, lng: -47.8828 },
    { name: 'Salvador', lat: -12.9777, lng: -38.5016 },
    { name: 'Fortaleza', lat: -3.7319, lng: -38.5267 },
    { name: 'Belo Horizonte', lat: -19.9167, lng: -43.9345 },
    { name: 'Manaus', lat: -3.119, lng: -60.0217 },
    { name: 'Curitiba', lat: -25.4284, lng: -49.2733 },
    { name: 'Recife', lat: -8.0476, lng: -34.877 },
    { name: 'Porto Alegre', lat: -30.0346, lng: -51.2177 }
  ]
}; 