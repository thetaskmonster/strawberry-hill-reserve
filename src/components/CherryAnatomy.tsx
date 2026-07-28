import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ScrollTrigger, prefersReduced } from "../lib/motion";
import { CHERRY_ANATOMY } from "../content/site";

// The anatomy beat: a coffee cherry drawn as an exploded cross-section that pulls
// itself apart on scroll, with hairline leaders out to labelled callouts.
//
// Technique is lifted from the reference teardown in docs/reference/all-star-burgers.md
// (section 7.1); nothing else is. It is drawn, not filmed, on purpose: generic botany
// makes no provenance claim, so this beat needs neither stock footage nor a labelled
// placeholder frame to stay inside the honesty line.
//
// Motion contract: this is a money shot, so it scrubs. The hold is CSS `position:
// sticky` over a tall track, NOT a ScrollTrigger pin - pins stay deferred repo-wide.
// Reduced motion and narrow screens both render the final exploded state with the
// callouts as a plain flow list.

const VB_W = 800;
const VB_H = 760;
const CX = 300; // disc centre
const LEADER_END = VB_W - 8; // leaders run to the diagram's right edge, where the
// callout column begins - the two sit in separate columns of equal height, so a
// layer's y maps to the same percentage in both.

// The diagram's rendered height. Everything (heading, diagram, padding) has to
// clear one viewport while the section is stuck, so this is capped in vh.
const DIAG_H = "min(58vh, 600px)";

// closed = stacked touching, open = fully exploded. rx tapers inward, th is the
// layer's thickness, tone is its fill opacity against the accent.
const LAYERS = [
  { rx: 176, th: 13, closed: 300, open: 96, tone: 0.2 },
  { rx: 168, th: 33, closed: 313, open: 198, tone: 0.28 },
  { rx: 150, th: 10, closed: 346, open: 300, tone: 0.36 },
  { rx: 133, th: 16, closed: 356, open: 394, tone: 0.46 },
  { rx: 117, th: 8, closed: 372, open: 484, tone: 0.58 },
  { rx: 105, th: 44, closed: 380, open: 566, tone: 0.85 },
];

const ry = (rx: number) => rx * 0.23;
const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const midOf = (i: number, p: number) => {
  const L = LAYERS[i];
  return L.closed + (L.open - L.closed) * p + L.th / 2;
};

// Cylinder wall under each top face: bottom edge of the top ellipse, down the right
// side, back around the bottom silhouette. Arc sweep flags read clockwise on screen,
// so left->right via the bottom is 0 and right->left via the bottom is 1.
const wall = (rx: number, y: number, th: number) => {
  const r = ry(rx);
  return [
    `M ${CX - rx} ${y}`,
    `A ${rx} ${r} 0 0 0 ${CX + rx} ${y}`,
    `L ${CX + rx} ${y + th}`,
    `A ${rx} ${r} 0 0 1 ${CX - rx} ${y + th}`,
    "Z",
  ].join(" ");
};

export default function CherryAnatomy() {
  // Wide enough to run a callout column beside the diagram? Read live - a desktop
  // window dragged narrow would otherwise collapse the labels onto the discs.
  const [wide, setWide] = useState(
    () => typeof window === "undefined" || window.matchMedia("(min-width: 900px)").matches
  );
  const [reduced] = useState(prefersReduced);
  const animate = wide && !reduced;

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const onChange = () => setWide(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const groups = useRef<(SVGGElement | null)[]>([]);
  const leaders = useRef<(SVGGElement | null)[]>([]);
  const labels = useRef<(HTMLLIElement | null)[]>([]);
  const track = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    if (!animate || !track.current) return;
    const apply = (p: number) => {
      LAYERS.forEach((L, i) => {
        groups.current[i]?.setAttribute(
          "transform",
          `translate(0 ${((L.open - L.closed) * p).toFixed(2)})`
        );
        // Callouts hold back until the stack has actually opened - any earlier and
        // adjacent labels are still close enough together to collide.
        const o = String(clamp01((p - 0.55 - i * 0.05) / 0.16));
        const label = labels.current[i];
        if (label) {
          label.style.top = `${((midOf(i, p) / VB_H) * 100).toFixed(3)}%`;
          label.style.opacity = o;
        }
        const leader = leaders.current[i];
        if (leader) leader.style.opacity = o;
      });
    };
    const st = ScrollTrigger.create({
      trigger: track.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => apply(self.progress),
    });
    apply(st.progress);
    return () => st.kill();
  }, [animate]);

  // Static position: assembled when it is about to scrub, exploded otherwise.
  const p0 = animate ? 0 : 1;

  const diagram = (
    <svg
      viewBox={wide ? `0 0 ${VB_W} ${VB_H}` : "100 60 400 640"}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      {LAYERS.map((L, i) => {
        const r = ry(L.rx);
        const mid = L.closed + L.th / 2;
        return (
          <g
            key={i}
            ref={(el) => {
              groups.current[i] = el;
            }}
            transform={`translate(0 ${(L.open - L.closed) * p0})`}
          >
            <path d={wall(L.rx, L.closed, L.th)} fill="var(--accent)" fillOpacity={L.tone * 0.6} />
            <path
              d={wall(L.rx, L.closed, L.th)}
              fill="none"
              stroke="var(--border-strong)"
              strokeLinejoin="round"
            />
            <ellipse
              cx={CX}
              cy={L.closed}
              rx={L.rx}
              ry={r}
              fill="var(--accent)"
              fillOpacity={L.tone}
              stroke="var(--border-strong)"
            />
            {/* the seed's centre crease, so the payoff layer reads as a bean */}
            {i === LAYERS.length - 1 && (
              <path
                d={`M ${CX} ${L.closed - r + 5} Q ${CX + 13} ${L.closed} ${CX} ${L.closed + r - 5}`}
                fill="none"
                stroke="var(--bg-film)"
                strokeOpacity={0.7}
                strokeWidth={2}
              />
            )}
            {wide && (
              <g
                ref={(el) => {
                  leaders.current[i] = el;
                }}
                style={{ opacity: p0 }}
              >
                <circle cx={CX + L.rx + 9} cy={mid} r={2.5} fill="var(--accent)" />
                <line
                  x1={CX + L.rx + 15}
                  y1={mid}
                  x2={LEADER_END}
                  y2={mid}
                  stroke="var(--border-strong)"
                />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );

  const callouts = (
    <ol className={wide ? "relative h-full flex-1" : "mt-10 space-y-5"}>
      {CHERRY_ANATOMY.map((c, i) => (
        <li
          key={c.term}
          ref={(el) => {
            labels.current[i] = el;
          }}
          className={wide ? "absolute inset-x-0 -translate-y-1/2" : "border-t border-line pt-4"}
          style={
            wide
              ? { top: `${((midOf(i, p0) / VB_H) * 100).toFixed(3)}%`, opacity: p0 }
              : undefined
          }
        >
          <p className="display text-fg" style={{ fontSize: "var(--step-1)" }}>
            {c.term}
            <span
              className="ml-3 font-sans text-fg-muted"
              style={{ fontSize: "var(--step--1)", letterSpacing: "0.18em" }}
            >
              {c.sub.toUpperCase()}
            </span>
          </p>
          <p
            className="mt-1 font-sans leading-tight text-fg-muted"
            style={{ fontSize: "var(--step--1)" }}
          >
            {c.note}
          </p>
        </li>
      ))}
    </ol>
  );

  return (
    <section
      ref={track}
      className="relative border-t border-line bg-bg-film"
      style={animate ? { height: "300vh" } : undefined}
      aria-labelledby="anatomy-title"
    >
      <div
        // Exactly one viewport tall, never taller: a sticky box releases at
        // (track bottom - its own height), so any overflow would unstick it before
        // the scrub reached progress 1 and the last layers would never land.
        className={
          animate
            ? "sticky top-0 flex h-screen flex-col justify-center overflow-hidden pb-12 pt-24"
            : "py-20"
        }
      >
        <div className="container-page w-full">
          <p className="eyebrow">Anatomy</p>
          <h2 id="anatomy-title" className="display mt-3 text-fg" style={{ fontSize: "var(--step-2)" }}>
            Coffee is a seed inside a fruit.
          </h2>
          <p className="lead mt-3">Six layers come off between the branch and the bean.</p>

          {wide ? (
            <div className="mt-8 flex items-start gap-x-10" style={{ height: DIAG_H }}>
              <div className="h-full shrink-0" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
                {diagram}
              </div>
              {callouts}
            </div>
          ) : (
            <div className="mt-8">
              <div className="mx-auto max-w-[280px]" style={{ aspectRatio: "400 / 640" }}>
                {diagram}
              </div>
              {callouts}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
