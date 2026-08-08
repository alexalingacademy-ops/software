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

import { wordImages } from "./images";

export const NOMINATIVE_ARTICLE = { m: "ein", f: "eine", n: "ein" };
export const ACCUSATIVE_ARTICLE = { m: "einen", f: "eine", n: "ein" };
export const DATIVE_ARTICLE = { m: "einem", f: "einer", n: "einem" };

// Bestimmte Artikel — für Massenwörter (word.noArticle: true, z.B. Watte,
// Blut, Westen): die brauchen in den Satz-Übungen den bestimmten statt dem
// unbestimmten Artikel ("Ich sehe die Watte.", nicht "eine Watte").
export const DEFINITE_NOMINATIVE_ARTICLE = { m: "der", f: "die", n: "das" };
export const DEFINITE_ACCUSATIVE_ARTICLE = { m: "den", f: "die", n: "das" };
export const DEFINITE_DATIVE_ARTICLE = { m: "dem", f: "der", n: "dem" };

function nominativeArticle(w) {
  return (w.noArticle ? DEFINITE_NOMINATIVE_ARTICLE : NOMINATIVE_ARTICLE)[w.genus];
}
function accusativeArticle(w) {
  return (w.noArticle ? DEFINITE_ACCUSATIVE_ARTICLE : ACCUSATIVE_ARTICLE)[w.genus];
}
function dativeArticle(w) {
  return (w.noArticle ? DEFINITE_DATIVE_ARTICLE : DATIVE_ARTICLE)[w.genus];
}

// Satztyp-Register: analog zum GROUPINGS-Muster in der UI — neuer Satztyp =
// neuer Eintrag hier (Kürzel = Dateinamens-Baustein, siehe audioKey unten),
// kein Umbau der Datenstruktur nötig.
export const SENTENCE_TYPES = {
  wort: { label: "Einzelwort", build: (w) => w.word },
  nom: { label: "Nominativ", build: (w) => `Das ist ${nominativeArticle(w)} ${w.word}.` },
  akk: { label: "Akkusativ", build: (w) => `Ich sehe ${accusativeArticle(w)} ${w.word}.` },
  dat: { label: "Dativ", build: (w) => `Ich spreche von ${dativeArticle(w)} ${w.word}.` },
  frage: { label: "Frage", build: (w) => `Ist das ${nominativeArticle(w)} ${w.word}?` },
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

// Bild-Zuordnung: siehe data/images.js — ein Ordner pro Wort
// (images/{wortId}/, images/{wortId}-plural/), beliebige Dateinamen. Damit
// lässt sich eine falsche Zuordnung per Drag & Drop korrigieren, ohne Code
// oder Dateinamen anzufassen.

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
  { id: "bauch", word: "Bauch", plural: "Bäuche", genus: "m", set: 1, topic: "Körper" },
  { id: "tuch", word: "Tuch", plural: "Tücher", genus: "n", set: 1, topic: "Kleidung" },
  { id: "dach", word: "Dach", plural: "Dächer", genus: "n", set: 1, topic: "Wohnen" },
  { id: "bach", word: "Bach", plural: "Bäche", genus: "m", set: 1, topic: "Natur" },
  { id: "tag", word: "Tag", plural: "Tage", genus: "m", set: 1, topic: "Zeit" },
  { id: "teig", word: "Teig", plural: "Teige", genus: "m", set: 1, topic: "Essen" },
  { id: "schlauch", word: "Schlauch", plural: "Schläuche", genus: "m", set: 1, topic: "Alltagsgegenstände" },
  { id: "strich", word: "Strich", plural: "Striche", genus: "m", set: 1, topic: "Alltagsgegenstände" },
  { id: "teich", word: "Teich", plural: "Teiche", genus: "m", set: 1, topic: "Natur" },
  // Drachen (Spielzeug) und Drache (Fabelwesen) sind zwei verschiedene
  // Wörter, die sich zufällig überschneiden: Der Plural von "Drache" lautet
  // ebenfalls "Drachen".
  { id: "drachen", word: "Drachen", plural: "Drachen", genus: "m", set: 1, topic: "Alltagsgegenstände" },
  { id: "strick", word: "Strick", plural: "Stricke", genus: "m", set: 1, topic: "Alltagsgegenstände" },
  { id: "drache", word: "Drache", plural: "Drachen", genus: "m", set: 1, topic: "Tiere" },

  { id: "schale", word: "Schale", plural: "Schalen", genus: "f", set: 2, topic: "Küche" },
  { id: "schal", word: "Schal", plural: "Schals", genus: "m", set: 2, topic: "Kleidung" },
  { id: "schnalle", word: "Schnalle", plural: "Schnallen", genus: "f", set: 2, topic: "Kleidung" },
  { id: "schiff", word: "Schiff", plural: "Schiffe", genus: "n", set: 2, topic: "Fahrzeuge" },
  { id: "schaf", word: "Schaf", plural: "Schafe", genus: "n", set: 2, topic: "Tiere" },
  // Schilf ist wie Watte/Wolle ein echtes Massenwort: kein gebräuchlicher
  // Plural und kein unbestimmter Artikel ("Schilf", nicht "ein Schilf").
  { id: "schilf", word: "Schilf", plural: null, genus: "n", set: 2, topic: "Natur", noArticle: true },
  { id: "schlaufe", word: "Schlaufe", plural: "Schlaufen", genus: "f", set: 2, topic: "Alltagsgegenstände" },
  { id: "schaufel", word: "Schaufel", plural: "Schaufeln", genus: "f", set: 2, topic: "Alltagsgegenstände" },
  { id: "schule", word: "Schule", plural: "Schulen", genus: "f", set: 2, topic: "Orte" },
  { id: "schluessel", word: "Schlüssel", plural: "Schlüssel", genus: "m", set: 2, topic: "Alltagsgegenstände" },
  { id: "schuessel", word: "Schüssel", plural: "Schüsseln", genus: "f", set: 2, topic: "Küche" },
  // Schloss als Türverschluss (passend zu Schlüssel) — nicht als Bauwerk.
  { id: "schloss", word: "Schloss", plural: "Schlösser", genus: "n", set: 2, topic: "Alltagsgegenstände" },
  { id: "schleife", word: "Schleife", plural: "Schleifen", genus: "f", set: 2, topic: "Alltagsgegenstände" },

  { id: "nase", word: "Nase", plural: "Nasen", genus: "f", set: 3, topic: "Körper" },
  { id: "vase", word: "Vase", plural: "Vasen", genus: "f", set: 3, topic: "Wohnen" },
  { id: "hase", word: "Hase", plural: "Hasen", genus: "m", set: 3, topic: "Tiere" },
  { id: "wiese", word: "Wiese", plural: "Wiesen", genus: "f", set: 3, topic: "Natur" },
  { id: "hose", word: "Hose", plural: "Hosen", genus: "f", set: 3, topic: "Kleidung" },
  { id: "hals", word: "Hals", plural: "Hälse", genus: "m", set: 3, topic: "Körper" },
  { id: "haus", word: "Haus", plural: "Häuser", genus: "n", set: 3, topic: "Wohnen" },
  { id: "wueste", word: "Wüste", plural: "Wüsten", genus: "f", set: 3, topic: "Natur" },
  { id: "ferse", word: "Ferse", plural: "Fersen", genus: "f", set: 3, topic: "Körper" },
  { id: "dose", word: "Dose", plural: "Dosen", genus: "f", set: 3, topic: "Alltagsgegenstände" },
  { id: "duese", word: "Düse", plural: "Düsen", genus: "f", set: 3, topic: "Alltagsgegenstände" },
  { id: "blase", word: "Blase", plural: "Blasen", genus: "f", set: 3, topic: "Körper" },
  { id: "herz", word: "Herz", plural: "Herzen", genus: "n", set: 3, topic: "Körper" },

  { id: "tasse", word: "Tasse", plural: "Tassen", genus: "f", set: 4, topic: "Küche" },
  { id: "tanne", word: "Tanne", plural: "Tannen", genus: "f", set: 4, topic: "Natur" },
  { id: "tante", word: "Tante", plural: "Tanten", genus: "f", set: 4, topic: "Familie" },
  { id: "tasche", word: "Tasche", plural: "Taschen", genus: "f", set: 4, topic: "Kleidung" },
  { id: "taste", word: "Taste", plural: "Tasten", genus: "f", set: 4, topic: "Alltagsgegenstände" },
  { id: "tonne", word: "Tonne", plural: "Tonnen", genus: "f", set: 4, topic: "Alltagsgegenstände" },
  // Tinte wie Watte/Wolle/Schilf als Massenwort behandelt: kein Plural, kein
  // unbestimmter Artikel.
  { id: "tinte", word: "Tinte", plural: null, genus: "f", set: 4, topic: "Alltagsgegenstände", noArticle: true },
  { id: "torte", word: "Torte", plural: "Torten", genus: "f", set: 4, topic: "Essen" },
  { id: "tulpe", word: "Tulpe", plural: "Tulpen", genus: "f", set: 4, topic: "Natur" },
  { id: "traene", word: "Träne", plural: "Tränen", genus: "f", set: 4, topic: "Körper" },
  { id: "taube", word: "Taube", plural: "Tauben", genus: "f", set: 4, topic: "Tiere" },
  { id: "traube", word: "Traube", plural: "Trauben", genus: "f", set: 4, topic: "Essen" },
  { id: "diener", word: "Diener", plural: "Diener", genus: "m", set: 4, topic: "Beruf" },

  { id: "ratte", word: "Ratte", plural: "Ratten", genus: "f", set: 5, topic: "Tiere" },
  // Watte und Wolle sind wie Blut/Butter echte Massenwörter: kein
  // gebräuchlicher Plural und kein unbestimmter Artikel.
  { id: "watte", word: "Watte", plural: null, genus: "f", set: 5, topic: "Alltagsgegenstände", noArticle: true },
  { id: "wolle", word: "Wolle", plural: null, genus: "f", set: 5, topic: "Alltagsgegenstände", noArticle: true },
  { id: "rolle", word: "Rolle", plural: "Rollen", genus: "f", set: 5, topic: "Alltagsgegenstände" },
  { id: "welle", word: "Welle", plural: "Wellen", genus: "f", set: 5, topic: "Natur" },
  { id: "raute", word: "Raute", plural: "Rauten", genus: "f", set: 5, topic: "Alltagsgegenstände" },
  { id: "rille", word: "Rille", plural: "Rillen", genus: "f", set: 5, topic: "Alltagsgegenstände" },
  { id: "welt", word: "Welt", plural: "Welten", genus: "f", set: 5, topic: "Natur" },
  { id: "wald", word: "Wald", plural: "Wälder", genus: "m", set: 5, topic: "Natur" },
  { id: "weste", word: "Weste", plural: "Westen", genus: "f", set: 5, topic: "Kleidung" },
  { id: "wespe", word: "Wespe", plural: "Wespen", genus: "f", set: 5, topic: "Tiere" },
  // Westen = Himmelsrichtung (nicht Plural von Weste) — als Richtungsbegriff
  // ohne gebräuchlichen Plural.
  { id: "westen", word: "Westen", plural: null, genus: "m", set: 5, topic: "Natur", noArticle: true },
  { id: "ritter", word: "Ritter", plural: "Ritter", genus: "m", set: 5, topic: "Beruf" },

  { id: "bett", word: "Bett", plural: "Betten", genus: "n", set: 6, topic: "Wohnen" },
  { id: "beet", word: "Beet", plural: "Beete", genus: "n", set: 6, topic: "Natur" },
  { id: "brett", word: "Brett", plural: "Bretter", genus: "n", set: 6, topic: "Alltagsgegenstände" },
  { id: "boot", word: "Boot", plural: "Boote", genus: "n", set: 6, topic: "Fahrzeuge" },
  { id: "brot", word: "Brot", plural: "Brote", genus: "n", set: 6, topic: "Essen" },
  { id: "bart", word: "Bart", plural: "Bärte", genus: "m", set: 6, topic: "Körper" },
  { id: "borte", word: "Borte", plural: "Borten", genus: "f", set: 6, topic: "Kleidung" },
  { id: "platte", word: "Platte", plural: "Platten", genus: "f", set: 6, topic: "Alltagsgegenstände" },
  // Blut ist ein echtes Massenwort — anders als Watte/Wolle/Schilf hat es im
  // Deutschen keine gebräuchliche Pluralform, daher hier bewusst kein
  // erfundener Plural.
  { id: "blut", word: "Blut", plural: null, genus: "n", set: 6, topic: "Körper", noArticle: true },
  { id: "braten", word: "Braten", plural: "Braten", genus: "m", set: 6, topic: "Essen" },
  // Butter ist wie Blut ein echtes Massenwort ohne gebräuchlichen Plural.
  { id: "butter", word: "Butter", plural: null, genus: "f", set: 6, topic: "Essen", noArticle: true },
  { id: "bad", word: "Bad", plural: "Bäder", genus: "n", set: 6, topic: "Wohnen" },
  // Band als Geschenk-/Magnetband (nicht Musikgruppe oder Buchband).
  { id: "band", word: "Band", plural: "Bänder", genus: "n", set: 6, topic: "Alltagsgegenstände" },
];

export const WORDS = RAW_WORDS.map((w) => ({ ...w, sentences: buildSentences(w), images: wordImages(w.id) }));
