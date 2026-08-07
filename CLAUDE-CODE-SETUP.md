# Start in Claude Code

Dieses Verzeichnis ist bereits ein fertig eingerichtetes Git-Repo:

- ein erster Commit ist vorhanden (README + Prototyp)
- der Remote `origin` zeigt bereits auf dein GitHub-Repo:
  `https://github.com/alexalingacademy-ops/software.git`

## Schritte

1. Zip entpacken, den entpackten Ordner in Claude Code öffnen (bzw. Claude Code darauf zeigen lassen).
2. Falls Claude Code dich noch nicht mit GitHub verbunden hat: einmalig über den Browser autorisieren (Claude Code fragt danach von selbst, sobald ein Push nötig ist).
3. Push ausführen:
   ```
   git push -u origin main
   ```
   Falls im GitHub-Repo bereits andere Inhalte liegen, die hier nicht existieren, ggf. vorher:
   ```
   git pull --rebase origin main
   ```
   und Konflikte auflösen.

Ab dann läuft die weitere Entwicklung direkt im Repo — kein Zip-Export mehr nötig.
