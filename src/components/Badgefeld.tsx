'use client';

import { useId, useRef, useState } from 'react';

/**
 * Das Multi-Badge-Feld - hier sammelt sich das Volk.
 *
 * Tippen, Enter druecken, fertig. Komma, Semikolon, Tabulator und
 * Zeilenumbruch trennen ebenfalls; eingefuegte Listen werden auf einen
 * Schlag zerlegt. Rueckschritt bei leerem Feld nimmt den letzten Badge weg.
 */

type Props = {
  badges: string[];
  aendern: (badges: string[]) => void;
  platzhalter?: string;
  beschriftung: string;
  hinweis?: string;
  maxAnzahl?: number;
};

const TRENNER = /[,;\n\t]/;

export default function Badgefeld({
  badges, aendern, platzhalter, beschriftung, hinweis, maxAnzahl = 200,
}: Props) {
  const [entwurf, setEntwurf] = useState('');
  const [warnung, setWarnung] = useState<string | null>(null);
  const eingabe = useRef<HTMLInputElement>(null);
  const id = useId();

  function normalisieren(text: string) {
    return text.replace(/\s+/g, ' ').trim();
  }

  function hinzufuegen(roh: string): boolean {
    const teile = roh.split(TRENNER).map(normalisieren).filter(Boolean);
    if (!teile.length) return false;

    const naechste = [...badges];
    let doppelt = 0;
    for (const teil of teile) {
      if (naechste.length >= maxAnzahl) break;
      const schonDa = naechste.some((b) => b.toLowerCase() === teil.toLowerCase());
      if (schonDa) { doppelt++; continue; }
      naechste.push(teil.slice(0, 60));
    }
    setWarnung(doppelt ? `${doppelt} Name${doppelt === 1 ? '' : 'n'} war${doppelt === 1 ? '' : 'en'} schon in der Liste.` : null);
    if (naechste.length !== badges.length) aendern(naechste);
    return true;
  }

  function entfernen(index: number) {
    aendern(badges.filter((_, i) => i !== index));
    setWarnung(null);
    eingabe.current?.focus();
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {beschriftung}
      </label>

      <div
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) { e.preventDefault(); eingabe.current?.focus(); }
        }}
        className="flex min-h-[3.25rem] w-full flex-wrap items-center gap-1.5 rounded-xl border border-sand-300
                   bg-white p-2 focus-within:border-meer-500 dark:border-tafel-700 dark:bg-tafel-900"
      >
        {badges.map((b, i) => (
          <span
            key={`${b}-${i}`}
            className="inline-flex animate-aufstieg items-center gap-1.5 rounded-lg border border-sand-300
                       bg-sand-100 py-1 pl-2.5 pr-1 text-sm font-medium text-tafel-800 shadow-sm
                       dark:border-tafel-600 dark:bg-tafel-800 dark:text-sand-100"
            title={b}
          >
            <span className="max-w-[14rem] truncate">{b}</span>
            <button
              type="button"
              onClick={() => entfernen(i)}
              aria-label={`${b} wieder streichen`}
              className="grid h-5 w-5 place-items-center rounded-md text-tafel-500 transition
                         hover:bg-flamme-100 hover:text-flamme-700 dark:hover:bg-flamme-950"
            >
              &times;
            </button>
          </span>
        ))}

        <input
          id={id}
          ref={eingabe}
          value={entwurf}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="done"
          placeholder={badges.length ? 'weiterer Name …' : platzhalter}
          className="min-w-[10rem] flex-1 border-0 bg-transparent px-1.5 py-1.5 text-base outline-none
                     placeholder:text-tafel-400 dark:placeholder:text-tafel-500"
          onChange={(e) => {
            const wert = e.target.value;
            if (TRENNER.test(wert)) {
              hinzufuegen(wert);
              setEntwurf('');
            } else {
              setEntwurf(wert);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (hinzufuegen(entwurf)) setEntwurf('');
            } else if (e.key === 'Tab' && entwurf.trim()) {
              e.preventDefault();
              if (hinzufuegen(entwurf)) setEntwurf('');
            } else if (e.key === 'Backspace' && !entwurf && badges.length) {
              e.preventDefault();
              entfernen(badges.length - 1);
            }
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData('text');
            if (TRENNER.test(text)) {
              e.preventDefault();
              hinzufuegen(text);
            }
          }}
          onBlur={() => {
            if (entwurf.trim()) { hinzufuegen(entwurf); setEntwurf(''); }
          }}
        />
      </div>

      <p className="fluester mt-1.5" aria-live="polite">
        {warnung ?? hinweis}
        {badges.length > 0 && (
          <span className="ml-1 font-semibold text-tafel-600 dark:text-sand-300">
            · {badges.length} bereit
          </span>
        )}
      </p>
    </div>
  );
}
