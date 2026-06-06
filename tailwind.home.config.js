module.exports = {
  content: [
    "./index.html",
    "./assets/footer-settings.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"]
      },
      colors: {
        brand: {
          bg: "#FFFFFF",
          surface: "#F4F0EA",
          text: "#1B1A18",
          muted: "#6F685F",
          border: "#E6DED4",
          accent: "#D9C6B2"
        }
      },
      letterSpacing: {
        tightest: "-0.06em"
      },
      boxShadow: {
        soft: "0 30px 80px rgba(27, 26, 24, 0.08)"
      }
    }
  }
};
