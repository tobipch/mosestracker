import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

/**
 * Der Bund - die angemeldete Sitzung.
 *
 * Signiertes JWT in einem httpOnly-Cookie: kein Zugriff aus JavaScript,
 * kein Versand an fremde Seiten (SameSite=Strict), laeuft nach 8 Stunden ab.
 */

export const BUND_COOKIE = 'moses_bund';
const GUELTIG_STUNDEN = 8;

function geheimnis(): Uint8Array {
  const wert = process.env.MOSES_SESSION_SECRET;
  if (!wert || wert.length < 32) {
    throw new Error(
      'MOSES_SESSION_SECRET fehlt oder ist zu kurz (mindestens 32 Zeichen). ' +
      'Erzeugen mit: npm run steintafel',
    );
  }
  return new TextEncoder().encode(wert);
}

export async function bundSchliessen(): Promise<void> {
  const jetzt = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({ rolle: 'moses' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(jetzt)
    .setIssuer('moses')
    .setAudience('sinai')
    .setNotBefore(jetzt - 5)
    .setExpirationTime(jetzt + GUELTIG_STUNDEN * 3600)
    .setJti(crypto.randomUUID())
    .sign(geheimnis());

  (await cookies()).set(BUND_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: GUELTIG_STUNDEN * 3600,
  });
}

export async function bundBrechen(): Promise<void> {
  (await cookies()).set(BUND_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });
}

/** true, wenn eine gueltige Sitzung besteht. */
export async function imBund(): Promise<boolean> {
  const token = (await cookies()).get(BUND_COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, geheimnis(), {
      issuer: 'moses',
      audience: 'sinai',
      algorithms: ['HS256'],
      clockTolerance: 5,
    });
    return true;
  } catch {
    return false;
  }
}

/** Wirft, wenn keine gueltige Sitzung besteht. Fuer Server Actions. */
export async function bundVerlangen(): Promise<void> {
  if (!(await imBund())) throw new Error('Kein gültiger Bund – bitte neu anmelden.');
}
