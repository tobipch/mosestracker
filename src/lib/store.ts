import 'server-only';
import { randomUUID, createHash } from 'node:crypto';
import type { Status } from './moses';
import type { Marken, Seele } from './typen';
import { MANNA_TAGE } from './zeit';

/**
 * Das Lager - die Datenhaltung.
 *
 * Zwei Traeger: PostgreSQL (Vercel/Neon) fuer den echten Betrieb, ein fluechtiger
 * Speicher fuer `npm run dev` ohne Datenbank. Beide halten sich an dieselbe Regel:
 * Nichts ueberlebt laenger als 14 Tage (Manna-Regel, Ex 16,20).
 */

export type { Marken, Seele } from './typen';

export type Lagerstand = {
  seelen: Seele[];
  /** Zeitpunkt des letzten Resets (ISO) oder null. */
  letzteScherbe: string | null;
  /** Wurde beim Laden automatisch ein Sabbat-Reset ausgefuehrt? */
  sabbatGehalten: boolean;
  /** Wie viele verdorbene Manna-Zeilen wurden gerade entfernt? */
  verdorben: number;
  /** Laeuft die App auf einer echten Datenbank? */
  dauerhaft: boolean;
};

export interface Store {
  readonly dauerhaft: boolean;
  vorbereiten(): Promise<void>;
  /** Loescht alles, was aelter als 14 Tage ist. Gibt die Anzahl zurueck. */
  mannaPruefen(): Promise<number>;
  zustandLesen(schluessel: string): Promise<string | null>;
  zustandSchreiben(schluessel: string, wert: string): Promise<void>;
  seelenLesen(): Promise<Seele[]>;
  seelenRufen(eintraege: { name: string; lager: string | null }[]): Promise<number>;
  seeleEntlassen(id: string): Promise<void>;
  markeSetzen(id: string, tag: number, status: Status): Promise<void>;
  zeileSetzen(id: string, status: Status | null): Promise<void>;
  spalteSetzen(tag: number, status: Status, nurOffen: boolean): Promise<void>;
  notizSetzen(id: string, notiz: string): Promise<void>;
  tafelnZerbrechen(): Promise<number>;
  wacheZaehlen(ipHash: string, fensterMinuten: number): Promise<number>;
  wacheMelden(ipHash: string): Promise<void>;
  wacheLoeschen(ipHash: string): Promise<void>;
}

export const MAX_SEELEN = 200;
export const MAX_NAME = 60;
export const MAX_LAGER = 40;
export const MAX_NOTIZ = 200;

export function ipHashen(ip: string): string {
  const salz = process.env.MOSES_IP_SALZ ?? process.env.MOSES_SESSION_SECRET ?? 'sinai';
  return createHash('sha256').update(`${salz}:${ip}`).digest('hex').slice(0, 32);
}

/* ------------------------------------------------------------------ */
/* PostgreSQL                                                          */
/* ------------------------------------------------------------------ */

function verbindungsUrl(): string | undefined {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    undefined
  );
}

type Sql = import('postgres').Sql;

let sqlSingleton: Sql | null = null;
let vorbereitung: Promise<void> | null = null;

async function sql(): Promise<Sql> {
  if (!sqlSingleton) {
    const url = verbindungsUrl();
    if (!url) throw new Error('Keine Datenbank-URL gesetzt (POSTGRES_URL).');
    const { default: postgres } = await import('postgres');
    sqlSingleton = postgres(url, {
      ssl: url.includes('sslmode=disable') ? false : 'require',
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false, // vertraegt sich mit PgBouncer/Neon-Pooling
      onnotice: () => {},
    });
  }
  return sqlSingleton;
}

class PgStore implements Store {
  readonly dauerhaft = true;

  async vorbereiten(): Promise<void> {
    if (!vorbereitung) {
      vorbereitung = (async () => {
        const db = await sql();
        await db`
          create table if not exists moses_volk (
            id          text primary key,
            name        text not null,
            lager       text,
            notiz       text,
            marken      jsonb not null default '{}'::jsonb,
            erfasst_am  timestamptz not null default now()
          )`;
        await db`create index if not exists moses_volk_alter on moses_volk (erfasst_am)`;
        await db`
          create table if not exists moses_bundeslade (
            schluessel  text primary key,
            wert        text not null,
            geaendert   timestamptz not null default now()
          )`;
        await db`
          create table if not exists moses_wache (
            id        bigserial primary key,
            ip_hash   text not null,
            gesehen   timestamptz not null default now()
          )`;
        await db`create index if not exists moses_wache_spur on moses_wache (ip_hash, gesehen)`;
      })().catch((e) => {
        vorbereitung = null;
        throw e;
      });
    }
    return vorbereitung;
  }

  async mannaPruefen(): Promise<number> {
    const db = await sql();
    const weg = await db`
      delete from moses_volk
      where erfasst_am < now() - make_interval(days => ${MANNA_TAGE}::int)
      returning id`;
    await db`delete from moses_wache where gesehen < now() - interval '24 hours'`;
    return weg.length;
  }

  async zustandLesen(schluessel: string) {
    const db = await sql();
    const r = await db`select wert from moses_bundeslade where schluessel = ${schluessel}`;
    return r.length ? (r[0].wert as string) : null;
  }

  async zustandSchreiben(schluessel: string, wert: string) {
    const db = await sql();
    await db`
      insert into moses_bundeslade (schluessel, wert, geaendert)
      values (${schluessel}, ${wert}, now())
      on conflict (schluessel) do update set wert = excluded.wert, geaendert = now()`;
  }

  async seelenLesen(): Promise<Seele[]> {
    const db = await sql();
    const r = await db`
      select id, name, lager, notiz, marken, erfasst_am
      from moses_volk
      -- Deterministische Reihenfolge: erst Baustelle, dann Erfassungszeit,
      -- dann Name. Ohne den Namen als letztes Kriterium koennten Personen aus
      -- demselben Sammel-Insert bei jedem Laden die Plaetze tauschen.
      order by coalesce(lager, 'zzzz') asc, erfasst_am asc, name asc`;
    return r.map((z) => ({
      id: z.id as string,
      name: z.name as string,
      lager: (z.lager as string | null) ?? null,
      notiz: (z.notiz as string | null) ?? null,
      marken: (z.marken ?? {}) as Marken,
      erfasstAm: new Date(z.erfasst_am as string | Date).toISOString(),
    }));
  }

  async seelenRufen(eintraege: { name: string; lager: string | null }[]): Promise<number> {
    if (!eintraege.length) return 0;
    const db = await sql();
    const [{ anzahl }] = await db`select count(*)::int as anzahl from moses_volk`;
    const platz = Math.max(0, MAX_SEELEN - Number(anzahl));
    const zeilen = eintraege.slice(0, platz).map((e) => ({
      id: randomUUID(),
      name: e.name,
      lager: e.lager,
    }));
    if (!zeilen.length) return 0;
    // Ein einziger Insert statt N Rundreisen - spuerbar auf Serverless.
    await db`insert into moses_volk ${db(zeilen, 'id', 'name', 'lager')}`;
    return zeilen.length;
  }

  async seeleEntlassen(id: string) {
    const db = await sql();
    await db`delete from moses_volk where id = ${id}`;
  }

  async markeSetzen(id: string, tag: number, status: Status) {
    const db = await sql();
    if (status === 'offen') {
      await db`update moses_volk set marken = marken - ${String(tag)}::text where id = ${id}`;
    } else {
      await db`
        update moses_volk
        set marken = marken || jsonb_build_object(${String(tag)}::text, ${status}::text)
        where id = ${id}`;
    }
  }

  async zeileSetzen(id: string, status: Status | null) {
    const db = await sql();
    if (status === null || status === 'offen') {
      await db`update moses_volk set marken = '{}'::jsonb where id = ${id}`;
      return;
    }
    const marken: Record<string, Status> = {};
    for (let t = 0; t < 7; t++) marken[String(t)] = status;
    await db`update moses_volk set marken = ${db.json(marken)} where id = ${id}`;
  }

  async spalteSetzen(tag: number, status: Status, nurOffen: boolean) {
    const db = await sql();
    const schluessel = String(tag);
    if (status === 'offen') {
      await db`update moses_volk set marken = marken - ${schluessel}::text`;
      return;
    }
    if (nurOffen) {
      await db`
        update moses_volk
        set marken = marken || jsonb_build_object(${schluessel}::text, ${status}::text)
        where not (marken ? ${schluessel}::text)`;
    } else {
      await db`
        update moses_volk
        set marken = marken || jsonb_build_object(${schluessel}::text, ${status}::text)`;
    }
  }

  async notizSetzen(id: string, notiz: string) {
    const db = await sql();
    await db`update moses_volk set notiz = ${notiz || null} where id = ${id}`;
  }

  async tafelnZerbrechen(): Promise<number> {
    const db = await sql();
    const weg = await db`delete from moses_volk returning id`;
    return weg.length;
  }

  async wacheZaehlen(ipHash: string, fensterMinuten: number): Promise<number> {
    const db = await sql();
    const r = await db`
      select count(*)::int as anzahl from moses_wache
      where ip_hash = ${ipHash}
        and gesehen > now() - make_interval(mins => ${fensterMinuten}::int)`;
    return Number(r[0].anzahl);
  }

  async wacheMelden(ipHash: string) {
    const db = await sql();
    await db`insert into moses_wache (ip_hash) values (${ipHash})`;
  }

  async wacheLoeschen(ipHash: string) {
    const db = await sql();
    await db`delete from moses_wache where ip_hash = ${ipHash}`;
  }
}

/* ------------------------------------------------------------------ */
/* Fluechtiger Speicher (nur lokale Entwicklung ohne Datenbank)        */
/* ------------------------------------------------------------------ */

type Fluechtig = {
  seelen: Seele[];
  zustand: Map<string, string>;
  wache: { ipHash: string; zeit: number }[];
};

const globalerSpeicher = globalThis as unknown as { __moses?: Fluechtig };
function speicher(): Fluechtig {
  if (!globalerSpeicher.__moses) {
    globalerSpeicher.__moses = { seelen: [], zustand: new Map(), wache: [] };
  }
  return globalerSpeicher.__moses;
}

class SandStore implements Store {
  readonly dauerhaft = false;

  async vorbereiten() {}

  async mannaPruefen(): Promise<number> {
    const s = speicher();
    const grenze = Date.now() - MANNA_TAGE * 86_400_000;
    const vorher = s.seelen.length;
    s.seelen = s.seelen.filter((x) => Date.parse(x.erfasstAm) >= grenze);
    s.wache = s.wache.filter((w) => w.zeit > Date.now() - 86_400_000);
    return vorher - s.seelen.length;
  }

  async zustandLesen(k: string) { return speicher().zustand.get(k) ?? null; }
  async zustandSchreiben(k: string, v: string) { speicher().zustand.set(k, v); }

  async seelenLesen(): Promise<Seele[]> {
    return speicher().seelen
      .slice()
      .sort((a, b) =>
        (a.lager ?? 'zzzz').localeCompare(b.lager ?? 'zzzz', 'de-CH') ||
        a.erfasstAm.localeCompare(b.erfasstAm) ||
        a.name.localeCompare(b.name, 'de-CH'),
      )
      .map((s) => ({ ...s, marken: { ...s.marken } }));
  }

  async seelenRufen(eintraege: { name: string; lager: string | null }[]): Promise<number> {
    const s = speicher();
    const platz = Math.max(0, MAX_SEELEN - s.seelen.length);
    const zu = eintraege.slice(0, platz);
    for (const e of zu) {
      s.seelen.push({
        id: randomUUID(), name: e.name, lager: e.lager,
        notiz: null, marken: {}, erfasstAm: new Date().toISOString(),
      });
    }
    return zu.length;
  }

  async seeleEntlassen(id: string) {
    const s = speicher();
    s.seelen = s.seelen.filter((x) => x.id !== id);
  }

  async markeSetzen(id: string, tag: number, status: Status) {
    const s = speicher().seelen.find((x) => x.id === id);
    if (!s) return;
    if (status === 'offen') delete s.marken[tag];
    else s.marken[tag] = status;
  }

  async zeileSetzen(id: string, status: Status | null) {
    const s = speicher().seelen.find((x) => x.id === id);
    if (!s) return;
    s.marken = {};
    if (status && status !== 'offen') for (let t = 0; t < 7; t++) s.marken[t] = status;
  }

  async spalteSetzen(tag: number, status: Status, nurOffen: boolean) {
    for (const s of speicher().seelen) {
      if (status === 'offen') { delete s.marken[tag]; continue; }
      if (nurOffen && s.marken[tag]) continue;
      s.marken[tag] = status;
    }
  }

  async notizSetzen(id: string, notiz: string) {
    const s = speicher().seelen.find((x) => x.id === id);
    if (s) s.notiz = notiz || null;
  }

  async tafelnZerbrechen(): Promise<number> {
    const s = speicher();
    const n = s.seelen.length;
    s.seelen = [];
    return n;
  }

  async wacheZaehlen(ipHash: string, fensterMinuten: number) {
    const grenze = Date.now() - fensterMinuten * 60_000;
    return speicher().wache.filter((w) => w.ipHash === ipHash && w.zeit > grenze).length;
  }

  async wacheMelden(ipHash: string) {
    speicher().wache.push({ ipHash, zeit: Date.now() });
  }

  async wacheLoeschen(ipHash: string) {
    const s = speicher();
    s.wache = s.wache.filter((w) => w.ipHash !== ipHash);
  }
}

/* ------------------------------------------------------------------ */

let gewaehlt: Store | null = null;

/** Liefert den passenden Traeger und legt beim ersten Mal die Tabellen an. */
export async function store(): Promise<Store> {
  if (!gewaehlt) {
    gewaehlt = verbindungsUrl() ? new PgStore() : new SandStore();
    if (!verbindungsUrl() && process.env.NODE_ENV === 'production') {
      // In Produktion ohne Datenbank waeren die Daten nach jedem Kaltstart weg -
      // das ist zwar datensparsam, aber unbrauchbar. Deshalb laut sein.
      console.warn(
        '[MOSES] Keine POSTGRES_URL gesetzt - laeuft im fluechtigen Wuestenspeicher. ' +
        'Daten ueberleben keinen Neustart der Serverless-Funktion.',
      );
    }
  }
  await gewaehlt.vorbereiten();
  return gewaehlt;
}

export function datenbankVorhanden(): boolean {
  return Boolean(verbindungsUrl());
}
