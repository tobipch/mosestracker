import 'server-only';
import { randomUUID, createHash } from 'node:crypto';
import type { Marke, Person } from './typen';
import { MANNA_TAGE, TAGE_IM_RASTER, WERKTAGE_STANDARD, montagIso, type Etappe } from './zeit';

/**
 * Das Lager - die Datenhaltung.
 *
 * Zwei Traeger: PostgreSQL (Vercel/Neon) fuer den echten Betrieb, ein fluechtiger
 * Speicher fuer `npm run dev` ohne Datenbank. Beide halten sich an dieselben Regeln:
 *
 *  - Die Personenliste ist zentral und bleibt bestehen, bis jemand sie aendert.
 *  - Wochendaten verfallen nach 14 Tagen (Manna-Regel, Ex 16,20).
 *  - Wird eine Person geloescht, verschwinden alle ihre Wochendaten mit ihr.
 */

export type { Person } from './typen';

/** Eintraege einer Person fuer genau eine Kalenderwoche. */
export type Wocheneintrag = {
  marken: Partial<Record<number, Marke>>;
  rapport: boolean;
};

export interface Store {
  readonly dauerhaft: boolean;
  vorbereiten(): Promise<void>;
  /** Loescht Wochendaten aelter als 14 Tage. Gibt die Anzahl zurueck. */
  mannaPruefen(): Promise<number>;
  zustandLesen(schluessel: string): Promise<string | null>;
  zustandSchreiben(schluessel: string, wert: string): Promise<void>;

  volkLesen(): Promise<Person[]>;
  volkRufen(namen: string[]): Promise<number>;
  /** Loescht die Person samt allen Wochendaten. */
  personTilgen(id: string): Promise<void>;
  werktageSetzen(id: string, werktage: number[]): Promise<void>;

  wocheLesen(etappe: Etappe): Promise<Map<string, Wocheneintrag>>;
  markeSetzen(id: string, etappe: Etappe, spalte: number, marke: Marke | null): Promise<void>;
  rapportSetzen(id: string, etappe: Etappe, gesetzt: boolean): Promise<void>;

  allesTilgen(): Promise<number>;

  wacheZaehlen(ipHash: string, fensterMinuten: number): Promise<number>;
  wacheMelden(ipHash: string): Promise<void>;
  wacheLoeschen(ipHash: string): Promise<void>;
}

export const MAX_PERSONEN = 200;
export const MAX_NAME = 60;

export function ipHashen(ip: string): string {
  const salz = process.env.MOSES_IP_SALZ ?? process.env.MOSES_SESSION_SECRET ?? 'sinai';
  return createHash('sha256').update(`${salz}:${ip}`).digest('hex').slice(0, 32);
}

/** Bringt eine Werktagsliste in eine saubere, erlaubte Form. */
export function werktageSaeubern(roh: unknown): number[] {
  if (!Array.isArray(roh)) return [...WERKTAGE_STANDARD];
  const erlaubt = roh
    .map((x) => Number(x))
    .filter((x) => Number.isInteger(x) && x >= 0 && x < TAGE_IM_RASTER);
  return [...new Set(erlaubt)].sort((a, b) => a - b);
}

/* ------------------------------------------------------------------ */
/* PostgreSQL                                                          */
/* ------------------------------------------------------------------ */

const URL_KANDIDATEN = [
  'POSTGRES_URL',
  'DATABASE_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING',
  'DATABASE_URL_UNPOOLED',
  'NEON_DATABASE_URL',
  'POSTGRES_URL_NO_SSL',
] as const;

function istPostgresUrl(wert: string | undefined): wert is string {
  return typeof wert === 'string' && /^postgres(ql)?:\/\/\S/i.test(wert.trim());
}

/**
 * Sucht die Verbindungszeichenkette: zuerst unter den bekannten Namen, dann
 * unter allen Umgebungsvariablen, deren Wert wie eine Postgres-URL aussieht.
 * Eine gesetzte, aber leere Variable soll nicht gewinnen.
 */
export function verbindungsQuelle(): { name: string; url: string } | null {
  for (const name of URL_KANDIDATEN) {
    const wert = process.env[name];
    if (istPostgresUrl(wert)) return { name, url: wert.trim() };
  }
  for (const [name, wert] of Object.entries(process.env)) {
    if (istPostgresUrl(wert)) return { name, url: wert.trim() };
  }
  return null;
}

/** Nur die Namen und ob sie belegt sind - niemals die Werte. Fuer die Fehlersuche. */
export function datenbankDiagnose(): { name: string; gesetzt: boolean }[] {
  return URL_KANDIDATEN.map((name) => ({
    name,
    gesetzt: Boolean(process.env[name]?.trim()),
  }));
}

/**
 * Parameter, die postgres.js unveraendert als Startup-Parameter weiterreicht.
 * Alles andere wird entfernt: Neon haengt "channel_binding" an, Prisma-URLs
 * "pgbouncer" - PostgreSQL lehnt beide ab und die Verbindung scheitert.
 */
const ERLAUBTE_PARAMETER = new Set([
  'sslmode', 'sslrootcert', 'application_name', 'options',
  'connect_timeout', 'target_session_attrs',
]);

function urlBereinigen(roh: string): string {
  try {
    const u = new URL(roh);
    for (const schluessel of [...u.searchParams.keys()]) {
      if (!ERLAUBTE_PARAMETER.has(schluessel.toLowerCase())) u.searchParams.delete(schluessel);
    }
    return u.toString();
  } catch {
    return roh;
  }
}

type Sql = import('postgres').Sql;

let sqlSingleton: Sql | null = null;
let vorbereitung: Promise<void> | null = null;

async function sql(): Promise<Sql> {
  if (!sqlSingleton) {
    const quelle = verbindungsQuelle();
    if (!quelle) throw new Error('Keine Datenbank-URL gesetzt (POSTGRES_URL).');
    const url = urlBereinigen(quelle.url);
    const { default: postgres } = await import('postgres');
    sqlSingleton = postgres(url, {
      ssl: /sslmode=disable/.test(url) ? false : 'require',
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

        // Umstellung vom alten Modell (eine Wegwerf-Woche pro Person) auf die
        // zentrale Liste mit Wochentafeln. Die alten Zeilen waren ohnehin
        // Wegwerfdaten, deshalb genuegt ein sauberer Schnitt.
        await db`
          do $$
          begin
            if exists (
              select 1 from information_schema.columns
              where table_schema = current_schema()
                and table_name = 'moses_volk'
                and column_name = 'lager'
            ) then
              drop table moses_volk cascade;
            end if;
          end $$`;

        await db`
          create table if not exists moses_volk (
            id          text primary key,
            name        text not null,
            werktage    jsonb not null default '[0,1,2,3,4]'::jsonb,
            erfasst_am  timestamptz not null default now()
          )`;

        await db`
          create table if not exists moses_wochentafel (
            volk_id   text not null references moses_volk(id) on delete cascade,
            jahr      smallint not null,
            woche     smallint not null,
            montag    date not null,
            marken    jsonb not null default '{}'::jsonb,
            rapport   boolean not null default false,
            geaendert timestamptz not null default now(),
            primary key (volk_id, jahr, woche)
          )`;
        await db`create index if not exists moses_wochentafel_alter on moses_wochentafel (montag)`;

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
      delete from moses_wochentafel
      where montag < current_date - make_interval(days => ${MANNA_TAGE}::int)
      returning volk_id`;
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

  async volkLesen(): Promise<Person[]> {
    const db = await sql();
    const r = await db`select id, name, werktage, erfasst_am from moses_volk`;
    return r
      .map((z) => ({
        id: z.id as string,
        name: z.name as string,
        werktage: werktageSaeubern(z.werktage),
        erfasstAm: new Date(z.erfasst_am as string | Date).toISOString(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'de-CH'));
  }

  async volkRufen(namen: string[]): Promise<number> {
    if (!namen.length) return 0;
    const db = await sql();
    const [{ anzahl }] = await db`select count(*)::int as anzahl from moses_volk`;
    const platz = Math.max(0, MAX_PERSONEN - Number(anzahl));
    const zeilen = namen.slice(0, platz).map((name) => ({ id: randomUUID(), name }));
    if (!zeilen.length) return 0;
    await db`insert into moses_volk ${db(zeilen, 'id', 'name')}`;
    return zeilen.length;
  }

  async personTilgen(id: string) {
    const db = await sql();
    // Die Wochendaten haengen per ON DELETE CASCADE daran und gehen mit.
    await db`delete from moses_volk where id = ${id}`;
  }

  async werktageSetzen(id: string, werktage: number[]) {
    const db = await sql();
    await db`update moses_volk set werktage = ${db.json(werktage)} where id = ${id}`;
  }

  async wocheLesen(etappe: Etappe): Promise<Map<string, Wocheneintrag>> {
    const db = await sql();
    const r = await db`
      select volk_id, marken, rapport
      from moses_wochentafel
      where jahr = ${etappe.jahr} and woche = ${etappe.woche}`;
    const map = new Map<string, Wocheneintrag>();
    for (const z of r) {
      map.set(z.volk_id as string, {
        marken: (z.marken ?? {}) as Partial<Record<number, Marke>>,
        rapport: Boolean(z.rapport),
      });
    }
    return map;
  }

  async markeSetzen(id: string, etappe: Etappe, spalte: number, marke: Marke | null) {
    const db = await sql();
    const schluessel = String(spalte);
    if (marke === null) {
      await db`
        update moses_wochentafel
        set marken = marken - ${schluessel}::text, geaendert = now()
        where volk_id = ${id} and jahr = ${etappe.jahr} and woche = ${etappe.woche}`;
      return;
    }
    await db`
      insert into moses_wochentafel (volk_id, jahr, woche, montag, marken)
      values (${id}, ${etappe.jahr}, ${etappe.woche}, ${montagIso(etappe)},
              jsonb_build_object(${schluessel}::text, ${marke}::text))
      on conflict (volk_id, jahr, woche) do update
        set marken = moses_wochentafel.marken || jsonb_build_object(${schluessel}::text, ${marke}::text),
            geaendert = now()`;
  }

  async rapportSetzen(id: string, etappe: Etappe, gesetzt: boolean) {
    const db = await sql();
    await db`
      insert into moses_wochentafel (volk_id, jahr, woche, montag, rapport)
      values (${id}, ${etappe.jahr}, ${etappe.woche}, ${montagIso(etappe)}, ${gesetzt})
      on conflict (volk_id, jahr, woche) do update
        set rapport = excluded.rapport, geaendert = now()`;
  }

  async allesTilgen(): Promise<number> {
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

type WochenSchluessel = string;

type Fluechtig = {
  volk: Person[];
  wochen: Map<WochenSchluessel, Map<string, Wocheneintrag>>;
  montage: Map<WochenSchluessel, string>;
  zustand: Map<string, string>;
  wache: { ipHash: string; zeit: number }[];
};

const globalerSpeicher = globalThis as unknown as { __moses?: Fluechtig };
function speicher(): Fluechtig {
  if (!globalerSpeicher.__moses) {
    globalerSpeicher.__moses = {
      volk: [], wochen: new Map(), montage: new Map(), zustand: new Map(), wache: [],
    };
  }
  return globalerSpeicher.__moses;
}

function schluesselVon(etappe: Etappe): string {
  return `${etappe.jahr}-${etappe.woche}`;
}

class SandStore implements Store {
  readonly dauerhaft = false;

  async vorbereiten() {}

  async mannaPruefen(): Promise<number> {
    const s = speicher();
    const grenze = new Date(Date.now() - MANNA_TAGE * 86_400_000).toISOString().slice(0, 10);
    let weg = 0;
    for (const [k, montag] of s.montage) {
      if (montag < grenze) {
        weg += s.wochen.get(k)?.size ?? 0;
        s.wochen.delete(k);
        s.montage.delete(k);
      }
    }
    s.wache = s.wache.filter((w) => w.zeit > Date.now() - 86_400_000);
    return weg;
  }

  async zustandLesen(k: string) { return speicher().zustand.get(k) ?? null; }
  async zustandSchreiben(k: string, v: string) { speicher().zustand.set(k, v); }

  async volkLesen(): Promise<Person[]> {
    return speicher().volk
      .map((p) => ({ ...p, werktage: [...p.werktage] }))
      .sort((a, b) => a.name.localeCompare(b.name, 'de-CH'));
  }

  async volkRufen(namen: string[]): Promise<number> {
    const s = speicher();
    const platz = Math.max(0, MAX_PERSONEN - s.volk.length);
    const zu = namen.slice(0, platz);
    for (const name of zu) {
      s.volk.push({
        id: randomUUID(),
        name,
        werktage: [...WERKTAGE_STANDARD],
        erfasstAm: new Date().toISOString(),
      });
    }
    return zu.length;
  }

  async personTilgen(id: string) {
    const s = speicher();
    s.volk = s.volk.filter((p) => p.id !== id);
    for (const woche of s.wochen.values()) woche.delete(id);
  }

  async werktageSetzen(id: string, werktage: number[]) {
    const p = speicher().volk.find((x) => x.id === id);
    if (p) p.werktage = werktage;
  }

  async wocheLesen(etappe: Etappe): Promise<Map<string, Wocheneintrag>> {
    const vorhanden = speicher().wochen.get(schluesselVon(etappe));
    const kopie = new Map<string, Wocheneintrag>();
    if (vorhanden) {
      for (const [k, v] of vorhanden) kopie.set(k, { marken: { ...v.marken }, rapport: v.rapport });
    }
    return kopie;
  }

  private eintrag(etappe: Etappe, id: string): Wocheneintrag {
    const s = speicher();
    const k = schluesselVon(etappe);
    if (!s.wochen.has(k)) {
      s.wochen.set(k, new Map());
      s.montage.set(k, montagIso(etappe));
    }
    const woche = s.wochen.get(k)!;
    if (!woche.has(id)) woche.set(id, { marken: {}, rapport: false });
    return woche.get(id)!;
  }

  async markeSetzen(id: string, etappe: Etappe, spalte: number, marke: Marke | null) {
    const e = this.eintrag(etappe, id);
    if (marke === null) delete e.marken[spalte];
    else e.marken[spalte] = marke;
  }

  async rapportSetzen(id: string, etappe: Etappe, gesetzt: boolean) {
    this.eintrag(etappe, id).rapport = gesetzt;
  }

  async allesTilgen(): Promise<number> {
    const s = speicher();
    const n = s.volk.length;
    s.volk = [];
    s.wochen.clear();
    s.montage.clear();
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
    const quelle = verbindungsQuelle();
    gewaehlt = quelle ? new PgStore() : new SandStore();
    if (quelle) {
      console.log(`[MOSES] Datenbank verbunden ueber ${quelle.name}.`);
    } else if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[MOSES] Keine Datenbank-URL gefunden - laeuft im fluechtigen Wuestenspeicher. ' +
        'Daten ueberleben keinen Neustart der Serverless-Funktion.',
      );
    }
  }
  await gewaehlt.vorbereiten();
  return gewaehlt;
}

export function datenbankVorhanden(): boolean {
  return verbindungsQuelle() !== null;
}
