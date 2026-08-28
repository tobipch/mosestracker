import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { nachtwache } from '@/lib/wanderung';
import { stempel } from '@/lib/zeit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Die Nachtwache - taeglicher Cron-Job (siehe vercel.json).
 *
 *  - loescht alles, was aelter als 14 Tage ist (Manna-Regel)
 *  - haelt den Sabbat: nach Sonntag 20:00 wird die Liste automatisch geleert
 *
 * Geschuetzt durch CRON_SECRET. Vercel schickt es als "Authorization: Bearer ...".
 */

function gleich(a: string, b: string): boolean {
  const pa = Buffer.from(a);
  const pb = Buffer.from(b);
  if (pa.length !== pb.length) return false;
  return timingSafeEqual(pa, pb);
}

export async function GET(anfrage: NextRequest) {
  const geheim = process.env.CRON_SECRET;

  if (!geheim) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { fehler: 'CRON_SECRET ist nicht gesetzt – die Nachtwache bleibt verschlossen.' },
        { status: 503 },
      );
    }
  } else {
    const kopf = anfrage.headers.get('authorization') ?? '';
    if (!kopf.startsWith('Bearer ') || !gleich(kopf.slice(7), geheim)) {
      return NextResponse.json({ fehler: 'Unbefugt.' }, { status: 401 });
    }
  }

  const ergebnis = await nachtwache();

  return NextResponse.json(
    {
      zeitpunkt: stempel(),
      ...ergebnis,
      bericht: ergebnis.sabbatGehalten
        ? `Sabbat gehalten – ${ergebnis.geloescht} ${ergebnis.geloescht === 1 ? 'Eintrag' : 'Einträge'} gelöscht.`
        : 'Kein Reset fällig.',
    },
    { headers: { 'cache-control': 'no-store' } },
  );
}
