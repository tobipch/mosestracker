/**
 * Das Vokabular der Wanderung.
 *
 * Alle Bezeichnungen und Bibel-Anspielungen an einem Ort - damit die
 * Oberflaeche verspielt sein darf, ohne dass jemand die Uebersicht verliert.
 * Regel: Jede Moses-Anspielung traegt ihre nuechterne Erklaerung daneben.
 */

import type { Marke, Wochenstatus, Zellstatus } from './typen';

export const APP_NAME = 'MOSES';
export const APP_LANG = 'Mitarbeiter-Organisation & Sabbat-Einsatz-System';
export const APP_CLAIM = 'Eine Wochentafel: wer war da, wer nicht.';

/* ----------------------------- Zellen ------------------------------- */

export type ZellInfo = {
  klar: string;
  biblisch: string;
  zeichen: string;
  klassen: string;
  hilfe: string;
};

export const ZELLE: Record<Zellstatus, ZellInfo> = {
  anwesend: {
    klar: 'Anwesend',
    biblisch: 'Im Einsatz am Bau',
    zeichen: '✓',
    klassen:
      'border-manna-400 bg-manna-200 text-manna-900 hover:bg-manna-300 ' +
      'dark:border-manna-700 dark:bg-manna-900/70 dark:text-manna-200 dark:hover:bg-manna-800',
    hilfe: 'Der Normalfall: Werktag, niemand hat etwas anderes gemeldet.',
  },
  entschuldigt: {
    klar: 'Entschuldigt abwesend',
    biblisch: 'Mit Segen abwesend',
    zeichen: '!',
    klassen:
      'border-bernstein-500 bg-bernstein-200 text-bernstein-900 hover:bg-bernstein-300 ' +
      'dark:border-bernstein-400 dark:bg-bernstein-500/45 dark:text-bernstein-50 dark:hover:bg-bernstein-500/60',
    hilfe: 'Ferien, Krankmeldung, bewilligter freier Tag – abgesprochen, kein Handlungsbedarf.',
  },
  unentschuldigt: {
    klar: 'Unentschuldigt abwesend',
    biblisch: 'Tanzte ums goldene Kalb',
    zeichen: '✗',
    klassen:
      'border-rot-500 bg-rot-200 text-rot-900 hover:bg-rot-300 ' +
      'dark:border-rot-700 dark:bg-rot-900/70 dark:text-rot-100 dark:hover:bg-rot-800',
    hilfe: 'Nicht erschienen, nicht abgemeldet. Genau der Fall, um den es geht.',
  },
  frei: {
    klar: 'Kein Werktag',
    biblisch: 'Sabbatruhe',
    zeichen: '',
    // Wirklich leer: erst beim Darueberfahren zeigt sich, dass man klicken kann.
    klassen:
      'border-transparent bg-transparent text-transparent hover:border-dashed hover:border-sand-400 ' +
      'dark:hover:border-tafel-600',
    hilfe: 'Für diese Person kein Arbeitstag. Anklickbar bleibt das Feld trotzdem.',
  },
};

/** Klick-Reihenfolge einer Zelle. Der Grundzustand haengt am Werktag. */
export function naechsteMarke(aktuell: Marke | null): Marke | null {
  if (aktuell === null) return 'entschuldigt';
  if (aktuell === 'entschuldigt') return 'unentschuldigt';
  return null;
}

/* --------------------------- Wochenstatus ---------------------------- */

export type WochenInfo = {
  klar: string;
  biblisch: string;
  punkt: string;
  zeile: string;
  pille: string;
};

export const WOCHE: Record<Wochenstatus, WochenInfo> = {
  rein: {
    klar: 'Vollständig anwesend',
    biblisch: 'Reine Woche',
    punkt: 'bg-manna-500',
    zeile: 'bg-manna-50/70 dark:bg-manna-950/30',
    pille: 'bg-manna-200 text-manna-900 dark:bg-manna-900 dark:text-manna-200',
  },
  segen: {
    klar: 'Entschuldigte Absenz',
    biblisch: 'Mit Segen abwesend',
    punkt: 'bg-bernstein-400',
    zeile: 'bg-bernstein-50/80 dark:bg-bernstein-500/10',
    pille: 'bg-bernstein-200 text-bernstein-900 dark:bg-bernstein-500/40 dark:text-bernstein-50',
  },
  kalb: {
    klar: 'Unentschuldigte Absenz',
    biblisch: 'Goldenes Kalb',
    punkt: 'bg-rot-500',
    zeile: 'bg-rot-50/70 dark:bg-rot-950/30',
    pille: 'bg-rot-200 text-rot-900 dark:bg-rot-900 dark:text-rot-100',
  },
};

/* ----------------------------- Bereiche ------------------------------ */

export const BEREICHE = {
  dornbusch: { titel: 'Der brennende Dornbusch', klar: 'Anmeldung' },
  tafel: { titel: 'Die Steintafel', klar: 'Kalenderwochenübersicht' },
  volk: { titel: 'Die Musterung', klar: 'Zentrale Personenliste' },
  berufung: { titel: 'Berufung ins Lager', klar: 'Personen hinzufügen' },
  scherben: { titel: 'Tafeln zerbrechen', klar: 'Alles löschen' },
  bundeslade: { titel: 'Die Bundeslade', klar: 'Sicherheit & Datenschutz' },
  gebote: { titel: 'Die zehn Gebote', klar: 'Kurzanleitung' },
  midian: { titel: 'Rückzug nach Midian', klar: 'Abmelden' },
} as const;

/* ----------------------------- Sprüche ------------------------------- */

export const SPRUECHE: string[] = [
  '«Lass mein Volk ziehen.» – aber bitte erst nach der Zeiterfassung. (Ex 5,1)',
  '«Ich habe das Elend meines Volkes gesehen.» – und auch die fehlenden Rapporte. (Ex 3,7)',
  'Vierzig Jahre Wüste sind nichts gegen eine Woche ohne Übersicht.',
  '«Zieh deine Schuhe aus» – aber die Sicherheitsschuhe bleiben an. (Ex 3,5)',
  'Das Meer teilt sich. Die Stundenrapporte leider nicht von selbst.',
  '«Du sollst nicht falsch Zeugnis reden» – auch nicht über geleistete Stunden. (Ex 20,16)',
  'Manna verdirbt nach einem Tag. Diese Wochendaten nach fünf Kalenderwochen. (Ex 16,20)',
  'Wer ums goldene Kalb tanzt, steht am Montag nicht auf der Baustelle.',
  'Zehn Plagen hat Ägypten überstanden. Ein fehlender Mann bringt eine Etappe zum Stillstand.',
  '«Sechs Tage sollst du arbeiten.» Genau deshalb hört diese Tafel am Samstag auf. (Ex 34,21)',
  'Aaron redete, Moses führte, die Tabelle zählte.',
  'Der Dornbusch brannte und verbrannte nicht – so soll auch dein Sonntag sein.',
  'Ein Stab wird zur Schlange, ein Häkchen wird zur Gewissheit.',
  'Die Wolkensäule zeigte den Weg. Diese Liste zeigt die Lücken.',
  '«Wer ist auf des HERRN Seite?» – und wer war heute auf der Baustelle? (Ex 32,26)',
  'Moses zählte sein Volk, Kopf für Kopf. (Num 1,2) Du auch, Woche für Woche.',
];
