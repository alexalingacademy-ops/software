// Bild-Zuordnung über Ordner statt exakte Dateinamen — damit eine falsche
// Zuordnung sich einfach per Drag & Drop korrigieren lässt, ohne Dateien
// umzubenennen oder Code anzufassen.
//
// Struktur:
//   images/{wortId}/*.{jpg,jpeg,png,webp}          Singular-Fotos
//   images/{wortId}-plural/*.{jpg,jpeg,png,webp}    Plural-Fotos
//
// Beliebig viele Dateien pro Ordner, beliebiger Dateiname — es wird einfach
// alles genommen, was im passenden Ordner liegt. Falsches Bild? Datei aus
// dem Ordner löschen/verschieben, richtige reinziehen, fertig.
const modules = import.meta.glob("../images/**/*.{jpg,jpeg,JPG,JPEG,png,PNG,webp,WEBP}", {
  eager: true,
  query: "?url",
  import: "default",
});

function imagesInFolder(folderName) {
  const prefix = `../images/${folderName}/`;
  return Object.keys(modules)
    .filter((path) => path.startsWith(prefix) && !path.slice(prefix.length).includes("/"))
    .sort()
    .map((path) => modules[path]);
}

export function wordImages(wordId) {
  return {
    singular: imagesInFolder(wordId),
    plural: imagesInFolder(`${wordId}-plural`),
  };
}
