import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { nachtwache } from '@/lib/wanderung';
import { stempel, MANNA_TAGE } from '@/lib/zeit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Die Nachtwache - taeglicher Cron-Job (siehe vercel.json).
 *
 * Setzt die Manna-Regel durch: Wochendaten, die aelter als 14 Tage sind,
 * werden endgueltig geloescht. «Es wuchsen Wuermer darin.» (Ex 16,20)
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

  const { verdorben } = await nachtwache();

  return NextResponse.json(
    {
      zeitpunkt: stempel(),
      verdorben,
      bericht:
        verdorben > 0
          ? `${verdorben} ${verdorben === 1 ? 'Wocheneintrag' : 'Wocheneinträge'} älter als ${MANNA_TAGE} Tage gelöscht.`
          : 'Nichts verdorben.',
    },
    { headers: { 'cache-control': 'no-store' } },
  );
}
