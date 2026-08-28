# 🔥 MOSES

Eine Wochentafel: wer war da, wer nicht.

Eine zentrale Personenliste, pro Kalenderwoche eine Tabelle. Werktage gelten als
anwesend, bis jemand etwas anderes anklickt. Eingegangene Rapporte hakst du ab –
was oben stehen bleibt, ist deine Arbeitsliste.

## Die zwei Ansichten

**Musterung** – die zentrale Personenliste. Gilt für alle Wochen, jederzeit änderbar.
Jede Person hat einen Namen und ihre Werktage (Mo–Sa möglich, Mo–Fr voreingestellt);
ein Klick schaltet einen Tag um. Wird eine Person getilgt, verschwinden alle ihre
Wochendaten mit ihr.

**Steintafel** – die Kalenderwoche. Zeilen sind Personen, Spalten Montag bis Samstag.

## Die vier Felder

| | Bedeutung | Moses-Variante |
|---|---|---|
| 🟩 `✓` | Anwesend – der Normalfall an einem Werktag | Im Einsatz am Bau |
| 🟧 `!` | Entschuldigt abwesend | Mit Segen abwesend |
| 🟥 `✗` | **Unentschuldigt abwesend** | Tanzte ums goldene Kalb |
| ⬜ `·` | Kein Werktag | Sabbatruhe |

Ein Klick schaltet weiter: grün → orange → rot → grün. Anwesenheit wird gar nicht
gespeichert, nur die Abweichungen.

Der Punkt vor dem Namen fasst die Woche zusammen: **grün** durchgehend anwesend,
**orange** mindestens eine entschuldigte Absenz, **rot** mindestens eine unentschuldigte.

## Rapport und Rückblick

Links pro Zeile eine Checkbox: Rapport eingegangen. Die Zeile wird blass und rutscht
ans Ende, die offenen bleiben oben. Mit **Vorige Etappe** springst du in die letzte
Kalenderwoche – dort machst du die Kontrolle. In der laufenden Woche ist die Spalte
des heutigen Tages leicht markiert.

## Datenschutz

- **Wochendaten verfallen nach 14 Tagen.** Gelöscht wird bei jedem Seitenaufruf und
  einmal täglich per Cron – kein Papierkorb, kein Archiv, keine Historie. Deshalb
  reicht der Rückblick genau eine Woche zurück.
- **Die Personenliste bleibt** – sie ist der zentrale Bestand und enthält nur Namen
  und Werktage. Einzeln tilgen oder mit «Tafeln zerbrechen» alles auf einmal.
- **Passwortgeschützt.** Losungswort als scrypt-Hash, zeitkonstant verglichen; nach
  5 Fehlversuchen 15 Minuten Sperre (gezählt über einen gesalzenen IP-Hash, der nach
  24 h verschwindet).
- **Sitzung** als signiertes Cookie (`HttpOnly`, `Secure`, `SameSite=Strict`, 8 Stunden);
  jede schreibende Aktion prüft sie serverseitig erneut.
- **CSP mit Nonce** pro Request, HSTS, `frame-ancestors 'none'`, `Referrer-Policy: no-referrer`.
- **Keine fremden Götter:** kein Tracking, keine externen Schriften oder Skripte. `noindex`.

## Setup

```bash
npm install
npm run steintafel        # erzeugt Passwort-Hash und alle Geheimnisse
npm run dev               # http://localhost:3000
```

Deployment auf Vercel: Repository importieren, unter **Storage** eine Postgres-Datenbank
verbinden (die App findet die Verbindung selbst und legt die Tabellen an), dann die Werte
aus `npm run steintafel` als Environment Variables eintragen – siehe `.env.example`.
Neue Variablen greifen erst nach einem Redeploy.

Ohne Datenbank läuft alles im Arbeitsspeicher; die App weist sichtbar darauf hin und
zeigt, welche Variablen sie gefunden hat.

`vercel.json` registriert einen täglichen Cron auf `/api/manna`, der die 14-Tage-Regel
durchsetzt. Fällt er aus, passiert dasselbe beim nächsten Seitenaufruf.

## Aufbau

```
src/
├─ proxy.ts        CSP mit Nonce + Cookie-Weiche vor jeder Anfrage
├─ app/            dornbusch (Anmeldung) · tafel (Woche) · volk (Liste) · gebote · api/manna
├─ components/     Steintafel · Musterung · Badgefeld · Berufung · Scherben (Reset)
└─ lib/            auth · session · taten (Server Actions) · store (Postgres)
                   wanderung (Laden) · analyse (Auswertung) · zeit (KW, Europe/Zurich)
                   moses (alle Texte und Anspielungen)
```

Jede Moses-Anspielung trägt ihre nüchterne Erklärung daneben («Die Musterung · Zentrale
Personenliste»). Wer die Bibel nicht kennt, versteht die App trotzdem.

*«Sechs Tage sollst du arbeiten.» (Ex 34,21)*
