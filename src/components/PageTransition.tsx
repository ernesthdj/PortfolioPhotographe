"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Transition entre pages — un bandeau noir façon pellicule balaie l'écran de
// bas en haut : il monte pour couvrir (au clic sur un lien), puis continue sa
// course vers le haut pour révéler la page suivante, comme un seul geste
// continu. Déclenché par les clics sur <a> internes (anticipatoire, pas de
// flash) et, en repli, par tout changement d'URL non intercepté (ex. le
// sélecteur de pellicule qui navigue via router.push).
const COVER_MS = 420;
const MIN_COVERED_MS = 200;
const REVEAL_MS = 640;

type Phase = "hidden" | "covering" | "revealing";

export function PageTransition() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("hidden");
  const prevPathname = useRef(pathname);
  const coveredAt = useRef<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  function reveal(afterMs: number) {
    const t1 = setTimeout(() => {
      setPhase("revealing");
      const t2 = setTimeout(() => setPhase("hidden"), REVEAL_MS);
      timers.current.push(t2);
    }, afterMs);
    timers.current.push(t1);
  }

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as HTMLElement)?.closest("a");
      if (!link || link.target === "_blank") return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;

      clearTimers();
      coveredAt.current = Date.now();
      setPhase("covering");
      // Filet de securite si la navigation echoue/n'arrive jamais.
      reveal(COVER_MS + MIN_COVERED_MS + 2000);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;

    if (coveredAt.current === null) {
      // Navigation non anticipee (ex. router.push programmatique) — on rejoue
      // quand meme le balayage complet pour marquer la transition.
      clearTimers();
      setPhase("covering");
      reveal(COVER_MS + MIN_COVERED_MS);
      return;
    }

    clearTimers();
    const elapsed = Date.now() - coveredAt.current;
    coveredAt.current = null;
    reveal(Math.max(0, COVER_MS + MIN_COVERED_MS - elapsed));
  }, [pathname]);

  useEffect(() => clearTimers, []);

  return (
    <div aria-hidden="true" className={`page-wipe page-wipe-${phase} pointer-events-none fixed inset-0 z-[200]`}>
      <div className="page-wipe-perf page-wipe-perf-top" />
      <div className="page-wipe-perf page-wipe-perf-bottom" />
    </div>
  );
}
