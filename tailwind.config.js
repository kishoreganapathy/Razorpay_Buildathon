/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        razorpay: {
          blue: "#0066FF",
          lightBlue: "#3395FF",
          sky: "#00C2FF",
          darkNavy: "#02042B",
          navy: "#06152B",
          card: "#0A192F",
          cardHover: "#0E2445",
          border: "#1E3A8A",
          borderLight: "rgba(51, 149, 255, 0.2)",
          textMuted: "#94A3B8",
        },
      },
      backgroundImage: {
        "razorpay-gradient": "linear-gradient(135deg, #0066FF 0%, #00C2FF 100%)",
        "razorpay-dark-gradient": "linear-gradient(180deg, #02042B 0%, #06152B 100%)",
        "card-gradient": "linear-gradient(145deg, rgba(10, 25, 47, 0.9) 0%, rgba(6, 21, 43, 0.9) 100%)",
      },
      boxShadow: {
        "razorpay-glow": "0 0 25px rgba(0, 102, 255, 0.25)",
        "razorpay-card": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
      },
    },
  },
  plugins: [],
};

