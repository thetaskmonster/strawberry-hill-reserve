import { useLayoutEffect, useRef } from "react";
import { gsap, prefersReduced } from "../lib/motion";

// Oversized display headline whose lines mask-in (rise into a clip window).
// Reduced motion -> plain visible text.
export default function KineticHeadline({
  lines,
  size = "var(--step-kinetic)",
  className = "",
}: {
  lines: string[];
  size?: string;
  className?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    if (prefersReduced() || !ref.current) return;
    const inners = ref.current.querySelectorAll("[data-line-inner]");
    const ctx = gsap.context(() => {
      gsap.set(inners, { yPercent: 118 });
      gsap.to(inners, {
        yPercent: 0,
        duration: 1.1,
        ease: "power4.out",
        stagger: 0.1,
        scrollTrigger: { trigger: ref.current, start: "top 88%" },
      });
    }, ref);
    return () => ctx.revert();
  }, []);
  return (
    <h1 ref={ref} className={`display text-fg ${className}`} style={{ fontSize: size }}>
      {lines.map((l, i) => (
        <span key={i} className="block overflow-hidden">
          <span data-line-inner className="block">{l}</span>
        </span>
      ))}
    </h1>
  );
}
