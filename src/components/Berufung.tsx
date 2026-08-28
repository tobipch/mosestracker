'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Badgefeld from './Badgefeld';
import { volkRufen, type Antwort } from '@/lib/taten';

/**
 * "Berufung ins Lager" - neue Personen auf die zentrale Liste setzen.
 * Namen ins Badge-Feld, ein Klick, fertig. Werktage sind dann Montag bis
 * Freitag und lassen sich pro Person umschalten.
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

export default function Berufung() {
  const [badges, setBadges] = useState<string[]>([]);
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
        beschriftung="Wen ruft Moses ins Lager?"
        badges={badges}
        aendern={setBadges}
        platzhalter="Name eintippen, Enter drücken …"
        hinweis="Trennzeichen: Enter, Komma, Semikolon. Ganze Listen dürfen eingefügt werden."
      />

      <Sendeknopf anzahl={badges.length} />

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
