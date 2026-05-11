import type { Config } from "tailwindcss";
import { nextui } from "@nextui-org/react";
import typography from "@tailwindcss/typography";

type ThemeGetter = (path: string, defaultValue?: any) => string | number | undefined;

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        jsyellow: "#FCAE1E",
        jsblack: "#1C1C1C",
      },
      boxShadow: {
        jsshadow: "0px 18px 18px rgba(140, 140, 140, 0.09)",
      },
      dropShadow: {
        jsshadow: ["0 18px 18px rgba(140, 140, 140, 0.09)"],
      },

      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "1.5rem",
          md: "2rem",
          lg: "2.5rem",
          xl: "3rem",
          "2xl": "4rem",
          "3xl": "6rem",
          "4xl": "8rem",
        },
        screens: {
          sm: "100%",
          md: "100%",
          lg: "1240px",
          xl: "1440px",
          "2xl": "1720px",  
          "3xl": "2100px",   
          "4xl": "2560px",   
          "5xl": "3200px",
          '6xl':'3840px'
        },
      },

      maxWidth: {
        "3xl": "1920px",
        "4xl": "2560px",
        "5xl": "3200px",
      },

      typography: (theme: ThemeGetter) => ({
        DEFAULT: {
          css: {
            fontSize: theme("fontSize.base"),
            "@screen xl": {
              fontSize: theme("fontSize.lg"),
            },
            "@screen 2xl": {
              fontSize: theme("fontSize.xl"),
            },
            "@screen 4xl": {
              fontSize: theme("fontSize.2xl"),
            },
          },
        },
        /** Bloq / xəbər / tədbir mətni: admin editor ilə yaxın, artıq boşluq yox (prose-DEFAULT bura tətbiq olunmur) */
        "post-article": {
          css: {
            maxWidth: "none",
            color: "#4b5563",
            fontSize: "1rem",
            lineHeight: "1.7",
            p: { marginTop: "0.45em", marginBottom: "0.45em" },
            a: { color: theme("colors.jsyellow") },
            h1: {
              color: theme("colors.jsblack"),
              fontWeight: "700",
              fontSize: "1.5rem",
              lineHeight: 1.25,
              marginTop: "0",
              marginBottom: "0.5em",
            },
            h2: {
              color: theme("colors.jsblack"),
              fontWeight: "600",
              fontSize: "1.25rem",
              lineHeight: 1.3,
              marginTop: "1.1em",
              marginBottom: "0.45em",
            },
            h3: {
              color: theme("colors.jsblack"),
              fontWeight: "600",
              fontSize: "1.1rem",
              lineHeight: 1.35,
              marginTop: "0.95em",
              marginBottom: "0.4em",
            },
            h4: {
              color: theme("colors.jsblack"),
              fontWeight: "600",
              fontSize: "1.05rem",
              marginTop: "0.85em",
              marginBottom: "0.35em",
            },
            ul: { marginTop: "0.45em", marginBottom: "0.45em" },
            ol: { marginTop: "0.45em", marginBottom: "0.45em" },
            li: { marginTop: "0.2em", marginBottom: "0.2em" },
            "ul > li, ol > li": { paddingInlineStart: "0.35em" },
            blockquote: { marginTop: "0.65em", marginBottom: "0.65em" },
            "blockquote p": { marginTop: "0.25em", marginBottom: "0.25em" },
            img: { marginTop: "0.65em", marginBottom: "0.65em" },
            figure: { marginTop: "0.75em", marginBottom: "0.75em" },
          },
        },
      }),

      animation: {
        "fade-up": "fadeUp 0.5s ease-out forwards",
        fadeIn: "fadeIn 0.5s ease-out forwards",
        "pulse-glow": "pulseGlow 5s ease-in-out infinite",
        "pulse-glow-delayed": "pulseGlow 5s ease-in-out 1s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(1rem)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.4" },
          "50%": { transform: "scale(1.4)", opacity: "0.2" },
        },
      },
      scale: {
        "102": "1.02",
      },
    },
  },
  darkMode: "class",
  plugins: [nextui(), typography()],
};

export default config;
