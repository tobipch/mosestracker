'use client';

import { useEffect, useState } from 'react';

/**
 * Die Sanduhr - zeigt, wie lange es noch bis zum automatischen Sabbat-Reset dauert.
 * Rechnet erst nach dem Mount, damit Server und Client nicht streiten.
 */

function rest(zielIso: string): string | null {
  const ms = Date.parse(zielIso) - Date.now();
  if (!Number.isFinite(ms)) return null;
  if (ms <= 0) return 'jeden Moment';
  const min = Math.floor(ms / 60000);
  const tage = Math.floor(min / 1440);
  const stunden = Math.floor((min % 1440) / 60);
  const minuten = min % 60;
  if (tage > 0) return `${tage} ${tage === 1 ? 'Tag' : 'Tage'}, ${stunden} Std.`;
  if (stunden > 0) return `${stunden} Std. ${minuten} Min.`;
  return `${minuten} Min.`;
}

export default function Sanduhr({ zielIso }: { zielIso: string }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setText(rest(zielIso));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [zielIso]);

  return (
    <span title="Sonntag 20:00 leert sich die Liste automatisch (Schweizer Zeit)">
      ⏳ Sabbat-Reset in {text ?? '…'}
    </span>
  );
}
