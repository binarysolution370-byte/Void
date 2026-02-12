import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: {
          black: "var(--void-black)",
          white: "var(--void-white)",
          gray: "var(--void-gray)"
        }
      },
      fontFamily: {
        void: ["var(--void-font)"]
      }
    }
  },
  plugins: []
};

export default config;
