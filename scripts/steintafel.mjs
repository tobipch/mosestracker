#!/usr/bin/env node
/**
 * "Haue dir zwei steinerne Tafeln, wie die ersten waren." (Ex 34,1)
 *
 * Erzeugt alle Geheimnisse, die MOSES braucht:
 *   node scripts/steintafel.mjs [passwort]
 *
 * Ohne Argument wird ein starkes Passwort vorgeschlagen.
 */

import { scrypt as scryptCb, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb);
const N = 16384, r = 8, p = 1, LEN = 32;

const WOERTER = [
  'sinai', 'dornbusch', 'manna', 'wolkensaeule', 'stab', 'tafel', 'exodus', 'midian',
  'aaron', 'mirjam', 'schilfmeer', 'wueste', 'zelt', 'bundeslade', 'nebo', 'horeb',
  'zippora', 'josua', 'plage', 'passah', 'wachtel', 'felsquelle', 'gebot', 'karawane',
];

function passwortVorschlagen() {
  const teile = Array.from({ length: 4 }, () => WOERTER[randomBytes(1)[0] % WOERTER.length]);
  const zahl = 10 + (randomBytes(2).readUInt16BE(0) % 90);
  return `${teile.join('-')}-${zahl}`;
}

const passwort = process.argv[2] ?? passwortVorschlagen();
const selbstErzeugt = process.argv.length < 3;

const salz = randomBytes(16);
const schluessel = await scrypt(passwort.normalize('NFKC'), salz, LEN, { N, r, p });
const hash = ['scrypt', N, r, p, salz.toString('base64'), schluessel.toString('base64')].join(':');

const zeile = '='.repeat(72);
console.log(`\n${zeile}`);
console.log('  MOSES - frische Steintafeln');
console.log(zeile);

if (selbstErzeugt) {
  console.log('\n  Vorgeschlagenes Losungswort (JETZT im Passwortmanager speichern!):\n');
  console.log(`      ${passwort}\n`);
  console.log('  Ein eigenes Passwort? node scripts/steintafel.mjs "mein passwort"');
} else {
  console.log('\n  Hash fuer das uebergebene Passwort erzeugt.');
}

console.log(`\n${zeile}`);
console.log('  Diese Werte als Umgebungsvariablen setzen (Vercel: Project Settings');
console.log('  -> Environment Variables, oder lokal in .env.local):');
console.log(`${zeile}\n`);
console.log(`MOSES_PASSWORT_HASH="${hash}"`);
console.log(`MOSES_SESSION_SECRET="${randomBytes(48).toString('base64url')}"`);
console.log(`MOSES_IP_SALZ="${randomBytes(16).toString('base64url')}"`);
console.log(`CRON_SECRET="${randomBytes(32).toString('base64url')}"`);
console.log(`\n${zeile}`);
console.log('  Das Klartext-Passwort steht nirgends in diesen Variablen - gut so.');
console.log('  Wer es vergisst, erzeugt einfach neue Tafeln.');
console.log(`${zeile}\n`);
