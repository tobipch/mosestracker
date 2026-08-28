import { NextResponse } from 'next/server';
import { imBund } from '@/lib/session';
import { store } from '@/lib/store';
import { auszugBauen } from '@/lib/analyse';
import { kalenderwoche, stempel, teile } from '@/lib/zeit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Der Auszug (Ex 12,41) - die Wochenliste als CSV.
 * Semikolon-getrennt und mit BOM, damit Excel in der Schweiz sauber oeffnet.
 */
export async function GET() {
  if (!(await imBund())) {
    return NextResponse.json({ fehler: 'Kein gültiger Bund.' }, { status: 401 });
  }

  const s = await store();
  await s.mannaPruefen();
  const seelen = await s.seelenLesen();
  const csv = auszugBauen(seelen, stempel);

  const t = teile();
  const datei = `moses-kw${kalenderwoche()}-${t.jahr}${String(t.monat).padStart(2, '0')}${String(t.tag).padStart(2, '0')}.csv`;

  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${datei}"`,
      'cache-control': 'no-store, max-age=0',
    },
  });
}
