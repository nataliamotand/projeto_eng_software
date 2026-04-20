/** @type {import('tailwindcss').Config} */
module.exports = {
  // Adicionamos o ./src para ele ler seus componentes de UI
  content: [
    "./app/**/*.{js,jsx,ts,tsx}", 
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}" 
  ],
  theme: {
    extend: {},
  },
  // O SEGREDO ESTÁ AQUI:
  presets: [require("nativewind/preset")],
  plugins: [],
}