import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// root zeigt auf prototypes/solo, damit die dort bereits fixierten relativen
// Pfade (z.B. "images/buch-a.jpg" in data/words.js) ohne Umbau funktionieren —
// der Ordner wird 1:1 zum Webroot, keine Dateien mussten verschoben werden.
export default defineConfig({
  root: "prototypes/solo",
  plugins: [react()],
});
