/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          charcoal: '#3a3a3c',
          red: '#c84f48',
          'red-dark': '#a93f39',
          'red-light': '#fbeceb',
        },
      },
    },
  },
  plugins: [],
}
