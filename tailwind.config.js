/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'kps': {
          brown: '#351C15',      // UPS Dark Brown
          'brown-light': '#4E3027', // Lighter Brown
          'brown-dark': '#24120D',  // Extra Dark Brown
          gold: '#FFC72C',       // UPS Gold
          'gold-light': '#FFE082', // Lighter Gold
          'gold-dark': '#DDA300',  // Darker Gold
        }
      }
    },
  },
  plugins: [],
}
