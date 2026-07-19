// Labeled placeholder for imagery not yet supplied. Honesty line: a stock clip is
// never captioned as a specific named claim; specific-provenance slots are labeled
// placeholders that real footage fills later.
export default function MediaPlaceholder({
  label,
  kind = "photo",
  ratio = "16 / 9",
}: {
  label: string;
  kind?: "film" | "photo" | "product" | "mark";
  ratio?: string;
}) {
  return (
    <div
      className="relative grid place-items-center overflow-hidden rounded border border-line bg-bg-elev text-center"
      style={{ aspectRatio: ratio }}
      role="img"
      aria-label={label}
    >
      <div className="p-6">
        <span className="eyebrow block">{kind} placeholder</span>
        <span className="mt-2 block font-sans text-fg-muted">{label}</span>
      </div>
    </div>
  );
}
