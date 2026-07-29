export function PlaceholderImage({
  label,
  className = "",
  rounded = false,
}: {
  label: string;
  className?: string;
  rounded?: boolean;
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden border border-ink/15 bg-[repeating-linear-gradient(135deg,rgba(43,37,33,0.06)_0_2px,transparent_2px_10px)] bg-cream-light ${
        rounded ? "rounded-full" : ""
      } ${className}`}
    >
      <span className="px-3 py-1 text-center font-mono text-[10px] tracking-[0.08em] text-ink/45">
        {label}
      </span>
    </div>
  );
}
