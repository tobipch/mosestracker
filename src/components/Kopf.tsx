import Link from 'next/link';
import Sanduhr from './Sanduhr';
import Spruchband from './Spruchband';
import { abmelden } from '@/lib/taten';
import { APP_NAME, APP_LANG } from '@/lib/moses';

/**
 * Der Seitenkopf: Wer bin ich, welche Woche ist, wann kommt der Reset,
 * und wie komme ich wieder raus.
 */
export default function Kopf({
  woche, naechsterSabbatIso, spruchIndex, angemeldet = true,
}: {
  woche: number;
  naechsterSabbatIso: string;
  spruchIndex: number;
  angemeldet?: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-sand-300/80 bg-sand-100/85 backdrop-blur-md dark:border-tafel-800 dark:bg-tafel-950/85">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
        <Link href="/tafel" className="flex items-center gap-2.5" title={APP_LANG}>
          <span className="text-2xl leading-none dornbusch-flamme" aria-hidden>🔥</span>
          <span>
            <span className="block font-serif text-xl font-bold leading-none tracking-tight">{APP_NAME}</span>
            <span className="fluester hidden leading-none sm:block">Wochenkontrolle</span>
          </span>
        </Link>

        <span className="rounded-lg border border-sand-300 bg-sand-50 px-2 py-1 text-xs font-semibold dark:border-tafel-700 dark:bg-tafel-800">
          KW {woche}
        </span>

        <span className="fluester hidden md:inline">
          <Sanduhr zielIso={naechsterSabbatIso} />
        </span>

        <div className="ml-auto flex items-center gap-1.5 kein-druck">
          <Link href="/gebote" className="btn-still px-2.5 py-1.5 text-xs" title="Kurzanleitung, Sicherheit & Datenschutz">
            📜 Gebote
          </Link>
          {angemeldet && (
            <>
              <a
                href="/api/auszug"
                className="btn-still px-2.5 py-1.5 text-xs"
                title="Wochenliste als CSV herunterladen (öffnet in Excel)"
              >
                📥 Auszug
              </a>
              <form action={abmelden}>
                <button type="submit" className="btn-still px-2.5 py-1.5 text-xs" title="Abmelden">
                  🚪 Midian
                </button>
              </form>
            </>
          )}
        </div>

        <div className="w-full md:hidden">
          <span className="fluester">
            <Sanduhr zielIso={naechsterSabbatIso} />
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-2">
        <Spruchband start={spruchIndex} />
      </div>
    </header>
  );
}
