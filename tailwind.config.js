/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{svelte,js,ts,html}',
    './src/**/**/*.{svelte,js,ts,html}',
    './src/routes/**/*.{svelte,js,ts,html}',
    './src/components/**/*.{svelte,js,ts,html}',
    './src/lib/**/*.{svelte,js,ts,html}',
    './src/stores/**/*.{svelte,js,ts,html}',
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
