'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Badgefeld from './Badgefeld';
import { volkRufen, type Antwort } from '@/lib/taten';

/**
 * "Berufung ins Lager" - neue Personen auf die zentrale Liste setzen.
 * Namen ins Badge-Feld, ein Klick, fertig.
 */

const START: Antwort = { ok: false, meldung: '' };

function Sendeknopf({ anzahl }: { anzahl: number }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-meer shrink-0" disabled={pending || anzahl === 0}>
      {pending ? 'einen Moment …' : anzahl > 0 ? `${anzahl} aufnehmen` : 'Aufnehmen'}
    </button>
  );
}

export default function Berufung({ standard }: { standard: string }) {
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
    <form action={absenden}>
      <input type="hidden" name="namen" value={badges.join('\n')} />

      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <Badgefeld
            badges={badges}
            aendern={setBadges}
            platzhalter="Name eintippen, Enter drücken …"
            hinweis={`Komma, Semikolon und Zeilenumbruch trennen ebenfalls · Werktage ${standard}, danach änderbar`}
          />
        </div>
        <Sendeknopf anzahl={badges.length} />
      </div>

      {zustand.meldung && (
        <p role="status" className="mt-2 text-sm text-tafel-600 dark:text-sand-300">
          {zustand.meldung}
        </p>
      )}
    </form>
  );
}
