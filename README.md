# Deutsch-Bingo

Digitale Weiterentwicklung eines bewährten Präsenz-Lernspiels aus dem DaF/DaZ-Unterricht: Wortschatz-, Genus- und Hörtraining über ein Bingo-Prinzip, ergänzt um Trainings- und Zuordnungsmodi für den Solo-Einsatz.

## Hintergrund

Das Original lief im F2F-Kurs mit laminierten Blättern und Chips: die Kursleiterin liest Wort- oder Satzkarten vor (immer neu gemischt), die Teilnehmenden decken passende Bildfelder auf ihrem 3×3- oder 4×4-Bingoblatt ab. Kernziele: Wortschatz- und Genusautomatisierung, Hörtraining, Konjugationstraining, häufig auch Vorbereitung der Alphabetisierung.

Die Live-Variante (Kursleiterin liest per Zoom vor) scheiterte online an Ausdrucken und Kontrollierbarkeit — das war der Auslöser für dieses App-Projekt.

## Aktueller Stand: Solo-Prototyp

Ein React-Prototyp mit drei eigenständigen Modi, aktuell mit Platzhalterbildern (echte Bildquelle vorhanden, noch nicht eingebunden):

- **🎯 Bingo** — Vollbild-Ziel (nicht nur eine Reihe/Spalte/Diagonale), automatischer oder manueller Kartenaufruf mit Sprachausgabe (Web Speech API), Zeitmessung mit persistentem persönlichem Rekord pro Boardgröße.
- **🔁 Training** — Endlos-Karussell: Bildvarianten desselben Worts rotieren automatisch, um Begriffssicherheit über einzelne Fotos hinaus aufzubauen (z. B. roter/grüner Pullover = beides "Pullover"). Umschaltbar zwischen Gruppierung nach Lautung (Minimalpaare) und nach Themenfeld.
- **🧩 Zuordnen** — Wort wird angesagt, passendes Bild wird angetippt, in Dauerschleife ohne Zeitdruck. Mehrere Bildvarianten desselben Worts dürfen gleichzeitig im Raster liegen, da es um korrekte Zuordnung geht, nicht um Eindeutigkeit.

Datei: [`prototypes/solo/deutsch-bingo.jsx`](prototypes/solo/deutsch-bingo.jsx)

## Content-Modell

- 6 Minimalpaar-Sets (22 Wörter), z. B. *Buch/Tuch/Dach/Tag*, *Schale/Schal/Schnalle* — bewusst nach **Lautung** kuratiert, nicht nach Thema.
- Jedes Wort trägt Genus (Farbcode: m=blau, f=pink, n=violett), ein Lautungs-Set und ein Themenfeld-Tag.
- Gruppierungssystem ist offen für weitere Taxonomien (aktuell: Lautung, Thema) — neue Gruppierungsart = neuer Eintrag, kein UI-Umbau.
- Jedes Wort kann mehrere Bildvarianten haben (aktuell als Platzhalter simuliert); Varianten sorgen für Abwechslung zwischen Boards bzw. Wiederholungsrunden, nicht für Mehrdeutigkeit auf einem einzelnen Board.

## Spielregeln (Kern-Mechanik)

- **Ziehstapel-Puffer:** ca. 30 % mehr Wörter im Ziehstapel als Feldanzahl auf dem Board — sonst gäbe es im Mehrspielermodus nie einen Sieger, weil jeder Aufruf ohnehin irgendwann trifft.
- **Board-Vielfalt:** mindestens 6 unterschiedliche Boards pro Wortset (unterschiedliche Wortauswahl *und* Anordnung) — im Prototyp durch Zufallsgenerierung mit Wiederholungssperre gelöst, keine fix kodierten Boards.
- **Tempo als Spielfaktor:** von langsam/wiederholend bis schnell im Loop — historisch der zentrale Spaßfaktor des F2F-Spiels, im Prototyp als Preset in allen drei Modi verfügbar.
- **Automatische Fairness-Kontrolle:** ein Feld lässt sich nur abdecken, wenn das Wort tatsächlich aufgerufen wurde — ersetzt die frühere manuelle Prüfung anhand der gezogenen Karten.

## Tech-Stack

- React (Einzelkomponente, Tailwind-Grundklassen + Inline-Styles für das individuelle Farbschema)
- Sprachausgabe über die browsereigene Web Speech API (`de-DE`), kein externer Dienst
- Persistenz für den Zeitrekord über die artefakteigene Storage-API (`window.storage`), personenbezogen, session-übergreifend

## Roadmap / Ideen (noch nicht umgesetzt)

- Mehrspielermodus (Realtime-Sync zwischen Geräten — deutlich größerer technischer Sprung als der Solo-Teil)
- Lotto-Variante als eigener dritter Spielmodus (Karten in der Mitte, TN ordnen zu, Schnellster gewinnt)
- Statt Bild-Wort-Zuordnung: Synonyme oder Antonyme
- Quartette statt 1:1-Paare — 1 Wort triggert 3 Bilder (z. B. *Wetter* → Sonne, Wolken, Blitz)
- Umgekehrte Zuordnung: Bild erscheint, passende Wörter werden zugeordnet
- Singular-Plural-Zuordnung
- Anbindung der echten Bildquelle anstelle der Platzhalter-Icons

## Status

Funktionaler Solo-Prototyp, mit Platzhalterbildern getestet. Nächste inhaltliche Schritte: echte Bilder einbinden, Mehrspieler-Architektur planen.
