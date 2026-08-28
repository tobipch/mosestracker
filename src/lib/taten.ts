'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { store, ipHashen, werktageSaeubern, MAX_NAME, MAX_PERSONEN } from './store';
import { losungPruefen } from './auth';
import { bundSchliessen, bundBrechen, bundVerlangen, imBund } from './session';
import type { Marke } from './typen';
import { TAGE_IM_RASTER, type Etappe } from './zeit';

/**
 * Die Taten - alle schreibenden Aktionen.
 *
 * Jede Tat prueft zuerst den Bund (die Sitzung). Ohne gueltige Anmeldung
 * bewegt sich hier nichts, auch nicht per direktem POST.
 */

const WACHE_FENSTER_MIN = 15;
const WACHE_VERSUCHE = 5;

export type Antwort = { ok: boolean; meldung: string };

/* ----------------------------- Anmeldung ----------------------------- */

async function ipSpur(): Promise<string> {
  const h = await headers();
  const roh =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip')?.trim() ||
    'unbekannt';
  return ipHashen(roh);
}

export async function anmelden(_zuvor: Antwort, daten: FormData): Promise<Antwort> {
  const losung = String(daten.get('losung') ?? '');
  const s = await store();
  const spur = await ipSpur();

  const versuche = await s.wacheZaehlen(spur, WACHE_FENSTER_MIN);
  if (versuche >= WACHE_VERSUCHE) {
    return {
      ok: false,
      meldung:
        `Zu viele Fehlversuche. Die Wache am Lagertor macht dicht – warte ${WACHE_FENSTER_MIN} Minuten. ` +
        '(Vierzig Jahre wären schlimmer.)',
    };
  }

  if (!losung) {
    return { ok: false, meldung: 'Ohne Losungswort bleibt der Dornbusch kalt.' };
  }

  if (!(await losungPruefen(losung))) {
    await s.wacheMelden(spur);
    const rest = Math.max(0, WACHE_VERSUCHE - versuche - 1);
    return {
      ok: false,
      meldung:
        'Falsches Losungswort – das Meer bleibt geschlossen.' +
        (rest > 0 ? ` Noch ${rest} Versuch${rest === 1 ? '' : 'e'}.` : ' Das war der letzte Versuch.'),
    };
  }

  await s.wacheLoeschen(spur);
  await bundSchliessen();
  redirect('/tafel');
}

export async function abmelden(): Promise<void> {
  await bundBrechen();
  redirect('/dornbusch?adieu=1');
}

/* --------------------------- Die Musterung --------------------------- */

// Steuerzeichen haben in Namen nichts verloren.
const STEUERZEICHEN = new RegExp('[\\u0000-\\u001f\\u007f-\\u009f]', 'g');

function saeubern(text: string, max: number): string {
  return text.replace(STEUERZEICHEN, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

/**
 * Zerlegt die Eingabe des Badge-Feldes. Komma, Semikolon, Zeilenumbruch und
 * Tabulator trennen - so lassen sich ganze Listen einfuegen.
 */
function namenZerlegen(roh: string): string[] {
  return roh
    .split(/[,;\n\t]+/)
    .map((teil) => saeubern(teil, MAX_NAME))
    .filter(Boolean);
}

export async function volkRufen(_zuvor: Antwort, daten: FormData): Promise<Antwort> {
  await bundVerlangen();
  const namen = namenZerlegen(String(daten.get('namen') ?? ''));
  if (!namen.length) {
    return { ok: false, meldung: 'Keine Namen erkannt. Namen eintippen und mit Enter zu Badges machen.' };
  }

  const s = await store();
  const bestand = await s.volkLesen();
  const bekannt = new Set(bestand.map((p) => p.name.toLowerCase()));

  const neue: string[] = [];
  const doppelte: string[] = [];
  for (const name of namen) {
    if (bekannt.has(name.toLowerCase())) { doppelte.push(name); continue; }
    bekannt.add(name.toLowerCase());
    neue.push(name);
  }

  const aufgenommen = await s.volkRufen(neue);
  revalidatePath('/volk');
  revalidatePath('/tafel');

  const teile: string[] = [];
  if (aufgenommen) {
    teile.push(`${aufgenommen} ${aufgenommen === 1 ? 'Person' : 'Personen'} ins Lager aufgenommen.`);
  }
  if (doppelte.length) {
    teile.push(
      `${doppelte.length} ${doppelte.length === 1 ? 'stand' : 'standen'} schon auf der Liste ` +
      `(${doppelte.slice(0, 3).join(', ')}${doppelte.length > 3 ? ' …' : ''}).`,
    );
  }
  if (aufgenommen < neue.length) teile.push(`Liste voll – maximal ${MAX_PERSONEN} Personen.`);

  return {
    ok: aufgenommen > 0,
    meldung: teile.join(' ') || 'Nichts zu tun – alle standen bereits auf der Liste.',
  };
}

/** Loescht eine Person samt allen ihren Wochendaten. (Ex 32,32) */
export async function personTilgen(id: string): Promise<void> {
  await bundVerlangen();
  const s = await store();
  await s.personTilgen(id);
  revalidatePath('/volk');
  revalidatePath('/tafel');
}

/** Schaltet einen Werktag einer Person um. */
export async function werktagUmschalten(id: string, spalte: number): Promise<void> {
  await bundVerlangen();
  if (!Number.isInteger(spalte) || spalte < 0 || spalte >= TAGE_IM_RASTER) return;
  const s = await store();
  const person = (await s.volkLesen()).find((p) => p.id === id);
  if (!person) return;
  const naechste = person.werktage.includes(spalte)
    ? person.werktage.filter((t) => t !== spalte)
    : [...person.werktage, spalte];
  await s.werktageSetzen(id, werktageSaeubern(naechste));
  revalidatePath('/volk');
  revalidatePath('/tafel');
}

/* --------------------------- Die Wochentafel ------------------------- */

function etappePruefen(jahr: unknown, woche: unknown): Etappe | null {
  const j = Number(jahr), w = Number(woche);
  if (!Number.isInteger(j) || j < 2000 || j > 2100) return null;
  if (!Number.isInteger(w) || w < 1 || w > 53) return null;
  return { jahr: j, woche: w };
}

function markePruefen(wert: unknown): Marke | null {
  return wert === 'entschuldigt' || wert === 'unentschuldigt' ? wert : null;
}

export async function markeSetzen(
  id: string, jahr: number, woche: number, spalte: number, marke: string | null,
): Promise<void> {
  await bundVerlangen();
  const etappe = etappePruefen(jahr, woche);
  if (!etappe) return;
  if (!Number.isInteger(spalte) || spalte < 0 || spalte >= TAGE_IM_RASTER) return;
  const s = await store();
  await s.markeSetzen(id, etappe, spalte, markePruefen(marke));
  revalidatePath('/tafel');
}

export async function rapportSetzen(
  id: string, jahr: number, woche: number, gesetzt: boolean,
): Promise<void> {
  await bundVerlangen();
  const etappe = etappePruefen(jahr, woche);
  if (!etappe) return;
  const s = await store();
  await s.rapportSetzen(id, etappe, Boolean(gesetzt));
  revalidatePath('/tafel');
}

/* --------------------------- Tafeln zerbrechen ----------------------- */

/**
 * Loescht die gesamte Liste samt allen Wochendaten. Nur mit dem
 * Bestaetigungswort - damit es nie aus Versehen passiert. (Ex 32,19)
 */
export async function tafelnZerbrechen(_zuvor: Antwort, daten: FormData): Promise<Antwort> {
  await bundVerlangen();
  const wort = String(daten.get('bestaetigung') ?? '').trim().toUpperCase();
  if (wort !== 'SINAI') {
    return { ok: false, meldung: 'Bestätigung fehlt. Tippe SINAI, um wirklich alles zu löschen.' };
  }
  const s = await store();
  const anzahl = await s.allesTilgen();
  await s.zustandSchreiben('letzte_scherbe', new Date().toISOString());
  revalidatePath('/volk');
  revalidatePath('/tafel');
  return {
    ok: true,
    meldung:
      anzahl > 0
        ? `Die Tafeln liegen in Scherben – ${anzahl} ${anzahl === 1 ? 'Person' : 'Personen'} samt allen Wochendaten gelöscht.`
        : 'Nichts zu zerbrechen, die Liste war bereits leer.',
  };
}

export async function bundPruefen(): Promise<boolean> {
  return imBund();
}
