import { redirect } from 'next/navigation';
import Kopf from '@/components/Kopf';
import Berufung from '@/components/Berufung';
import Musterung from '@/components/Musterung';
import Scherben from '@/components/Scherben';
import { imBund } from '@/lib/session';
import { volkLaden } from '@/lib/wanderung';
import { BEREICHE } from '@/lib/moses';
import { stempel, RUECKBLICK_WOCHEN, WERKTAGE_STANDARD, TAGE_KURZ } from '@/lib/zeit';

export const dynamic = 'force-dynamic';
export const metadata = { title: BEREICHE.volk.titel };

export default async function Volk() {
  if (!(await imBund())) redirect('/dornbusch');

  const { personen, letzteScherbe, dauerhaft } = await volkLaden();
  const standard = `${TAGE_KURZ[WERKTAGE_STANDARD[0]]}–${TAGE_KURZ[WERKTAGE_STANDARD[WERKTAGE_STANDARD.length - 1]]}`;

  return (
    <>
      <Kopf spruchIndex={7} aktiv="volk" />

      <main className="mx-auto max-w-4xl space-y-5 px-4 py-6">
        {!dauerhaft && (
          <p className="tafel dark-tafel border-flamme-300 bg-flamme-50 p-3.5 text-sm dark:border-flamme-900 dark:bg-flamme-950/60">
            ⚠️ <strong>Wüstenspeicher aktiv.</strong> Keine Datenbank verbunden – diese Liste
            überlebt keinen Neustart.
          </p>
        )}

        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">
            👥 {BEREICHE.volk.titel}
          </h1>
          <p className="fluester mt-1">
            {BEREICHE.volk.klar} – sie gilt für alle Kalenderwochen. «Nehmt die Summe der ganzen
            Gemeinde, nach ihren Namen, Kopf für Kopf.» (Num 1,2)
          </p>
        </div>

        <section className="tafel dark-tafel p-5">
          <h2 className="ueberschrift">⛺ {BEREICHE.berufung.titel}</h2>
          <p className="fluester mb-4 mt-1">
            {BEREICHE.berufung.klar}. Neue Personen starten mit {standard} als Werktagen.
          </p>
          <Berufung />
        </section>

        <section>
          <div className="mb-3">
            <h2 className="ueberschrift">📋 Die Liste</h2>
            <p className="fluester mt-1">
              {personen.length} {personen.length === 1 ? 'Person' : 'Personen'} · Werktage anklicken
              zum Umschalten · × löscht die Person samt allen Wochendaten.
            </p>
          </div>
          <Musterung personen={personen} />
        </section>

        <section className="tafel dark-tafel border-rot-300/70 p-5 dark:border-rot-900/70">
          <h2 className="ueberschrift">🪨 {BEREICHE.scherben.titel}</h2>
          <p className="fluester mb-4 mt-1">
            {BEREICHE.scherben.klar}: die ganze Liste und sämtliche Wochendaten auf einen Schlag.
            Braucht das Bestätigungswort – aus Versehen passiert das nicht.
          </p>
          <Scherben anzahl={personen.length} />
          {letzteScherbe && (
            <p className="fluester mt-3">Zuletzt zerbrochen: {stempel(new Date(letzteScherbe))}</p>
          )}
        </section>

        <footer className="fluester space-y-1 pb-8 pt-2 text-center">
          <p>
            Die Personenliste bleibt bestehen, bis du sie änderst · Wochendaten:
            die laufende Woche und {RUECKBLICK_WOCHEN} zurück
          </p>
          <p className="italic">«Und Moses zählte sie, wie ihm befohlen war.» (Num 3,16)</p>
        </footer>
      </main>
    </>
  );
}
