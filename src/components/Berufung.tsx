'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Badgefeld from './Badgefeld';
import { volkRufen, type Antwort } from '@/lib/taten';

/**
 * "Berufung ins Lager" - Montagmorgen-Erfassung.
 * Namen ins Badge-Feld, optional eine Baustelle dazu, ein Klick, fertig.
 */

const START: Antwort = { ok: false, meldung: '' };

function Sendeknopf({ anzahl }: { anzahl: number }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-meer w-full sm:w-auto" disabled={pending || anzahl === 0}>
      {pending ? 'Das Meer teilt sich …' : anzahl > 0 ? `${anzahl} ins Lager rufen` : 'Ins Lager rufen'}
    </button>
  );
}

export default function Berufung({ bekannteLager }: { bekannteLager: string[] }) {
  const [badges, setBadges] = useState<string[]>([]);
  const [lager, setLager] = useState('');
  const [zustand, absenden] = useActionState(volkRufen, START);
  const zuletzt = useRef<Antwort>(START);

  useEffect(() => {
    if (zustand !== zuletzt.current) {
      zuletzt.current = zustand;
      if (zustand.ok) setBadges([]);
    }
  }, [zustand]);

  return (
    <form action={absenden} className="space-y-4">
      <input type="hidden" name="namen" value={badges.join('\n')} />

      <Badgefeld
        beschriftung="Wen ruft Moses diese Woche ins Lager?"
        badges={badges}
        aendern={setBadges}
        platzhalter="Name eintippen, Enter drücken …"
        hinweis="Trennzeichen: Enter, Komma, Semikolon. Ganze Listen dürfen eingefügt werden. Mit «Name @Baustelle» gleich zuweisen."
      />

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <label htmlFor="lager" className="mb-1.5 block text-sm font-semibold">
            Baustelle für alle oben <span className="font-normal text-tafel-500">(optional)</span>
          </label>
          <input
            id="lager"
            name="lager"
            list="bekannte-lager"
            value={lager}
            onChange={(e) => setLager(e.target.value)}
            maxLength={40}
            autoComplete="off"
            placeholder="z. B. Zürich Hardbrücke"
            className="feld"
          />
          <datalist id="bekannte-lager">
            {bekannteLager.map((l) => <option key={l} value={l} />)}
          </datalist>
        </div>
        <Sendeknopf anzahl={badges.length} />
      </div>

      {zustand.meldung && (
        <p
          role="status"
          className={`animate-aufstieg rounded-xl border px-3.5 py-2.5 text-sm ${
            zustand.ok
              ? 'border-manna-300 bg-manna-50 text-manna-900 dark:border-manna-800 dark:bg-manna-950 dark:text-manna-200'
              : 'border-kalb-400 bg-kalb-50 text-kalb-900 dark:border-kalb-800 dark:bg-kalb-950 dark:text-kalb-200'
          }`}
        >
          {zustand.meldung}
        </p>
      )}
    </form>
  );
}
