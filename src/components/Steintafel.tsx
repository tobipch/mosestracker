'use client';

import { useMemo, useOptimistic, useState, useTransition } from 'react';
import type { Seele } from '@/lib/typen';
import { STATUS, STATUS_ZYKLUS, naechsterStatus, type Status } from '@/lib/moses';
import { rueckfragenBilden } from '@/lib/analyse';
import { TAGE_KURZ, TAGE_LANG } from '@/lib/zeit';
import {
  markeSetzen, zeileFuellen, spalteFuellen, notizSetzen, seeleEntlassen,
} from '@/lib/taten';
import Rauchsaeule from './Rauchsaeule';

/**
 * Die Steintafel - die Wochenuebersicht.
 *
 * Eine Zeile pro Person, eine Spalte pro Tag. Ein Klick auf eine Zelle setzt
 * den Zustand; welcher Zustand gesetzt wird, bestimmt der Zeigestab oben.
 * Alle Aenderungen erscheinen sofort (optimistisch) und werden im Hintergrund
 * gespeichert.
 */

type Props = {
  seelen: Seele[];
  heute: number;
  datumProTag: string[];
};

type Aenderung =
  | { typ: 'marke'; id: string; tag: number; status: Status }
  | { typ: 'zeile'; id: string; status: Status | null }
  | { typ: 'spalte'; tag: number; status: Status; nurOffen: boolean }
  | { typ: 'notiz'; id: string; notiz: string }
  | { typ: 'weg'; id: string };

function anwenden(seelen: Seele[], a: Aenderung): Seele[] {
  switch (a.typ) {
    case 'marke':
      return seelen.map((s) => {
        if (s.id !== a.id) return s;
        const marken = { ...s.marken };
        if (a.status === 'offen') delete marken[a.tag];
        else marken[a.tag] = a.status;
        return { ...s, marken };
      });
    case 'zeile':
      return seelen.map((s) => {
        if (s.id !== a.id) return s;
        const marken: Seele['marken'] = {};
        if (a.status && a.status !== 'offen') for (let t = 0; t < 7; t++) marken[t] = a.status;
        return { ...s, marken };
      });
    case 'spalte':
      return seelen.map((s) => {
        if (a.nurOffen && s.marken[a.tag]) return s;
        const marken = { ...s.marken };
        if (a.status === 'offen') delete marken[a.tag];
        else marken[a.tag] = a.status;
        return { ...s, marken };
      });
    case 'notiz':
      return seelen.map((s) => (s.id === a.id ? { ...s, notiz: a.notiz || null } : s));
    case 'weg':
      return seelen.filter((s) => s.id !== a.id);
  }
}

/** Der Zeigestab: was ein Klick auf eine Zelle bewirkt. */
type Stab = Status | 'zyklus';

export default function Steintafel({ seelen, heute, datumProTag }: Props) {
  const [zeigen, setzeZeigen] = useOptimistic(seelen, anwenden);
  const [, uebergang] = useTransition();
  const [stab, setStab] = useState<Stab>('zyklus');
  const [suche, setSuche] = useState('');
  const [notizOffen, setNotizOffen] = useState<string | null>(null);

  function tun(aenderung: Aenderung, speichern: () => Promise<void>) {
    uebergang(async () => {
      setzeZeigen(aenderung);
      await speichern();
    });
  }

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase();
    if (!q) return zeigen;
    return zeigen.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.lager ?? '').toLowerCase().includes(q),
    );
  }, [zeigen, suche]);

  const gruppen = useMemo(() => {
    const map = new Map<string, Seele[]>();
    for (const s of gefiltert) {
      const schluessel = s.lager ?? '';
      if (!map.has(schluessel)) map.set(schluessel, []);
      map.get(schluessel)!.push(s);
    }
    return [...map.entries()].sort(([a], [b]) =>
      a === '' ? 1 : b === '' ? -1 : a.localeCompare(b, 'de-CH'),
    );
  }, [gefiltert]);

  const rueckfragen = useMemo(() => rueckfragenBilden(zeigen, heute), [zeigen, heute]);

  if (!seelen.length) {
    return (
      <div className="tafel dark-tafel p-10 text-center">
        <p className="mb-2 text-4xl" aria-hidden>🏜️</p>
        <p className="ueberschrift">Die Wüste ist leer</p>
        <p className="fluester mx-auto mt-2 max-w-md">
          Noch niemand im Lager. Trage oben die Namen ein, die diese Woche auf den
          Baustellen stehen sollen – dann füllt sich die Steintafel.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Rauchsaeule rueckfragen={rueckfragen} heute={heute} datumProTag={datumProTag} />

      {/* Zeigestab + Suche */}
      <div className="tafel dark-tafel flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-tafel-500">
            Zeigestab
          </span>
          <StabKnopf aktiv={stab === 'zyklus'} setzen={() => setStab('zyklus')} titel="Klick schaltet der Reihe nach weiter">
            ↻ durchklicken
          </StabKnopf>
          {STATUS_ZYKLUS.filter((s) => s !== 'offen').map((s) => (
            <StabKnopf key={s} aktiv={stab === s} setzen={() => setStab(s)} titel={STATUS[s].hilfe}>
              {STATUS[s].zeichen} {STATUS[s].klar}
            </StabKnopf>
          ))}
          <StabKnopf aktiv={stab === 'offen'} setzen={() => setStab('offen')} titel={STATUS.offen.hilfe}>
            · leeren
          </StabKnopf>
        </div>

        <div className="relative shrink-0">
          <input
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="Suchen: Name oder Baustelle"
            aria-label="Im Lager suchen"
            className="feld py-2 pl-3 pr-8 text-sm sm:w-64"
          />
          {suche && (
            <button
              type="button"
              onClick={() => setSuche('')}
              aria-label="Suche zurücksetzen"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-tafel-400 hover:text-tafel-700"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Die Tafel */}
      <div className="tafel dark-tafel overflow-hidden">
        <div className="wanderung-scroll overflow-x-auto">
          <table className="w-full min-w-[52rem] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
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
                        ? 'bg-kalb-100 dark:bg-kalb-950/60'
                        : i === 6
                          ? 'bg-meer-50 dark:bg-meer-950/40'
                          : 'bg-sand-100 dark:bg-tafel-800'
                    }`}
                  >
                    <span className="block leading-tight">{tag}</span>
                    <span className="block text-[11px] font-normal text-tafel-500">{datumProTag[i]}</span>
                    <button
                      type="button"
                      title={`${TAGE_LANG[i]}: alle noch offenen Felder auf «gearbeitet» setzen`}
                      onClick={() =>
                        tun(
                          { typ: 'spalte', tag: i, status: 'einsatz', nurOffen: true },
                          () => spalteFuellen(i, 'einsatz', true),
                        )
                      }
                      className="mx-auto mt-1 block rounded px-1.5 text-[11px] font-medium text-manna-700
                                 hover:bg-manna-100 dark:text-manna-400 dark:hover:bg-manna-950"
                    >
                      alle ✓
                    </button>
                  </th>
                ))}
                <th scope="col" className="border-b border-sand-300 bg-sand-100 px-2 py-3 text-right font-semibold dark:border-tafel-700 dark:bg-tafel-800">
                  Woche
                </th>
              </tr>
            </thead>

            <tbody>
              {gruppen.map(([lagerName, leute]) => (
                <Gruppe
                  key={lagerName || '__ohne'}
                  lagerName={lagerName}
                  leute={leute}
                  heute={heute}
                  stab={stab}
                  notizOffen={notizOffen}
                  setNotizOffen={setNotizOffen}
                  tun={tun}
                />
              ))}
            </tbody>
          </table>
        </div>

        {!gefiltert.length && (
          <p className="px-4 py-6 text-center text-sm text-tafel-500">
            Niemand gefunden. Selbst Moses hat die Kundschafter zweimal losgeschickt.
          </p>
        )}
      </div>

      <Legende />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function StabKnopf({
  aktiv, setzen, titel, children,
}: { aktiv: boolean; setzen: () => void; titel: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={setzen}
      title={titel}
      aria-pressed={aktiv}
      className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
        aktiv
          ? 'border-meer-600 bg-meer-700 text-white shadow-sm'
          : 'border-sand-300 bg-sand-50 text-tafel-600 hover:bg-sand-200 dark:border-tafel-700 dark:bg-tafel-800 dark:text-sand-300 dark:hover:bg-tafel-700'
      }`}
    >
      {children}
    </button>
  );
}

function Gruppe({
  lagerName, leute, heute, stab, notizOffen, setNotizOffen, tun,
}: {
  lagerName: string;
  leute: Seele[];
  heute: number;
  stab: Stab;
  notizOffen: string | null;
  setNotizOffen: (id: string | null) => void;
  tun: (a: Aenderung, s: () => Promise<void>) => void;
}) {
  return (
    <>
      <tr>
        <th
          colSpan={9}
          scope="colgroup"
          className="sticky left-0 border-b border-sand-200 bg-sand-200/70 px-4 py-1.5 text-left text-xs
                     font-semibold uppercase tracking-wide text-tafel-600
                     dark:border-tafel-800 dark:bg-tafel-800/70 dark:text-sand-300"
        >
          {lagerName ? `⛺ ${lagerName}` : '⛺ Ohne Baustelle'}
          <span className="ml-2 font-normal normal-case text-tafel-500">
            {leute.length} {leute.length === 1 ? 'Person' : 'Personen'}
          </span>
        </th>
      </tr>
      {leute.map((seele) => (
        <Zeile
          key={seele.id}
          seele={seele}
          heute={heute}
          stab={stab}
          notizOffen={notizOffen === seele.id}
          notizUmschalten={() => setNotizOffen(notizOffen === seele.id ? null : seele.id)}
          tun={tun}
        />
      ))}
    </>
  );
}

function Zeile({
  seele, heute, stab, notizOffen, notizUmschalten, tun,
}: {
  seele: Seele;
  heute: number;
  stab: Stab;
  notizOffen: boolean;
  notizUmschalten: () => void;
  tun: (a: Aenderung, s: () => Promise<void>) => void;
}) {
  const [entwurf, setEntwurf] = useState(seele.notiz ?? '');

  function zelleKlick(tag: number) {
    const jetzt: Status = seele.marken[tag] ?? 'offen';
    const neu: Status = stab === 'zyklus' ? naechsterStatus(jetzt) : stab;
    tun({ typ: 'marke', id: seele.id, tag, status: neu }, () => markeSetzen(seele.id, tag, neu));
  }

  return (
    <>
      <tr className="group">
        <th
          scope="row"
          className="sticky left-0 z-10 border-b border-sand-200 bg-sand-50 px-4 py-2 text-left align-middle
                     font-medium dark:border-tafel-800 dark:bg-tafel-900"
        >
          <span className="block max-w-[16rem] truncate">{seele.name}</span>
          {seele.notiz && !notizOffen && (
            <button
              type="button"
              onClick={notizUmschalten}
              className="mt-0.5 block max-w-[16rem] truncate text-left text-xs font-normal italic text-flamme-700 dark:text-flamme-400"
              title={seele.notiz}
            >
              ✎ {seele.notiz}
            </button>
          )}
        </th>

        {Array.from({ length: 7 }, (_, tag) => {
          const status: Status = seele.marken[tag] ?? 'offen';
          const info = STATUS[status];
          const vergangen = tag < heute;
          const auffaellig = info.alarm || (vergangen && status === 'offen');
          return (
            <td
              key={tag}
              className={`border-b border-sand-200 p-1 text-center dark:border-tafel-800 ${
                tag === heute ? 'bg-kalb-50/60 dark:bg-kalb-950/30' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => zelleKlick(tag)}
                title={`${seele.name} · ${TAGE_LANG[tag]}: ${info.klar} (${info.biblisch})`}
                aria-label={`${seele.name}, ${TAGE_LANG[tag]}: ${info.klar}. Klicken zum Ändern.`}
                className={`mx-auto grid h-9 w-full min-w-[2.25rem] max-w-[3rem] place-items-center rounded-lg border
                            text-base transition ${info.klassen} ${
                              auffaellig ? 'ring-1 ring-inset ring-flamme-400/70' : ''
                            }`}
              >
                <span aria-hidden>{info.zeichen}</span>
              </button>
            </td>
          );
        })}

        <td className="border-b border-sand-200 px-2 py-1 text-right dark:border-tafel-800">
          <div className="flex items-center justify-end gap-1">
            <MiniKnopf
              titel="Ganze Woche auf «gearbeitet» setzen"
              klick={() => tun({ typ: 'zeile', id: seele.id, status: 'einsatz' }, () => zeileFuellen(seele.id, 'einsatz'))}
            >
              ✓✓
            </MiniKnopf>
            <MiniKnopf
              titel="Zeile leeren (alle Tage wieder offen)"
              klick={() => tun({ typ: 'zeile', id: seele.id, status: null }, () => zeileFuellen(seele.id, null))}
            >
              ↺
            </MiniKnopf>
            <MiniKnopf titel="Notiz zu dieser Person" klick={notizUmschalten}>
              ✎
            </MiniKnopf>
            <MiniKnopf
              titel="Person aus dem Lager entlassen"
              gefahr
              klick={() => {
                if (confirm(`${seele.name} aus dem Lager entlassen? Die Zeile wird gelöscht.`)) {
                  tun({ typ: 'weg', id: seele.id }, () => seeleEntlassen(seele.id));
                }
              }}
            >
              &times;
            </MiniKnopf>
          </div>
        </td>
      </tr>

      {notizOffen && (
        <tr>
          <td colSpan={9} className="border-b border-sand-200 bg-sand-100/70 px-4 py-2 dark:border-tafel-800 dark:bg-tafel-800/50">
            <label className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
              <span className="text-xs font-semibold text-tafel-600 dark:text-sand-300">
                Randnotiz zu {seele.name}
              </span>
              <input
                value={entwurf}
                onChange={(e) => setEntwurf(e.target.value)}
                maxLength={200}
                autoFocus
                placeholder="z. B. «Arztzeugnis angefordert» oder «Polier meldet sich Dienstag»"
                className="feld flex-1 py-1.5 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    tun({ typ: 'notiz', id: seele.id, notiz: entwurf }, () => notizSetzen(seele.id, entwurf));
                    notizUmschalten();
                  }
                  if (e.key === 'Escape') notizUmschalten();
                }}
                onBlur={() => {
                  if (entwurf !== (seele.notiz ?? '')) {
                    tun({ typ: 'notiz', id: seele.id, notiz: entwurf }, () => notizSetzen(seele.id, entwurf));
                  }
                }}
              />
            </label>
          </td>
        </tr>
      )}
    </>
  );
}

function MiniKnopf({
  titel, klick, children, gefahr,
}: { titel: string; klick: () => void; children: React.ReactNode; gefahr?: boolean }) {
  return (
    <button
      type="button"
      onClick={klick}
      title={titel}
      aria-label={titel}
      className={`grid h-7 min-w-7 place-items-center rounded-md border px-1.5 text-xs transition ${
        gefahr
          ? 'border-transparent text-tafel-400 hover:border-flamme-300 hover:bg-flamme-100 hover:text-flamme-700 dark:hover:bg-flamme-950'
          : 'border-transparent text-tafel-500 hover:border-sand-300 hover:bg-sand-200 dark:text-tafel-400 dark:hover:bg-tafel-700'
      }`}
    >
      {children}
    </button>
  );
}

function Legende() {
  return (
    <div className="tafel dark-tafel p-4">
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-tafel-500">
        Legende · was die Zeichen bedeuten
      </p>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {STATUS_ZYKLUS.map((s) => {
          const info = STATUS[s];
          return (
            <li key={s} className="flex items-start gap-2.5">
              <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border ${info.klassen}`}>
                <span aria-hidden>{info.zeichen}</span>
              </span>
              <span className="text-sm">
                <strong className="font-semibold">{info.klar}</strong>
                <span className="text-tafel-500"> · {info.biblisch}</span>
                <br />
                <span className="fluester">{info.hilfe}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
