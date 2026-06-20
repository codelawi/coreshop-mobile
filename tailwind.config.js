/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0A0A0A",
          50: "#F5F5F5",
          100: "#E5E5E5",
          900: "#0A0A0A",
        },
        accent: {
          DEFAULT: "#FF4D4F",
          light: "#FF7875",
          dark: "#D9363E",
        },
        bg: {
          light: "#FAFAFA",
          dark: "#0A0A0A",
          card: "#1A1A1A",
        },
      },
      fontFamily: {
        sans: ["Manrope_400Regular"],
        medium: ["Manrope_500Medium"],
        semibold: ["Manrope_600SemiBold"],
        bold: ["Manrope_700Bold"],
        arabic: ["IBMPlexSansArabic_400Regular"],
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "10px",
        md: "12px",
        lg: "16px",
      },
    },
  },
  plugins: [],
};