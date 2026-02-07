/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // <--- Ativa o Dark Mode manual
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // <--- Manda o Tailwind olhar dentro da pasta src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}