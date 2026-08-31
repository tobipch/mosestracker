import { redirect } from 'next/navigation';
import Kopf from '@/components/Kopf';
import Berufung from '@/components/Berufung';
import Musterung from '@/components/Musterung';
import Scherben from '@/components/Scherben';
import { imBund } from '@/lib/session';
import { volkLaden } from '@/lib/wanderung';
import { BEREICHE } from '@/lib/moses';
import { TAGE_KURZ, WERKTAGE_STANDARD } from '@/lib/zeit';

export const dynamic = 'force-dynamic';
export const metadata = { title: BEREICHE.volk.titel };

export default async function Volk() {
  if (!(await imBund())) redirect('/dornbusch');

  const { personen, dauerhaft } = await volkLaden();
  const standard = `${TAGE_KURZ[WERKTAGE_STANDARD[0]]}–${TAGE_KURZ[WERKTAGE_STANDARD[WERKTAGE_STANDARD.length - 1]]}`;

  return (
    <>
      <Kopf aktiv="volk" />

      <main className="mx-auto max-w-3xl px-4 py-5">
        {!dauerhaft && (
          <p className="mb-4 rounded-lg border border-rot-300 bg-rot-50 px-3 py-2 text-sm text-rot-900 dark:border-rot-900 dark:bg-rot-950/50 dark:text-rot-200">
            Keine Datenbank verbunden – diese Liste überlebt keinen Neustart.
          </p>
        )}

        <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
          <h1 className="font-serif text-xl font-bold tracking-tight">{BEREICHE.volk.titel}</h1>
          <span className="fluester">
            {personen.length} {personen.length === 1 ? 'Person' : 'Personen'} · gilt für alle Wochen
          </span>
        </div>

        <Berufung standard={standard} />

        <div className="mt-5">
          <Musterung personen={personen} />
        </div>

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-sand-300 pt-4 dark:border-tafel-800">
          <span className="fluester">
            Alles löschen: Liste samt allen Wochendaten.
          </span>
          <Scherben anzahl={personen.length} />
        </div>
      </main>
    </>
  );
}
