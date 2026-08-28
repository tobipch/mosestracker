import { NextResponse, type NextRequest } from 'next/server';

/**
 * Die Wolkensaeule - laeuft vor jeder Anfrage her. (Ex 13,21)
 *
 * Zwei Aufgaben:
 *  1. Content-Security-Policy mit frischer Nonce setzen (kein fremdes Script kommt durch).
 *  2. Wer kein Sitzungs-Cookie hat, wird zum Dornbusch geschickt.
 *     Die eigentliche Signaturpruefung passiert danach serverseitig.
 */

const BUND_COOKIE = 'moses_bund';
// Oeffentlich erreichbar: Anmeldung, Kurzanleitung und der Cron-Endpunkt
// (der authentifiziert sich mit CRON_SECRET statt mit einem Cookie).
const OEFFENTLICH = ['/dornbusch', '/gebote', '/api/sabbat'];

export default function proxy(anfrage: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const entwicklung = process.env.NODE_ENV !== 'production';

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${entwicklung ? "'unsafe-eval'" : ''}`.trim(),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self'${entwicklung ? ' ws: wss:' : ''}`,
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "object-src 'none'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    ...(entwicklung ? [] : ['upgrade-insecure-requests']),
  ].join('; ');

  const pfad = anfrage.nextUrl.pathname;
  const oeffentlich = OEFFENTLICH.some((p) => pfad === p || pfad.startsWith(p + '/'));
  const hatCookie = Boolean(anfrage.cookies.get(BUND_COOKIE)?.value);

  const kopf = new Headers(anfrage.headers);
  kopf.set('x-nonce', nonce);
  kopf.set('content-security-policy', csp);

  let antwort: NextResponse;
  if (!oeffentlich && !hatCookie && pfad !== '/') {
    const ziel = anfrage.nextUrl.clone();
    ziel.pathname = '/dornbusch';
    ziel.search = '';
    antwort = NextResponse.redirect(ziel);
  } else {
    antwort = NextResponse.next({ request: { headers: kopf } });
  }

  antwort.headers.set('content-security-policy', csp);
  return antwort;
}

export const config = {
  // Alles ausser Next-Interna und statischen Dateien.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt).*)'],
};
