import Link from 'next/link';
import { redirect } from 'next/navigation';
import Kopf from '@/components/Kopf';
import Steintafel from '@/components/Steintafel';
import Spruchband from '@/components/Spruchband';
import { imBund } from '@/lib/session';
import { etappeLaden } from '@/lib/wanderung';
import { ZELLE, BEREICHE } from '@/lib/moses';
import {
  etappeLesen, etappeSchluessel, etappeVerschieben, etappeGleich, etappeVorher,
  RUECKBLICK_WOCHEN,
} from '@/lib/zeit';

export const dynamic = 'force-dynamic';
export const metadata = { title: BEREICHE.tafel.titel };

export default async function Tafel({
  searchParams,
}: {
  searchParams: Promise<{ kw?: string }>;
}) {
  if (!(await imBund())) redirect('/dornbusch');

  const { kw } = await searchParams;
  const gewuenscht = etappeLesen(kw);
  const u = await etappeLaden(gewuenscht);

  // Wer eine Woche ausserhalb des Fensters aufruft, landet in der laufenden -
  // sonst zeigte die Tafel lauter grüne Felder für Daten, die es nicht mehr gibt.
  if (gewuenscht && (etappeVorher(gewuenscht, u.frueheste) || etappeVorher(u.laufend, gewuenscht))) {
    redirect('/tafel');
  }

  const zurueck = etappeVerschieben(u.etappe, -1);
  const vorwaerts = etappeVerschieben(u.etappe, 1);
  const darfZurueck = !etappeVorher(zurueck, u.frueheste);
  const auswahl = Array.from({ length: RUECKBLICK_WOCHEN + 1 }, (_, i) =>
    etappeVerschieben(u.laufend, i - RUECKBLICK_WOCHEN),
  );
  const offen = u.kennzahlen.offeneRapporte;

  return (
    <>
      <Kopf aktiv="tafel" />

      <main className="mx-auto max-w-3xl px-4 py-5">
        {!u.dauerhaft && (
          <p className="mb-4 rounded-lg border border-rot-300 bg-rot-50 px-3 py-2 text-sm text-rot-900 dark:border-rot-900 dark:bg-rot-950/50 dark:text-rot-200">
            Keine Datenbank verbunden – Eingaben überleben keinen Neustart.
            {u.diagnose.some((d) => d.gesetzt) ? '' : ' Keine der erwarteten Umgebungsvariablen ist gesetzt.'}
          </p>
        )}

        {/* Kopfzeile der Woche: Navigation links, Stand rechts */}
        <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-2 kein-druck">
          <h1 className="font-serif text-xl font-bold tracking-tight">KW {u.etappe.woche}</h1>
          <span className="fluester">{u.spanne}</span>
          {!u.istLaufend && (
            <span className="rounded bg-meer-100 px-1.5 py-0.5 text-[11px] font-medium text-meer-800 dark:bg-meer-950 dark:text-meer-200">
              Rückblick
            </span>
          )}

          <span className="ml-auto text-sm">
            {offen > 0 ? (
              <>
                <strong className="font-semibold">{offen}</strong> von {u.kennzahlen.personen} Rapporten offen
              </>
            ) : u.kennzahlen.personen > 0 ? (
              <span className="text-manna-700 dark:text-manna-400">Alle Rapporte da</span>
            ) : null}
          </span>
        </div>

        {/* Etappen */}
        <div className="mb-3 flex flex-wrap items-center gap-1 kein-druck">
          <Pfeil ziel={darfZurueck ? etappeSchluessel(zurueck) : null} titel={`Zurück zu KW ${zurueck.woche}`}>
            ←
          </Pfeil>
          {auswahl.map((e) => {
            const aktiv = etappeGleich(e, u.etappe);
            const laufend = etappeGleich(e, u.laufend);
            return (
              <Link
                key={etappeSchluessel(e)}
                href={laufend ? '/tafel' : `/tafel?kw=${etappeSchluessel(e)}`}
                aria-current={aktiv ? 'page' : undefined}
                title={laufend ? `KW ${e.woche} · laufende Woche` : `KW ${e.woche}`}
                className={`rounded px-2 py-1 text-xs transition ${
                  aktiv
                    ? 'bg-tafel-900 font-semibold text-sand-50 dark:bg-sand-100 dark:text-tafel-900'
                    : 'text-tafel-500 hover:bg-sand-200 dark:hover:bg-tafel-800'
                }`}
              >
                {e.woche}
              </Link>
            );
          })}
          <Pfeil
            ziel={!u.istLaufend ? etappeSchluessel(vorwaerts) : null}
            titel={`Weiter zu KW ${vorwaerts.woche}`}
          >
            →
          </Pfeil>
        </div>

        <Steintafel
          zeilen={u.zeilen}
          jahr={u.etappe.jahr}
          woche={u.etappe.woche}
          heute={u.heute}
          datumProTag={u.datumProTag}
        />

        {/* Legende, einzeilig */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 fluester">
          {(['anwesend', 'entschuldigt', 'unentschuldigt'] as const).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span
                className={`grid h-4 w-4 place-items-center rounded border text-[10px] font-semibold ${ZELLE[k].klassen}`}
                aria-hidden
              >
                {ZELLE[k].zeichen}
              </span>
              {ZELLE[k].klar}
            </span>
          ))}
          <span>leer = kein Werktag</span>
          <span className="hidden sm:inline">· Haken = Rapport da, Zeile rutscht ans Ende</span>
        </div>

        <footer className="mt-8 border-t border-sand-300 pt-3 dark:border-tafel-800 kein-druck">
          <Spruchband start={u.etappe.woche} />
        </footer>
      </main>
    </>
  );
}

function Pfeil({ ziel, titel, children }: { ziel: string | null; titel: string; children: React.ReactNode }) {
  const klassen = 'rounded px-2 py-1 text-xs';
  if (!ziel) {
    return (
      <span
        className={`${klassen} cursor-not-allowed text-tafel-300 dark:text-tafel-700`}
        title={`Aufbewahrt werden ${RUECKBLICK_WOCHEN} Kalenderwochen`}
        aria-disabled
      >
        {children}
      </span>
    );
  }
  return (
    <Link href={`/tafel?kw=${ziel}`} className={`${klassen} text-tafel-500 hover:bg-sand-200 dark:hover:bg-tafel-800`} title={titel}>
      {children}
    </Link>
  );
}
