/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1a3a5c', light: '#1d5fa6', dark: '#0f2238' },
        accent: { DEFAULT: '#d4a017', light: '#e8b520' },
        success: '#2e7d32',
        danger: '#b71c1c',
        warning: '#e65100',
        surface: '#f5f6f8',
        border: '#dde1e7'
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        }
      },
      animation: {
        ticker: 'ticker 20s linear infinite',
      }
    },
  },
  plugins: [],
}
