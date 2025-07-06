# 🌤️ Weather App

A modern, responsive weather application built with SvelteKit that provides real-time weather data and forecasts for cities around the world. Features an interactive map, location-based weather, and a clean, intuitive interface.

## 🚀 Live Demo

**[View Live Demo](https://weather-app-qm8m.onrender.com/)**

> **Note:** This app is hosted on Render's free tier. Free web services on Render spin down after 15 minutes of inactivity and may take up to a minute to start up again when you visit the site. If the app takes a while to load, please be patient while the server wakes up. This is expected behavior for free-tier deployments. [source]

## ✨ Features

- **🌍 Global Weather Data** - Access weather information for cities worldwide
- **🗺️ Interactive Map** - Visualize weather data with an interactive map interface
- **📍 Location-Based Weather** - Get weather for your current location automatically
- **📊 7-Day Forecast** - Detailed weather forecasts with temperature, humidity, and UV index
- **⚡ Real-Time Updates** - Live weather data from Open-Meteo API
- **🎨 Modern UI** - Clean, responsive design with smooth animations
- **📱 Mobile-Friendly** - Optimized for all device sizes
- **💾 Smart Caching** - Efficient data caching for better performance
- **🔄 Performance Monitoring** - Built-in performance tracking
- **🧹 Cache Management** - Easy cache clearing for troubleshooting

## 🛠️ Tech Stack

- **Frontend:** SvelteKit, TypeScript
- **Styling:** CSS with custom design system
- **Maps:** MapLibre GL JS
- **APIs:**
  - Open-Meteo (weather data)
  - GeoNames (location data)
- **Testing:** Vitest, MSW (Mock Service Worker)
- **Deployment:** Render

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/maksimKV/weather-app.git
   cd weather-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

   ```env
   VITE_GEONAMES_USERNAME=your_geonames_username
   ```

   > **Note:** You'll need to sign up for a free GeoNames account at [geonames.org](https://www.geonames.org/login) to get location data.

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
weather-app/
├── src/
│   ├── components/          # Svelte components
│   │   ├── lib/
│   │   │   ├── services/        # API services
│   │   │   ├── stores/          # Svelte stores
│   │   │   └── utils/           # Utility functions
│   │   ├── routes/              # SvelteKit routes
│   │   └── styles/              # Global styles
│   ├── static/
│   │   └── weather-icons/       # Weather icons
│   ├── src/test/                # Unit and integration tests
│   └── e2e/                     # End-to-end tests
```

## 🧪 Testing

The project includes comprehensive testing with Vitest and MSW for API mocking.

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Format code
npm run format
```

## 🔧 Key Features Explained

### 🧹 Clear Cache

The clear cache functionality allows users to reset the application's stored data. This is useful when:

- The app seems stuck or unresponsive
- Weather data appears outdated
- Map markers aren't updating correctly
- You want to start fresh

**How to use:** Click the "clear cache" link in the app or navigate to `/clear-cache` to reset all stored data.

### 📊 Performance Monitor

The built-in performance monitor tracks:

- **API Response Times** - How quickly weather data loads
- **Map Rendering Performance** - Map interaction smoothness
- **Memory Usage** - Application memory consumption
- **Cache Hit Rates** - How effectively data is being cached

This helps identify performance bottlenecks and ensures the app runs smoothly across different devices and network conditions.

## 🎨 Design System

The app uses a custom design system with:

- **Color Palette:** Blue gradients for weather themes
- **Typography:** Montserrat font family
- **Icons:** Custom SVG weather icons
- **Animations:** Smooth transitions and loading states
- **Responsive Design:** Mobile-first approach

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Weather Icons:** [Erik Flowers' Weather Icons](https://github.com/erikflowers/weather-icons) - Free SVG weather icons used throughout the application
- **Open-Meteo API:** Free weather data API
- **GeoNames:** Location and geocoding services
- **MapLibre GL JS:** Open-source mapping library

## 👨‍💻 Author

**Maksim Kanev**

- **GitHub:** [@maksimKV](https://github.com/maksimKV)
- **Live Demo:** [Weather App](https://weather-app-qm8m.onrender.com/)

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/maksimKV/weather-app/issues) page
2. Create a new issue with detailed information
3. Include your browser, operating system, and steps to reproduce

---

⭐ **Star this repository if you found it helpful!**
