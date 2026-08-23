import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Archivo", "ui-sans-serif", "system-ui", "sans-serif"],
                  sans: ["IBM Plex Sans", "ui-sans-serif", "system-ui", "sans-serif"],
                  mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
          },
                colors: {
        bg: "#F5F6F9",
                  surface: "#FFFFFF",
                  surface2: "#EEF1F6",
                  ink: "#171B24",
                  inksoft: "#4B5468",
                  inkfaint: "#8890A3",
                  border: "#DFE3EC",
                  bordersoft: "#EAEDF3",
                  accent: "#2B4C8C",
                  accentink: "#1E3564",
                  accentsoft: "#E8EDFA",
                  good: "#1F7A4D",
                  goodsoft: "#E4F5EC",
                  warn: "#B45309",
                  warnsoft: "#FEF3E2",
                  danger: "#B3261E",
                  dangersoft: "#FCE8E6",
          },
      },
    },
  plugins: [],
    };
export default config;
