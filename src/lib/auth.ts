import 'server-only';
import { scrypt as scryptCb, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb) as (
  passwort: string | Buffer, salz: string | Buffer, laenge: number, optionen?: { N?: number; r?: number; p?: number; maxmem?: number },
) => Promise<Buffer>;

/**
 * Das Losungswort.
 *
 * Bevorzugt wird ein scrypt-Hash in MOSES_PASSWORT_HASH. Nur zur Not
 * (Erstinbetriebnahme) wird ein Klartext-Passwort in MOSES_PASSWORT akzeptiert -
 * die App warnt dann sichtbar, bis der Hash gesetzt ist.
 */

const N = 16384, r = 8, p = 1, KEY_LEN = 32;

/**
 * Format: scrypt:N:r:p:salz(base64):hash(base64)
 * Doppelpunkt statt Dollarzeichen, weil manche .env-Parser $... als Variable expandieren.
 */

export async function hashErzeugen(passwort: string): Promise<string> {
  const salz = randomBytes(16);
  const schluessel = await scrypt(passwort.normalize('NFKC'), salz, KEY_LEN, { N, r, p });
  return ['scrypt', N, r, p, salz.toString('base64'), schluessel.toString('base64')].join(':');
}

async function hashPruefen(passwort: string, gespeichert: string): Promise<boolean> {
  const teile = gespeichert.split(':');
  if (teile.length !== 6 || teile[0] !== 'scrypt') return false;
  const [, sN, sR, sP, salzB64, hashB64] = teile;
  const salz = Buffer.from(salzB64, 'base64');
  const erwartet = Buffer.from(hashB64, 'base64');
  if (erwartet.length === 0) return false;
  const berechnet = await scrypt(passwort.normalize('NFKC'), salz, erwartet.length, {
    N: Number(sN), r: Number(sR), p: Number(sP), maxmem: 128 * Number(sN) * Number(sR) * 4,
  });
  return berechnet.length === erwartet.length && timingSafeEqual(berechnet, erwartet);
}

function klartextPruefen(passwort: string, erwartet: string): boolean {
  const a = Buffer.from(passwort.normalize('NFKC'));
  const b = Buffer.from(erwartet.normalize('NFKC'));
  // Laengen-Unterschiede sollen den Vergleich nicht abkuerzen.
  const laenge = Math.max(a.length, b.length, 1);
  const pa = Buffer.alloc(laenge); a.copy(pa);
  const pb = Buffer.alloc(laenge); b.copy(pb);
  return timingSafeEqual(pa, pb) && a.length === b.length;
}

export type Losungslage =
  | { art: 'hash' }
  | { art: 'klartext' }
  | { art: 'fehlt' };

export function losungslage(): Losungslage {
  if (process.env.MOSES_PASSWORT_HASH) return { art: 'hash' };
  if (process.env.MOSES_PASSWORT) return { art: 'klartext' };
  return { art: 'fehlt' };
}

/** Prueft das eingegebene Losungswort. Nimmt sich immer etwas Zeit. */
export async function losungPruefen(eingabe: string): Promise<boolean> {
  const lage = losungslage();
  if (lage.art === 'fehlt') {
    // Ohne konfiguriertes Passwort kommt niemand hinein.
    await scrypt('leer', 'leer', KEY_LEN, { N, r, p });
    return false;
  }
  if (lage.art === 'hash') {
    return hashPruefen(eingabe, process.env.MOSES_PASSWORT_HASH!);
  }
  await scrypt(eingabe, 'zeitgleich', KEY_LEN, { N, r, p });
  return klartextPruefen(eingabe, process.env.MOSES_PASSWORT!);
}
