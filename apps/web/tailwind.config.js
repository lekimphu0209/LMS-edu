import preset from '@educonnect/config/tailwind/preset';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  presets: [preset],
  plugins: [],
};
