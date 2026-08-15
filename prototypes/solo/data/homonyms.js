// Homonym-Paare für den "Memory"-Modus: gleiche Schreibung, unterschiedliche
// Bedeutung — oft (aber nicht immer) auch unterschiedliches Genus und/oder
// unterschiedlicher Plural. Bewusst getrennt von data/words.js, da es eine
// eigene kleine Wortkategorie ist, keine Lautungs-Sets.
//
// Jede "meaning" bekommt eine eigene id (z.B. "mutter-eltern") und damit
// einen eigenen Bildordner nach dem bekannten Muster:
//   images/{meaningId}/            Singular
//   images/{meaningId}-plural/     Plural
// Genau wie bei den 78 Lautungs-Wörtern beliebige Dateinamen, per
// import.meta.glob eingelesen (siehe data/images.js) — Drag & Drop, kein
// Umbenennen nötig.
//
// sentenceSingular/sentencePlural: bei einigen Paaren (Maus, Flügel, Nagel,
// Schloss, Tor) sind Artikel UND Pluralform für beide Bedeutungen identisch
// — dort kann keine Grammatik die Bedeutung verraten, nur der Kontext.
// Deshalb bekommt jede Bedeutung einen eigenen, eindeutigen Beispielsatz
// statt nur des bloßen Worts als Ansage.
//
// Kriterium für Aufnahme ist NICHT unverwandte Etymologie (dann würden
// Maus/Schloss/Flügel/Nagel/Tor allesamt rausfallen, da hier historisch
// Bedeutungserweiterung statt Zufallszusammentreffen vorliegt), sondern:
// im Wörterbuch getrennt gelistete Bedeutung, die Lernende verwechseln
// könnten. Bei "Tor" deshalb bewusst Fußballtor vs. Garagentor (zwei klar
// unterscheidbare, alltagsrelevante Sinne) statt der dritten, eher
// abstrakten Bedeutung "Tor als gezählter Punkt".

import { wordImages } from "./images";

const RAW_PAIRS = [
  {
    id: "mutter",
    spelling: "Mutter",
    meanings: [
      {
        id: "mutter-eltern",
        label: "Elternteil",
        genus: "f",
        plural: "Mütter",
        sentenceSingular: "Die Mutter bringt ihr Kind ins Bett.",
        sentencePlural: "Die Mütter treffen sich im Park.",
      },
      {
        id: "mutter-schraube",
        label: "Schraubenmutter",
        genus: "f",
        plural: "Muttern",
        sentenceSingular: "Die Mutter hält die Schraube fest.",
        sentencePlural: "Die Muttern liegen in der Werkzeugkiste.",
      },
    ],
  },
  {
    id: "kiefer",
    spelling: "Kiefer",
    meanings: [
      {
        id: "kiefer-kinn",
        label: "Kieferknochen",
        genus: "m",
        plural: "Kiefer",
        sentenceSingular: "Der Kiefer tut beim Kauen weh.",
        sentencePlural: "Die Kiefer sind Teil des Schädels.",
      },
      {
        id: "kiefer-baum",
        label: "Nadelbaum",
        genus: "f",
        plural: "Kiefern",
        sentenceSingular: "Die Kiefer wächst im Wald.",
        sentencePlural: "Die Kiefern stehen am Waldrand.",
      },
    ],
  },
  {
    id: "bank",
    spelling: "Bank",
    meanings: [
      {
        id: "bank-sitz",
        label: "Sitzbank",
        genus: "f",
        plural: "Bänke",
        sentenceSingular: "Wir sitzen auf der Bank im Park.",
        sentencePlural: "Die Bänke im Park sind neu.",
      },
      {
        id: "bank-geld",
        label: "Geldinstitut",
        genus: "f",
        plural: "Banken",
        sentenceSingular: "Ich hebe Geld von der Bank ab.",
        sentencePlural: "Die Banken sind heute geschlossen.",
      },
    ],
  },
  {
    id: "leiter",
    spelling: "Leiter",
    meanings: [
      {
        id: "leiter-treppe",
        label: "Steigleiter",
        genus: "f",
        plural: "Leitern",
        sentenceSingular: "Er steigt auf die Leiter.",
        sentencePlural: "Die Leitern stehen im Keller.",
      },
      {
        id: "leiter-person",
        label: "Führungsperson",
        genus: "m",
        plural: "Leiter",
        sentenceSingular: "Der Leiter begrüßt die Gäste.",
        sentencePlural: "Die Leiter der Abteilungen treffen sich.",
      },
    ],
  },
  {
    id: "steuer",
    spelling: "Steuer",
    meanings: [
      {
        id: "steuer-abgabe",
        label: "Abgabe an den Staat",
        genus: "f",
        plural: "Steuern",
        sentenceSingular: "Ich zahle eine hohe Steuer.",
        sentencePlural: "Die Steuern sind gestiegen.",
      },
      {
        id: "steuer-lenkrad",
        label: "Lenkrad/Ruder",
        genus: "n",
        plural: "Steuer",
        sentenceSingular: "Der Kapitän hält das Steuer fest.",
        sentencePlural: "Die Steuer der alten Schiffe waren aus Holz.",
      },
    ],
  },
  {
    id: "see",
    spelling: "See",
    meanings: [
      {
        id: "see-gewaesser",
        label: "Binnengewässer",
        genus: "m",
        plural: "Seen",
        sentenceSingular: "Wir schwimmen im See.",
        sentencePlural: "Die Seen in dieser Region sind sauber.",
      },
      // "die See" (Meer) ist im Alltag meist ohne Plural gebräuchlich
      // (ähnlich Massenwort) — Plural nur bei mehreren Meeren/Ozeanen.
      {
        id: "see-meer",
        label: "Meer",
        genus: "f",
        plural: "Seen",
        sentenceSingular: "Das Schiff fährt auf die See hinaus.",
        sentencePlural: "Die Seen der Welt sind unterschiedlich salzig.",
      },
    ],
  },
  {
    id: "maus",
    spelling: "Maus",
    meanings: [
      {
        id: "maus-tier",
        label: "Tier",
        genus: "f",
        plural: "Mäuse",
        sentenceSingular: "Die Maus läuft über den Boden.",
        sentencePlural: "Die Mäuse leben im Keller.",
      },
      {
        id: "maus-computer",
        label: "Computermaus",
        genus: "f",
        plural: "Mäuse",
        sentenceSingular: "Die Maus liegt neben der Tastatur.",
        sentencePlural: "Die Mäuse im Büro sind kabellos.",
      },
    ],
  },
  {
    id: "schloss",
    spelling: "Schloss",
    meanings: [
      // Wiederverwendet bestehende Wort-ID/Bilder aus data/words.js (Set 2).
      {
        id: "schloss",
        label: "Türverschluss",
        genus: "n",
        plural: "Schlösser",
        sentenceSingular: "Das Schloss an der Tür ist kaputt.",
        sentencePlural: "Die Schlösser wurden ausgetauscht.",
      },
      // "id: burg" ist nur der interne Bildordner-Name (wiederverwendet den
      // bestehenden "burg"-Staging-Ordner mit Schloss-/Palastfotos aus einer
      // früheren Session) — das angezeigte/angesagte Wort ist "Schloss".
      {
        id: "burg",
        label: "Palast/Herrschaftshaus",
        genus: "n",
        plural: "Schlösser",
        sentenceSingular: "Das Schloss steht auf einem Hügel.",
        sentencePlural: "Die Schlösser im Tal sind alt.",
      },
    ],
  },
  {
    id: "schild",
    spelling: "Schild",
    meanings: [
      {
        id: "schild-hinweis",
        label: "Hinweisschild",
        genus: "n",
        plural: "Schilder",
        sentenceSingular: "Das Schild zeigt den Weg.",
        sentencePlural: "Die Schilder stehen an der Straße.",
      },
      {
        id: "schild-ritter",
        label: "Ritterschild",
        genus: "m",
        plural: "Schilde",
        sentenceSingular: "Der Ritter trägt einen Schild.",
        sentencePlural: "Die Schilde der Ritter sind bemalt.",
      },
    ],
  },
  {
    id: "fluegel",
    spelling: "Flügel",
    meanings: [
      {
        id: "fluegel-vogel",
        label: "Vogel-/Gebäudeflügel",
        genus: "m",
        plural: "Flügel",
        sentenceSingular: "Der Vogel bewegt seinen Flügel.",
        sentencePlural: "Die Flügel des Vogels sind bunt.",
      },
      {
        id: "fluegel-klavier",
        label: "Konzertflügel",
        genus: "m",
        plural: "Flügel",
        sentenceSingular: "Der Pianist spielt auf dem Flügel.",
        sentencePlural: "Die Flügel im Konzertsaal sind schwarz.",
      },
    ],
  },
  {
    id: "tor",
    spelling: "Tor",
    meanings: [
      {
        id: "tor-fussball",
        label: "Fußballtor",
        genus: "n",
        plural: "Tore",
        sentenceSingular: "Der Ball fliegt ins Tor.",
        // Plural bewusst als erzielte Punkte (Spielstand), nicht als
        // mehrere Tor-Objekte — dafür braucht es ein Anzeigetafel-Foto,
        // siehe images/tor-fussball-plural/ (noch offen).
        sentencePlural: "Die Anzeigetafel zeigt drei Tore.",
      },
      {
        id: "tor-garage",
        label: "Garagentor",
        genus: "n",
        plural: "Tore",
        sentenceSingular: "Das Tor der Garage schließt automatisch.",
        sentencePlural: "Die Tore der Garagen sind aus Metall.",
      },
    ],
  },
  {
    id: "nagel",
    spelling: "Nagel",
    meanings: [
      {
        id: "nagel-werkzeug",
        label: "Werkzeug/Baumaterial",
        genus: "m",
        plural: "Nägel",
        sentenceSingular: "Der Nagel steckt in der Wand.",
        sentencePlural: "Die Nägel liegen in der Kiste.",
      },
      {
        id: "nagel-finger",
        label: "Fingernagel",
        genus: "m",
        plural: "Nägel",
        sentenceSingular: "Der Nagel ist frisch lackiert.",
        sentencePlural: "Die Nägel sind kurz geschnitten.",
      },
    ],
  },
];

function buildMeaning(spelling, m) {
  return {
    id: m.id,
    word: spelling,
    label: m.label,
    genus: m.genus,
    plural: m.plural,
    sentenceSingular: m.sentenceSingular,
    sentencePlural: m.sentencePlural,
    images: wordImages(m.id),
  };
}

export const HOMONYMS = RAW_PAIRS.map((p) => ({
  id: p.id,
  spelling: p.spelling,
  meanings: p.meanings.map((m) => buildMeaning(p.spelling, m)),
}));
