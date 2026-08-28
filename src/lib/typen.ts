import type { Status } from './moses';

/** Reine Datentypen - bewusst ohne Server-Abhaengigkeiten, damit auch
 *  Client-Komponenten sie verwenden koennen. */

export type Marken = Partial<Record<number, Status>>;

/** Eine Person im Lager. Bewusst minimal: mehr Daten brauchen wir nicht. */
export type Seele = {
  id: string;
  name: string;
  /** Baustelle bzw. Einsatzort. */
  lager: string | null;
  notiz: string | null;
  marken: Marken;
  erfasstAm: string; // ISO
};

export type Rueckfrage = {
  seele: Seele;
  /** Vergangene Tage ohne jede Meldung. */
  offeneTage: number[];
  /** Vergangene Tage mit unentschuldigtem Fehlen. */
  kalbTage: number[];
  dringlichkeit: number;
};
