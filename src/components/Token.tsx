// Renders a proof-contract token as a visible placeholder. A visible token is
// correct; an invented number is the failure. Wraps so long tokens never overflow.
export default function Token({ name }: { name: string }) {
  return (
    <span
      className="inline-block max-w-full break-words rounded-sm border border-dashed border-line px-2 py-0.5 font-sans text-[0.9em] text-accent"
      style={{ overflowWrap: "anywhere" }}
      data-token={name}
    >
      {`{{${name}}}`}
    </span>
  );
}
