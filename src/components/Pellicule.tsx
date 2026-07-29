"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// Mécanisme d'engagement du dossier — "la pellicule qui se développe". Chaque choix
// expose une nouvelle frame ; la dernière ajoutée flashe façon chambre noire.
// Voir docs/modules/DOSSIER.md §5.
export function Pellicule({
  total,
  filled,
  developing = false,
}: {
  total: number;
  filled: number;
  developing?: boolean;
}) {
  const previousFilled = useRef(filled);
  const [justFlashed, setJustFlashed] = useState<number | null>(null);

  useEffect(() => {
    if (filled > previousFilled.current) {
      setJustFlashed(filled - 1);
      const timeout = setTimeout(() => setJustFlashed(null), 600);
      previousFilled.current = filled;
      return () => clearTimeout(timeout);
    }
    previousFilled.current = filled;
  }, [filled]);

  const frames = Array.from({ length: total });

  return (
    <div className="relative overflow-hidden rounded-sm bg-ink-dark py-3">
      <div className="absolute inset-x-0 top-0 flex justify-around px-2">
        {Array.from({ length: Math.max(total * 2, 10) }).map((_, i) => (
          <div key={i} className="h-1.5 w-1.5 rounded-full bg-cream-light/15" />
        ))}
      </div>
      <div className="flex gap-1.5 overflow-x-auto px-3 py-3">
        {frames.map((_, i) => {
          const isDeveloped = i < filled || developing;
          const isFlashing = justFlashed === i;
          return (
            <div
              key={i}
              className="relative h-11 w-8 flex-none overflow-hidden rounded-[1px] border border-cream-light/10"
            >
              <motion.div
                className="absolute inset-0"
                initial={false}
                animate={{
                  backgroundColor: isDeveloped ? "#F4EEE4" : "#1C1712",
                }}
                transition={{ duration: developing ? 0.4 : 0.3, delay: developing ? i * 0.05 : 0 }}
              />
              <AnimatePresence>
                {isFlashing && (
                  <motion.div
                    className="absolute inset-0 bg-white"
                    initial={{ opacity: 0.95 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.55 }}
                  />
                )}
              </AnimatePresence>
              {isDeveloped && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: developing ? i * 0.05 + 0.1 : 0.1 }}
                  className="absolute inset-0 flex items-center justify-center text-bronze"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M1 5L4 8L9 2"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex justify-around px-2">
        {Array.from({ length: Math.max(total * 2, 10) }).map((_, i) => (
          <div key={i} className="h-1.5 w-1.5 rounded-full bg-cream-light/15" />
        ))}
      </div>
    </div>
  );
}
