/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'oswald': ['Oswald', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        'supernova': '#FFCE03',
        'razzmatazz': '#C80650',
        'apple': '#61B347',
      },
    },
  },
  plugins: [],
};
