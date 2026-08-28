'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { anmelden, type Antwort } from '@/lib/taten';

const START: Antwort = { ok: false, meldung: '' };

function Eintreten() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-meer w-full" disabled={pending}>
      {pending ? 'Das Meer teilt sich …' : 'Heiligen Boden betreten'}
    </button>
  );
}

/** Das Anmeldeformular am brennenden Dornbusch. */
export default function DornbuschFormular({ adieu }: { adieu: boolean }) {
  const [zustand, absenden] = useActionState(anmelden, START);

  return (
    <form action={absenden} className="space-y-4">
      <div>
        <label htmlFor="losung" className="mb-1.5 block text-sm font-semibold">
          Losungswort
        </label>
        <input
          id="losung"
          name="losung"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          maxLength={200}
          placeholder="••••••••••••"
          className="feld text-center tracking-widest"
        />
      </div>

      <Eintreten />

      {zustand.meldung && (
        <p
          role="alert"
          className="animate-aufstieg rounded-xl border border-flamme-300 bg-flamme-50 px-3.5 py-2.5 text-sm text-flamme-900
                     dark:border-flamme-900 dark:bg-flamme-950/70 dark:text-flamme-200"
        >
          {zustand.meldung}
        </p>
      )}

      {adieu && !zustand.meldung && (
        <p className="rounded-xl border border-meer-300 bg-meer-50 px-3.5 py-2.5 text-sm text-meer-900 dark:border-meer-900 dark:bg-meer-950/70 dark:text-meer-200">
          Abgemeldet. Moses zog sich nach Midian zurück – du auch. Bis zum nächsten Mal.
        </p>
      )}
    </form>
  );
}
