# 🔥 MOSES

Eine Wochentafel: wer war da, wer nicht.

Namen erfassen, Tage abhaken, fertig. Was am Ende der Woche keine Meldung hat,
steht automatisch oben in der Rückfrage-Liste. Sonntagabend leert sich die Tafel von selbst.

## Die fünf Zeichen

| | Bedeutung | Moses-Variante |
|---|---|---|
| `·` | Offen – keine Meldung | Noch in der Wüste |
| `✓` | Gearbeitet | Im Einsatz |
| `☾` | Frei / abgemeldet | Mit Segen abwesend |
| `✚` | Krank gemeldet | Von einer Plage getroffen |
| `🐂` | **Unentschuldigt gefehlt** | Tanzte ums goldene Kalb |

`🐂` und vergangene `·` landen in der **Rauchsäule** – der Rückfrage-Liste ganz oben.

## Bedienung

- **Badge-Feld:** tippen und Enter. Komma, Semikolon und Zeilenumbruch trennen ebenfalls;
  ganze Listen dürfen eingefügt werden. `Name @Ort` weist den Ort direkt zu.
- **Zeigestab:** bestimmt, was ein Klick auf eine Zelle setzt. Standard ist «durchklicken».
- **`✓✓`** setzt die ganze Woche einer Person, **«alle ✓»** in der Spaltenüberschrift
  den ganzen Tag für alle noch offenen Felder.
- **Reset:** «Tafeln zerbrechen» → `SINAI` tippen → alles gelöscht.
- **Auszug:** CSV mit Semikolon und BOM, öffnet direkt in Excel.

## Datenschutz

- **Nichts überlebt 14 Tage.** Älteres wird bei jedem Seitenaufruf und einmal täglich per Cron
  endgültig gelöscht – kein Papierkorb, kein Archiv, keine Historie.
- **Passwortgeschützt.** Losungswort als scrypt-Hash, zeitkonstant verglichen; nach 5 Fehlversuchen
  15 Minuten Sperre (gezählt über einen gesalzenen IP-Hash, der nach 24 h verschwindet).
- **Sitzung** als signiertes Cookie (`HttpOnly`, `Secure`, `SameSite=Strict`, 8 Stunden);
  jede schreibende Aktion prüft sie serverseitig erneut.
- **CSP mit Nonce** pro Request, HSTS, `frame-ancestors 'none'`, `Referrer-Policy: no-referrer`.
- **Keine fremden Götter:** kein Tracking, keine externen Schriften oder Skripte. `noindex`.
- **Datensparsam:** Name, Ort, sieben Tageszeichen, optionale Notiz. Sonst nichts.

## Setup

```bash
npm install
npm run steintafel        # erzeugt Passwort-Hash und alle Geheimnisse
npm run dev               # http://localhost:3000
```

Deployment auf Vercel: Repository importieren, unter **Storage** eine Postgres-Datenbank
verbinden (`POSTGRES_URL` wird automatisch gesetzt, die Tabellen legt die App selbst an),
dann die Werte aus `npm run steintafel` als Environment Variables eintragen –
siehe `.env.example`.

Ohne `POSTGRES_URL` läuft alles im Arbeitsspeicher; die App weist sichtbar darauf hin.

`vercel.json` registriert einen täglichen Cron auf `/api/sabbat`: löscht Abgelaufenes und
holt den Sonntags-Reset nach. Fällt der Cron aus, passiert dasselbe beim nächsten Seitenaufruf.

## Aufbau

```
src/
├─ proxy.ts        CSP mit Nonce + Cookie-Weiche vor jeder Anfrage
├─ app/            dornbusch (Anmeldung) · tafel (Hauptseite) · gebote (Anleitung) · api
├─ components/     Badgefeld · Steintafel · Rauchsaeule · Scherben (Reset) · Sanduhr
└─ lib/            auth · session · taten (Server Actions) · store (Postgres)
                   wanderung (Reset-Regeln) · analyse · zeit (Europe/Zurich) · moses (Texte)
```

Jede Moses-Anspielung trägt ihre nüchterne Erklärung direkt daneben
(«Die Rauchsäule · hier musst du nachfragen»). Wer die Bibel nicht kennt, versteht die App trotzdem.

*«Und das Volk zog aus.» (Ex 12,41)*
