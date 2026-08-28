import 'server-only';
import { store, type Lagerstand } from './store';
import type { Status } from './moses';
import type { Rueckfrage } from './typen';
import { rueckfragenBilden, zaehlen, lagerNamen } from './analyse';
import { heuteIndex, kalenderwoche, letzterSabbat, naechsterSabbat } from './zeit';

/**
 * Die Wanderung - alles, was das Lager beim Laden einer Seite wissen muss.
 *
 * Hier passieren die beiden automatischen Regeln:
 *  1. Manna-Regel  - was aelter als 14 Tage ist, wird geloescht.
 *  2. Sabbat-Regel - war seit dem letzten Sonntag 20:00 kein Reset, wird jetzt einer nachgeholt.
 */

const SCHLUESSEL_SABBAT = 'letzter_sabbat';
const SCHLUESSEL_SCHERBE = 'letzte_scherbe';

export type Uebersicht = {
  stand: Lagerstand;
  heute: number;
  woche: number;
  naechsterSabbatIso: string;
  rueckfragen: Rueckfrage[];
  zaehler: Record<Status, number>;
  lagerNamen: string[];
};

/** Fuehrt Manna- und Sabbat-Regel aus und liest den aktuellen Stand. */
export async function lagerLaden(): Promise<Uebersicht> {
  const s = await store();

  const verdorben = await s.mannaPruefen();

  // Sabbat-Automatik: unabhaengig vom Cron-Job, damit der Reset auch dann
  // passiert, wenn der Cron einmal ausfaellt oder gar nicht eingerichtet ist.
  const grenze = letzterSabbat();
  const gemerkt = await s.zustandLesen(SCHLUESSEL_SABBAT);
  let sabbatGehalten = false;
  if (!gemerkt) {
    await s.zustandSchreiben(SCHLUESSEL_SABBAT, grenze.toISOString());
  } else if (Date.parse(gemerkt) < grenze.getTime()) {
    await s.tafelnZerbrechen();
    await s.zustandSchreiben(SCHLUESSEL_SABBAT, grenze.toISOString());
    await s.zustandSchreiben(SCHLUESSEL_SCHERBE, new Date().toISOString());
    sabbatGehalten = true;
  }

  const seelen = await s.seelenLesen();
  const letzteScherbe = await s.zustandLesen(SCHLUESSEL_SCHERBE);
  const heute = heuteIndex();

  return {
    stand: {
      seelen,
      letzteScherbe,
      sabbatGehalten,
      verdorben,
      dauerhaft: s.dauerhaft,
    },
    heute,
    woche: kalenderwoche(),
    naechsterSabbatIso: naechsterSabbat().toISOString(),
    rueckfragen: rueckfragenBilden(seelen, heute),
    zaehler: zaehlen(seelen, heute),
    lagerNamen: lagerNamen(seelen),
  };
}

/**
 * Die Nachtwache - fuer den taeglichen Cron-Job.
 *
 * Loescht verdorbenes Manna (> 14 Tage) und haelt den Sabbat, falls seit
 * Sonntag 20:00 noch kein Reset stattgefunden hat.
 */
export async function nachtwache(): Promise<{
  verdorben: number;
  sabbatGehalten: boolean;
  geloescht: number;
}> {
  const s = await store();
  const verdorben = await s.mannaPruefen();

  const grenze = letzterSabbat();
  const gemerkt = await s.zustandLesen(SCHLUESSEL_SABBAT);
  let sabbatGehalten = false;
  let geloescht = 0;

  if (!gemerkt) {
    await s.zustandSchreiben(SCHLUESSEL_SABBAT, grenze.toISOString());
  } else if (Date.parse(gemerkt) < grenze.getTime()) {
    geloescht = await s.tafelnZerbrechen();
    await s.zustandSchreiben(SCHLUESSEL_SABBAT, grenze.toISOString());
    await s.zustandSchreiben(SCHLUESSEL_SCHERBE, new Date().toISOString());
    sabbatGehalten = true;
  }

  return { verdorben, sabbatGehalten, geloescht };
}
