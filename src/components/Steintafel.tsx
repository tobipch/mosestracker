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
 * anwesend, bis jemand etwas anderes anklickt. Ist der Rapport eingegangen,
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
      <p className="tafel px-4 py-12 text-center text-sm text-tafel-500">
        Noch niemand auf der Liste. Trage die Personen unter{' '}
        <strong className="font-medium">Musterung</strong> ein.
      </p>
    );
  }

  return (
    <div className="wanderung-scroll overflow-x-auto">
      <table className="w-full min-w-[32rem] border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th scope="col" className="w-8 border-b border-sand-300 pb-2 dark:border-tafel-800">
              <span className="sr-only">Rapport eingegangen</span>
            </th>
            <th
              scope="col"
              className="sticky left-0 z-10 border-b border-sand-300 bg-sand-100 pb-2 pl-1 pr-3 sm:w-full
                         text-left text-xs font-medium text-tafel-500 dark:border-tafel-800 dark:bg-tafel-950"
            >
              Person
            </th>
            {TAGE_KURZ.map((tag, i) => (
              <th
                key={tag}
                scope="col"
                className={`w-14 border-b border-sand-300 px-1 pb-2 text-center dark:border-tafel-800 ${
                  i === heute ? 'text-meer-700 dark:text-meer-300' : 'text-tafel-500'
                }`}
              >
                <span className={`block text-xs ${i === heute ? 'font-bold' : 'font-medium'}`}>{tag}</span>
                <span className="block text-[10px] font-normal opacity-70">{datumProTag[i]}</span>
                {i === heute && <span className="sr-only">heute</span>}
              </th>
            ))}
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
              trennerDarueber={index === ersteErledigte && index > 0}
              tun={tun}
            />
          ))}
        </tbody>
      </table>
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
      className={`${zeile.rapport ? 'opacity-40 saturate-[.3]' : info.zeile} ${
        trennerDarueber ? '[&>*]:border-t [&>*]:border-t-sand-400 dark:[&>*]:border-t-tafel-600' : ''
      }`}
      title={zeile.rapport ? `${zeile.name}: Rapport eingegangen` : `${zeile.name}: ${info.klar}`}
    >
      <td className="border-b border-sand-200/70 py-1 pr-1 text-center align-middle dark:border-tafel-800/70">
        <input
          type="checkbox"
          checked={zeile.rapport}
          onChange={(e) => {
            const wert = e.target.checked;
            tun({ typ: 'rapport', id: zeile.id, wert }, () => rapportSetzen(zeile.id, jahr, woche, wert));
          }}
          aria-label={`Rapport für ${zeile.name} eingegangen`}
          title="Rapport eingegangen – Zeile erledigt"
          className="h-4 w-4 cursor-pointer accent-meer-700 dark:accent-meer-500"
        />
      </td>

      <th
        scope="row"
        className={`sticky left-0 z-10 border-b border-sand-200/70 py-1 pl-1 pr-3 text-left align-middle
                    font-normal dark:border-tafel-800/70 ${
          zeile.rapport ? 'bg-sand-100 line-through dark:bg-tafel-950' : 'bg-sand-100 dark:bg-tafel-950'
        }`}
      >
        <span className="block max-w-[8.5rem] truncate sm:max-w-[15rem]">
          {zeile.name}
          <span className="sr-only"> – {info.klar}</span>
        </span>
      </th>

      {Array.from({ length: TAGE_IM_RASTER }, (_, spalte) => {
        const zell = zellstatus(zeile, zeile.marken, spalte);
        const z = ZELLE[zell];
        return (
          <td key={spalte} className="border-b border-sand-200/70 p-0.5 text-center dark:border-tafel-800/70">
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
              className={`mx-auto grid h-8 w-12 place-items-center rounded border text-sm font-semibold
                          transition ${z.klassen}`}
            >
              <span aria-hidden>{z.zeichen || ''}</span>
            </button>
          </td>
        );
      })}
    </tr>
  );
}
