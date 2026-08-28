'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { store, ipHashen, MAX_NAME, MAX_LAGER, MAX_NOTIZ, MAX_SEELEN } from './store';
import { losungPruefen } from './auth';
import { bundSchliessen, bundBrechen, bundVerlangen, imBund } from './session';
import { STATUS_ZYKLUS, type Status } from './moses';

/**
 * Die Taten - alle schreibenden Aktionen.
 *
 * Jede Tat prueft zuerst den Bund (die Sitzung). Ohne gueltige Anmeldung
 * bewegt sich hier nichts, auch nicht per direktem POST.
 */

const WACHE_FENSTER_MIN = 15;
const WACHE_VERSUCHE = 5;

export type Antwort = { ok: boolean; meldung: string; feld?: string };

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

/* --------------------------- Volk erfassen --------------------------- */

// Steuerzeichen haben in Namen nichts verloren (Schutz vor CSV- und Log-Tricks).
const STEUERZEICHEN = new RegExp('[\\u0000-\\u001f\\u007f-\\u009f]', 'g');

function saeubern(text: string, max: number): string {
  return text.replace(STEUERZEICHEN, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

/**
 * Zerlegt die Eingabe des Badge-Feldes.
 * Erlaubt sind Komma, Semikolon, Zeilenumbruch und Tabulator als Trenner.
 * Mit "Name @Baustelle" laesst sich das Lager direkt am Namen mitgeben.
 */
function zerlegen(roh: string, standardLager: string | null): { name: string; lager: string | null }[] {
  return roh
    .split(/[,;\n\t]+/)
    .map((teil) => teil.trim())
    .filter(Boolean)
    .map((teil) => {
      const treffer = teil.match(/^(.*?)\s*@\s*(.+)$/);
      const name = saeubern(treffer ? treffer[1] : teil, MAX_NAME);
      const lager = treffer ? saeubern(treffer[2], MAX_LAGER) : standardLager;
      return { name, lager: lager || null };
    })
    .filter((e) => e.name.length > 0);
}

export async function volkRufen(_zuvor: Antwort, daten: FormData): Promise<Antwort> {
  await bundVerlangen();
  const roh = String(daten.get('namen') ?? '');
  const standardLager = saeubern(String(daten.get('lager') ?? ''), MAX_LAGER) || null;

  const eintraege = zerlegen(roh, standardLager);
  if (!eintraege.length) {
    return {
      ok: false,
      meldung: 'Keine Namen erkannt. Namen eintippen und mit Enter zu Badges machen.',
      feld: 'namen',
    };
  }

  const s = await store();
  const bestand = await s.seelenLesen();
  const bekannt = new Set(bestand.map((x) => `${x.name.toLowerCase()}|${(x.lager ?? '').toLowerCase()}`));

  const neue: { name: string; lager: string | null }[] = [];
  const doppelte: string[] = [];
  for (const e of eintraege) {
    const schluessel = `${e.name.toLowerCase()}|${(e.lager ?? '').toLowerCase()}`;
    if (bekannt.has(schluessel)) { doppelte.push(e.name); continue; }
    bekannt.add(schluessel);
    neue.push(e);
  }

  const aufgenommen = await s.seelenRufen(neue);
  revalidatePath('/tafel');

  const teile: string[] = [];
  if (aufgenommen) {
    teile.push(`${aufgenommen} ${aufgenommen === 1 ? 'Person' : 'Personen'} ins Lager aufgenommen.`);
  }
  if (doppelte.length) {
    teile.push(
      `${doppelte.length} ${doppelte.length === 1 ? 'stand' : 'standen'} schon im Lager (${doppelte.slice(0, 3).join(', ')}${doppelte.length > 3 ? ' …' : ''}).`,
    );
  }
  if (aufgenommen < neue.length) teile.push(`Lager voll – maximal ${MAX_SEELEN} Personen.`);

  return {
    ok: aufgenommen > 0,
    meldung: teile.join(' ') || 'Nichts zu tun – alle standen bereits im Lager.',
  };
}

/* ------------------------- Tage markieren ---------------------------- */

function statusPruefen(wert: unknown): Status {
  return STATUS_ZYKLUS.includes(wert as Status) ? (wert as Status) : 'offen';
}

export async function markeSetzen(id: string, tag: number, status: string): Promise<void> {
  await bundVerlangen();
  if (!Number.isInteger(tag) || tag < 0 || tag > 6) return;
  const s = await store();
  await s.markeSetzen(id, tag, statusPruefen(status));
  revalidatePath('/tafel');
}

export async function zeileFuellen(id: string, status: string | null): Promise<void> {
  await bundVerlangen();
  const s = await store();
  await s.zeileSetzen(id, status === null ? null : statusPruefen(status));
  revalidatePath('/tafel');
}

/** Ganze Tagesspalte setzen - z. B. "Montag: alle offenen auf gearbeitet". */
export async function spalteFuellen(tag: number, status: string, nurOffen: boolean): Promise<void> {
  await bundVerlangen();
  if (!Number.isInteger(tag) || tag < 0 || tag > 6) return;
  const s = await store();
  await s.spalteSetzen(tag, statusPruefen(status), Boolean(nurOffen));
  revalidatePath('/tafel');
}

export async function notizSetzen(id: string, notiz: string): Promise<void> {
  await bundVerlangen();
  const s = await store();
  await s.notizSetzen(id, saeubern(notiz, MAX_NOTIZ));
  revalidatePath('/tafel');
}

export async function seeleEntlassen(id: string): Promise<void> {
  await bundVerlangen();
  const s = await store();
  await s.seeleEntlassen(id);
  revalidatePath('/tafel');
}

/* --------------------------- Tafeln zerbrechen ----------------------- */

/**
 * Der Reset. Wird nur ausgefuehrt, wenn das Bestaetigungswort exakt stimmt -
 * damit niemand aus Versehen die ganze Woche loescht.
 */
export async function tafelnZerbrechen(_zuvor: Antwort, daten: FormData): Promise<Antwort> {
  await bundVerlangen();
  const wort = String(daten.get('bestaetigung') ?? '').trim().toUpperCase();
  if (wort !== 'SINAI') {
    return {
      ok: false,
      meldung: 'Bestätigung fehlt. Tippe SINAI, um die Tafeln wirklich zu zerbrechen.',
    };
  }
  const s = await store();
  const anzahl = await s.tafelnZerbrechen();
  await s.zustandSchreiben('letzte_scherbe', new Date().toISOString());
  revalidatePath('/tafel');
  return {
    ok: true,
    meldung:
      anzahl > 0
        ? `Die Tafeln liegen in Scherben – ${anzahl} ${anzahl === 1 ? 'Eintrag' : 'Einträge'} endgültig gelöscht.`
        : 'Nichts zu zerbrechen, die Tafel war bereits leer.',
  };
}

/* ------------------------------ Status ------------------------------- */

export async function bundPruefen(): Promise<boolean> {
  return imBund();
}
