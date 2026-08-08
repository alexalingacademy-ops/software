// Zentrale Wortdatenbank für Deutsch-Bingo — bewusst getrennt von der UI-
// Komponente, damit Wortschatz/Sätze unabhängig von Gameplay und (später)
// echten Bildern/Audiodateien gepflegt werden können.
//
// Jedes Wort trägt neben Genus/Lautungs-Set/Themenfeld eine `sentences`-Liste
// mit mehreren Übungssatz-Typen (Einzelwort, Nominativ, Akkusativ, Dativ,
// Frage) — offen für weitere Typen, siehe SENTENCE_TYPES. Artikel werden aus
// dem Genus generiert, nicht per Hand getippt, damit sie garantiert korrekt
// sind. Board/Zuordnung reagieren weiterhin nur auf die Wort-ID, nicht auf
// den gewählten Ansagetext.

export const NOMINATIVE_ARTICLE = { m: "ein", f: "eine", n: "ein" };
export const ACCUSATIVE_ARTICLE = { m: "einen", f: "eine", n: "ein" };
export const DATIVE_ARTICLE = { m: "einem", f: "einer", n: "einem" };

// Satztyp-Register: analog zum GROUPINGS-Muster in der UI — neuer Satztyp =
// neuer Eintrag hier (Kürzel = Dateinamens-Baustein, siehe audioKey unten),
// kein Umbau der Datenstruktur nötig.
export const SENTENCE_TYPES = {
  wort: { label: "Einzelwort", build: (w) => w.word },
  nom: { label: "Nominativ", build: (w) => `Das ist ${NOMINATIVE_ARTICLE[w.genus]} ${w.word}.` },
  akk: { label: "Akkusativ", build: (w) => `Ich sehe ${ACCUSATIVE_ARTICLE[w.genus]} ${w.word}.` },
  dat: { label: "Dativ", build: (w) => `Ich spreche von ${DATIVE_ARTICLE[w.genus]} ${w.word}.` },
  frage: { label: "Frage", build: (w) => `Ist das ${NOMINATIVE_ARTICLE[w.genus]} ${w.word}?` },
};

// ---------------------------------------------------------------------------
// Audio-Namenskonvention (fixiert, auch wenn noch keine Dateien existieren)
//
//   {wortId}--{satzKürzel}-{Nummer}--{sprecherId}.{ext}
//
// Beispiele:
//   buch--wort-1--anna.mp3     Anna sagt "Buch"
//   buch--akk-1--stefan.mp3    Stefan sagt "Ich sehe ein Buch."
//   tag--dat-2--anna.mp3       Annas zweite Dativ-Variante zu "Tag"
//
// - wortId: die id unten (z.B. "buch"), sprecherId: die id aus SPEAKERS.
// - Nummer ist Pflicht (auch bei nur einer Aufnahme = 1), damit später
//   weitere Satzvarianten desselben Typs ergänzt werden können, ohne
//   bestehende Dateien umzubenennen.
// - `--` trennt die drei Hauptteile, `-` nur satzKürzel von Nummer, damit
//   sich Dateinamen eindeutig zurück in {wortId, satzTyp, nummer, sprecherId}
//   zerlegen lassen.
// - Fehlt für ein (wortId, satzTyp, sprecherId)-Tripel die Datei, fällt die
//   App auf die Sprachausgabe (Web Speech API) zurück — Aufnahmen können
//   also nach und nach ergänzt werden.
// ---------------------------------------------------------------------------

export function audioKey(wordId, satzTyp, nummer = 1) {
  return `${wordId}--${satzTyp}-${nummer}`;
}

export function audioFileName(wordId, satzTyp, sprecherId, nummer = 1, ext = "mp3") {
  return `${audioKey(wordId, satzTyp, nummer)}--${sprecherId}.${ext}`;
}

// Sprecher-Register: Platzhalter, bis echte Aufnahmen existieren. Genus
// (m/f) und Herkunft (Standardaussprache/Dialekt/Region) als Metadaten, um
// später gezielt auswählen zu können oder einen Random-Mix aus mehreren
// Sprecher:innen zu ziehen (z.B. für breiteres Hörverständnis-Training).
//
// Beispiel-Eintrag, sobald eine Person aufgenommen hat:
//   { id: "anna", name: "Anna", gender: "f", herkunft: "Hochdeutsch" }
export const SPEAKERS = [
  // { id: "", name: "", gender: "m" | "f", herkunft: "" },
];

function buildSentences(word) {
  return Object.entries(SENTENCE_TYPES).map(([type, def]) => ({
    type,
    label: def.label,
    index: 1,
    text: def.build(word),
    audioKey: audioKey(word.id, type, 1),
  }));
}

const RAW_WORDS = [
  { id: "buch", word: "Buch", genus: "n", set: 1, topic: "Alltagsgegenstände" },
  { id: "tuch", word: "Tuch", genus: "n", set: 1, topic: "Kleidung" },
  { id: "dach", word: "Dach", genus: "n", set: 1, topic: "Wohnen" },
  { id: "tag", word: "Tag", genus: "m", set: 1, topic: "Zeit" },

  { id: "schale", word: "Schale", genus: "f", set: 2, topic: "Küche" },
  { id: "schal", word: "Schal", genus: "m", set: 2, topic: "Kleidung" },
  { id: "schnalle", word: "Schnalle", genus: "f", set: 2, topic: "Kleidung" },

  { id: "nase", word: "Nase", genus: "f", set: 3, topic: "Körper" },
  { id: "vase", word: "Vase", genus: "f", set: 3, topic: "Wohnen" },
  { id: "hase", word: "Hase", genus: "m", set: 3, topic: "Tiere" },

  { id: "tasse", word: "Tasse", genus: "f", set: 4, topic: "Küche" },
  { id: "tanne", word: "Tanne", genus: "f", set: 4, topic: "Natur" },
  { id: "tante", word: "Tante", genus: "f", set: 4, topic: "Familie" },
  { id: "tasche", word: "Tasche", genus: "f", set: 4, topic: "Kleidung" },
  { id: "taste", word: "Taste", genus: "f", set: 4, topic: "Alltagsgegenstände" },

  { id: "ratte", word: "Ratte", genus: "f", set: 5, topic: "Tiere" },
  { id: "watte", word: "Watte", genus: "f", set: 5, topic: "Alltagsgegenstände" },

  { id: "bett", word: "Bett", genus: "n", set: 6, topic: "Wohnen" },
  { id: "beet", word: "Beet", genus: "n", set: 6, topic: "Natur" },
  { id: "brett", word: "Brett", genus: "n", set: 6, topic: "Alltagsgegenstände" },
  { id: "boot", word: "Boot", genus: "n", set: 6, topic: "Fahrzeuge" },
  { id: "brot", word: "Brot", genus: "n", set: 6, topic: "Essen" },
];

export const WORDS = RAW_WORDS.map((w) => ({ ...w, sentences: buildSentences(w) }));
