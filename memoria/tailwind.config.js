// tailwind.config.js
const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        'text': '#d4d4d4',       // Primary text color
        'sidebar-bg': '#202020',
        'main-body-bg': '#191919',
        'error-bg': '#eb5757',
        'error-text': '#ffffff', // Assuming white text on error-bg
        // Add other custom colors as needed
      },
    },
  },
  plugins: [],
}