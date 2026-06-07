/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { 50: '#e6f7fb', 100: '#b3e8f2', 200: '#80d9e9', 300: '#4dcae0', 400: '#1abbd7', 500: '#00A1D6', 600: '#0091c0', 700: '#0081aa', 800: '#007194', 900: '#005168' },
        drama: { bg: '#18191C', card: '#212224', surface: '#2C2E31', border: '#2E3034', text: '#E3E5E7', muted: '#9499A0' },
        accent: { 400: '#FB7299', 500: '#FB7299', 600: '#e5627f' }
      }
    },
  },
  plugins: [],
}
