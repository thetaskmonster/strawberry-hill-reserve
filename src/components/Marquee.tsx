// Static in Phase 2 (no motion). Phase 3 adds the continuous scroll.
export default function Marquee({ items }: { items: string[] }) {
  const track = [...items, ...items];
  return (
    <div className="overflow-hidden border-y border-line py-4" aria-hidden="true">
      <div className="flex gap-10 whitespace-nowrap px-6" data-marquee>
        {track.map((t, i) => (
          <span key={i} className="display text-fg-muted" style={{ fontSize: "var(--step-2)" }}>
            {t} <span className="text-accent">/</span>
          </span>
        ))}
      </div>
    </div>
  );
}
