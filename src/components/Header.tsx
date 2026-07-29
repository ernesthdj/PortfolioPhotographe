export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/95 backdrop-blur-sm">
      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-5 md:px-10">
        <nav className="flex justify-end gap-6 md:gap-8">
          <a href="#galerie" className="text-[11px] tracking-[0.1em] text-ink">
            GALERIE
          </a>
          <a href="#devis" className="text-[11px] tracking-[0.1em] text-ink">
            DEVIS
          </a>
        </nav>
        <div className="text-center">
          <span className="font-serif text-lg font-semibold tracking-[0.06em] text-ink px-4 md:text-xl">
            ERNEST H.
          </span>
          <div className="mt-0.5 font-mono text-[8.5px] tracking-[0.15em] text-ink/40">
            BOBINE Nº. MMXXVI
          </div>
        </div>
        <nav className="flex gap-6 md:gap-8">
          <a href="#a-propos" className="text-[11px] tracking-[0.1em] text-ink">
            À PROPOS
          </a>
          <a href="#contact" className="text-[11px] tracking-[0.1em] text-ink">
            CONTACT
          </a>
        </nav>
      </div>
      <div className="flex justify-center gap-4 pb-2 font-mono text-[9.5px] tracking-[0.15em] text-ink/35">
        <span>−2</span>
        <span>−1</span>
        <span className="text-bronze">0</span>
        <span>+1</span>
        <span>+2</span>
      </div>
    </header>
  );
}
