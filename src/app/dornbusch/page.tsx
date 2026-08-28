import Link from 'next/link';
import { redirect } from 'next/navigation';
import DornbuschFormular from '@/components/DornbuschFormular';
import { imBund } from '@/lib/session';
import { losungslage } from '@/lib/auth';
import { APP_NAME, APP_LANG, BEREICHE } from '@/lib/moses';

export const dynamic = 'force-dynamic';
export const metadata = { title: BEREICHE.dornbusch.titel };

export default async function Dornbusch({
  searchParams,
}: {
  searchParams: Promise<{ adieu?: string }>;
}) {
  if (await imBund()) redirect('/tafel');
  const { adieu } = await searchParams;
  const lage = losungslage();

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 w-fit animate-flackern text-6xl dornbusch-flamme" aria-hidden>
            🔥
          </div>
          <h1 className="font-serif text-4xl font-bold tracking-tight">{APP_NAME}</h1>
          <p className="fluester mt-1">{APP_LANG}</p>
        </div>

        <div className="tafel dark-tafel p-6 shadow-dornbusch">
          <h2 className="ueberschrift">{BEREICHE.dornbusch.titel}</h2>
          <p className="fluester mb-5 mt-1">
            «Zieh deine Schuhe aus, denn der Ort, darauf du stehst, ist heiliges Land.»
            <span className="text-tafel-400"> (Ex 3,5)</span> – Sicherheitsschuhe darfst du anbehalten.
          </p>

          {lage.art === 'fehlt' && (
            <p className="mb-4 rounded-xl border border-kalb-400 bg-kalb-50 px-3.5 py-2.5 text-sm text-kalb-900 dark:border-kalb-800 dark:bg-kalb-950/70 dark:text-kalb-200">
              <strong>Noch kein Losungswort gesetzt.</strong> In den Umgebungsvariablen
              <code className="mx-1 rounded bg-kalb-200/70 px-1 font-mono text-xs dark:bg-kalb-900">MOSES_PASSWORT_HASH</code>
              hinterlegen (erzeugen mit <code className="font-mono text-xs">npm run steintafel</code>).
              Bis dahin kommt niemand hinein – auch du nicht.
              <br />
              <span className="mt-1.5 block text-[13px]">
                Schon gesetzt und trotzdem diese Meldung? Dann fehlt nur der <strong>Redeploy</strong> –
                neue Umgebungsvariablen wirken erst in einem neuen Deployment, nicht rückwirkend im
                laufenden. Und die Variable braucht ein Häkchen bei der Umgebung, die du gerade
                aufrufst (Production bzw. Preview).
              </span>
            </p>
          )}

          {lage.art === 'klartext' && (
            <p className="mb-4 rounded-xl border border-flamme-300 bg-flamme-50 px-3.5 py-2.5 text-sm text-flamme-900 dark:border-flamme-900 dark:bg-flamme-950/70 dark:text-flamme-200">
              <strong>Notbetrieb:</strong> Das Passwort liegt im Klartext in
              <code className="mx-1 rounded bg-flamme-200/70 px-1 font-mono text-xs dark:bg-flamme-900">MOSES_PASSWORT</code>.
              Bitte auf <code className="font-mono text-xs">MOSES_PASSWORT_HASH</code> umstellen.
            </p>
          )}

          <DornbuschFormular adieu={adieu === '1'} />
        </div>

        <p className="fluester mt-5 text-center">
          Fünf Fehlversuche, dann macht die Wache für 15 Minuten dicht. ·{' '}
          <Link href="/gebote" className="underline underline-offset-2 hover:text-flamme-700">
            Die zehn Gebote
          </Link>
        </p>
      </div>
    </main>
  );
}
