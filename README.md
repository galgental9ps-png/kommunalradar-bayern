# KommunalRadar Bayern

Professioneller Monitor für relevante Entwicklungen in bayerischer Kommunalverwaltung, Haushalt, Finanzen, Recht, Förderung, Vergabe, Personal, Digitalisierung, Bau, Datenschutz und Rechtsprechung.

## Start lokal

```bash
npm install
npm run update
npm run dev
```

## Veröffentlichung

GitHub Pages auf "GitHub Actions" stellen. Der Workflow baut die App täglich neu und veröffentlicht das aktuelle Dashboard.

## Sicherheitsprinzip

Die Anwendung verarbeitet nur öffentliche Quellen aus `public/data/sources.json`. Keine Logins, keine privaten Daten, keine Bürgerdaten, keine Personaldaten, keine API-Schlüssel.
