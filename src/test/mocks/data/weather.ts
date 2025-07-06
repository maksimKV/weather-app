export const mockWeatherData = {
  temperature: 20,
  weathercode: 1,
  time: '2024-01-01T12:00:00Z',
};

export const mockForecastData = {
  daily: {
    time: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05'],
    temperature_2m_max: [25, 26, 24, 27, 28],
    temperature_2m_min: [15, 16, 14, 17, 18],
    weathercode: [1, 2, 3, 1, 0],
    relative_humidity_2m_max: [80, 75, 85, 70, 65],
    relative_humidity_2m_min: [60, 55, 65, 50, 45],
    sunrise: ['07:00', '07:01', '07:02', '07:03', '07:04'],
    sunset: ['17:00', '17:01', '17:02', '17:03', '17:04'],
    uv_index_max: [3, 4, 2, 5, 6],
  },
};

export const mockWeatherWithIcon = {
  ...mockWeatherData,
  icon: '/weather-icons/mainly-clear.svg',
};

export const mockForecastWithIcons = {
  ...mockForecastData,
  icons: {
    0: '/weather-icons/clear-day.svg',
    1: '/weather-icons/mainly-clear.svg',
    2: '/weather-icons/partly-cloudy.svg',
    3: '/weather-icons/overcast.svg',
  },
};
