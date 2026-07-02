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
        darkBg: '#0f172a', // Slate-900
        cardBg: 'rgba(30, 41, 59, 0.7)', // Glass Slate-800
        borderBg: 'rgba(255, 255, 255, 0.08)',
        neonBlue: '#38bdf8', // Sky-400
        neonPurple: '#a855f7', // Purple-500
        neonPink: '#ec4899', // Pink-500
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-hover': '0 8px 32px 0 rgba(56, 189, 248, 0.2)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
