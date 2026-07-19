import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap, prefersReduced } from "../lib/motion";

// One-shot fade/rise on scroll enter. Reduced motion -> visible immediately.
export default function Reveal({
  children,
  y = 26,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  y?: number;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (prefersReduced() || !ref.current) return;
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        autoAlpha: 0,
        y,
        duration: 0.9,
        delay,
        ease: "power3.out",
        scrollTrigger: { trigger: ref.current, start: "top 86%" },
      });
    }, ref);
    return () => ctx.revert();
  }, [y, delay]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
