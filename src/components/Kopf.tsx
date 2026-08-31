import Link from 'next/link';
import { abmelden } from '@/lib/taten';
import { APP_NAME, APP_LANG } from '@/lib/moses';

/** Der Seitenkopf: eine Zeile, mehr braucht es nicht. */
export default function Kopf({
  aktiv, angemeldet = true,
}: {
  aktiv?: 'tafel' | 'volk' | 'gebote';
  angemeldet?: boolean;
}) {
  const reiter = (schluessel: 'tafel' | 'volk' | 'gebote') =>
    `rounded-lg px-2.5 py-1.5 text-sm transition ${
      aktiv === schluessel
        ? 'bg-tafel-900 font-medium text-sand-50 dark:bg-sand-100 dark:text-tafel-900'
        : 'text-tafel-600 hover:bg-sand-200 dark:text-tafel-300 dark:hover:bg-tafel-800'
    }`;

  return (
    <header className="border-b border-sand-300 dark:border-tafel-800 kein-druck">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-2.5">
        <Link href="/tafel" className="mr-2 flex items-center gap-2" title={APP_LANG}>
          <span className="text-lg leading-none" aria-hidden>🔥</span>
          <span className="font-serif text-lg font-bold tracking-tight">{APP_NAME}</span>
        </Link>

        {angemeldet && (
          <>
            <Link href="/tafel" className={reiter('tafel')}>Tafel</Link>
            <Link href="/volk" className={reiter('volk')}>Musterung</Link>
          </>
        )}
        <Link href="/gebote" className={reiter('gebote')}>Gebote</Link>

        {angemeldet && (
          <form action={abmelden} className="ml-auto">
            <button
              type="submit"
              title="Abmelden – Rückzug nach Midian"
              className="rounded-lg px-2.5 py-1.5 text-sm text-tafel-500 transition hover:bg-sand-200 dark:hover:bg-tafel-800"
            >
              Abmelden
            </button>
          </form>
        )}
      </div>
    </header>
  );
}
