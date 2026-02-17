/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Premium Light Theme Colors (AutomatePro Style)
        bgLight: "#F8FAFC",    // Slate 50 - Main background
        surface: "#FFFFFF",    // White - Cards/Sidebar
        textMain: "#0F172A",   // Slate 900 - Headings
        textSub: "#64748B",    // Slate 500 - Secondary text
        borderLight: "#E2E8F0", // Slate 200 - Borders
        
        // Brand Colors
        primary: "#4F46E5",    // Indigo 600 - Main Brand Color
        primaryHover: "#4338CA", // Indigo 700
        secondary: "#EC4899",  // Pink 500
        accent: "#8B5CF6",     // Violet 500

        // Status Colors (Pills)
        success: "#10B981",    // Emerald 500
        warning: "#F59E0B",    // Amber 500
        error: "#EF4444",      // Red 500
        info: "#3B82F6",       // Blue 500

        // Dark Mode Compatibility (Legacy)
        bgDark: "#0F172A", 
        cardBg: "#1E293B",
        primaryText: "#F8FAFC",
        secondaryText: "#94A3B8",
        themeBG: "#1E293B",
        themeText: "white",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Ensure Inter is used if available
      }
    },
  },
  plugins: [],
};
