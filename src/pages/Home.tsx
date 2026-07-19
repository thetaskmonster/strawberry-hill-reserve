import { Link } from "react-router-dom";
import { HERO_LINE, PROCESS, ORIGINS, CLIPS } from "../content/site";
import Marquee from "../components/Marquee";
import MediaPlaceholder from "../components/MediaPlaceholder";
import CinematicVideo from "../components/CinematicVideo";
import KineticHeadline from "../components/KineticHeadline";
import Reveal from "../components/Reveal";
import Token from "../components/Token";

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative flex min-h-[92vh] items-end overflow-hidden bg-bg-film">
        <CinematicVideo src={CLIPS.hero.src} poster={CLIPS.hero.poster} label="Slow drift over misted high-grown coffee craft (licensed stock, generic)" fill />
        <div className="hero-scrim" />
        <div className="container-page relative z-10 pb-16 pt-28">
          <Reveal><p className="eyebrow">Multi-origin &middot; high-grown &middot; provably real</p></Reveal>
          <KineticHeadline lines={["Proven,", "not promised."]} className="mt-4" />
          <Reveal delay={0.15}>
            <p className="lead mt-6">
              Most Blue Mountain sold isn&rsquo;t real. Ours is certified, and we can prove it. A small, honest range of
              high-grown origins, led by <span className="text-fg">{HERO_LINE}</span>, our limited Jamaica Blue Mountain drop.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/reserve" className="rounded bg-accent px-6 py-3 font-sans text-bg-film">Shop the drop</Link>
              <Link to="/story" className="rounded border border-line-strong px-6 py-3 font-sans text-fg">Why authenticity matters</Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Marquee items={["Certified Jamaica Blue Mountain", "Roasted at origin", "Genuine quarterly drops", "Traceable to the lot"]} />

      {/* PROCESS TEASER */}
      <section className="container-page py-20" aria-labelledby="process-h">
        <Reveal>
          <p className="eyebrow">Seed to cup</p>
          <h2 id="process-h" className="display mt-3 text-fg" style={{ fontSize: "var(--step-3)" }}>Four honest steps.</h2>
        </Reveal>
        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map((p, i) => (
            <li key={p.word}>
              <Reveal delay={i * 0.05}>
                <div className="overflow-hidden rounded border border-line" style={{ aspectRatio: "4 / 5" }}>
                  <CinematicVideo src={p.clip} poster={p.poster} label={`${p.word}: generic coffee craft (licensed stock)`} />
                </div>
                <h3 className="display mt-4 text-fg" style={{ fontSize: "var(--step-2)" }}><span className="text-accent">0{i + 1}</span> {p.word}.</h3>
                <p className="mt-2 font-sans text-fg-muted">{p.copy}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      {/* AUTHENTICITY / JACRA */}
      <section className="bg-bg-warm py-20" aria-labelledby="auth-h">
        <div className="container-page grid gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow">The moat</p>
            <h2 id="auth-h" className="display mt-3 text-fg" style={{ fontSize: "var(--step-3)" }}>Certified real, or it doesn&rsquo;t ship.</h2>
            <p className="lead mt-5">The market is flooded with mislabeled and blended &ldquo;Blue Mountain.&rdquo; Ours carries JACRA certification, the estate is named, and every batch is traceable. A reverse image search will never contradict a caption on this site.</p>
            <ul className="mt-6 space-y-3 text-fg-muted">
              <li className="flex flex-wrap items-center gap-2"><span className="text-accent">&#9650;</span> JACRA certificate <Token name="JACRA_CERT_NO" /></li>
              <li className="flex flex-wrap items-center gap-2"><span className="text-accent">&#9650;</span> Roasted at origin on <Token name="ROAST_DATE" />, shipped fresh</li>
              <li className="flex flex-wrap items-center gap-2"><span className="text-accent">&#9650;</span> Named estate, traceable batch, no blending</li>
            </ul>
          </Reveal>
          <Reveal delay={0.1} className="relative">
            <div className="overflow-hidden rounded border border-line" style={{ aspectRatio: "4 / 3" }}>
              <CinematicVideo src={CLIPS.atmosphere.src} poster={CLIPS.atmosphere.poster} label="Coffee craft in low light (licensed stock, generic)" />
            </div>
            <div className="mt-4 rounded border border-line bg-bg-film p-5">
              <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3">
                <span className="eyebrow">Batch</span><Token name="ROAST_DATE" />
                <span className="eyebrow">JACRA cert</span><Token name="JACRA_CERT_NO" />
              </div>
            </div>
            <div className="absolute right-4 top-4 w-20"><MediaPlaceholder label="JACRA / JBM certification mark (supply licensed asset)" kind="mark" ratio="1 / 1" /></div>
          </Reveal>
        </div>
      </section>

      {/* RESERVE DROP */}
      <section className="container-page py-20" aria-labelledby="drop-h">
        <div className="grid gap-12 lg:grid-cols-2">
          <Reveal className="relative"><MediaPlaceholder label="Strawberry Hill Reserve bag (supply real product shot)" kind="product" ratio="1 / 1" /></Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow">The hero line</p>
            <p className="font-signature text-fg" style={{ fontSize: "var(--step-3)", lineHeight: 1 }}>Strawberry Hill</p>
            <h2 id="drop-h" className="display mt-2 text-fg" style={{ fontSize: "var(--step-3)" }}>When it&rsquo;s gone, it&rsquo;s gone.</h2>
            <p className="lead mt-4">We buy what we can secure, and not one bag more. The scarcity is real. Subscribers pour first, before the public sees a single bag.</p>
            <dl className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div><dt className="text-accent-strong" style={{ fontSize: "var(--step-2)" }}><Token name="DROP_UNITS_REMAINING" /></dt><dd className="eyebrow mt-1">bags secured</dd></div>
              <div><dt className="text-accent-strong" style={{ fontSize: "var(--step-2)" }}><Token name="NEXT_DROP_COUNTDOWN" /></dt><dd className="eyebrow mt-1">days to the drop</dd></div>
              <div><dt className="text-accent-strong" style={{ fontSize: "var(--step-2)" }}><Token name="DROP_DATE" /></dt><dd className="eyebrow mt-1">the drop opens</dd></div>
            </dl>
            <Link to="/reserve" className="mt-8 inline-block rounded bg-accent px-6 py-3 font-sans text-bg-film">Subscribe &amp; pour first</Link>
          </Reveal>
        </div>
      </section>

      {/* ORIGINS */}
      <section id="origins" className="bg-bg-warm py-20" aria-labelledby="origins-h">
        <div className="container-page">
          <Reveal>
            <p className="eyebrow">The range</p>
            <h2 id="origins-h" className="display mt-3 text-fg" style={{ fontSize: "var(--step-3)" }}>Origins light up when they&rsquo;re real.</h2>
            <p className="lead mt-4">An origin appears for sale only when its inventory is paid for and landed. Everything else is a waitlist, never a buyable ghost.</p>
          </Reveal>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ORIGINS.map((o, i) => (
              <li key={o.name}>
                <Reveal delay={i * 0.05}>
                  <div className="flex min-h-[220px] flex-col justify-end rounded border border-line bg-bg-film p-5">
                    <span className="eyebrow self-start rounded-sm border border-line px-2 py-1" style={{ color: o.state === "live" ? "var(--accent-strong)" : undefined }}>{o.state === "live" ? "Live" : o.state === "waitlist" ? "Waitlist" : "Dark"}</span>
                    <h3 className="mt-auto pt-10 font-sans text-fg" style={{ fontSize: "var(--step-1)" }}>{o.name}</h3>
                    <p className="mt-1 font-sans text-sm text-fg-muted">{o.note}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* GIFTING CTA */}
      <section className="container-page py-20">
        <Reveal>
          <div className="rounded-lg border border-line bg-bg-elev p-10 md:p-14">
            <p className="eyebrow">For teams and clients</p>
            <h2 className="display mt-3 text-fg" style={{ fontSize: "var(--step-3)" }}>Corporate gifting they remember.</h2>
            <p className="lead mt-4">Certified, provable, story-rich coffee, priced for volume with one human contact from quote to delivery.</p>
            <Link to="/gifting" className="mt-6 inline-block rounded border border-line-strong px-6 py-3 font-sans text-fg">Start a gifting inquiry</Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
