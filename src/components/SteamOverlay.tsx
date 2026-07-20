import { useState } from "react";
import { prefersReduced } from "../lib/motion";

// Atmospheric steam/smoke layer composited over dark footage (mix-blend screen),
// the RÖSTWERK-style compositing move. Decorative; off under reduced motion.
export default function SteamOverlay({ src, opacity = 0.2 }: { src: string; opacity?: number }) {
  const [reduced] = useState(prefersReduced);
  if (reduced) return null;
  return (
    <video
      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      style={{ mixBlendMode: "screen", opacity, filter: "contrast(1.15)" }}
      muted
      loop
      autoPlay
      playsInline
      preload="none"
      aria-hidden="true"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
