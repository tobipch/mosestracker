/**
 * Das Vokabular der Wanderung.
 *
 * Hier liegen alle Bezeichnungen, Zustaende und Bibel-Anspielungen an einem Ort -
 * damit die Oberflaeche verspielt sein darf, ohne dass jemand die Uebersicht verliert.
 * Regel: Jede Moses-Anspielung traegt eine nuechterne Erklaerung direkt daneben.
 */

export const APP_NAME = 'MOSES';
export const APP_LANG = 'Mitarbeiter-Organisation & Sabbat-Einsatz-System';
export const APP_CLAIM = 'Eine Wochentafel: wer war da, wer nicht.';

/** Zustand eines Tages fuer eine Person. */
export type Status = 'offen' | 'einsatz' | 'segen' | 'plage' | 'kalb';

export type StatusInfo = {
  key: Status;
  /** Was es nuechtern bedeutet - das steht ueberall zuerst. */
  klar: string;
  /** Die Moses-Variante. */
  biblisch: string;
  zeichen: string;
  kurz: string;
  /** Braucht der Berater hier eine Rueckfrage? */
  alarm: boolean;
  klassen: string;
  hilfe: string;
};

export const STATUS: Record<Status, StatusInfo> = {
  offen: {
    key: 'offen',
    klar: 'Offen',
    biblisch: 'Noch in der Wüste',
    zeichen: '·',
    kurz: '·',
    alarm: false,
    klassen:
      'border-sand-300 bg-sand-50 text-tafel-400 hover:bg-sand-200 dark:border-tafel-700 dark:bg-tafel-900 dark:text-tafel-500 dark:hover:bg-tafel-800',
    hilfe: 'Kein Rapport, keine Meldung. Sobald der Tag vorbei ist, gehört das nachgefragt.',
  },
  einsatz: {
    key: 'einsatz',
    klar: 'Gearbeitet',
    biblisch: 'Im Einsatz am Bau',
    zeichen: '✓',
    kurz: '✓',
    alarm: false,
    klassen:
      'border-manna-300 bg-manna-100 text-manna-800 hover:bg-manna-200 dark:border-manna-800 dark:bg-manna-950 dark:text-manna-300',
    hilfe: 'Person war auf der Baustelle, Stunden sind im Rapport. Alles gut.',
  },
  segen: {
    key: 'segen',
    klar: 'Frei / abgemeldet',
    biblisch: 'Mit Segen abwesend',
    zeichen: '☾',
    kurz: '☾',
    alarm: false,
    klassen:
      'border-meer-300 bg-meer-100 text-meer-800 hover:bg-meer-200 dark:border-meer-800 dark:bg-meer-950 dark:text-meer-300',
    hilfe: 'Ferien, Feiertag, bewilligter freier Tag - vorher abgesprochen, kein Handlungsbedarf.',
  },
  plage: {
    key: 'plage',
    klar: 'Krank gemeldet',
    biblisch: 'Von einer Plage getroffen',
    zeichen: '✚',
    kurz: '✚',
    alarm: false,
    klassen:
      'border-flamme-300 bg-flamme-100 text-flamme-800 hover:bg-flamme-200 dark:border-flamme-800 dark:bg-flamme-950 dark:text-flamme-300',
    hilfe: 'Krankheit ist gemeldet. Arztzeugnis im Auge behalten, aber die Abwesenheit ist geklärt.',
  },
  kalb: {
    key: 'kalb',
    klar: 'Unentschuldigt gefehlt',
    biblisch: 'Tanzte ums goldene Kalb',
    zeichen: '🐂',
    kurz: '🐂',
    alarm: true,
    klassen:
      'border-kalb-400 bg-kalb-200 text-kalb-900 hover:bg-kalb-300 dark:border-kalb-700 dark:bg-kalb-950 dark:text-kalb-300',
    hilfe: 'Nicht erschienen, nicht abgemeldet. Das ist der Fall, der sofort auf die Rückfrage-Liste gehört.',
  },
};

/** Reihenfolge beim Durchklicken einer Zelle. */
export const STATUS_ZYKLUS: Status[] = ['offen', 'einsatz', 'kalb', 'plage', 'segen'];

export function naechsterStatus(aktuell: Status): Status {
  const i = STATUS_ZYKLUS.indexOf(aktuell);
  return STATUS_ZYKLUS[(i + 1) % STATUS_ZYKLUS.length];
}

/** Zitate, die im Kopf der Seite rotieren. Reine Deko - null Funktion. */
export const SPRUECHE: string[] = [
  '«Lass mein Volk ziehen.» – aber bitte erst nach der Zeiterfassung. (Ex 5,1)',
  '«Ich habe das Elend meines Volkes gesehen.» – und auch die fehlenden Rapporte. (Ex 3,7)',
  'Vierzig Jahre Wüste sind nichts gegen eine Woche ohne Übersicht.',
  '«Zieh deine Schuhe aus» – aber die Sicherheitsschuhe bleiben an. (Ex 3,5)',
  'Das Meer teilt sich. Die Stundenrapporte leider nicht von selbst.',
  '«Du sollst nicht falsch Zeugnis reden» – auch nicht über geleistete Stunden. (Ex 20,16)',
  'Manna verdirbt nach einem Tag. Diese Daten nach vierzehn. (Ex 16,20)',
  'Wer ums goldene Kalb tanzt, steht am Montag nicht auf der Baustelle.',
  'Zehn Plagen hat Ägypten überstanden. Ein fehlender Monteur bringt eine Baustelle zum Stillstand.',
  '«Sechs Tage sollst du arbeiten.» Der siebte gehört dem Reset. (Ex 34,21)',
  'Aaron redete, Moses führte, die Tabelle zählte.',
  'Der Dornbusch brannte und verbrannte nicht – so soll auch dein Sonntag sein.',
  'Ein Stab wird zur Schlange, ein Kreuzchen wird zur Rechnung.',
  'Die Wolkensäule zeigte den Weg. Diese Liste zeigt die Lücken.',
  '«Wer ist auf des HERRN Seite?» – und wer war heute auf der Baustelle? (Ex 32,26)',
];

export function spruchDesTages(saat: number): string {
  return SPRUECHE[Math.abs(saat) % SPRUECHE.length];
}

/** Namen der Bereiche - biblisch mit nuechternem Untertitel. */
export const BEREICHE = {
  dornbusch: { titel: 'Der brennende Dornbusch', klar: 'Anmeldung' },
  berufung: { titel: 'Berufung ins Lager', klar: 'Neue Leute erfassen' },
  tafel: { titel: 'Die Steintafel', klar: 'Wochenübersicht' },
  rauchsaeule: { titel: 'Die Rauchsäule', klar: 'Wo du nachfragen musst' },
  auszug: { titel: 'Der Auszug', klar: 'CSV-Export' },
  scherben: { titel: 'Tafeln zerbrechen', klar: 'Liste zurücksetzen' },
  bundeslade: { titel: 'Die Bundeslade', klar: 'Sicherheit & Datenschutz' },
  gebote: { titel: 'Die zehn Gebote', klar: 'Kurzanleitung' },
  midian: { titel: 'Rückzug nach Midian', klar: 'Abmelden' },
} as const;

/** Zufaellige Bestaetigungsmeldung nach einer Aktion. */
export const JUBEL: string[] = [
  'Das Meer hat sich geteilt.',
  'Aufgezeichnet auf der Steintafel.',
  'Der Dornbusch nickt zufrieden.',
  'Mirjam greift zum Tamburin.',
  'Ins Lager aufgenommen.',
  'Notiert - Aaron hat es gesehen.',
];

export function jubel(): string {
  return JUBEL[Math.floor(Math.random() * JUBEL.length)];
}
