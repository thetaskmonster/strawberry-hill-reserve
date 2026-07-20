import { PROCESS, CLIPS } from "../content/site";
import CinematicVideo from "../components/CinematicVideo";
import SteamOverlay from "../components/SteamOverlay";
import ScrubVideo from "../components/ScrubVideo";
import KineticHeadline from "../components/KineticHeadline";
import Reveal from "../components/Reveal";
import Token from "../components/Token";

export default function Story() {
  return (
    <article>
      <section className="relative flex min-h-[80vh] items-end overflow-hidden bg-bg-film">
        <CinematicVideo src={CLIPS.story.src} poster={CLIPS.story.poster} label="Misty forest above the coffee belt (licensed stock, generic)" fill />
        <SteamOverlay src={CLIPS.steam.src} opacity={0.14} />
        <div className="hero-scrim" />
        <div className="container-page relative z-10 pb-16 pt-28">
          <Reveal><p className="eyebrow">The story</p></Reveal>
          <KineticHeadline lines={["Most Blue Mountain", "is a lie."]} size="var(--step-4)" className="mt-4" />
        </div>
      </section>

      <section className="container-page py-20">
        <Reveal><p className="lead">Jamaica Blue Mountain is one of the most counterfeited coffees on earth. Far more is sold each year than the mountains can possibly grow. Most of what carries the name is blended, mislabeled, or simply invented. The label leans on a reputation the coffee in the bag never earned.</p></Reveal>
        <Reveal delay={0.1}><p className="lead mt-6">We exist on the other side of that line. Our Jamaica Blue Mountain, sold as <span className="text-fg">Strawberry Hill Reserve</span>, comes from a single certified estate in the Blue Mountain zone, is certified by JACRA, and is roasted and sealed at origin. Every batch is traceable. Every claim on this site is one a certificate number and a reverse image search can back up.</p></Reveal>
      </section>

      {PROCESS.map((p, i) => (
        <section key={p.word} className="relative flex min-h-[85vh] items-center overflow-hidden border-t border-line bg-bg-film" aria-labelledby={`beat-${i}`}>
          {i === 3 ? (
            <ScrubVideo src={p.clip} poster={p.poster} label={`${p.word}: generic coffee craft, scroll-scrubbed (licensed stock)`} />
          ) : (
            <CinematicVideo src={p.clip} poster={p.poster} label={`${p.word}: generic coffee craft, cinematic (licensed stock)`} fill />
          )}
          <div className="hero-scrim" />
          <div className="container-page relative z-10">
            <KineticHeadline lines={[`${p.word}.`]} />
            <Reveal delay={0.1}><p className="lead mt-4">{p.copy}</p></Reveal>
            {i === 3 && <p className="mt-2 font-sans text-sm text-accent">(This beat is scroll-scrubbed frame by frame.)</p>}
          </div>
          <h2 id={`beat-${i}`} className="sr-only">{p.word}</h2>
        </section>
      ))}

      <section className="bg-bg-warm py-20">
        <div className="container-page">
          <Reveal>
            <p className="eyebrow">What JACRA certification means</p>
            <h2 className="display mt-3 text-fg" style={{ fontSize: "var(--step-3)" }}>A number you can check.</h2>
            <p className="lead mt-4">Grown in the certified zone, processed at a licensed works, issued a certificate of origin. Ours renders live from source.</p>
            <p className="mt-6 flex flex-wrap items-center gap-2 text-fg-muted">Certificate <Token name="JACRA_CERT_NO" /> &middot; roasted <Token name="ROAST_DATE" /> &middot; lot <Token name="LOT_NO" /></p>
          </Reveal>
        </div>
      </section>
    </article>
  );
}
