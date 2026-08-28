/**
 * Zeitrechnung der Wanderung - alles in Schweizer Ortszeit (Europe/Zurich).
 *
 * Die Woche laeuft von Montag bis Samstag; der Sonntag kommt im Raster nicht vor.
 * «Sechs Tage sollst du arbeiten.» (Ex 34,21)
 */

export const ZONE = 'Europe/Zurich';

/** Maximale Aufbewahrung der Wochendaten. Manna, das laenger liegt, verdirbt. (Ex 16,20) */
export const MANNA_TAGE = 14;

/** Das Raster: Montag (0) bis Samstag (5). */
export const TAGE_KURZ = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'] as const;
export const TAGE_LANG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'] as const;
export const TAGE_IM_RASTER = 6;

/** Voreinstellung fuer neue Personen: Montag bis Freitag. */
export const WERKTAGE_STANDARD = [0, 1, 2, 3, 4];

const TAG_MS = 86_400_000;

type Teile = {
  jahr: number; monat: number; tag: number;
  stunde: number; minute: number; sekunde: number;
  /** 0 = Montag ... 6 = Sonntag */
  wochentag: number;
};

const FORMAT = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZONE,
  hour12: false,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  weekday: 'short',
});

const WOCHENTAG_INDEX: Record<string, number> = {
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
    stunde: Number(p.hour) % 24,
    minute: Number(p.minute),
    sekunde: Number(p.second),
    wochentag: WOCHENTAG_INDEX[p.weekday] ?? 0,
  };
}

/**
 * Spaltenindex des heutigen Tages, oder null am Sonntag - der hat im
 * Raster keine Spalte.
 */
export function heuteSpalte(jetzt: Date = new Date()): number | null {
  const t = teile(jetzt).wochentag;
  return t <= 5 ? t : null;
}

/* ------------------------------------------------------------------ */
/* Kalenderwochen nach ISO 8601 - so zaehlt die Schweiz.               */
/* ------------------------------------------------------------------ */

export type Etappe = { jahr: number; woche: number };

/** Kalenderwoche eines Zeitpunkts (Ortszeit). Das ISO-Jahr kann vom Kalenderjahr abweichen. */
export function etappeVon(zeitpunkt: Date = new Date()): Etappe {
  const t = teile(zeitpunkt);
  const d = new Date(Date.UTC(t.jahr, t.monat - 1, t.tag));
  const tagNr = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - tagNr + 3); // Donnerstag dieser Woche
  const jahr = d.getUTCFullYear();
  const ersterDonnerstag = new Date(Date.UTC(jahr, 0, 4));
  const tagNr2 = (ersterDonnerstag.getUTCDay() + 6) % 7;
  ersterDonnerstag.setUTCDate(ersterDonnerstag.getUTCDate() - tagNr2 + 3);
  return { jahr, woche: 1 + Math.round((d.getTime() - ersterDonnerstag.getTime()) / (7 * TAG_MS)) };
}

/** Der Montag einer Kalenderwoche als reines Kalenderdatum. */
function montagAlsDatum(etappe: Etappe): Date {
  const ersterDonnerstag = new Date(Date.UTC(etappe.jahr, 0, 4));
  const tagNr = (ersterDonnerstag.getUTCDay() + 6) % 7;
  const montagKw1 = new Date(ersterDonnerstag.getTime() - tagNr * TAG_MS);
  return new Date(montagKw1.getTime() + (etappe.woche - 1) * 7 * TAG_MS);
}

/** Der Montag einer Kalenderwoche als "JJJJ-MM-TT" - so liegt er in der Datenbank. */
export function montagIso(etappe: Etappe): string {
  return montagAlsDatum(etappe).toISOString().slice(0, 10);
}

/** Verschiebt eine Kalenderwoche um n Wochen (auch ueber Jahresgrenzen hinweg). */
export function etappeVerschieben(etappe: Etappe, wochen: number): Etappe {
  const ziel = new Date(montagAlsDatum(etappe).getTime() + wochen * 7 * TAG_MS + 12 * 3_600_000);
  const d = new Date(ziel);
  const tagNr = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - tagNr + 3);
  const jahr = d.getUTCFullYear();
  const ersterDonnerstag = new Date(Date.UTC(jahr, 0, 4));
  const tagNr2 = (ersterDonnerstag.getUTCDay() + 6) % 7;
  ersterDonnerstag.setUTCDate(ersterDonnerstag.getUTCDate() - tagNr2 + 3);
  return { jahr, woche: 1 + Math.round((d.getTime() - ersterDonnerstag.getTime()) / (7 * TAG_MS)) };
}

/** "2026-35" - die Kalenderwoche als Adresszeile. */
export function etappeSchluessel(etappe: Etappe): string {
  return `${etappe.jahr}-${String(etappe.woche).padStart(2, '0')}`;
}

/** Liest "2026-35" wieder ein. Gibt null zurueck, wenn nichts Sinnvolles dasteht. */
export function etappeLesen(text: string | undefined | null): Etappe | null {
  if (!text) return null;
  const treffer = /^(\d{4})-(\d{1,2})$/.exec(text.trim());
  if (!treffer) return null;
  const jahr = Number(treffer[1]);
  const woche = Number(treffer[2]);
  if (jahr < 2000 || jahr > 2100 || woche < 1 || woche > 53) return null;
  return { jahr, woche };
}

export function etappeGleich(a: Etappe, b: Etappe): boolean {
  return a.jahr === b.jahr && a.woche === b.woche;
}

/** Datum eines Rastertages, z. B. "24.08." */
export function datumImRaster(etappe: Etappe, spalte: number): string {
  const d = new Date(montagAlsDatum(etappe).getTime() + spalte * TAG_MS);
  return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.`;
}

/** "24.08. – 29.08.2026" - die Spanne der Etappe. */
export function spanneDerEtappe(etappe: Etappe): string {
  const montag = montagAlsDatum(etappe);
  const samstag = new Date(montag.getTime() + 5 * TAG_MS);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(montag.getUTCDate())}.${p(montag.getUTCMonth() + 1)}. – ` +
    `${p(samstag.getUTCDate())}.${p(samstag.getUTCMonth() + 1)}.${samstag.getUTCFullYear()}`;
}

/** Menschenlesbarer Zeitstempel in Schweizer Ortszeit. */
export function stempel(zeitpunkt: Date = new Date()): string {
  const t = teile(zeitpunkt);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(t.tag)}.${p(t.monat)}.${t.jahr}, ${p(t.stunde)}:${p(t.minute)}`;
}
