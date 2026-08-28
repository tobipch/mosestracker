'use client';

import { useMemo, useOptimistic, useTransition } from 'react';
import type { Marke, Zeile } from '@/lib/typen';
import { ZELLE, WOCHE, naechsteMarke } from '@/lib/moses';
import { sortieren, wochenstatus, zellstatus } from '@/lib/analyse';
import { TAGE_KURZ, TAGE_LANG, TAGE_IM_RASTER } from '@/lib/zeit';
import { markeSetzen, rapportSetzen } from '@/lib/taten';

/**
 * Die Steintafel - eine Kalenderwoche.
 *
 * Zeilen sind Personen, Spalten Montag bis Samstag. Ein Werktag gilt als
 * anwesend, bis jemand etwas anderes anklickt: erst entschuldigt (orange),
 * dann unentschuldigt (rot), dann wieder zurueck. Ist der Rapport eingegangen,
 * wird die Zeile abgehakt, blass und rutscht ans Ende.
 */

type Props = {
  zeilen: Zeile[];
  jahr: number;
  woche: number;
  /** Spalte des heutigen Tages - nur in der laufenden Woche gesetzt. */
  heute: number | null;
  datumProTag: string[];
};

type Aenderung =
  | { typ: 'marke'; id: string; spalte: number; marke: Marke | null }
  | { typ: 'rapport'; id: string; wert: boolean };

function anwenden(zeilen: Zeile[], a: Aenderung): Zeile[] {
  return zeilen.map((z) => {
    if (z.id !== a.id) return z;
    if (a.typ === 'rapport') return { ...z, rapport: a.wert };
    const marken = { ...z.marken };
    if (a.marke === null) delete marken[a.spalte];
    else marken[a.spalte] = a.marke;
    return { ...z, marken };
  });
}

export default function Steintafel({ zeilen, jahr, woche, heute, datumProTag }: Props) {
  const [zeigen, setzeZeigen] = useOptimistic(zeilen, anwenden);
  const [, uebergang] = useTransition();

  const sortiert = useMemo(() => sortieren(zeigen), [zeigen]);
  const ersteErledigte = sortiert.findIndex((z) => z.rapport);

  function tun(aenderung: Aenderung, speichern: () => Promise<void>) {
    uebergang(async () => {
      setzeZeigen(aenderung);
      await speichern();
    });
  }

  if (!zeilen.length) {
    return (
      <div className="tafel dark-tafel p-10 text-center">
        <p className="mb-2 text-4xl" aria-hidden>🏜️</p>
        <p className="ueberschrift">Die Wüste ist leer</p>
        <p className="fluester mx-auto mt-2 max-w-md">
          Auf der zentralen Liste steht noch niemand. Trage unter «Die Musterung» die
          Personen ein – danach erscheinen sie hier in jeder Kalenderwoche.
        </p>
      </div>
    );
  }

  return (
    <div className="tafel dark-tafel overflow-hidden">
      <div className="wanderung-scroll overflow-x-auto">
        <table className="w-full min-w-[46rem] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th
                scope="col"
                title="Rapport eingegangen – die Zeile ist erledigt"
                className="border-b border-sand-300 bg-sand-100 px-2 py-3 text-center font-semibold
                           dark:border-tafel-700 dark:bg-tafel-800"
              >
                <span className="text-xs">Rapport</span>
              </th>
              <th
                scope="col"
                className="sticky left-0 z-20 border-b border-sand-300 bg-sand-100 px-4 py-3 text-left
                           font-semibold dark:border-tafel-700 dark:bg-tafel-800"
              >
                Person
              </th>
              {TAGE_KURZ.map((tag, i) => (
                <th
                  key={tag}
                  scope="col"
                  className={`border-b border-sand-300 px-1 py-2 text-center font-semibold dark:border-tafel-700 ${
                    i === heute
                      ? 'bg-meer-100 dark:bg-meer-950/70'
                      : 'bg-sand-100 dark:bg-tafel-800'
                  }`}
                >
                  <span className="block leading-tight">{tag}</span>
                  <span className="block text-[11px] font-normal text-tafel-500">{datumProTag[i]}</span>
                  {i === heute && (
                    <span className="mx-auto mt-0.5 block h-1 w-1 rounded-full bg-meer-600 dark:bg-meer-400" aria-hidden />
                  )}
                  {i === heute && <span className="sr-only">heute</span>}
                </th>
              ))}
              <th
                scope="col"
                className="border-b border-sand-300 bg-sand-100 px-3 py-3 text-left font-semibold
                           dark:border-tafel-700 dark:bg-tafel-800"
              >
                Woche
              </th>
            </tr>
          </thead>

          <tbody>
            {sortiert.map((zeile, index) => (
              <TafelZeile
                key={zeile.id}
                zeile={zeile}
                jahr={jahr}
                woche={woche}
                heute={heute}
                /** Trennlinie zwischen offenen und erledigten Zeilen. */
                trennerDarueber={index === ersteErledigte && index > 0}
                tun={tun}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TafelZeile({
  zeile, jahr, woche, heute, trennerDarueber, tun,
}: {
  zeile: Zeile;
  jahr: number;
  woche: number;
  heute: number | null;
  trennerDarueber: boolean;
  tun: (a: Aenderung, s: () => Promise<void>) => void;
}) {
  const status = wochenstatus(zeile.marken);
  const info = WOCHE[status];

  return (
    <tr
      className={`${zeile.rapport ? 'opacity-45 saturate-[.35]' : info.zeile} ${
        trennerDarueber ? '[&>*]:border-t-2 [&>*]:border-t-sand-400 dark:[&>*]:border-t-tafel-600' : ''
      }`}
    >
      <td className="border-b border-sand-200 px-2 py-2 text-center dark:border-tafel-800">
        <input
          type="checkbox"
          checked={zeile.rapport}
          onChange={(e) => {
            const wert = e.target.checked;
            tun({ typ: 'rapport', id: zeile.id, wert }, () => rapportSetzen(zeile.id, jahr, woche, wert));
          }}
          aria-label={`Rapport für ${zeile.name} eingegangen`}
          title={
            zeile.rapport
              ? 'Rapport ist da – Zeile erledigt. Klicken, um sie wieder zu öffnen.'
              : 'Rapport eingegangen? Abhaken – die Zeile rutscht ans Ende.'
          }
          className="h-4 w-4 cursor-pointer accent-meer-700 dark:accent-meer-500"
        />
      </td>

      <th
        scope="row"
        className={`sticky left-0 z-10 border-b border-sand-200 px-4 py-2 text-left align-middle font-medium
                    dark:border-tafel-800 ${
                      zeile.rapport
                        ? 'bg-sand-100 line-through decoration-tafel-400 dark:bg-tafel-900'
                        : 'bg-sand-50 dark:bg-tafel-900'
                    }`}
      >
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${info.punkt}`} aria-hidden />
          <span className="max-w-[14rem] truncate">{zeile.name}</span>
        </span>
      </th>

      {Array.from({ length: TAGE_IM_RASTER }, (_, spalte) => {
        const zell = zellstatus(zeile, zeile.marken, spalte);
        const z = ZELLE[zell];
        return (
          <td
            key={spalte}
            className={`border-b border-sand-200 p-1 text-center dark:border-tafel-800 ${
              spalte === heute ? 'bg-meer-50/50 dark:bg-meer-950/25' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => {
                const neu = naechsteMarke(zeile.marken[spalte] ?? null);
                tun(
                  { typ: 'marke', id: zeile.id, spalte, marke: neu },
                  () => markeSetzen(zeile.id, jahr, woche, spalte, neu),
                );
              }}
              title={`${zeile.name} · ${TAGE_LANG[spalte]}: ${z.klar}${z.biblisch ? ` («${z.biblisch}»)` : ''}`}
              aria-label={`${zeile.name}, ${TAGE_LANG[spalte]}: ${z.klar}. Klicken zum Ändern.`}
              className={`mx-auto grid h-9 w-full min-w-[2.25rem] max-w-[3.5rem] place-items-center rounded-lg
                          border text-base font-semibold transition ${z.klassen}`}
            >
              <span aria-hidden>{z.zeichen || '·'}</span>
            </button>
          </td>
        );
      })}

      <td className="border-b border-sand-200 px-3 py-2 dark:border-tafel-800">
        <span className={`inline-block whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ${info.pille}`}>
          {info.klar}
        </span>
      </td>
    </tr>
  );
}
