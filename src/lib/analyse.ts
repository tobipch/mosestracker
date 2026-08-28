import { STATUS, type Status } from './moses';
import type { Seele, Rueckfrage } from './typen';

/**
 * Auswertung der Steintafel - reine Funktionen, laufen auf Server und Client.
 * Damit zeigt die Rauchsaeule sofort das Ergebnis eines Klicks an.
 */

/**
 * Die Rauchsaeule: Wer braucht eine Rueckfrage?
 * Nur bereits vergangene Tage zaehlen - der laufende Tag ist noch nicht faellig.
 */
export function rueckfragenBilden(seelen: Seele[], heute: number): Rueckfrage[] {
  const liste: Rueckfrage[] = [];
  for (const seele of seelen) {
    const offeneTage: number[] = [];
    const kalbTage: number[] = [];
    for (let t = 0; t < heute; t++) {
      const status = seele.marken[t] ?? 'offen';
      if (status === 'kalb') kalbTage.push(t);
      else if (status === 'offen') offeneTage.push(t);
    }
    if (!offeneTage.length && !kalbTage.length) continue;
    liste.push({
      seele,
      offeneTage,
      kalbTage,
      dringlichkeit: kalbTage.length * 10 + offeneTage.length,
    });
  }
  return liste.sort(
    (a, b) =>
      b.dringlichkeit - a.dringlichkeit ||
      a.seele.name.localeCompare(b.seele.name, 'de-CH'),
  );
}

/** Zaehlt die Zustaende bis einschliesslich heute. */
export function zaehlen(seelen: Seele[], heute: number): Record<Status, number> {
  const z: Record<Status, number> = { offen: 0, einsatz: 0, segen: 0, plage: 0, kalb: 0 };
  for (const seele of seelen) {
    for (let t = 0; t <= heute; t++) z[seele.marken[t] ?? 'offen']++;
  }
  return z;
}

/** Alle vorkommenden Baustellen, alphabetisch. */
export function lagerNamen(seelen: Seele[]): string[] {
  return [...new Set(seelen.map((s) => s.lager).filter((x): x is string => !!x))].sort((a, b) =>
    a.localeCompare(b, 'de-CH'),
  );
}

/** Der Auszug: CSV fuer Excel (Semikolon + BOM, wie es die Schweiz mag). */
export function auszugBauen(seelen: Seele[], stempelFn: (d: Date) => string): string {
  const kopf = [
    'Name', 'Baustelle', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So', 'Notiz', 'Erfasst am',
  ];
  const zeilen = seelen.map((s) => {
    const tage = Array.from({ length: 7 }, (_, t) => STATUS[s.marken[t] ?? 'offen'].klar);
    return [s.name, s.lager ?? '', ...tage, s.notiz ?? '', stempelFn(new Date(s.erfasstAm))];
  });
  // Fuehrende Formelzeichen entschaerfen, damit Excel keinen CSV-Injection-Unfug ausfuehrt.
  const feld = (w: string) => {
    const text = /^[=+\-@\t\r]/.test(w) ? `'${w}` : w;
    return `"${text.replace(/"/g, '""')}"`;
  };
  return '\ufeff' + [kopf, ...zeilen].map((z) => z.map(feld).join(';')).join('\r\n') + '\r\n';
}
