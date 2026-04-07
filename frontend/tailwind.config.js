export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#050d1a",
        cyan: "#00d4ff",
        blue: "#0066ff",
        warn: "#ff6b35",
        success: "#00ff88"
      },
      fontFamily: {
        mono: ["Space Mono", "monospace"],
        syne: ["Syne", "sans-serif"]
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: "0.6" },
          "70%": { transform: "scale(1.4)", opacity: "0" },
          "100%": { transform: "scale(0.9)", opacity: "0" }
        },
        flow: {
          "0%": { strokeDashoffset: "1000" },
          "100%": { strokeDashoffset: "0" }
        },
        slideIn: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        }
      },
      animation: {
        pulseRing: "pulseRing 2s cubic-bezier(0.4,0,0.6,1) infinite",
        slideIn: "slideIn .4s ease forwards"
      }
    }
  },
  plugins: []
}
