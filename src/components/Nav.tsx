import { useState } from "react";
import { Link } from "react-router-dom";
import { BRAND, NAV } from "../content/site";

function RidgelineMark() {
  return (
    <svg viewBox="0 0 32 20" width="30" height="19" fill="none" aria-hidden="true">
      <path d="M2 18L9 7l4 5.5L20 3l10 15" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M7 18l5-6.5 3 4 5.5-6.5 5.5 9" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" strokeLinecap="round" opacity=".45" />
    </svg>
  );
}

export default function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/85 backdrop-blur">
      <div className="container-page flex items-center justify-between py-4">
        <Link to="/" className="flex items-center gap-3 text-accent" aria-label={`${BRAND} home`}>
          <RidgelineMark />
          <span className="font-display text-fg" style={{ letterSpacing: "0.18em", fontSize: "1.1rem" }}>{BRAND}</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV.map((n) => (
            <Link key={n.label} to={n.to} className="font-sans text-fg-muted transition-colors hover:text-fg">{n.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/reserve" className="hidden rounded bg-accent px-4 py-2 font-sans text-sm text-bg-film md:inline-block">Shop the drop</Link>
          <button
            className="md:hidden rounded border border-line p-2 text-fg"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-line md:hidden" aria-label="Primary mobile">
          <ul className="container-page flex flex-col py-2">
            {NAV.map((n) => (
              <li key={n.label}><Link to={n.to} className="block py-3 font-sans text-fg" onClick={() => setOpen(false)}>{n.label}</Link></li>
            ))}
            <li><Link to="/reserve" className="block py-3 font-sans text-accent" onClick={() => setOpen(false)}>Shop the drop</Link></li>
          </ul>
        </nav>
      )}
    </header>
  );
}
