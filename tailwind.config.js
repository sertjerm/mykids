/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        rainbow: {
          red: "#FFB3B3",
          orange: "#FFCCB3",
          yellow: "#FFFFB3",
          green: "#B3FFB3",
          mint: "#B3FFCC",
          cyan: "#B3FFFF",
          blue: "#B3E5FF",
          indigo: "#B3CCFF",
          purple: "#CCB3FF",
          pink: "#FFB3E6",
        },
      },
      animation: {
        "bounce-slow": "bounce 2s infinite",
        "pulse-slow": "pulse 3s infinite",
        wiggle: "wiggle 1s ease-in-out infinite",
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
      },
    },
  },
  plugins: [],
};
