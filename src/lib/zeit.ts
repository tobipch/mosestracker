/**
 * Zeitrechnung der Wanderung - alles in Schweizer Ortszeit (Europe/Zurich).
 *
 * "Sechs Tage sollst du arbeiten, aber am siebten Tag sollst du ruhen." (Ex 34,21)
 * Genau deshalb faengt die Woche am Montag an und der Sabbat-Reset kommt am Sonntagabend.
 */

export const ZONE = 'Europe/Zurich';

/** Stunde am Sonntagabend, zu der die Tafeln automatisch zerbrechen (Ortszeit). */
export const SABBAT_STUNDE = 20;

/** Maximale Aufbewahrung. Manna, das laenger liegt, verdirbt. (Ex 16,20) */
export const MANNA_TAGE = 14;

export type Wochentag = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Montag ... 6 = Sonntag

export const TAGE_KURZ = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const;
export const TAGE_LANG = [
  'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag',
] as const;

type Teile = {
  jahr: number; monat: number; tag: number;
  stunde: number; minute: number; sekunde: number;
  /** 0 = Montag ... 6 = Sonntag */
  wochentag: Wochentag;
};

const FORMAT = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZONE,
  hour12: false,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  weekday: 'short',
});

const WOCHENTAG_INDEX: Record<string, Wochentag> = {
  Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6,
};

/** Zerlegt einen Zeitpunkt in Schweizer Ortszeit-Bestandteile. */
export function teile(zeitpunkt: Date = new Date()): Teile {
  const p: Record<string, string> = {};
  for (const t of FORMAT.formatToParts(zeitpunkt)) p[t.type] = t.value;
  return {
    jahr: Number(p.year),
    monat: Number(p.month),
    tag: Number(p.day),
    // 24:00 kommt in manchen Runtimes fuer Mitternacht zurueck.
    stunde: Number(p.hour) % 24,
    minute: Number(p.minute),
    sekunde: Number(p.second),
    wochentag: WOCHENTAG_INDEX[p.weekday] ?? 0,
  };
}

/** Offset der Zone zu UTC (in ms) zum gegebenen Zeitpunkt. */
function offsetMs(zeitpunkt: Date): number {
  const t = teile(zeitpunkt);
  const alsUtc = Date.UTC(t.jahr, t.monat - 1, t.tag, t.stunde, t.minute, t.sekunde);
  return alsUtc - Math.floor(zeitpunkt.getTime() / 1000) * 1000;
}

/** Wandelt eine Schweizer Wandzeit in den echten UTC-Zeitpunkt um (DST-sicher). */
export function ortszeitZuUtc(
  jahr: number, monat: number, tag: number, stunde = 0, minute = 0,
): Date {
  const schaetzung = Date.UTC(jahr, monat - 1, tag, stunde, minute);
  // Zwei Runden reichen auch ueber Zeitumstellungen hinweg.
  let ergebnis = schaetzung - offsetMs(new Date(schaetzung));
  ergebnis = schaetzung - offsetMs(new Date(ergebnis));
  return new Date(ergebnis);
}

/** Der letzte Sabbat-Moment (Sonntag 20:00 Ortszeit), der bereits vorbei ist. */
export function letzterSabbat(jetzt: Date = new Date()): Date {
  const t = teile(jetzt);
  // Wie viele Tage ist der letzte Sonntag her?
  let zurueck = (t.wochentag + 1) % 7; // Sonntag(6) -> 0, Montag(0) -> 1, ...
  if (t.wochentag === 6 && t.stunde < SABBAT_STUNDE) zurueck = 7; // heute Sonntag, aber noch vor 20:00
  const tagMs = 86_400_000;
  const ziel = teile(new Date(jetzt.getTime() - zurueck * tagMs));
  return ortszeitZuUtc(ziel.jahr, ziel.monat, ziel.tag, SABBAT_STUNDE, 0);
}

/** Der naechste Sabbat-Moment (Sonntag 20:00 Ortszeit) in der Zukunft. */
export function naechsterSabbat(jetzt: Date = new Date()): Date {
  const t = teile(jetzt);
  let vor = (6 - t.wochentag + 7) % 7;
  if (t.wochentag === 6 && t.stunde >= SABBAT_STUNDE) vor = 7;
  const tagMs = 86_400_000;
  const ziel = teile(new Date(jetzt.getTime() + vor * tagMs));
  return ortszeitZuUtc(ziel.jahr, ziel.monat, ziel.tag, SABBAT_STUNDE, 0);
}

/** Montag 00:00 Ortszeit der laufenden Woche. */
export function wochenStart(jetzt: Date = new Date()): Date {
  const t = teile(jetzt);
  const tagMs = 86_400_000;
  const ziel = teile(new Date(jetzt.getTime() - t.wochentag * tagMs));
  return ortszeitZuUtc(ziel.jahr, ziel.monat, ziel.tag, 0, 0);
}

/** Heutiger Wochentag-Index (0 = Montag). */
export function heuteIndex(jetzt: Date = new Date()): Wochentag {
  return teile(jetzt).wochentag;
}

/** ISO-8601-Kalenderwoche (die Schweiz zaehlt so). */
export function kalenderwoche(jetzt: Date = new Date()): number {
  const t = teile(jetzt);
  const d = new Date(Date.UTC(t.jahr, t.monat - 1, t.tag));
  const tagNr = (d.getUTCDay() + 6) % 7; // Montag = 0
  d.setUTCDate(d.getUTCDate() - tagNr + 3); // Donnerstag der Woche
  const ersterDonnerstag = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const tagNr2 = (ersterDonnerstag.getUTCDay() + 6) % 7;
  ersterDonnerstag.setUTCDate(ersterDonnerstag.getUTCDate() - tagNr2 + 3);
  return 1 + Math.round((d.getTime() - ersterDonnerstag.getTime()) / (7 * 86_400_000));
}

/** Datum eines Wochentags der laufenden Woche, z. B. "25.08." */
export function datumDesTages(index: number, jetzt: Date = new Date()): string {
  const start = wochenStart(jetzt);
  const t = teile(new Date(start.getTime() + index * 86_400_000 + 12 * 3_600_000));
  return `${String(t.tag).padStart(2, '0')}.${String(t.monat).padStart(2, '0')}.`;
}

/** Menschenlesbarer Zeitstempel in Schweizer Ortszeit. */
export function stempel(zeitpunkt: Date = new Date()): string {
  const t = teile(zeitpunkt);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(t.tag)}.${p(t.monat)}.${t.jahr}, ${p(t.stunde)}:${p(t.minute)}`;
}

/** Grenze, ab der Daten als verdorbenes Manna gelten. */
export function mannaGrenze(jetzt: Date = new Date()): Date {
  return new Date(jetzt.getTime() - MANNA_TAGE * 86_400_000);
}
