'use client';

import { useEffect, useState } from 'react';
import { SPRUECHE } from '@/lib/moses';

/**
 * Das Spruchband im Seitenkopf. Reine Deko - ein Klick blaettert weiter.
 * Der Startspruch kommt vom Server, damit die Hydration nicht meckert.
 */
export default function Spruchband({ start }: { start: number }) {
  const [i, setI] = useState(start % SPRUECHE.length);

  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % SPRUECHE.length), 25_000);
    return () => clearInterval(id);
  }, []);

  return (
    <button
      type="button"
      onClick={() => setI((x) => (x + 1) % SPRUECHE.length)}
      title="Weiterblättern"
      className="block w-full truncate text-left font-serif text-xs italic text-tafel-500 transition hover:text-flamme-700 dark:text-tafel-400 dark:hover:text-flamme-400"
    >
      {SPRUECHE[i]}
    </button>
  );
}
