/** Reine Datentypen - bewusst ohne Server-Abhaengigkeiten, damit auch
 *  Client-Komponenten sie verwenden koennen. */

/** Was in einer Zelle abweichend vermerkt wird. Anwesenheit ist der Normalfall
 *  und wird deshalb gar nicht gespeichert. */
export type Marke = 'entschuldigt' | 'unentschuldigt';

/** Was eine Zelle anzeigt - ergibt sich aus Werktag und Marke. */
export type Zellstatus = 'anwesend' | 'frei' | Marke;

/** Zusammenfassung einer Woche pro Person. */
export type Wochenstatus = 'rein' | 'segen' | 'kalb';

/** Eine Person auf der zentralen Liste. */
export type Person = {
  id: string;
  name: string;
  /** Spaltenindizes 0 = Montag ... 5 = Samstag. */
  werktage: number[];
  erfasstAm: string; // ISO
};

/** Eine Person mit ihren Eintraegen fuer genau eine Kalenderwoche. */
export type Zeile = Person & {
  marken: Partial<Record<number, Marke>>;
  /** Rapport ist eingegangen - die Zeile ist erledigt. */
  rapport: boolean;
};
