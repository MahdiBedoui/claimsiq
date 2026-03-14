/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7fa',
          100: '#d6eaf3',
          200: '#a8d4e8',
          300: '#6bb5d6',
          400: '#3496c0',
          500: '#1c7293',
          600: '#065a82',
          700: '#054a6b',
          800: '#043b55',
          900: '#0a1628',
        }
      }
    }
  },
  plugins: [],
}
