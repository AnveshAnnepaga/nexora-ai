import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Shadcn UI colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        foreground: "hsl(var(--foreground))",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Nexora Theme Colors
        "outline": "#859398",
        "secondary-container": "#6800ec",
        "inverse-on-surface": "#253140",
        "on-primary-fixed-variant": "#004e5f",
        "on-error": "#690005",
        "on-tertiary-fixed-variant": "#00522c",
        "outline-variant": "#3c494e",
        "secondary-fixed-dim": "#d1bcff",
        "on-tertiary-container": "#005d32",
        "background": "#071421",
        "on-surface": "#d7e3f7",
        "on-background": "#d7e3f7",
        "tertiary-fixed": "#5bffa1",
        "on-primary-container": "#00586b",
        "on-error-container": "#ffdad6",
        "tertiary-container": "#00df81",
        "surface-dim": "#071421",
        "primary": "#a8e8ff",
        "primary-container": "#00d4ff",
        "on-tertiary-fixed": "#00210e",
        "surface": "#071421",
        "on-secondary": "#3d0090",
        "secondary-fixed": "#eaddff",
        "primary-fixed": "#b4ebff",
        "on-secondary-fixed-variant": "#5700c8",
        "on-secondary-container": "#d4c0ff",
        "on-primary": "#003642",
        "surface-container-high": "#1f2b39",
        "surface-container": "#14202e",
        "inverse-surface": "#d7e3f7",
        "surface-variant": "#2a3644",
        "on-tertiary": "#00391d",
        "error-container": "#93000a",
        "inverse-primary": "#00677e",
        "error": "#ffb4ab",
        "tertiary-fixed-dim": "#00e383",
        "surface-container-low": "#101c2a",
        "on-primary-fixed": "#001f27",
        "surface-container-lowest": "#030f1c",
        "surface-bright": "#2e3a49",
        "surface-container-highest": "#2a3644",
        "primary-fixed-dim": "#3cd7ff",
        "on-secondary-fixed": "#24005b",
        "tertiary": "#00ff94",
        "on-surface-variant": "#bbc9cf",
        "surface-tint": "#3cd7ff",
        "secondary": "#d1bcff"
      },
      spacing: {
        "margin-mobile": "16px",
        "unit": "4px",
        "xs": "4px",
        "lg": "24px",
        "margin-desktop": "48px",
        "sm": "8px",
        "gutter": "24px",
        "md": "16px",
        "xl": "40px",
        "2xl": "64px"
      },
      fontFamily: {
        "display-xl": ["Orbitron", "sans-serif"],
        "label-caps": ["JetBrains Mono", "monospace"],
        "headline-lg": ["Space Grotesk", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "headline-lg-mobile": ["Orbitron", "sans-serif"],
        "data-mono": ["JetBrains Mono", "monospace"],
        "body-sm": ["Inter", "sans-serif"],
        "display-lg": ["Orbitron", "sans-serif"],
        "body-md": ["Inter", "sans-serif"]
      },
      borderRadius: {
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem"
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography")
  ],
} satisfies Config

export default config
