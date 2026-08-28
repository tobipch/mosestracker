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
      <div className="tafel dark-tafel p-10 text-center">
        <p className="mb-2 text-4xl" aria-hidden>🏜️</p>
        <p className="ueberschrift">Noch niemand gemustert</p>
        <p className="fluester mx-auto mt-2 max-w-md">
          Trage oben die Namen ein. Jede Person startet mit Montag bis Freitag als Werktagen –
          umschalten kannst du das gleich danach.
        </p>
      </div>
    );
  }

  return (
    <div className="tafel dark-tafel overflow-hidden">
      <div className="wanderung-scroll overflow-x-auto">
        <table className="w-full min-w-[38rem] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-20 border-b border-sand-300 bg-sand-100 px-4 py-3 text-left
                           font-semibold dark:border-tafel-700 dark:bg-tafel-800"
              >
                Person
              </th>
              <th
                scope="col"
                colSpan={TAGE_IM_RASTER}
                className="border-b border-sand-300 bg-sand-100 px-2 py-3 text-center font-semibold
                           dark:border-tafel-700 dark:bg-tafel-800"
              >
                Werktage <span className="font-normal text-tafel-500">· klicken zum Umschalten</span>
              </th>
              <th className="border-b border-sand-300 bg-sand-100 px-2 dark:border-tafel-700 dark:bg-tafel-800">
                <span className="sr-only">Entfernen</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {zeigen.map((person) => (
              <tr key={person.id}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-b border-sand-200 bg-sand-50 px-4 py-2 text-left
                             font-medium dark:border-tafel-800 dark:bg-tafel-900"
                >
                  <span className="block max-w-[16rem] truncate">{person.name}</span>
                  <span className="fluester">
                    {person.werktage.length} {person.werktage.length === 1 ? 'Werktag' : 'Werktage'}
                  </span>
                </th>

                {Array.from({ length: TAGE_IM_RASTER }, (_, spalte) => {
                  const aktiv = person.werktage.includes(spalte);
                  return (
                    <td key={spalte} className="border-b border-sand-200 p-1 text-center dark:border-tafel-800">
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
                        className={`grid h-9 w-11 place-items-center rounded-lg border text-xs font-semibold transition ${
                          aktiv
                            ? 'border-meer-600 bg-meer-700 text-white hover:bg-meer-800'
                            : 'border-dashed border-sand-300 bg-transparent text-tafel-400 hover:bg-sand-200 dark:border-tafel-700 dark:text-tafel-500 dark:hover:bg-tafel-800'
                        }`}
                      >
                        {TAGE_KURZ[spalte]}
                      </button>
                    </td>
                  );
                })}

                <td className="border-b border-sand-200 px-2 py-2 text-right dark:border-tafel-800">
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
                    className="grid h-8 w-8 place-items-center rounded-md border border-transparent text-tafel-400
                               transition hover:border-rot-300 hover:bg-rot-100 hover:text-rot-700
                               dark:hover:border-rot-800 dark:hover:bg-rot-950 dark:hover:text-rot-300"
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
