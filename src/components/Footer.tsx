import { Link } from "react-router-dom";
import { BRAND } from "../content/site";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-bg-film">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="font-display text-fg" style={{ letterSpacing: "0.16em", fontSize: "1.1rem" }}>{BRAND}</p>
          <p className="lead mt-3" style={{ fontSize: "var(--step-0)" }}>High-grown, honestly sourced. Home of Strawberry Hill Reserve.</p>
        </div>
        <nav aria-label="Shop"><h2 className="eyebrow">Shop</h2>
          <ul className="mt-3 space-y-2 text-fg-muted">
            <li><Link to="/reserve" className="hover:text-fg">Reserve drop</Link></li>
            <li><Link to="/#origins" className="hover:text-fg">Origins</Link></li>
          </ul>
        </nav>
        <nav aria-label="Company"><h2 className="eyebrow">Company</h2>
          <ul className="mt-3 space-y-2 text-fg-muted">
            <li><Link to="/story" className="hover:text-fg">Story</Link></li>
            <li><Link to="/gifting" className="hover:text-fg">Corporate gifting</Link></li>
            <li><Link to="/wholesale" className="hover:text-fg">Wholesale</Link></li>
          </ul>
        </nav>
        <nav aria-label="Help"><h2 className="eyebrow">Help</h2>
          <ul className="mt-3 space-y-2 text-fg-muted">
            <li><Link to="/faq" className="hover:text-fg">FAQ</Link></li>
          </ul>
        </nav>
      </div>
      <div className="container-page border-t border-line py-6">
        <p className="font-sans text-sm text-fg-muted">{BRAND}. Photography is representative; named-estate and packaged-product shots are labeled placeholders until supplied. Certification and batch data render from source. &copy; 2026.</p>
      </div>
    </footer>
  );
}
