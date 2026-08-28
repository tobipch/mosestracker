'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { tafelnZerbrechen, type Antwort } from '@/lib/taten';

/**
 * "Tafeln zerbrechen" - der Reset.
 *
 * Moses zerschmetterte die Steintafeln am Fuss des Sinai (Ex 32,19).
 * Damit das nicht aus Versehen passiert, braucht es zwei Schritte:
 * Dialog oeffnen und das Wort SINAI tippen.
 */

const START: Antwort = { ok: false, meldung: '' };

function Zerschmettern() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-flamme w-full" disabled={pending}>
      {pending ? 'Die Tafeln fallen …' : 'Ja, Tafeln zerschmettern'}
    </button>
  );
}

export default function Scherben({ anzahl }: { anzahl: number }) {
  const [offen, setOffen] = useState(false);
  const [zustand, absenden] = useActionState(tafelnZerbrechen, START);
  const eingabe = useRef<HTMLInputElement>(null);
  const ausloeser = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (offen) eingabe.current?.focus();
  }, [offen]);

  useEffect(() => {
    if (zustand.ok && offen) {
      const t = setTimeout(() => { setOffen(false); ausloeser.current?.focus(); }, 1400);
      return () => clearTimeout(t);
    }
  }, [zustand, offen]);

  useEffect(() => {
    if (!offen) return;
    function taste(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOffen(false); ausloeser.current?.focus(); }
    }
    document.addEventListener('keydown', taste);
    return () => document.removeEventListener('keydown', taste);
  }, [offen]);

  return (
    <>
      <button
        ref={ausloeser}
        type="button"
        onClick={() => setOffen(true)}
        className="btn-still border-flamme-300 text-flamme-800 hover:bg-flamme-100 dark:border-flamme-900 dark:text-flamme-300 dark:hover:bg-flamme-950"
        title="Die ganze Liste löschen (mit Rückfrage)"
      >
        🪨 Tafeln zerbrechen
      </button>

      {offen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-tafel-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setOffen(false); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="scherben-titel"
            className="tafel dark-tafel w-full max-w-md animate-aufstieg p-6"
          >
            <h2 id="scherben-titel" className="font-serif text-xl font-semibold">
              🪨 Tafeln zerbrechen?
            </h2>
            <p className="mt-2 text-sm text-tafel-600 dark:text-sand-300">
              «Und Moses entbrannte im Zorn und warf die Tafeln aus seiner Hand und zerbrach
              sie unten am Berge.» <span className="text-tafel-400">(Ex 32,19)</span>
            </p>
            <p className="mt-3 rounded-xl border border-flamme-300 bg-flamme-50 px-3.5 py-2.5 text-sm text-flamme-900 dark:border-flamme-900 dark:bg-flamme-950/60 dark:text-flamme-200">
              <strong>{anzahl}</strong> {anzahl === 1 ? 'Person wird' : 'Personen werden'} samt allen
              Markierungen <strong>endgültig gelöscht</strong>. Kein Papierkorb, kein Zurück –
              genau wie im Original.
            </p>

            <form action={absenden} className="mt-4 space-y-3">
              <label htmlFor="bestaetigung" className="block text-sm font-semibold">
                Tippe <span className="rounded bg-sand-200 px-1.5 py-0.5 font-mono dark:bg-tafel-700">SINAI</span> zur Bestätigung
              </label>
              <input
                ref={eingabe}
                id="bestaetigung"
                name="bestaetigung"
                autoComplete="off"
                spellCheck={false}
                placeholder="SINAI"
                className="feld font-mono uppercase tracking-widest"
              />

              {zustand.meldung && (
                <p
                  role="status"
                  className={`rounded-xl px-3 py-2 text-sm ${
                    zustand.ok
                      ? 'bg-manna-100 text-manna-900 dark:bg-manna-950 dark:text-manna-200'
                      : 'bg-kalb-100 text-kalb-900 dark:bg-kalb-950 dark:text-kalb-200'
                  }`}
                >
                  {zustand.meldung}
                </p>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button type="button" onClick={() => setOffen(false)} className="btn-still w-full">
                  Abbrechen – Tafeln behalten
                </button>
                <Zerschmettern />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
