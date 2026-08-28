import 'server-only';
import { store, datenbankDiagnose } from './store';
import type { Zeile } from './typen';
import { sortieren, zaehlen } from './analyse';
import {
  etappeVon, etappeGleich, etappeVerschieben, heuteSpalte,
  datumImRaster, spanneDerEtappe, TAGE_IM_RASTER, type Etappe,
} from './zeit';

/**
 * Die Wanderung - alles, was eine Seite beim Laden wissen muss.
 *
 * Hier laeuft auch die Manna-Regel: Wochendaten aelter als 14 Tage werden
 * bei jedem Aufruf geloescht (Ex 16,20). Die Personenliste selbst bleibt -
 * sie ist die zentrale Liste und gehoert dem Benutzer.
 */

export type Etappenblick = {
  etappe: Etappe;
  laufend: Etappe;
  /** Wie weit darf man zurueck? Weiter zurueck liegen keine Daten mehr. */
  frueheste: Etappe;
  zeilen: Zeile[];
  /** Spalte des heutigen Tages, nur wenn die laufende Woche gezeigt wird. */
  heute: number | null;
  datumProTag: string[];
  spanne: string;
  istLaufend: boolean;
  kennzahlen: ReturnType<typeof zaehlen>;
  verdorben: number;
  dauerhaft: boolean;
  diagnose: { name: string; gesetzt: boolean }[];
};

/** Laedt eine Kalenderwoche samt Personenliste. */
export async function etappeLaden(gewuenscht?: Etappe | null): Promise<Etappenblick> {
  const s = await store();
  const verdorben = await s.mannaPruefen();

  const laufend = etappeVon();
  const frueheste = etappeVerschieben(laufend, -1);
  const etappe = gewuenscht ?? laufend;

  const volk = await s.volkLesen();
  const woche = await s.wocheLesen(etappe);

  const zeilen: Zeile[] = volk.map((person) => {
    const eintrag = woche.get(person.id);
    return {
      ...person,
      marken: eintrag?.marken ?? {},
      rapport: eintrag?.rapport ?? false,
    };
  });

  const istLaufend = etappeGleich(etappe, laufend);

  return {
    etappe,
    laufend,
    frueheste,
    zeilen: sortieren(zeilen),
    heute: istLaufend ? heuteSpalte() : null,
    datumProTag: Array.from({ length: TAGE_IM_RASTER }, (_, i) => datumImRaster(etappe, i)),
    spanne: spanneDerEtappe(etappe),
    istLaufend,
    kennzahlen: zaehlen(zeilen),
    verdorben,
    dauerhaft: s.dauerhaft,
    diagnose: s.dauerhaft ? [] : datenbankDiagnose(),
  };
}

/** Nur die zentrale Personenliste - fuer die Musterung. */
export async function volkLaden() {
  const s = await store();
  const verdorben = await s.mannaPruefen();
  return {
    personen: await s.volkLesen(),
    letzteScherbe: await s.zustandLesen('letzte_scherbe'),
    verdorben,
    dauerhaft: s.dauerhaft,
  };
}

/** Die Nachtwache - taeglicher Cron-Job: verdorbenes Manna wegraeumen. */
export async function nachtwache(): Promise<{ verdorben: number }> {
  const s = await store();
  return { verdorben: await s.mannaPruefen() };
}
