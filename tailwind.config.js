/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/renderer/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#16A34A',
        background: '#F8F7F4',
        card: '#ffffff',
        border: '#e5e5e0',
        input: '#f3f2ef',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
