export function FrameDecor() {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 hidden md:block" aria-hidden="true">
      <div className="absolute inset-y-0 left-0 w-3.5 bg-[repeating-linear-gradient(180deg,transparent_0_10px,rgba(43,37,33,0.18)_10px_16px,transparent_16px_28px)]" />
      <div className="absolute inset-y-0 right-0 w-3.5 bg-[repeating-linear-gradient(180deg,transparent_0_10px,rgba(43,37,33,0.18)_10px_16px,transparent_16px_28px)]" />

      <div className="absolute left-5 top-5 h-6 w-6 border-l border-t border-ink/35" />
      <div className="absolute right-5 top-5 h-6 w-6 border-r border-t border-ink/35" />
      <div className="absolute bottom-5 left-5 h-6 w-6 border-b border-l border-ink/35" />
      <div className="absolute bottom-5 right-5 h-6 w-6 border-b border-r border-ink/35" />
    </div>
  );
}
