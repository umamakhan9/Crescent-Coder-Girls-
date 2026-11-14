/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nasa: {
          blue: '#0B3D91',
          red: '#FC3D21',
          dark: '#0B0F19',
          card: '#111827',
          border: '#1F2937'
        }
      }
    },
  },
  plugins: [],
}
