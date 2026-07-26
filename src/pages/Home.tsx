import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HERO_LINE, PROCESS, ORIGINS, CLIPS, DROP } from "../content/site";
import Marquee from "../components/Marquee";
import CinematicVideo from "../components/CinematicVideo";
import SteamOverlay from "../components/SteamOverlay";
import KineticHeadline from "../components/KineticHeadline";
import Reveal from "../components/Reveal";

function daysUntil(iso: string): number {
  const target = new Date(iso + "T00:00:00").getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((target - now) / 86_400_000));
}

export default function Home() {
  const [days, setDays] = useState(() => daysUntil(DROP.opensISO));
  useEffect(() => {
    const id = setInterval(() => setDays(daysUntil(DROP.opensISO)), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* HERO - high-grown origins, steam-composited */}
      <section className="relative flex min-h-[92vh] items-end overflow-hidden bg-bg-film">
        <CinematicVideo src={CLIPS.hero.src} poster={CLIPS.hero.poster} label="High mountains above the coffee belt (licensed stock, generic)" fill />
        <SteamOverlay src={CLIPS.steam.src} opacity={0.16} />
        <div className="hero-scrim" />
        <div className="container-page relative z-10 pb-16 pt-28">
          <Reveal><p className="eyebrow">High-grown &middot; roasted to order &middot; a short honest range</p></Reveal>
          <KineticHeadline lines={["Coffee worth", "slowing down for."]} className="mt-4" />
          <Reveal delay={0.15}>
            <p className="lead mt-6">
              A small coffee house built on altitude, patience, and origins we can stand behind. We keep the range short and
              let each one earn its place, led right now by <span className="text-fg">{HERO_LINE}</span>, our certified Jamaica Blue Mountain drop.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/reserve" className="rounded bg-accent px-6 py-3 font-sans text-bg-film">Shop the drop</Link>
              <Link to="/story" className="rounded border border-line-strong px-6 py-3 font-sans text-fg">How we source</Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Marquee items={["High-grown, hand-picked", "Roasted to order", "Certified origins", "Sealed the day it ships"]} />

      {/* PROCESS - grown to poured */}
      <section className="container-page py-20" aria-labelledby="process-h">
        <Reveal>
          <p className="eyebrow">Seed to cup</p>
          <h2 id="process-h" className="display mt-3 text-fg" style={{ fontSize: "var(--step-3)" }}>Slow where it counts.</h2>
        </Reveal>
        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map((p, i) => (
            <li key={p.word}>
              <Reveal delay={i * 0.05}>
                <div className="overflow-hidden rounded border border-line" style={{ aspectRatio: "4 / 5" }}>
                  <CinematicVideo src={p.clip} poster={p.poster} label={`${p.word}: coffee craft (licensed stock)`} />
                </div>
                <h3 className="display mt-4 text-fg" style={{ fontSize: "var(--step-2)" }}><span className="text-accent">0{i + 1}</span> {p.word}.</h3>
                <p className="mt-2 font-sans text-fg-muted">{p.copy}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      {/* SOURCING / CERTIFICATION - the standard, framed as craft */}
      <section className="bg-bg-warm py-20" aria-labelledby="auth-h">
        <div className="container-page grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <p className="eyebrow">The standard</p>
            <h2 id="auth-h" className="display mt-3 text-fg" style={{ fontSize: "var(--step-3)" }}>We only sell what we can vouch for.</h2>
            <p className="lead mt-5">Great coffee starts long before the roast, in the choice of what to buy. We keep the range short so every origin is one we know the way back to. The featured drop, Strawberry Hill Reserve, is certified Jamaica Blue Mountain, named to its estate and sold only when it is real coffee in hand.</p>
            <ul className="mt-6 space-y-3 text-fg-muted">
              <li className="flex flex-wrap items-center gap-2"><span className="text-accent">&#9650;</span> Certified Jamaica Blue Mountain, verified on the bag</li>
              <li className="flex flex-wrap items-center gap-2"><span className="text-accent">&#9650;</span> Roasted to order, then sealed the day it ships</li>
              <li className="flex flex-wrap items-center gap-2"><span className="text-accent">&#9650;</span> A named estate, a traceable lot, and no blending</li>
            </ul>
          </Reveal>
          <Reveal delay={0.1} className="relative">
            <div className="overflow-hidden rounded border border-line" style={{ aspectRatio: "4 / 3" }}>
              <img src={CLIPS.beansPhoto} alt="Roasted coffee beans, close" className="h-full w-full object-cover" style={{ filter: "contrast(1.06)" }} loading="lazy" />
            </div>
            <div className="absolute right-4 top-4 w-24 rounded bg-bg-film/90 p-2 shadow-lg backdrop-blur-sm">
              <img src={CLIPS.certMark} alt="Jamaica Blue Mountain certification mark" className="h-full w-full object-contain" loading="lazy" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* RESERVE DROP - cinematic reveal, real bag */}
      <section className="relative overflow-hidden bg-bg-film py-24" aria-labelledby="drop-h">
        <CinematicVideo src={CLIPS.reveal.src} poster={CLIPS.reveal.poster} label="Coffee beans, close (licensed stock, generic)" fill className="opacity-40" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, var(--bg-film) 0%, rgba(5,5,5,0.55) 50%, var(--bg-film) 100%)" }} />
        <div className="container-page relative z-10 grid gap-12 lg:grid-cols-2 lg:items-center">
          <Reveal className="relative flex justify-center">
            <img src={CLIPS.bag} alt={`${HERO_LINE} bag`} className="w-full max-w-sm object-contain drop-shadow-2xl" loading="lazy" />
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow">The featured drop</p>
            <p className="font-signature text-fg" style={{ fontSize: "var(--step-4)", lineHeight: 1.2, marginTop: "0.35em" }}>Strawberry Hill</p>
            <h2 id="drop-h" className="display mt-2 text-fg" style={{ fontSize: "var(--step-3)" }}>When it&rsquo;s gone, it&rsquo;s gone.</h2>
            <p className="lead mt-4">We buy what we can secure, and not one bag more. Subscribers pour first, before a single bag goes to the public.</p>
            <dl className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div><dt className="text-accent-strong" style={{ fontSize: "var(--step-2)" }}>{DROP.units}</dt><dd className="eyebrow mt-1">bags this drop</dd></div>
              <div><dt className="text-accent-strong" style={{ fontSize: "var(--step-2)" }}>{days}</dt><dd className="eyebrow mt-1">{days === 1 ? "day to the drop" : "days to the drop"}</dd></div>
              <div><dt className="text-accent-strong" style={{ fontSize: "var(--step-2)" }}>{DROP.opens}</dt><dd className="eyebrow mt-1">the drop opens</dd></div>
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
            <h2 id="origins-h" className="display mt-3 text-fg" style={{ fontSize: "var(--step-3)" }}>Short by design.</h2>
            <p className="lead mt-4">An origin appears for sale only when its coffee is paid for and landed. Everything else is a waitlist, so you always know what is really pourable.</p>
          </Reveal>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ORIGINS.map((o, i) => (
              <li key={o.name}>
                <Reveal delay={i * 0.05}>
                  <div className="relative flex min-h-[300px] flex-col justify-end overflow-hidden rounded border border-line bg-bg-film p-5">
                    <img
                      src={o.img}
                      alt={`${o.place}, representative`}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                      style={{ filter: "grayscale(1) contrast(1.05)", opacity: o.state === "live" ? 0.8 : o.state === "waitlist" ? 0.4 : 0.22 }}
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(5,5,5,0.15) 0%, rgba(5,5,5,0.55) 55%, var(--bg-film) 100%)" }} />
                    <span className="eyebrow relative z-10 self-start rounded-sm border border-line-strong bg-bg-film/70 px-2 py-1 backdrop-blur-sm" style={{ color: o.state === "live" ? "var(--accent-strong)" : undefined }}>{o.state === "live" ? "Live" : o.state === "waitlist" ? "Waitlist" : "Sourcing"}</span>
                    <h3 className="relative z-10 mt-auto pt-10 font-sans text-fg" style={{ fontSize: "var(--step-1)" }}>{o.name}</h3>
                    <p className="relative z-10 mt-0.5 font-sans text-xs uppercase tracking-wide text-accent">{o.place}</p>
                    <p className="relative z-10 mt-1 font-sans text-sm text-fg-muted">{o.note}</p>
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
            <h2 className="display mt-3 text-fg" style={{ fontSize: "var(--step-3)" }}>Gifting they actually keep.</h2>
            <p className="lead mt-4">Certified coffee that feels considered, priced for volume, with one person to talk to from quote to delivery.</p>
            <Link to="/gifting" className="mt-6 inline-block rounded border border-line-strong px-6 py-3 font-sans text-fg">Start a gifting inquiry</Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
