import type { Config } from "tailwindcss";

// Tokens in tokens.css are full colors (#0a0a0a), not channel triplets, so a bare
// "var(--bg)" here makes Tailwind emit rgb(#0a0a0a / .85) for an opacity modifier
// like bg-bg/85 - invalid CSS, which the browser drops to fully transparent. That
// silently killed the sticky header's background. color-mix keeps the tokens as
// full colors (inline var(--bg) usages still work) while making /NN modifiers real.
// opacityValue arrives either as a literal ("0.85" for bg-bg/85) or as the CSS
// variable reference "var(--tw-bg-opacity)" for a bare bg-bg, so the percentage
// goes through calc() rather than Number() - the latter yields NaN on the var form.
const token =
  (name: string) =>
  ({ opacityValue }: { opacityValue?: string }) =>
    opacityValue === undefined
      ? `var(${name})`
      : `color-mix(in srgb, var(${name}) calc(${opacityValue} * 100%), transparent)`;

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: token("--bg"),
        "bg-film": token("--bg-film"),
        "bg-warm": token("--bg-warm"),
        "bg-elev": token("--bg-elev"),
        fg: token("--fg"),
        "fg-muted": token("--fg-muted"),
        accent: token("--accent"),
        "accent-strong": token("--accent-strong"),
        line: token("--border"),
        "line-strong": token("--border-strong"),
        focus: token("--focus"),
        danger: token("--danger"),
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
