/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'amber-warm': '#fbbf24',
        'bone': '#f8f4f0',
      },
      fontFamily: {
        'display': ['Inter', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
        'mono': ['Inter', 'monospace'],
      }
    },
  },
  plugins: [],
}
