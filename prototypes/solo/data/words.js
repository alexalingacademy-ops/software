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

// ---------------------------------------------------------------------------
// Bild-Namenskonvention (analog zur Audio-Konvention oben)
//
//   images/{wortId}-{variante}.{ext}            Singular
//   images/{wortId}-plural-{variante}.{ext}      Plural
//
// Beispiele: images/buch-a.jpg, images/buch-plural-a.jpg
//
// - variante: a/b/c — mehrere Bilder desselben Worts (z. B. rotes/graues
//   Dach = beides "Dach"), analog zu den A/B/C-Varianten im Trainingsmodus.
// - Nicht jedes Wort braucht alle drei Varianten oder ein Pluralbild; fehlt
//   eine Datei, fällt die UI auf das Platzhalter-Icon zurück.
// ---------------------------------------------------------------------------

export const IMAGE_VARIANTS = ["a", "b", "c"];

export function imagePath(wordId, variant, { plural = false, ext = "jpg" } = {}) {
  return plural ? `images/${wordId}-plural-${variant}.${ext}` : `images/${wordId}-${variant}.${ext}`;
}

function buildImages(word) {
  return {
    singular: IMAGE_VARIANTS.map((v) => imagePath(word.id, v)),
    plural: IMAGE_VARIANTS.map((v) => imagePath(word.id, v, { plural: true })),
  };
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
  { id: "buch", word: "Buch", plural: "Bücher", genus: "n", set: 1, topic: "Alltagsgegenstände" },
  { id: "tuch", word: "Tuch", plural: "Tücher", genus: "n", set: 1, topic: "Kleidung" },
  { id: "dach", word: "Dach", plural: "Dächer", genus: "n", set: 1, topic: "Wohnen" },
  { id: "tag", word: "Tag", plural: "Tage", genus: "m", set: 1, topic: "Zeit" },

  { id: "schale", word: "Schale", plural: "Schalen", genus: "f", set: 2, topic: "Küche" },
  { id: "schal", word: "Schal", plural: "Schals", genus: "m", set: 2, topic: "Kleidung" },
  { id: "schnalle", word: "Schnalle", plural: "Schnallen", genus: "f", set: 2, topic: "Kleidung" },

  { id: "nase", word: "Nase", plural: "Nasen", genus: "f", set: 3, topic: "Körper" },
  { id: "vase", word: "Vase", plural: "Vasen", genus: "f", set: 3, topic: "Wohnen" },
  { id: "hase", word: "Hase", plural: "Hasen", genus: "m", set: 3, topic: "Tiere" },

  { id: "tasse", word: "Tasse", plural: "Tassen", genus: "f", set: 4, topic: "Küche" },
  { id: "tanne", word: "Tanne", plural: "Tannen", genus: "f", set: 4, topic: "Natur" },
  { id: "tante", word: "Tante", plural: "Tanten", genus: "f", set: 4, topic: "Familie" },
  { id: "tasche", word: "Tasche", plural: "Taschen", genus: "f", set: 4, topic: "Kleidung" },
  { id: "taste", word: "Taste", plural: "Tasten", genus: "f", set: 4, topic: "Alltagsgegenstände" },

  { id: "ratte", word: "Ratte", plural: "Ratten", genus: "f", set: 5, topic: "Tiere" },
  // Watte ist im Alltag meist ein Massenwort (wie "cotton wool") und kommt
  // kaum im Plural vor — Form trotzdem hinterlegt, für Konsistenz im Modell.
  { id: "watte", word: "Watte", plural: "Watten", genus: "f", set: 5, topic: "Alltagsgegenstände" },

  { id: "bett", word: "Bett", plural: "Betten", genus: "n", set: 6, topic: "Wohnen" },
  { id: "beet", word: "Beet", plural: "Beete", genus: "n", set: 6, topic: "Natur" },
  { id: "brett", word: "Brett", plural: "Bretter", genus: "n", set: 6, topic: "Alltagsgegenstände" },
  { id: "boot", word: "Boot", plural: "Boote", genus: "n", set: 6, topic: "Fahrzeuge" },
  { id: "brot", word: "Brot", plural: "Brote", genus: "n", set: 6, topic: "Essen" },
];

export const WORDS = RAW_WORDS.map((w) => ({ ...w, sentences: buildSentences(w), images: buildImages(w) }));
