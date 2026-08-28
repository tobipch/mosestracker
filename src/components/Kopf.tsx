import Link from 'next/link';
import Spruchband from './Spruchband';
import { abmelden } from '@/lib/taten';
import { APP_NAME, APP_LANG } from '@/lib/moses';

/**
 * Der Seitenkopf: Wer bin ich, wo bin ich, und wie komme ich wieder raus.
 */
export default function Kopf({
  spruchIndex, aktiv, angemeldet = true,
}: {
  spruchIndex: number;
  aktiv?: 'tafel' | 'volk' | 'gebote';
  angemeldet?: boolean;
}) {
  const reiter = (schluessel: 'tafel' | 'volk' | 'gebote') =>
    `btn-still px-2.5 py-1.5 text-xs ${
      aktiv === schluessel ? 'border-meer-600 bg-meer-700 text-white hover:bg-meer-800' : ''
    }`;

  return (
    <header className="sticky top-0 z-30 border-b border-sand-300/80 bg-sand-100/85 backdrop-blur-md dark:border-tafel-800 dark:bg-tafel-950/85">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
        <Link href="/tafel" className="flex items-center gap-2.5" title={APP_LANG}>
          <span className="text-2xl leading-none dornbusch-flamme" aria-hidden>🔥</span>
          <span>
            <span className="block font-serif text-xl font-bold leading-none tracking-tight">{APP_NAME}</span>
            <span className="fluester hidden leading-none sm:block">Wochentafel</span>
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-1.5 kein-druck">
          {angemeldet && (
            <>
              <Link href="/tafel" className={reiter('tafel')} title="Kalenderwochenübersicht">
                📜 Tafel
              </Link>
              <Link href="/volk" className={reiter('volk')} title="Zentrale Personenliste">
                👥 Musterung
              </Link>
            </>
          )}
          <Link href="/gebote" className={reiter('gebote')} title="Kurzanleitung, Sicherheit & Datenschutz">
            📖 Gebote
          </Link>
          {angemeldet && (
            <form action={abmelden}>
              <button type="submit" className="btn-still px-2.5 py-1.5 text-xs" title="Abmelden">
                🚪 Midian
              </button>
            </form>
          )}
        </nav>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-2">
        <Spruchband start={spruchIndex} />
      </div>
    </header>
  );
}
