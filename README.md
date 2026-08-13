# Deutsch-Bingo

Digitale Weiterentwicklung eines bewährten Präsenz-Lernspiels aus dem DaF/DaZ-Unterricht: Wortschatz-, Genus- und Hörtraining über ein Bingo-Prinzip, ergänzt um Trainings- und Zuordnungsmodi für den Solo-Einsatz.

## Hintergrund

Das Original lief im F2F-Kurs mit laminierten Blättern und Chips: die Kursleiterin liest Wort- oder Satzkarten vor (immer neu gemischt), die Teilnehmenden decken passende Bildfelder auf ihrem 3×3- oder 4×4-Bingoblatt ab. Kernziele: Wortschatz- und Genusautomatisierung, Hörtraining, Konjugationstraining, häufig auch Vorbereitung der Alphabetisierung.

Die Live-Variante (Kursleiterin liest per Zoom vor) scheiterte online an Ausdrucken und Kontrollierbarkeit — das war der Auslöser für dieses App-Projekt.

## Aktueller Stand: Solo-Prototyp

Ein React-Prototyp mit vier eigenständigen Modi. Alle 78 Wörter haben mittlerweile echte Fotos; fehlt für ein Wort dennoch mal ein Bild, fällt die App automatisch auf ein Platzhalter-Icon zurück:

- **🎯 Bingo** — Vollbild-Ziel (nicht nur eine Reihe/Spalte/Diagonale), automatischer oder manueller Kartenaufruf mit Sprachausgabe (Web Speech API), Zeitmessung mit persistentem persönlichem Rekord pro Boardgröße.
- **🔁 Training** — Endlos-Karussell: Bildvarianten desselben Worts rotieren automatisch, um Begriffssicherheit über einzelne Fotos hinaus aufzubauen (z. B. roter/grüner Pullover = beides "Pullover"). Umschaltbar zwischen Gruppierung nach Lautung (Minimalpaare) und nach Themenfeld.
- **🧩 Zuordnen** — Wort wird angesagt, passendes Bild wird angetippt, in Dauerschleife ohne Zeitdruck. Mehrere Bildvarianten desselben Worts dürfen gleichzeitig im Raster liegen, da es um korrekte Zuordnung geht, nicht um Eindeutigkeit.
- **🎧 Minimalpaare** — zwei Wörter aus demselben Lautungs-Set werden als Bild gezeigt, eines wird angesagt, das passende Bild muss angetippt werden. Bewusst ohne Textlabel — reine Hörunterscheidung ähnlich klingender Wörter, nicht Lesen.

Datei: [`prototypes/solo/deutsch-bingo.jsx`](prototypes/solo/deutsch-bingo.jsx)
Wortdatenbank (Content, getrennt von UI/Gameplay): [`prototypes/solo/data/words.js`](prototypes/solo/data/words.js)

## Content-Modell

- 6 Minimalpaar-Sets à 13 Wörter (78 Wörter gesamt) — ein Set füllt damit sogar ein 3×3-Board mit Ziehstapel-Puffer allein. Bewusst nach **Lautung** kuratiert, nicht nach Thema.
- Jedes Wort trägt Genus (Farbcode: m=blau, f=pink, n=violett), ein Lautungs-Set und ein Themenfeld-Tag.
- Gruppierungssystem ist offen für weitere Taxonomien (aktuell: Lautung, Thema) — neue Gruppierungsart = neuer Eintrag, kein UI-Umbau.
- Jedes Wort kann mehrere Bildvarianten haben (`images.singular`, aktuell für Set 1 mit echten Fotos befüllt, sonst Platzhalter-Icon); Varianten sorgen für Abwechslung zwischen Boards bzw. Wiederholungsrunden, nicht für Mehrdeutigkeit auf einem einzelnen Board.
- Jedes Wort trägt zusätzlich eine `plural`-Form (z. B. Buch → Bücher) und optionale Plural-Bilder (`images.plural`) — Datenmodell vorbereitet für den Roadmap-Punkt Singular-Plural-Zuordnung, im Gameplay aber noch nicht verdrahtet.
- Jedes Wort trägt zusätzlich mehrere Übungssatz-Typen (Einzelwort, Nominativ, Akkusativ, Dativ, Frage — Register `SENTENCE_TYPES`, offen für weitere Typen). Artikel werden aus dem Genus generiert, nicht per Hand getippt, damit sie garantiert korrekt sind. Aktuell im Spiel verdrahtet ist der Akkusativsatz („Ich sehe einen/eine/ein *Wort*.“, passend zum bildbasierten Spielprinzip — man „sieht“ ja tatsächlich das Bildfeld): über den Schalter „Sätze statt Wörter ansagen“ (Bingo + Zuordnen) wird er statt des bloßen Worts vorgelesen. Board-Logik und Zuordnung reagieren weiterhin nur auf die Wort-ID, nicht auf den Ansagetext.

### Audio-Namenskonvention (fixiert, Dateien folgen später)

Sobald eigene Sprachaufnahmen (z. B. Alexas Stimme, später weitere Sprecher:innen) die Sprachausgabe ergänzen oder ersetzen sollen, gilt folgendes Namensschema (bereits in `data/words.js` als `audioKey()`/`audioFileName()` hinterlegt):

```
{wortId}--{satzKürzel}-{Nummer}--{sprecherId}.{ext}

buch--wort-1--anna.mp3     Anna sagt "Buch"
buch--akk-1--stefan.mp3    Stefan sagt "Ich sehe ein Buch."
tag--dat-2--anna.mp3       Annas zweite Dativ-Variante zu "Tag"
```

- **wortId**: die `id` aus der Wortliste (z. B. `buch`).
- **satzKürzel**: Schlüssel aus `SENTENCE_TYPES` (`wort`, `nom`, `akk`, `dat`, `frage`, …).
- **Nummer**: Pflichtfeld, auch bei nur einer Aufnahme (`1`) — erlaubt später weitere Satzvarianten desselben Typs, ohne bestehende Dateien umzubenennen.
- **sprecherId**: Kennung aus dem `SPEAKERS`-Register (siehe unten).
- Fehlt für eine Kombination die Audiodatei, fällt die App automatisch auf die Sprachausgabe (Web Speech API) zurück — Aufnahmen können also nach und nach ergänzt werden, ohne dass etwas fehlt.

**Sprecher-Register** (`SPEAKERS` in `data/words.js`, aktuell noch leer): jede Person trägt `id`, `name`, `gender` (m/f) und `herkunft` (Standardaussprache/Dialekt/Region) als Metadaten. Diese Klassifizierung ist die Grundlage für eine spätere Sprecherauswahl (gezielt eine Stimme wählen) oder einen Random-Mix-Modus (zufällige Stimme pro Ansage, für breiteres Hörverständnis-Training).

### Bilder: ein Ordner pro Wort (`data/images.js`)

```
images/{wortId}/*.{jpg,png,webp}            Singular, z.B. images/buch/irgendwas.jpg
images/{wortId}-plural/*.{jpg,png,webp}      Plural,   z.B. images/buch-plural/irgendwas.jpg
```

- Kein fester Dateiname nötig — `data/images.js` liest per `import.meta.glob` einfach alles ein, was im passenden Ordner liegt (beliebiger Name, beliebige Anzahl). Falsches Bild zugeordnet? Datei aus dem Ordner löschen/verschieben, richtige reinziehen — kein Umbenennen, kein Code anfassen.
- Bilder liegen unter [`prototypes/solo/images/`](prototypes/solo/images/), auf max. 1000px Kantenlänge verkleinert (JPEG, Qualität 82) — die Originalauflösung von Freepik ist fürs Web unnötig groß.
- Fehlt für ein Wort der Ordner oder ist er leer, zeigt die App automatisch das Platzhalter-Icon — Bilder können also Wort für Wort ergänzt werden. Auswahl-Hilfe: [`prototypes/solo/BILDAUSWAHL-CHECKLISTE.md`](prototypes/solo/BILDAUSWAHL-CHECKLISTE.md).

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
- Eigene Sprachaufnahmen statt/zusätzlich zur Web-Speech-API einbinden (Namenskonvention bereits fixiert, siehe Content-Modell), inkl. Sprecherauswahl und Random-Mix-Modus über mehrere Stimmen
- Satzmodus im Gameplay auf weitere Fälle ausweiten (aktuell nur Akkusativ verdrahtet; Nominativ/Dativ/Frage sind in der Datenbank bereits vorbereitet)
- Singular-Plural-Zuordnung als eigener Modus (Plural-Wortformen und -Bilder sind in der Datenbank bereits vorbereitet, siehe Content-Modell)
- Weitere Bildvarianten (B/C) und mehr Plural-Fotos für die Wörter ergänzen, die bisher nur eine Singular-Variante haben

## Status

Funktionaler Solo-Prototyp mit vier Modi. Alle 78 Wörter haben mindestens ein echtes Foto (Set 1 zusätzlich mit Plural-Varianten). Nächste inhaltliche Schritte: weitere Bildvarianten ergänzen, echte Sprachaufnahmen, Mehrspieler-Architektur planen.
