'use client';

import { useState } from 'react';
import type { Rueckfrage } from '@/lib/typen';
import { TAGE_KURZ } from '@/lib/zeit';

/**
 * Die Rauchsaeule - sie zeigt dem Volk den Weg. (Ex 13,21)
 *
 * Hier steht in Klartext, bei wem eine Rueckfrage faellig ist:
 * unentschuldigtes Fehlen zuerst, danach Tage ganz ohne Rapport.
 * Nur vergangene Tage zaehlen - der laufende Tag ist noch nicht faellig.
 */

export default function Rauchsaeule({
  rueckfragen, heute, datumProTag,
}: {
  rueckfragen: Rueckfrage[];
  heute: number;
  datumProTag: string[];
}) {
  const [kopiert, setKopiert] = useState(false);

  if (heute === 0) {
    return (
      <div className="tafel dark-tafel border-meer-300/70 bg-meer-50/70 p-4 dark:border-meer-900 dark:bg-meer-950/40">
        <p className="ueberschrift">☁️ Die Rauchsäule ruht</p>
        <p className="fluester mt-1">
          Montag – die Woche fängt gerade erst an. Sobald der erste Tag vorbei ist,
          erscheint hier, bei wem du nachfragen musst.
        </p>
      </div>
    );
  }

  if (!rueckfragen.length) {
    return (
      <div className="tafel dark-tafel border-manna-300/70 bg-manna-50/70 p-4 dark:border-manna-900 dark:bg-manna-950/40">
        <p className="ueberschrift">🕊️ Alles im Lot</p>
        <p className="fluester mt-1">
          Für jeden vergangenen Tag liegt eine Meldung vor. Keine Rückfrage nötig –
          das Meer ist glatt wie am achten Tag.
        </p>
      </div>
    );
  }

  const kalbAnzahl = rueckfragen.filter((r) => r.kalbTage.length).length;

  function tageText(tage: number[]) {
    return tage.map((t) => `${TAGE_KURZ[t]} ${datumProTag[t]}`).join(', ');
  }

  async function kopieren() {
    const zeilen = rueckfragen.map((r) => {
      const teile: string[] = [];
      if (r.kalbTage.length) teile.push(`unentschuldigt gefehlt: ${tageText(r.kalbTage)}`);
      if (r.offeneTage.length) teile.push(`keine Meldung: ${tageText(r.offeneTage)}`);
      return `- ${r.seele.name}${r.seele.lager ? ` (${r.seele.lager})` : ''}: ${teile.join(' / ')}`;
    });
    const text = ['Offene Punkte zur Zeiterfassung:', ...zeilen].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setKopiert(true);
      setTimeout(() => setKopiert(false), 2500);
    } catch {
      setKopiert(false);
    }
  }

  return (
    <div className="tafel dark-tafel border-flamme-300/70 bg-flamme-50/70 p-4 dark:border-flamme-900/70 dark:bg-flamme-950/30">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="ueberschrift">
            <span className="mr-1.5 inline-block animate-flackern dornbusch-flamme" aria-hidden>🔥</span>
            Die Rauchsäule · hier musst du nachfragen
          </p>
          <p className="fluester mt-0.5">
            {rueckfragen.length} {rueckfragen.length === 1 ? 'Person' : 'Personen'} mit offenen Punkten
            {kalbAnzahl > 0 && <> · davon {kalbAnzahl} unentschuldigt</>}
          </p>
        </div>
        <button type="button" onClick={kopieren} className="btn-still text-xs">
          {kopiert ? '✓ kopiert' : '📋 Liste kopieren'}
        </button>
      </div>

      <ul className="space-y-1.5">
        {rueckfragen.map((r) => (
          <li
            key={r.seele.id}
            className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-lg bg-white/70 px-3 py-2 text-sm
                       dark:bg-tafel-900/70"
          >
            <span className="font-semibold">{r.seele.name}</span>
            {r.seele.lager && <span className="text-xs text-tafel-500">⛺ {r.seele.lager}</span>}
            {r.kalbTage.length > 0 && (
              <span className="rounded-md bg-kalb-200 px-1.5 py-0.5 text-xs font-medium text-kalb-900 dark:bg-kalb-900 dark:text-kalb-200">
                🐂 unentschuldigt: {tageText(r.kalbTage)}
              </span>
            )}
            {r.offeneTage.length > 0 && (
              <span className="rounded-md bg-sand-200 px-1.5 py-0.5 text-xs font-medium text-tafel-700 dark:bg-tafel-700 dark:text-sand-200">
                · keine Meldung: {tageText(r.offeneTage)}
              </span>
            )}
            {r.seele.notiz && (
              <span className="text-xs italic text-flamme-700 dark:text-flamme-400">✎ {r.seele.notiz}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
