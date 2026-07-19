import { useLayoutEffect, useRef } from "react";
import { gsap, prefersReduced } from "../lib/motion";

// Continuous horizontal ticker. Reduced motion -> static.
export default function Marquee({ items }: { items: string[] }) {
  const track = [...items, ...items];
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (prefersReduced() || !ref.current) return;
    const el = ref.current;
    const ctx = gsap.context(() => {
      gsap.to(el, {
        xPercent: -50,
        duration: 26,
        ease: "none",
        repeat: -1,
      });
    }, el);
    return () => ctx.revert();
  }, []);
  return (
    <div className="overflow-hidden border-y border-line py-4" aria-hidden="true">
      <div ref={ref} className="flex w-max gap-10 whitespace-nowrap px-6">
        {track.map((t, i) => (
          <span key={i} className="display text-fg-muted" style={{ fontSize: "var(--step-2)" }}>
            {t} <span className="text-accent">/</span>
          </span>
        ))}
      </div>
    </div>
  );
}
