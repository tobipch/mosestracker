import type { Marke, Person, Wochenstatus, Zeile, Zellstatus } from './typen';
import { TAGE_IM_RASTER } from './zeit';

/**
 * Auswertung der Steintafel - reine Funktionen, laufen auf Server und Client.
 * Dadurch stimmt die Anzeige sofort nach einem Klick, ohne auf den Server zu warten.
 */

/**
 * Was zeigt eine Zelle? Anwesenheit ist der Normalfall an einem Werktag und
 * wird gar nicht gespeichert - nur Abweichungen stehen in `marken`.
 */
export function zellstatus(person: Person, marken: Zeile['marken'], spalte: number): Zellstatus {
  const marke = marken[spalte];
  if (marke) return marke;
  return person.werktage.includes(spalte) ? 'anwesend' : 'frei';
}

/**
 * Die Zusammenfassung einer Woche:
 * mindestens eine unentschuldigte Absenz schlaegt alles, danach die
 * entschuldigte, sonst war die Woche vollstaendig.
 */
export function wochenstatus(marken: Zeile['marken']): Wochenstatus {
  let segen = false;
  for (let spalte = 0; spalte < TAGE_IM_RASTER; spalte++) {
    const marke = marken[spalte];
    if (marke === 'unentschuldigt') return 'kalb';
    if (marke === 'entschuldigt') segen = true;
  }
  return segen ? 'segen' : 'rein';
}

/**
 * Reihenfolge der Tabelle: offene Rapporte zuoberst - um die geht es.
 * Erledigte rutschen ans Ende. Innerhalb der Gruppen alphabetisch.
 */
export function sortieren(zeilen: Zeile[]): Zeile[] {
  return [...zeilen].sort(
    (a, b) =>
      Number(a.rapport) - Number(b.rapport) ||
      a.name.localeCompare(b.name, 'de-CH'),
  );
}

/** Kennzahlen der angezeigten Woche. */
export function zaehlen(zeilen: Zeile[]) {
  let offen = 0, rein = 0, segen = 0, kalb = 0, entschuldigteTage = 0, unentschuldigteTage = 0;
  for (const z of zeilen) {
    if (!z.rapport) offen++;
    const status = wochenstatus(z.marken);
    if (status === 'rein') rein++;
    else if (status === 'segen') segen++;
    else kalb++;
    for (const marke of Object.values(z.marken) as Marke[]) {
      if (marke === 'entschuldigt') entschuldigteTage++;
      else if (marke === 'unentschuldigt') unentschuldigteTage++;
    }
  }
  return {
    personen: zeilen.length,
    offeneRapporte: offen,
    rein, segen, kalb,
    entschuldigteTage, unentschuldigteTage,
  };
}
