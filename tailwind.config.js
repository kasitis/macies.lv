/** @type {import('tailwindcss').Config} */
export default {
  // This line is essential for the dark mode theme you want
  darkMode: 'class',

  // This tells Tailwind to scan these files for class names
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // This scans all your React component files
  ],

  theme: {
    extend: {},
  },
  plugins: [],
}