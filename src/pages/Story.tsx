import { PROCESS, CLIPS } from "../content/site";
import CinematicVideo from "../components/CinematicVideo";
import SteamOverlay from "../components/SteamOverlay";
import ScrubVideo from "../components/ScrubVideo";
import KineticHeadline from "../components/KineticHeadline";
import Reveal from "../components/Reveal";

export default function Story() {
  return (
    <article>
      <section className="relative flex min-h-[80vh] items-end overflow-hidden bg-bg-film">
        <CinematicVideo src={CLIPS.story.src} poster={CLIPS.story.poster} label="Misty forest above the coffee belt (licensed stock, generic)" fill />
        <SteamOverlay src={CLIPS.steam.src} opacity={0.14} />
        <div className="hero-scrim" />
        <div className="container-page relative z-10 pb-16 pt-28">
          <Reveal><p className="eyebrow">The story</p></Reveal>
          <KineticHeadline lines={["Start with", "better coffee."]} size="var(--step-4)" className="mt-4" />
        </div>
      </section>

      <section className="container-page py-20">
        <Reveal><p className="lead">Most coffee is bought on price and blended for consistency. That is a fine way to fill a shelf. It is not how you get a cup worth sitting with. We went the other way: buy less, buy higher, and keep the range short enough to know each origin by name.</p></Reveal>
        <Reveal delay={0.1}><p className="lead mt-6">The featured drop, <span className="text-fg">Strawberry Hill Reserve</span>, is certified Jamaica Blue Mountain from a single estate in the Blue Mountain zone, roasted to order and sealed at origin. It is one of the great high-grown coffees, and one of the most faked, which is exactly why we sell it certified and traceable rather than take the name on faith.</p></Reveal>
      </section>

      {PROCESS.map((p, i) => (
        <section key={p.word} className="relative flex min-h-[85vh] items-center overflow-hidden border-t border-line bg-bg-film" aria-labelledby={`beat-${i}`}>
          {i === 3 ? (
            <ScrubVideo src={p.clip} poster={p.poster} label={`${p.word}: coffee craft, scroll-scrubbed (licensed stock)`} />
          ) : (
            <CinematicVideo src={p.clip} poster={p.poster} label={`${p.word}: coffee craft, cinematic (licensed stock)`} fill />
          )}
          <div className="hero-scrim" />
          <div className="container-page relative z-10">
            <KineticHeadline lines={[`${p.word}.`]} />
            <Reveal delay={0.1}><p className="lead mt-4">{p.copy}</p></Reveal>
          </div>
          <h2 id={`beat-${i}`} className="sr-only">{p.word}</h2>
        </section>
      ))}

      <section className="bg-bg-warm py-20">
        <div className="container-page">
          <Reveal>
            <p className="eyebrow">On certification</p>
            <h2 className="display mt-3 text-fg" style={{ fontSize: "var(--step-3)" }}>Proof, not just a name.</h2>
            <p className="lead mt-4">Real Jamaica Blue Mountain is grown in a defined zone, processed at a licensed works, and issued a certificate of origin. The featured drop carries that certification, and the details live on the bag you receive, not just in the marketing.</p>
          </Reveal>
        </div>
      </section>
    </article>
  );
}
