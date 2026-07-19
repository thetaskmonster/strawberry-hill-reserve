import { useEffect, useRef, useState } from "react";
import { ScrollTrigger, prefersReduced, isSmall } from "../lib/motion";

// The ONE true frame-scrub (per the reference): scroll position drives
// video.currentTime. Desktop only. Small screens fall back to an autoplay loop;
// reduced motion falls back to the poster.
export default function ScrubVideo({
  src,
  poster,
  label,
  fill = true,
}: {
  src: string;
  poster: string;
  label: string;
  fill?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [mode] = useState<"scrub" | "loop" | "poster">(() =>
    prefersReduced() ? "poster" : isSmall() ? "loop" : "scrub"
  );

  useEffect(() => {
    const v = ref.current;
    if (!v || mode !== "scrub") return;
    let st: ScrollTrigger | undefined;
    const onReady = () => {
      const dur = v.duration || 6;
      st = ScrollTrigger.create({
        trigger: v,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          const t = Math.min(dur - 0.05, Math.max(0, self.progress * dur));
          if (Number.isFinite(t)) v.currentTime = t;
        },
      });
    };
    v.addEventListener("loadedmetadata", onReady);
    if (v.readyState >= 1) onReady();
    return () => {
      v.removeEventListener("loadedmetadata", onReady);
      st?.kill();
    };
  }, [mode]);

  const box = fill ? "absolute inset-0 h-full w-full object-cover" : "h-full w-full object-cover";
  const grade = { filter: "contrast(1.06) saturate(1.02)" } as const;

  if (mode === "poster") return <img src={poster} alt={label} className={box} style={grade} />;
  return (
    <video
      ref={ref}
      className={box}
      style={grade}
      poster={poster}
      muted
      loop={mode === "loop"}
      autoPlay={mode === "loop"}
      playsInline
      preload={mode === "scrub" ? "auto" : "none"}
      aria-hidden="true"
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
