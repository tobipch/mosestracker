'use client';

import { useOptimistic, useTransition } from 'react';
import type { Person } from '@/lib/typen';
import { TAGE_KURZ, TAGE_LANG, TAGE_IM_RASTER } from '@/lib/zeit';
import { personTilgen, werktagUmschalten } from '@/lib/taten';

/**
 * Die Musterung - die zentrale Personenliste. (Num 1,2)
 *
 * Sie gilt fuer alle Kalenderwochen. Werktage pro Person umschalten,
 * Personen jederzeit aufnehmen oder tilgen - beim Tilgen verschwinden
 * saemtliche Wochendaten dieser Person gleich mit.
 */

type Aenderung =
  | { typ: 'werktag'; id: string; spalte: number }
  | { typ: 'weg'; id: string };

function anwenden(personen: Person[], a: Aenderung): Person[] {
  if (a.typ === 'weg') return personen.filter((p) => p.id !== a.id);
  return personen.map((p) => {
    if (p.id !== a.id) return p;
    const werktage = p.werktage.includes(a.spalte)
      ? p.werktage.filter((t) => t !== a.spalte)
      : [...p.werktage, a.spalte].sort((x, y) => x - y);
    return { ...p, werktage };
  });
}

export default function Musterung({ personen }: { personen: Person[] }) {
  const [zeigen, setzeZeigen] = useOptimistic(personen, anwenden);
  const [, uebergang] = useTransition();

  function tun(aenderung: Aenderung, speichern: () => Promise<void>) {
    uebergang(async () => {
      setzeZeigen(aenderung);
      await speichern();
    });
  }

  if (!personen.length) {
    return (
      <p className="tafel px-4 py-12 text-center text-sm text-tafel-500">
        Noch niemand auf der Liste – trage oben die Namen ein.
      </p>
    );
  }

  return (
    <div>
      <div className="wanderung-scroll overflow-x-auto">
        <table className="w-full min-w-[32rem] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-10 border-b border-sand-300 bg-sand-100 pb-2 pr-3 sm:w-full
                           text-left text-xs font-medium text-tafel-500 dark:border-tafel-800 dark:bg-tafel-950"
              >
                Person
              </th>
              <th
                scope="col"
                colSpan={TAGE_IM_RASTER}
                className="border-b border-sand-300 pb-2 text-center text-xs font-medium text-tafel-500
                           dark:border-tafel-800"
              >
                Werktage
              </th>
              <th className="border-b border-sand-300 dark:border-tafel-800">
                <span className="sr-only">Entfernen</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {zeigen.map((person) => (
              <tr key={person.id}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-b border-sand-200/70 bg-sand-100 py-1 pr-3 text-left
                             align-middle font-normal dark:border-tafel-800/70 dark:bg-tafel-950"
                >
                  <span className="block max-w-[8.5rem] truncate sm:max-w-[15rem]">{person.name}</span>
                </th>

                {Array.from({ length: TAGE_IM_RASTER }, (_, spalte) => {
                  const aktiv = person.werktage.includes(spalte);
                  return (
                    <td key={spalte} className="border-b border-sand-200/70 p-0.5 text-center dark:border-tafel-800/70">
                      <button
                        type="button"
                        onClick={() =>
                          tun({ typ: 'werktag', id: person.id, spalte }, () =>
                            werktagUmschalten(person.id, spalte),
                          )
                        }
                        aria-pressed={aktiv}
                        title={`${TAGE_LANG[spalte]} ist ${aktiv ? 'ein' : 'kein'} Werktag für ${person.name}`}
                        aria-label={`${TAGE_LANG[spalte]} für ${person.name} ${aktiv ? 'abwählen' : 'auswählen'}`}
                        className={`grid h-8 w-10 place-items-center rounded border text-xs transition ${
                          aktiv
                            ? 'border-tafel-800 bg-tafel-800 font-medium text-sand-50 hover:bg-tafel-700 dark:border-sand-200 dark:bg-sand-200 dark:text-tafel-900'
                            : 'border-transparent text-tafel-300 hover:border-dashed hover:border-sand-400 dark:text-tafel-700'
                        }`}
                      >
                        {TAGE_KURZ[spalte]}
                      </button>
                    </td>
                  );
                })}

                <td className="border-b border-sand-200/70 py-1 pl-2 text-right dark:border-tafel-800/70">
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          `${person.name} von der Liste tilgen?\n\n` +
                          'Alle Wochendaten dieser Person werden mitgelöscht. Das lässt sich nicht rückgängig machen.',
                        )
                      ) {
                        tun({ typ: 'weg', id: person.id }, () => personTilgen(person.id));
                      }
                    }}
                    title={`${person.name} samt allen Wochendaten löschen`}
                    aria-label={`${person.name} von der Liste tilgen`}
                    className="grid h-7 w-7 place-items-center rounded text-tafel-300 transition
                               hover:bg-rot-100 hover:text-rot-700
                               dark:text-tafel-600 dark:hover:bg-rot-950 dark:hover:text-rot-300"
                  >
                    &times;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
