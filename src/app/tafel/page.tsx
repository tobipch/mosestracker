import Link from 'next/link';
import { redirect } from 'next/navigation';
import Kopf from '@/components/Kopf';
import Steintafel from '@/components/Steintafel';
import { imBund } from '@/lib/session';
import { etappeLaden } from '@/lib/wanderung';
import { ZELLE, WOCHE, BEREICHE, APP_NAME } from '@/lib/moses';
import {
  etappeLesen, etappeSchluessel, etappeVerschieben, etappeGleich, etappeVorher,
  RUECKBLICK_WOCHEN, TAGE_LANG,
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
  const darfVorwaerts = !u.istLaufend;

  // Alle erreichbaren Etappen, älteste zuerst.
  const auswahl = Array.from({ length: RUECKBLICK_WOCHEN + 1 }, (_, i) =>
    etappeVerschieben(u.laufend, i - RUECKBLICK_WOCHEN),
  );

  return (
    <>
      <Kopf spruchIndex={u.etappe.woche} aktiv="tafel" />

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6">
        {u.verdorben > 0 && (
          <p className="tafel dark-tafel animate-aufstieg border-meer-300 bg-meer-50 p-3.5 text-sm dark:border-meer-900 dark:bg-meer-950/60">
            🍞 <strong>Manna-Regel angewendet.</strong> {u.verdorben}{' '}
            {u.verdorben === 1 ? 'Wocheneintrag lag' : 'Wocheneinträge lagen'} weiter zurück als{' '}
            {RUECKBLICK_WOCHEN} Kalenderwochen und {u.verdorben === 1 ? 'wurde' : 'wurden'} gelöscht.
            «Es wuchsen Würmer darin.» (Ex 16,20)
          </p>
        )}
        {!u.dauerhaft && (
          <div className="tafel dark-tafel border-flamme-300 bg-flamme-50 p-3.5 text-sm dark:border-flamme-900 dark:bg-flamme-950/60">
            <p>
              ⚠️ <strong>Wüstenspeicher aktiv.</strong> Es ist keine Datenbank verbunden. Alles hier
              lebt nur im Arbeitsspeicher und ist beim nächsten Neustart weg.
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {u.diagnose.map((d) => (
                <li
                  key={d.name}
                  className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] ${
                    d.gesetzt
                      ? 'bg-manna-200 text-manna-900 dark:bg-manna-900 dark:text-manna-200'
                      : 'bg-sand-200 text-tafel-500 line-through dark:bg-tafel-800 dark:text-tafel-400'
                  }`}
                >
                  {d.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Etappenwahl */}
        <section className="tafel dark-tafel space-y-3 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <NaviKnopf
              ziel={darfZurueck ? etappeSchluessel(zurueck) : null}
              titel={
                darfZurueck
                  ? `Zurück zu KW ${zurueck.woche}`
                  : `Weiter zurück liegen keine Daten – aufbewahrt werden ${RUECKBLICK_WOCHEN} Kalenderwochen.`
              }
            >
              ←
            </NaviKnopf>

            <div className="px-1">
              <p className="font-serif text-lg font-bold leading-none">
                KW {u.etappe.woche}
                {!u.istLaufend && (
                  <span className="ml-2 rounded-md bg-meer-200 px-1.5 py-0.5 align-middle text-[11px] font-semibold text-meer-900 dark:bg-meer-900 dark:text-meer-100">
                    Rückblick
                  </span>
                )}
              </p>
              <p className="fluester mt-0.5">{u.spanne}</p>
            </div>

            <NaviKnopf
              ziel={darfVorwaerts ? etappeSchluessel(vorwaerts) : null}
              titel={darfVorwaerts ? `Weiter zu KW ${vorwaerts.woche}` : 'Das ist die laufende Woche.'}
            >
              →
            </NaviKnopf>

            <div className="ml-auto flex flex-wrap items-center gap-1">
              <span className="fluester mr-1 hidden sm:inline">Etappen</span>
              {auswahl.map((e) => {
                const aktiv = etappeGleich(e, u.etappe);
                const laufend = etappeGleich(e, u.laufend);
                return (
                  <Link
                    key={etappeSchluessel(e)}
                    href={laufend ? '/tafel' : `/tafel?kw=${etappeSchluessel(e)}`}
                    aria-current={aktiv ? 'page' : undefined}
                    title={laufend ? `KW ${e.woche} · laufende Woche` : `KW ${e.woche}`}
                    className={`rounded-lg border px-2 py-1 text-xs font-semibold transition ${
                      aktiv
                        ? 'border-meer-600 bg-meer-700 text-white'
                        : 'border-sand-300 bg-sand-50 text-tafel-600 hover:bg-sand-200 dark:border-tafel-700 dark:bg-tafel-800 dark:text-sand-300 dark:hover:bg-tafel-700'
                    }`}
                  >
                    {e.woche}
                    {laufend && <span className="ml-1" aria-hidden>•</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Kennzahlen */}
        <section aria-label="Kennzahlen der Woche" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kachel
            zahl={u.kennzahlen.offeneRapporte}
            beschriftung="Rapport offen"
            unterzeile={`von ${u.kennzahlen.personen} Personen`}
            zeichen="📬"
            hervor={u.kennzahlen.offeneRapporte > 0}
          />
          <Kachel zahl={u.kennzahlen.rein} beschriftung={WOCHE.rein.klar} unterzeile={WOCHE.rein.biblisch} zeichen="✓" />
          <Kachel zahl={u.kennzahlen.segen} beschriftung={WOCHE.segen.klar} unterzeile={`${u.kennzahlen.entschuldigteTage} Tage`} zeichen="!" />
          <Kachel zahl={u.kennzahlen.kalb} beschriftung={WOCHE.kalb.klar} unterzeile={`${u.kennzahlen.unentschuldigteTage} Tage`} zeichen="✗" alarm={u.kennzahlen.kalb > 0} />
        </section>

        {/* Die Woche */}
        <section>
          <div className="mb-3">
            <h1 className="ueberschrift">📜 {BEREICHE.tafel.titel} · KW {u.etappe.woche}</h1>
            <p className="fluester mt-1">
              Werktage sind grün, bis du etwas anderes anklickst. Ein Klick macht gelb
              (entschuldigt), der nächste rot (unentschuldigt), der dritte wieder grün.
              {u.heute !== null && <> Heute ist {TAGE_LANG[u.heute]} – die Spalte ist markiert.</>}
            </p>
          </div>

          <Steintafel
            zeilen={u.zeilen}
            jahr={u.etappe.jahr}
            woche={u.etappe.woche}
            heute={u.heute}
            datumProTag={u.datumProTag}
          />
        </section>

        <Legende />

        <footer className="fluester space-y-1 pb-8 pt-2 text-center">
          <p>
            {APP_NAME} · Die Personenliste bleibt bestehen · Wochendaten:
            die laufende Woche und {RUECKBLICK_WOCHEN} zurück
          </p>
          <p className="italic">«Sechs Tage sollst du arbeiten.» (Ex 34,21)</p>
        </footer>
      </main>
    </>
  );
}

function NaviKnopf({
  ziel, titel, children,
}: { ziel: string | null; titel: string; children: React.ReactNode }) {
  if (!ziel) {
    return (
      <span className="btn-still cursor-not-allowed text-xs opacity-40" title={titel} aria-disabled>
        {children}
      </span>
    );
  }
  return (
    <Link href={`/tafel?kw=${ziel}`} className="btn-still text-xs" title={titel}>
      {children}
    </Link>
  );
}

function Kachel({
  zahl, beschriftung, unterzeile, zeichen, alarm, hervor,
}: {
  zahl: number; beschriftung: string; unterzeile: string; zeichen: string;
  alarm?: boolean; hervor?: boolean;
}) {
  return (
    <div
      className={`tafel dark-tafel px-3.5 py-3 ${
        alarm
          ? 'border-rot-400 bg-rot-50 dark:border-rot-800 dark:bg-rot-950/50'
          : hervor
            ? 'border-meer-400 bg-meer-50 dark:border-meer-800 dark:bg-meer-950/50'
            : ''
      }`}
    >
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg leading-none" aria-hidden>{zeichen}</span>
        <span className="font-serif text-2xl font-bold tabular-nums leading-none">{zahl}</span>
      </div>
      <p className="mt-1.5 text-sm font-semibold leading-tight">{beschriftung}</p>
      <p className="fluester leading-tight">{unterzeile}</p>
    </div>
  );
}

function Legende() {
  const zellen = ['anwesend', 'entschuldigt', 'unentschuldigt', 'frei'] as const;
  return (
    <div className="tafel dark-tafel p-4">
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-tafel-500">
        Legende · was die Farben bedeuten
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {zellen.map((k) => {
          const info = ZELLE[k];
          return (
            <li key={k} className="flex items-start gap-2.5">
              <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border text-sm font-semibold ${info.klassen}`}>
                <span aria-hidden>{info.zeichen || '·'}</span>
              </span>
              <span className="text-sm">
                <strong className="font-semibold">{info.klar}</strong>
                <span className="text-tafel-500"> · {info.biblisch}</span>
                <br />
                <span className="fluester">{info.hilfe}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="fluester mt-3 border-t border-sand-200 pt-3 dark:border-tafel-800">
        Der Punkt vor dem Namen fasst die Woche zusammen: grün = durchgehend anwesend,
        gelb = mindestens eine entschuldigte Absenz, rot = mindestens eine unentschuldigte.
        Ist der Rapport abgehakt, wird die Zeile blass und rutscht ans Ende.
      </p>
    </div>
  );
}
