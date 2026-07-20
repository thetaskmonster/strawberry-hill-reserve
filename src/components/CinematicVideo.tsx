import { useEffect, useRef, useState } from "react";
import { prefersReduced } from "../lib/motion";

// Autoplay muted loop background clip. Plays only in view (battery/perf).
// Reduced motion -> static poster image, no playback. Subtle cinematic grade;
// imagery stays real (never full grayscale, it is the trust signal).
export default function CinematicVideo({
  src,
  poster,
  label,
  fill = false,
  className = "",
}: {
  src: string;
  poster: string;
  label: string;
  fill?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [reduced] = useState(prefersReduced);

  useEffect(() => {
    if (reduced) return;
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          // rootMargin pre-buffers the clip before it scrolls into view so it is
          // ready to play on arrival instead of stalling from a cold start.
          if (e.isIntersecting) v.play().catch(() => {});
          else v.pause();
        }),
      { threshold: 0.01, rootMargin: "400px 0px" }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [reduced]);

  const box = fill ? "absolute inset-0 h-full w-full object-cover" : "h-full w-full object-cover";
  const grade = { filter: "contrast(1.06) saturate(1.02)" } as const;

  if (reduced) {
    return <img src={poster} alt={label} className={`${box} ${className}`} style={grade} />;
  }
  return (
    <video
      ref={ref}
      className={`${box} ${className}`}
      style={grade}
      poster={poster}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
