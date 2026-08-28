import Link from 'next/link';
import Kopf from '@/components/Kopf';
import { imBund } from '@/lib/session';
import { APP_NAME, APP_LANG, BEREICHE, STATUS, STATUS_ZYKLUS } from '@/lib/moses';
import { kalenderwoche, naechsterSabbat, MANNA_TAGE } from '@/lib/zeit';

export const dynamic = 'force-dynamic';
export const metadata = { title: BEREICHE.gebote.titel };

const GEBOTE: { titel: string; text: string }[] = [
  {
    titel: 'Du sollst am Montagmorgen dein Volk sammeln.',
    text: 'Namen ins Badge-Feld tippen, Enter drücken, «Ins Lager rufen». Ganze Listen aus Mail oder Excel dürfen direkt hineinkopiert werden – Komma, Semikolon und Zeilenumbruch trennen automatisch.',
  },
  {
    titel: 'Du sollst die Baustelle dazuschreiben.',
    text: 'Entweder für alle auf einmal im Feld darunter, oder pro Person mit «Name @Baustelle». Die Tafel gruppiert danach, damit du pro Einsatzort lesen kannst.',
  },
  {
    titel: 'Du sollst nur erfassen, was du brauchst.',
    text: 'Name, Baustelle, sieben Tageszeichen, eine kurze Notiz. Keine Geburtsdaten, keine AHV-Nummern, keine Adressen. Was nicht erfasst wird, kann auch nicht verloren gehen.',
  },
  {
    titel: 'Du sollst abhaken, was der Rapport bestätigt.',
    text: 'Ein Klick auf eine Zelle schaltet weiter. Wer die ganze Woche gearbeitet hat, bekommt mit «✓✓» in einem Griff sieben Haken. Kommt der Wochenrapport am Stück, setzt «alle ✓» in der Spaltenüberschrift den ganzen Tag.',
  },
  {
    titel: 'Du sollst das goldene Kalb beim Namen nennen.',
    text: 'Wer ohne Abmeldung nicht erschienen ist, bekommt 🐂. Genau diese Fälle gehen sonst unter, weil im Rapport schlicht keine Stunden stehen.',
  },
  {
    titel: 'Du sollst der Rauchsäule folgen.',
    text: 'Ganz oben steht, bei wem eine Rückfrage fällig ist – unentschuldigtes Fehlen zuerst, danach vergangene Tage ganz ohne Meldung. Mit «Liste kopieren» wandert alles fixfertig in Mail oder WhatsApp.',
  },
  {
    titel: 'Du sollst den Auszug nehmen, wenn du Zahlen brauchst.',
    text: 'Der Knopf «Auszug» lädt die Woche als CSV herunter, semikolongetrennt für Excel. Danach lebt die Datei bei dir – nicht mehr hier.',
  },
  {
    titel: 'Du sollst den Sabbat heiligen.',
    text: 'Jeden Sonntag um 20:00 (Schweizer Zeit) leert sich die Liste von selbst. Fällt der Cron-Job einmal aus, holt die App den Reset beim nächsten Aufruf nach. Du musst dafür nichts tun.',
  },
  {
    titel: 'Du sollst die Tafeln zerbrechen dürfen.',
    text: 'Der rote Knopf löscht sofort alles – aber erst, nachdem du SINAI getippt hast. Zwei Schritte, damit es nie aus Versehen passiert.',
  },
  {
    titel: 'Du sollst kein Manna horten.',
    text: `Nichts bleibt länger als ${MANNA_TAGE} Tage gespeichert. Ältere Einträge werden bei jedem Aufruf und einmal täglich per Cron gelöscht – ohne Papierkorb, ohne Archiv, ohne Backup-Kopie in der App.`,
  },
];

const BUNDESLADE: { titel: string; text: string }[] = [
  {
    titel: 'Ein Losungswort, sicher verwahrt',
    text: 'Das Passwort steht nirgends im Klartext: gespeichert wird ein scrypt-Hash in einer Umgebungsvariablen. Verglichen wird zeitkonstant, damit sich das Passwort nicht Zeichen für Zeichen erraten lässt.',
  },
  {
    titel: 'Wache am Lagertor',
    text: 'Nach fünf Fehlversuchen ist für 15 Minuten Schluss. Gezählt wird pro Absender – gespeichert wird dabei nur ein gesalzener Hash der IP-Adresse, der nach 24 Stunden verschwindet.',
  },
  {
    titel: 'Sitzung mit Ablaufdatum',
    text: 'Die Anmeldung liegt in einem signierten Cookie (HttpOnly, Secure, SameSite=Strict) und verfällt nach 8 Stunden. JavaScript im Browser kommt nicht heran, fremde Seiten können es nicht mitschicken.',
  },
  {
    titel: 'Keine fremden Götter',
    text: 'Kein Tracking, keine Analytics, keine externen Schriften, keine CDN-Skripte. Die Content-Security-Policy erlaubt ausschliesslich Inhalte dieser Seite; die Seite darf in keinem fremden Rahmen eingebettet werden.',
  },
  {
    titel: 'Nicht auffindbar',
    text: 'Suchmaschinen werden per robots.txt und Header ausgesperrt, Referrer werden nicht weitergegeben.',
  },
  {
    titel: 'Datensparsam von Grund auf',
    text: 'Gespeichert werden Name, Baustelle, sieben Tageszeichen und eine optionale Notiz. Kein Verlauf, kein Änderungsprotokoll, keine zweite Kopie – ein Reset löscht die Zeilen wirklich (DELETE, kein «gelöscht»-Häkchen).',
  },
  {
    titel: `Verfall nach ${MANNA_TAGE} Tagen`,
    text: 'Jeder Eintrag trägt seinen Erfassungszeitpunkt. Was älter ist, wird beim nächsten Seitenaufruf und zusätzlich einmal täglich per Cron endgültig gelöscht. Der wöchentliche Reset kommt ohnehin früher.',
  },
  {
    titel: 'Und trotzdem: heikle Daten',
    text: 'Namen von Mitarbeitenden samt Krankmeldungen sind Personendaten im Sinne des Schweizer DSG. Zugang nur für die Personen, die ihn wirklich brauchen; Passwort nicht teilen; Auszüge nach Gebrauch löschen.',
  },
];

export default async function Gebote() {
  const angemeldet = await imBund();

  return (
    <>
      <Kopf
        woche={kalenderwoche()}
        naechsterSabbatIso={naechsterSabbat().toISOString()}
        spruchIndex={3}
        angemeldet={angemeldet}
      />

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">📜 {BEREICHE.gebote.titel}</h1>
          <p className="fluester mt-1">
            {APP_NAME} – {APP_LANG}. Alles, was du zum Bedienen brauchst, auf einer Seite.
          </p>
        </div>

        <section className="tafel dark-tafel p-5">
          <h2 className="ueberschrift mb-1">Der Wochenlauf in drei Handgriffen</h2>
          <ol className="mt-3 space-y-2.5 text-sm">
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-meer-700 text-xs font-bold text-white">1</span>
              <span><strong>Montagmorgen:</strong> Namen ins Badge-Feld, Baustelle dazu, «Ins Lager rufen».</span>
            </li>
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-meer-700 text-xs font-bold text-white">2</span>
              <span><strong>Wenn der Rapport kommt:</strong> Tage abhaken. Was fehlt, bleibt offen – und taucht in der Rauchsäule auf.</span>
            </li>
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-meer-700 text-xs font-bold text-white">3</span>
              <span><strong>Sonntag 20:00:</strong> nichts tun. Die Liste leert sich selbst.</span>
            </li>
          </ol>
        </section>

        <section className="tafel dark-tafel p-5">
          <h2 className="ueberschrift mb-3">Die fünf Zeichen</h2>
          <ul className="space-y-2.5">
            {STATUS_ZYKLUS.map((s) => {
              const info = STATUS[s];
              return (
                <li key={s} className="flex items-start gap-3">
                  <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-base ${info.klassen}`}>
                    <span aria-hidden>{info.zeichen}</span>
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
          <p className="fluester mb-3">
            {BEREICHE.bundeslade.klar} – was diese App tut, damit die Daten sicher bleiben.
          </p>
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
