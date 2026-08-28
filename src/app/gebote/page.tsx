import Link from 'next/link';
import Kopf from '@/components/Kopf';
import { imBund } from '@/lib/session';
import { APP_NAME, APP_LANG, BEREICHE, ZELLE, WOCHE } from '@/lib/moses';
import { MANNA_TAGE, TAGE_KURZ, WERKTAGE_STANDARD } from '@/lib/zeit';

export const dynamic = 'force-dynamic';
export const metadata = { title: BEREICHE.gebote.titel };

const standard = `${TAGE_KURZ[WERKTAGE_STANDARD[0]]}–${TAGE_KURZ[WERKTAGE_STANDARD[WERKTAGE_STANDARD.length - 1]]}`;

const GEBOTE: { titel: string; text: string }[] = [
  {
    titel: 'Du sollst dein Volk einmal mustern.',
    text: `Unter «Musterung» stehen alle Personen – eine zentrale Liste, die für jede Kalenderwoche gilt. Namen ins Badge-Feld, Enter, «Ins Lager rufen». Ganze Listen aus Mail oder Excel dürfen direkt hinein: Komma, Semikolon und Zeilenumbruch trennen automatisch.`,
  },
  {
    titel: 'Du sollst die Werktage setzen.',
    text: `Jede Person startet mit ${standard}. Ein Klick auf ${TAGE_KURZ.join(', ')} schaltet den Tag um. Nicht-Werktage bleiben in der Wochentafel leer.`,
  },
  {
    titel: 'Du sollst jederzeit aufnehmen und tilgen dürfen.',
    text: 'Die Liste ist immer änderbar. Wird eine Person getilgt, verschwinden alle ihre Wochendaten mit ihr – restlos, in jeder Woche.',
  },
  {
    titel: 'Du sollst annehmen, dass alle da waren.',
    text: 'Jeder Werktag ist grün, ohne dass du etwas tust. Nur Abweichungen kostet dich Klicks – und Abweichungen sind die Ausnahme.',
  },
  {
    titel: 'Du sollst mit einem Klick weiterschalten.',
    text: 'Grün → orange (entschuldigt) → rot (unentschuldigt) → wieder grün. Auch leere Felder lassen sich anklicken, falls jemand an einem freien Tag hätte einspringen sollen.',
  },
  {
    titel: 'Du sollst den Punkt vor dem Namen lesen.',
    text: 'Er fasst die Woche zusammen: grün = durchgehend anwesend, orange = mindestens eine entschuldigte Absenz, rot = mindestens eine unentschuldigte. Eine rote Zeile ist die, um die es geht.',
  },
  {
    titel: 'Du sollst abhaken, was eingegangen ist.',
    text: 'Kommt ein Rapport, setzt du links das Häkchen. Die Zeile wird blass und rutscht ans Ende. Was oben stehen bleibt, ist deine Arbeitsliste – genau die Handvoll, bei der noch etwas fehlt.',
  },
  {
    titel: 'Du sollst zurückblicken dürfen.',
    text: 'Mit «Vorige Etappe» springst du in die letzte Kalenderwoche – dort machst du in der Regel die Kontrolle. «Zur laufenden Woche» bringt dich zurück. Weiter zurück geht es nicht, weil dort nichts mehr liegt.',
  },
  {
    titel: 'Du sollst dich am heutigen Tag orientieren.',
    text: 'In der laufenden Woche ist die Spalte des heutigen Tages leicht blau hinterlegt und mit einem Punkt markiert.',
  },
  {
    titel: 'Du sollst kein Manna horten.',
    text: `Wochendaten verfallen nach ${MANNA_TAGE} Tagen und werden endgültig gelöscht – bei jedem Aufruf und einmal täglich per Cron. Die Personenliste selbst bleibt, sie gehört dir.`,
  },
];

const BUNDESLADE: { titel: string; text: string }[] = [
  {
    titel: 'Ein Losungswort, sicher verwahrt',
    text: 'Das Passwort steht nirgends im Klartext: gespeichert wird ein scrypt-Hash in einer Umgebungsvariablen, verglichen wird zeitkonstant.',
  },
  {
    titel: 'Wache am Lagertor',
    text: 'Nach fünf Fehlversuchen ist für 15 Minuten Schluss. Gezählt wird über einen gesalzenen Hash der IP-Adresse, der nach 24 Stunden verschwindet.',
  },
  {
    titel: 'Sitzung mit Ablaufdatum',
    text: 'Die Anmeldung liegt in einem signierten Cookie (HttpOnly, Secure, SameSite=Strict) und verfällt nach 8 Stunden. Jede schreibende Aktion prüft sie serverseitig erneut.',
  },
  {
    titel: 'Keine fremden Götter',
    text: 'Kein Tracking, keine Analytics, keine externen Schriften, keine CDN-Skripte. Die Content-Security-Policy erlaubt ausschliesslich Inhalte dieser Seite; einbetten lässt sie sich nirgends.',
  },
  {
    titel: 'Datensparsam von Grund auf',
    text: 'Gespeichert werden Name, Werktage und pro Woche die Abweichungen samt Rapport-Häkchen. Anwesenheit selbst wird gar nicht erst gespeichert – sie ist der Normalfall. Kein Verlauf, kein Änderungsprotokoll.',
  },
  {
    titel: `Wochendaten verfallen nach ${MANNA_TAGE} Tagen`,
    text: 'Jede Wochentafel kennt ihren Montag. Was älter ist, wird gelöscht – ohne Papierkorb, ohne Archiv.',
  },
  {
    titel: 'Die Personenliste bleibt – bewusst',
    text: 'Damit die Liste zentral und dauerhaft nutzbar ist, verfällt sie nicht automatisch. Sie enthält nur Namen und Werktage. Wer eine Person nicht mehr braucht, tilgt sie; «Tafeln zerbrechen» räumt alles auf einmal ab.',
  },
  {
    titel: 'Und trotzdem: heikle Daten',
    text: 'Namen von Mitarbeitenden samt Absenzen sind Personendaten im Sinne des Schweizer DSG. Zugang nur für die, die ihn brauchen; Passwort nicht teilen.',
  },
];

export default async function Gebote() {
  const angemeldet = await imBund();
  const zellen = ['anwesend', 'entschuldigt', 'unentschuldigt', 'frei'] as const;
  const wochen = ['rein', 'segen', 'kalb'] as const;

  return (
    <>
      <Kopf spruchIndex={3} aktiv="gebote" angemeldet={angemeldet} />

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-8">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">📖 {BEREICHE.gebote.titel}</h1>
          <p className="fluester mt-1">
            {APP_NAME} – {APP_LANG}. Alles zum Bedienen auf einer Seite.
          </p>
        </div>

        <section className="tafel dark-tafel p-5">
          <h2 className="ueberschrift mb-1">Der Ablauf in drei Handgriffen</h2>
          <ol className="mt-3 space-y-2.5 text-sm">
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-meer-700 text-xs font-bold text-white">1</span>
              <span><strong>Einmalig:</strong> unter «Musterung» alle Personen erfassen und die Werktage setzen.</span>
            </li>
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-meer-700 text-xs font-bold text-white">2</span>
              <span><strong>Laufend:</strong> Absenzen anklicken – orange für entschuldigt, rot für unentschuldigt.</span>
            </li>
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-meer-700 text-xs font-bold text-white">3</span>
              <span><strong>Nächste Woche:</strong> «Vorige Etappe» öffnen und jeden eingegangenen Rapport abhaken. Was oben übrig bleibt, ist deine Arbeitsliste.</span>
            </li>
          </ol>
        </section>

        <section className="tafel dark-tafel p-5">
          <h2 className="ueberschrift mb-3">Die vier Felder</h2>
          <ul className="space-y-2.5">
            {zellen.map((k) => {
              const info = ZELLE[k];
              return (
                <li key={k} className="flex items-start gap-3">
                  <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-sm font-semibold ${info.klassen}`}>
                    <span aria-hidden>{info.zeichen || '·'}</span>
                  </span>
                  <span className="text-sm">
                    <strong>{info.klar}</strong>
                    <span className="text-tafel-500"> · «{info.biblisch}»</span>
                    <br />
                    <span className="fluester">{info.hilfe}</span>
                  </span>
                </li>
              );
            })}
          </ul>

          <h3 className="ueberschrift mb-2 mt-5 text-base">Der Punkt vor dem Namen</h3>
          <ul className="space-y-1.5">
            {wochen.map((k) => {
              const info = WOCHE[k];
              return (
                <li key={k} className="flex items-center gap-2.5 text-sm">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${info.punkt}`} aria-hidden />
                  <span>
                    <strong>{info.klar}</strong>
                    <span className="text-tafel-500"> · «{info.biblisch}»</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="tafel dark-tafel p-5">
          <h2 className="ueberschrift mb-3">Die zehn Gebote</h2>
          <ol className="space-y-3">
            {GEBOTE.map((g, i) => (
              <li key={g.titel} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-sand-300 bg-sand-100 font-serif text-sm font-bold dark:border-tafel-700 dark:bg-tafel-800">
                  {i + 1}
                </span>
                <span className="text-sm">
                  <strong className="block">{g.titel}</strong>
                  <span className="text-tafel-600 dark:text-sand-300">{g.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="tafel dark-tafel border-meer-300/70 p-5 dark:border-meer-900">
          <h2 className="ueberschrift mb-1">🗄️ {BEREICHE.bundeslade.titel}</h2>
          <p className="fluester mb-3">{BEREICHE.bundeslade.klar}</p>
          <ul className="space-y-3">
            {BUNDESLADE.map((b) => (
              <li key={b.titel} className="text-sm">
                <strong className="block">🔒 {b.titel}</strong>
                <span className="text-tafel-600 dark:text-sand-300">{b.text}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="fluester pb-8 text-center">
          <Link href={angemeldet ? '/tafel' : '/dornbusch'} className="underline underline-offset-2 hover:text-flamme-700">
            {angemeldet ? '← Zurück zur Steintafel' : '← Zum Dornbusch'}
          </Link>
        </p>
      </main>
    </>
  );
}
