import { Link } from "react-router-dom";
import { BRAND, INQUIRY_EMAIL } from "../content/site";
import { SELLER } from "../content/legal";

// One address, on our own domain. No form: the gifting and wholesale pages
// carry their own, and a plain mailto is the honest shape for everything else.
export default function Contact() {
  return (
    <section className="container-page max-w-3xl py-16">
      <p className="eyebrow">Contact</p>
      <h1 className="display mt-3 text-fg" style={{ fontSize: "var(--step-4)" }}>Talk to us.</h1>
      <p className="lead mt-6">
        Orders, cancellations, returns, subscriptions, or anything about the coffee: one address reaches a person.
      </p>
      <p className="mt-8 font-sans text-fg" style={{ fontSize: "var(--step-1)" }}>
        <a href={`mailto:${INQUIRY_EMAIL}`} className="text-accent hover:text-fg">{INQUIRY_EMAIL}</a>
      </p>
      <p className="mt-6 font-sans text-fg-muted">
        Corporate gifting has its own <Link to="/gifting#inquiry" className="text-fg hover:text-accent">inquiry form</Link>, and cafes, hotels and restaurants start on the{" "}
        <Link to="/wholesale" className="text-fg hover:text-accent">wholesale page</Link>.
      </p>
      <p className="mt-10 font-sans text-sm text-fg-muted">
        {BRAND} is {SELLER}.
      </p>
    </section>
  );
}
