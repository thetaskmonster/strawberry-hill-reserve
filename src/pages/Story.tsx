import { PROCESS } from "../content/site";
import MediaPlaceholder from "../components/MediaPlaceholder";
import Token from "../components/Token";

export default function Story() {
  return (
    <article>
      <section className="relative flex min-h-[70vh] items-end overflow-hidden bg-bg-film">
        <div className="absolute inset-0"><MediaPlaceholder label="Story hero: mountains at dawn above the coffee belt (licensed stock, generic)" kind="film" ratio="auto" /></div>
        <div className="hero-scrim" />
        <div className="container-page relative z-10 pb-16 pt-28">
          <p className="eyebrow">The story</p>
          <h1 className="display mt-4 text-fg" style={{ fontSize: "var(--step-4)" }}>Most Blue Mountain<br />is a lie.</h1>
        </div>
      </section>

      <section className="container-page py-20">
        <p className="lead">Jamaica Blue Mountain is one of the most counterfeited coffees on earth. Far more is sold each year than the mountains can possibly grow. Most of what carries the name is blended, mislabeled, or simply invented. The label leans on a reputation the coffee in the bag never earned.</p>
        <p className="lead mt-6">We exist on the other side of that line. Our Jamaica Blue Mountain, sold as <span className="text-fg">Strawberry Hill Reserve</span>, comes from a single certified estate in the Blue Mountain zone, is certified by JACRA, and is roasted and sealed at origin. Every batch is traceable. Every claim on this site is one a certificate number and a reverse image search can back up.</p>
      </section>

      {PROCESS.map((p, i) => (
        <section key={p.word} className="relative flex min-h-[80vh] items-center overflow-hidden border-t border-line bg-bg-film" aria-labelledby={`beat-${i}`}>
          <div className="absolute inset-0"><MediaPlaceholder label={`${p.word}: generic coffee craft, cinematic (licensed stock)`} kind="film" ratio="auto" /></div>
          <div className="hero-scrim" />
          <div className="container-page relative z-10">
            <h2 id={`beat-${i}`} className="display text-fg" style={{ fontSize: "var(--step-kinetic)" }}>{p.word}.</h2>
            <p className="lead mt-4">{p.copy}</p>
          </div>
        </section>
      ))}

      <section className="bg-bg-warm py-20">
        <div className="container-page">
          <p className="eyebrow">What JACRA certification means</p>
          <h2 className="display mt-3 text-fg" style={{ fontSize: "var(--step-3)" }}>A number you can check.</h2>
          <p className="lead mt-4">Grown in the certified zone, processed at a licensed works, issued a certificate of origin. Ours renders live from source.</p>
          <p className="mt-6 flex flex-wrap items-center gap-2 text-fg-muted">Certificate <Token name="JACRA_CERT_NO" /> &middot; roasted <Token name="ROAST_DATE" /> &middot; lot <Token name="LOT_NO" /></p>
        </div>
      </section>
    </article>
  );
}
