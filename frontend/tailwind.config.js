// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: ["./src/**/*.{js,jsx,ts,tsx}"],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// };

module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bgDark: "#181818",
        cardBg: "#242424",
        primaryText: "#E4E4E4",
        secondaryText: "#A3A3A3",
        primaryBg: "#2a3140",
        themeBG: "#1f2633",
        themeText: "white",
      },
    },
  },
  plugins: [],
};
