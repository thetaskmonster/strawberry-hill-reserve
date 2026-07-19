import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="container-page grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <p className="eyebrow">Off the trail</p>
        <h1 className="display mt-3 text-fg" style={{ fontSize: "var(--step-kinetic)" }}>404</h1>
        <p className="lead mx-auto mt-4">This page went the way of a sold-out drop. Let&rsquo;s get you back to the coffee.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/" className="rounded bg-accent px-6 py-3 font-sans text-bg-film">Back home</Link>
          <Link to="/reserve" className="rounded border border-line-strong px-6 py-3 font-sans text-fg">See the drop</Link>
        </div>
      </div>
    </section>
  );
}
