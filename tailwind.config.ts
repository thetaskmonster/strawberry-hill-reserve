import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-film": "var(--bg-film)",
        "bg-warm": "var(--bg-warm)",
        "bg-elev": "var(--bg-elev)",
        fg: "var(--fg)",
        "fg-muted": "var(--fg-muted)",
        accent: "var(--accent)",
        "accent-strong": "var(--accent-strong)",
        line: "var(--border)",
        "line-strong": "var(--border-strong)",
        focus: "var(--focus)",
        danger: "var(--danger)",
      },
      fontFamily: {
        display: "var(--font-display)",
        sans: "var(--font-sans)",
        signature: "var(--font-signature)",
      },
      maxWidth: { measure: "var(--measure)", page: "var(--maxw)" },
      borderRadius: { sm: "var(--r-sm)", DEFAULT: "var(--r)", lg: "var(--r-lg)" },
    },
  },
  plugins: [],
} satisfies Config;
