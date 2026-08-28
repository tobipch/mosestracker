import { redirect } from 'next/navigation';
import Kopf from '@/components/Kopf';
import Berufung from '@/components/Berufung';
import Steintafel from '@/components/Steintafel';
import Scherben from '@/components/Scherben';
import { imBund } from '@/lib/session';
import { lagerLaden } from '@/lib/wanderung';
import { STATUS, BEREICHE, APP_NAME } from '@/lib/moses';
import { datumDesTages, stempel, MANNA_TAGE, TAGE_LANG } from '@/lib/zeit';

export const dynamic = 'force-dynamic';
export const metadata = { title: BEREICHE.tafel.titel };

export default async function Tafel() {
  if (!(await imBund())) redirect('/dornbusch');

  const u = await lagerLaden();
  const datumProTag = Array.from({ length: 7 }, (_, i) => datumDesTages(i));
  const anzahl = u.stand.seelen.length;

  return (
    <>
      <Kopf woche={u.woche} naechsterSabbatIso={u.naechsterSabbatIso} spruchIndex={u.woche + u.heute} />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {/* Hinweise, die nur manchmal auftauchen */}
        {u.stand.sabbatGehalten && (
          <p className="tafel dark-tafel animate-aufstieg border-meer-300 bg-meer-50 p-3.5 text-sm dark:border-meer-900 dark:bg-meer-950/60">
            🌙 <strong>Sabbat gehalten.</strong> Seit Sonntag 20:00 war kein Reset mehr fällig –
            die Liste wurde soeben automatisch geleert. Frische Woche, frische Tafel.
          </p>
        )}
        {u.stand.verdorben > 0 && (
          <p className="tafel dark-tafel animate-aufstieg border-kalb-400 bg-kalb-50 p-3.5 text-sm dark:border-kalb-800 dark:bg-kalb-950/60">
            🍞 <strong>Manna-Regel angewendet.</strong> {u.stand.verdorben} {u.stand.verdorben === 1 ? 'Eintrag war' : 'Einträge waren'} älter
            als {MANNA_TAGE} Tage und {u.stand.verdorben === 1 ? 'wurde' : 'wurden'} gelöscht. «Es wuchsen Würmer darin.» (Ex 16,20)
          </p>
        )}
        {!u.stand.dauerhaft && (
          <p className="tafel dark-tafel border-flamme-300 bg-flamme-50 p-3.5 text-sm dark:border-flamme-900 dark:bg-flamme-950/60">
            ⚠️ <strong>Wüstenspeicher aktiv.</strong> Es ist keine Datenbank verbunden
            (<code className="font-mono text-xs">POSTGRES_URL</code>). Alles hier lebt nur im
            Arbeitsspeicher und ist beim nächsten Neustart weg – gut zum Ausprobieren,
            nicht für den Ernstfall.
          </p>
        )}

        {/* Kennzahlen */}
        <section aria-label="Kennzahlen der Woche" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Kachel gross zahl={anzahl} beschriftung="im Lager" unterzeile="Personen diese Woche" zeichen="👥" />
          <Kachel zahl={u.zaehler.einsatz} beschriftung={STATUS.einsatz.klar} unterzeile="Tage bis heute" zeichen={STATUS.einsatz.zeichen} />
          <Kachel zahl={u.zaehler.kalb} beschriftung={STATUS.kalb.klar} unterzeile="Rückfrage nötig" zeichen={STATUS.kalb.zeichen} alarm={u.zaehler.kalb > 0} />
          <Kachel zahl={u.zaehler.plage} beschriftung={STATUS.plage.klar} unterzeile="gemeldet" zeichen={STATUS.plage.zeichen} />
          <Kachel zahl={u.zaehler.segen} beschriftung={STATUS.segen.klar} unterzeile="abgesprochen" zeichen={STATUS.segen.zeichen} />
          <Kachel zahl={u.zaehler.offen} beschriftung={STATUS.offen.klar} unterzeile={`bis ${TAGE_LANG[u.heute]}`} zeichen="·" />
        </section>

        {/* Montagmorgen: Volk sammeln */}
        <section className="tafel dark-tafel p-5">
          <div className="mb-4">
            <h2 className="ueberschrift">⛺ {BEREICHE.berufung.titel}</h2>
            <p className="fluester mt-1">
              {BEREICHE.berufung.klar} – der Montagmorgen-Handgriff. «Und Moses versammelte die
              ganze Gemeinde.» (Ex 35,1)
            </p>
          </div>
          <Berufung bekannteLager={u.lagerNamen} />
        </section>

        {/* Die Woche */}
        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="ueberschrift">📜 {BEREICHE.tafel.titel}</h2>
              <p className="fluester mt-1">
                Ein Klick pro Tag und Person. Heute ist {TAGE_LANG[u.heute]} – die Spalte ist hervorgehoben.
              </p>
            </div>
            <div className="flex items-center gap-2 kein-druck">
              <a href="/api/auszug" className="btn-still text-xs" title="Als CSV für Excel herunterladen">
                📥 {BEREICHE.auszug.titel}
              </a>
              <Scherben anzahl={anzahl} />
            </div>
          </div>

          <Steintafel seelen={u.stand.seelen} heute={u.heute} datumProTag={datumProTag} />
        </section>

        <footer className="fluester space-y-1 pb-8 pt-2 text-center">
          <p>
            {APP_NAME} · Automatischer Reset jeden Sonntag um 20:00 (Schweizer Zeit) ·
            Nichts wird länger als {MANNA_TAGE} Tage aufbewahrt.
          </p>
          {u.stand.letzteScherbe && <p>Letzter Reset: {stempel(new Date(u.stand.letzteScherbe))}</p>}
          <p className="italic">«Und das Volk zog aus.» (Ex 12,41)</p>
        </footer>
      </main>
    </>
  );
}

function Kachel({
  zahl, beschriftung, unterzeile, zeichen, alarm, gross,
}: {
  zahl: number; beschriftung: string; unterzeile: string; zeichen: string;
  alarm?: boolean; gross?: boolean;
}) {
  return (
    <div
      className={`tafel dark-tafel px-3.5 py-3 ${
        alarm ? 'border-kalb-400 bg-kalb-50 dark:border-kalb-800 dark:bg-kalb-950/50' : ''
      } ${gross ? 'col-span-2 sm:col-span-1' : ''}`}
    >
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl leading-none" aria-hidden>{zeichen}</span>
        <span className="font-serif text-2xl font-bold tabular-nums leading-none">{zahl}</span>
      </div>
      <p className="mt-1.5 text-sm font-semibold leading-tight">{beschriftung}</p>
      <p className="fluester leading-tight">{unterzeile}</p>
    </div>
  );
}
