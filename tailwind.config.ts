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
    // Tailwind's defaults plus `nav`, listed in full so the new breakpoint sorts
    // into place rather than being appended after 2xl (which would make a `nav:`
    // rule win over an `lg:` one on the same property). `nav` is where the header
    // can actually fit its desktop row: brand 119px + links 437px + cart cluster
    // 178px = 733px of content, and the page gutter takes 4vw a side, so it needs
    // 733 / 0.92 + breathing room. At md (768px) the links collided with the
    // wordmark and the bar wrapped to two lines.
    screens: {
      sm: "640px",
      md: "768px",
      nav: "880px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
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
