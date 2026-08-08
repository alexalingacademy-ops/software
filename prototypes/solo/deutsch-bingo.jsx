import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Repeat,
  Image as ImageIcon,
  Clock,
  Trophy,
  RefreshCw,
} from "lucide-react";
import { WORDS } from "./data/words";

const ARTICLE = { m: "der", f: "die", n: "das" };
const GENUS_COLOR = { m: "#3B6FD9", f: "#E0538E", n: "#8B5FBF" };
const GENUS_LABEL = { m: "maskulin", f: "feminin", n: "neutral" };

const TEMPO = {
  langsam: { label: "Langsam", ms: 4500, rate: 0.85 },
  mittel: { label: "Mittel", ms: 2600, rate: 1.0 },
  schnell: { label: "Schnell (Loop)", ms: 1300, rate: 1.15 },
};

// Platzhalter-Bildvarianten: da noch keine echten Fotos vorliegen, simulieren
// wir "verschiedene Bilder desselben Worts" (z. B. roter/grüner Pullover) mit
// 3 Farbtönen + Label A/B/C pro Wort, die im Trainingsmodus rotieren.
const VARIANT_COUNT = 3;
const VARIANT_LABELS = ["A", "B", "C"];
const VARIANT_TINTS = ["#EFE6D8", "#E4EDE6", "#E9E3F2"];

function seedFromId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % VARIANT_COUNT;
}

// Gruppierungssystem: mehrere unabhängige Taxonomien auf denselben Wörtern.
// Neue Gruppierungsart hinzufügen = neuer Eintrag hier, kein Umbau der UI nötig.
const GROUPINGS = {
  lautung: { label: "Nach Lautung", groupOf: (w) => `Set ${w.set}` },
  thema: { label: "Nach Themenfeld", groupOf: (w) => w.topic },
};

function groupWords(words, groupingKey) {
  const grouping = GROUPINGS[groupingKey];
  const map = new Map();
  words.forEach((w) => {
    const g = grouping.groupOf(w);
    if (!map.has(g)) map.set(g, []);
    map.get(g).push(w);
  });
  let entries = Array.from(map.entries());
  if (groupingKey === "thema") entries = entries.sort((a, b) => a[0].localeCompare(b[0], "de"));
  return entries;
}

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(ms) {
  if (ms == null) return "—";
  const totalSec = ms / 1000;
  const m = Math.floor(totalSec / 60);
  const remSec = totalSec - m * 60;
  const s = remSec.toFixed(1);
  return `${m}:${remSec < 10 ? "0" + s : s}`;
}

// Board + Ziehstapel generieren. Ziehstapel = Board-Wörter + ~30% Zusatzwörter,
// damit nicht jeder Aufruf ein Treffer ist (sonst gäbe es im Mehrspielermodus
// nie einen Sieger, weil alle Boards gleichzeitig voll wären).
function generateRound(gridN, avoidSignature) {
  const cellCount = gridN * gridN;
  let boardWords, signature, remaining;

  for (let attempt = 0; attempt < 8; attempt++) {
    const shuffled = shuffle(WORDS);
    boardWords = shuffled.slice(0, cellCount);
    remaining = shuffled.slice(cellCount);
    signature = boardWords.map((w) => w.id).sort().join(",");
    if (signature !== avoidSignature) break;
  }

  const poolExtra = Math.max(0, Math.ceil(cellCount * 1.3) - cellCount);
  const missWords = shuffle(remaining).slice(0, Math.min(poolExtra, remaining.length));
  const drawPool = shuffle([...boardWords, ...missWords]);
  const board = shuffle(boardWords);

  return { board, drawPool, signature };
}

// ---------------------------------------------------------------------------
export default function DeutschBingo() {
  const [mode, setMode] = useState("bingo"); // 'bingo' | 'training'

  // ---- Bingo-Modus State ----
  const [gridN, setGridN] = useState(3);
  const [board, setBoard] = useState([]);
  const [calledIds, setCalledIds] = useState(new Set());
  const [coveredIds, setCoveredIds] = useState(new Set());
  const [history, setHistory] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState("mittel");
  const [ttsOn, setTtsOn] = useState(true);
  const [satzModus, setSatzModus] = useState(false);
  const [showWords, setShowWords] = useState(true);
  const [bingo, setBingo] = useState(false);
  const [message, setMessage] = useState("");
  const [shakeId, setShakeId] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [record, setRecord] = useState(null);
  const [newRecord, setNewRecord] = useState(false);

  const drawPoolRef = useRef([]);
  const drawIndexRef = useRef(0);
  const lastSignatureRef = useRef("");
  const voicesRef = useRef([]);
  const startTimeRef = useRef(null);

  // ---- Trainingsmodus State (Varianten-Karussell) ----
  const [trainingTick, setTrainingTick] = useState(0);
  const [trainingPlaying, setTrainingPlaying] = useState(true);
  const [trainingTempo, setTrainingTempo] = useState("mittel");
  const [grouping, setGrouping] = useState("lautung");

  // ---- Zuordnen-Modus State (Ansage + Tippen, Dauerschleife) ----
  const [matchGrid, setMatchGrid] = useState([]);
  const [matchTarget, setMatchTarget] = useState(null);
  const [matchAnnouncedText, setMatchAnnouncedText] = useState("");
  const [matchCorrectCount, setMatchCorrectCount] = useState(0);
  const [matchShakeKey, setMatchShakeKey] = useState(null);
  const [matchFlashKey, setMatchFlashKey] = useState(null);
  const [matchPlaying, setMatchPlaying] = useState(true);
  const [matchTempo, setMatchTempo] = useState("mittel");
  const matchTimeoutRef = useRef(null);
  const matchKeySeqRef = useRef(0);

  // deutsche Stimme laden, sobald verfügbar
  useEffect(() => {
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    };
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // speakWord: spricht immer, unabhängig vom ttsOn-Schalter (für manuelle
  // Klicks im Training). announce() unten respektiert ttsOn zusätzlich.
  const speakWord = useCallback((text, rate = 0.95) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "de-DE";
    const deVoice = voicesRef.current.find((v) => v.lang && v.lang.startsWith("de"));
    if (deVoice) utter.voice = deVoice;
    utter.rate = rate;
    window.speechSynthesis.speak(utter);
  }, []);

  // Wählt den Ansagetext für ein Wort: im Satzmodus der Akkusativ-Übungssatz
  // aus word.sentences ("Ich sehe einen/eine/ein X."), sonst nur das blanke
  // Wort. word.sentences enthält daneben auch Nominativ/Dativ/Frage-Varianten
  // (siehe data/words.js) — hier bewusst auf einen Fall fixiert, damit die
  // Ansage im Automatisierungs-Training konsistent bleibt statt Fälle zu
  // mischen. Board/Zuordnung reagieren weiterhin nur auf die Wort-ID.
  const pickAnnouncement = useCallback(
    (word) => {
      if (satzModus) {
        const akkSatz = word.sentences && word.sentences.find((s) => s.type === "akk");
        if (akkSatz) return akkSatz.text;
      }
      return word.word;
    },
    [satzModus]
  );

  // announce: liefert zusätzlich den gewählten Text zurück (für Anzeige +
  // Wiederholen), respektiert ttsOn nur fürs tatsächliche Vorlesen.
  const announce = useCallback(
    (word, rate) => {
      const text = pickAnnouncement(word);
      if (ttsOn) speakWord(text, rate);
      return text;
    },
    [ttsOn, speakWord, pickAnnouncement]
  );

  // Rekord für die aktuelle Boardgröße laden
  useEffect(() => {
    let cancelled = false;
    async function loadRecord() {
      try {
        const res = await window.storage.get(`bestzeit_${gridN}x${gridN}`, false);
        if (!cancelled) setRecord(res ? Number(res.value) : null);
      } catch (e) {
        if (!cancelled) setRecord(null);
      }
    }
    loadRecord();
    return () => {
      cancelled = true;
    };
  }, [gridN]);

  const startNewGame = useCallback((size) => {
    const { board: newBoard, drawPool, signature } = generateRound(size, lastSignatureRef.current);
    lastSignatureRef.current = signature;
    drawPoolRef.current = drawPool;
    drawIndexRef.current = 0;
    startTimeRef.current = null;
    setGridN(size);
    setBoard(newBoard);
    setCalledIds(new Set());
    setCoveredIds(new Set());
    setHistory([]);
    setBingo(false);
    setMessage("");
    setIsPlaying(false);
    setElapsedMs(0);
    setNewRecord(false);
  }, []);

  useEffect(() => {
    startNewGame(3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const drawNext = useCallback(() => {
    let pool = drawPoolRef.current;
    let idx = drawIndexRef.current;

    if (idx >= pool.length) {
      if (tempo === "schnell") {
        pool = shuffle(pool);
        drawPoolRef.current = pool;
        idx = 0;
      } else {
        setIsPlaying(false);
        setMessage("Ziehstapel ist durch — neues Spiel starten oder Board größer wählen.");
        return;
      }
    }

    if (startTimeRef.current === null) startTimeRef.current = Date.now();

    const word = pool[idx];
    drawIndexRef.current = idx + 1;
    const announcedText = announce(word, TEMPO[tempo].rate);
    setCalledIds((prev) => new Set(prev).add(word.id));
    setHistory((prev) => [{ ...word, announcedText }, ...prev].slice(0, 8));
    setMessage("");
  }, [tempo, announce]);

  // Auto-Ziehen im gewählten Tempo
  useEffect(() => {
    if (mode !== "bingo" || !isPlaying || bingo) return;
    const interval = setInterval(drawNext, TEMPO[tempo].ms);
    return () => clearInterval(interval);
  }, [mode, isPlaying, bingo, tempo, drawNext]);

  // Laufende Zeitanzeige, solange die Runde aktiv ist
  useEffect(() => {
    if (mode !== "bingo" || bingo) return;
    const tick = setInterval(() => {
      if (startTimeRef.current !== null) setElapsedMs(Date.now() - startTimeRef.current);
    }, 100);
    return () => clearInterval(tick);
  }, [mode, bingo]);

  const repeatCurrent = () => {
    if (!ttsOn || !history[0]) return;
    speakWord(history[0].announcedText, TEMPO[tempo].rate);
  };

  const handleCellClick = (word) => {
    if (bingo) return;
    if (!calledIds.has(word.id)) {
      setMessage(`„${word.word}" wurde noch nicht aufgerufen.`);
      setShakeId(word.id);
      setTimeout(() => setShakeId(null), 400);
      return;
    }
    setCoveredIds((prev) => {
      const next = new Set(prev);
      next.has(word.id) ? next.delete(word.id) : next.add(word.id);
      return next;
    });
  };

  // Gewinnprüfung: Vollbild — alle Felder des Boards müssen abgedeckt sein.
  // (Bewusst keine Einzellinie: es geht ums Lernen, nicht ums frühestmögliche
  // Abbrechen — Sieger ist, wer alle Wörter richtig erkannt hat.)
  useEffect(() => {
    if (!board.length || bingo) return;
    const won = board.every((word) => coveredIds.has(word.id));
    if (!won) return;

    const finalElapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
    setElapsedMs(finalElapsed);
    setBingo(true);
    setIsPlaying(false);

    (async () => {
      try {
        const key = `bestzeit_${gridN}x${gridN}`;
        let existingMs = null;
        try {
          const existing = await window.storage.get(key, false);
          existingMs = existing ? Number(existing.value) : null;
        } catch (e) {
          existingMs = null;
        }
        if (existingMs === null || finalElapsed < existingMs) {
          await window.storage.set(key, String(finalElapsed), false);
          setRecord(finalElapsed);
          setNewRecord(true);
        }
      } catch (e) {
        // Storage nicht verfügbar — Rekord bleibt nur für diese Sitzung im Kopf
      }
    })();
  }, [coveredIds, board, bingo, gridN]);

  // Trainingsmodus: Variantenwechsel im gewählten Tempo
  useEffect(() => {
    if (mode !== "training" || !trainingPlaying) return;
    const interval = setInterval(() => setTrainingTick((t) => t + 1), TEMPO[trainingTempo].ms);
    return () => clearInterval(interval);
  }, [mode, trainingPlaying, trainingTempo]);

  // ---- Zuordnen-Modus: Ansage + Tippen, mehrere Bilder desselben Worts
  // dürfen gleichzeitig im Raster liegen — es geht nicht um Eindeutigkeit
  // (wie beim Bingo-Board), sondern nur um richtiges Zuordnen. ----
  const nextMatchKey = () => `mk-${matchKeySeqRef.current++}`;

  const randomVariant = () => Math.floor(Math.random() * VARIANT_COUNT);

  const buildInitialMatchGrid = useCallback((cellCount = 12, duplicatePairs = 3) => {
    const shuffled = shuffle(WORDS);
    const dupWords = shuffled.slice(0, duplicatePairs);
    const uniqueWords = shuffled.slice(duplicatePairs, duplicatePairs + (cellCount - duplicatePairs * 2));
    const cells = [];
    dupWords.forEach((w) => {
      const v1 = randomVariant();
      let v2 = randomVariant();
      while (v2 === v1) v2 = randomVariant();
      cells.push({ word: w, variantIdx: v1 });
      cells.push({ word: w, variantIdx: v2 });
    });
    uniqueWords.forEach((w) => cells.push({ word: w, variantIdx: randomVariant() }));
    return shuffle(cells).map((c) => ({ ...c, key: nextMatchKey() }));
  }, []);

  const pickTargetFromGrid = (cells) => {
    if (!cells.length) return null;
    return cells[Math.floor(Math.random() * cells.length)].word;
  };

  // Für eine neu zu befüllende Zelle: mit ~40% Wahrscheinlichkeit ein Wort
  // wählen, das im Raster schon vorkommt (neue Variante desselben Worts) —
  // damit die "mehrere Bilder pro Wort"-Situation immer wieder entsteht.
  const pickWordForCell = (currentCells) => {
    const currentWords = currentCells.map((c) => c.word);
    if (currentWords.length && Math.random() < 0.4) {
      const base = currentWords[Math.floor(Math.random() * currentWords.length)];
      return { word: base, variantIdx: randomVariant() };
    }
    const presentIds = new Set(currentWords.map((w) => w.id));
    const candidates = WORDS.filter((w) => !presentIds.has(w.id));
    const pool = candidates.length ? candidates : WORDS;
    return { word: pool[Math.floor(Math.random() * pool.length)], variantIdx: randomVariant() };
  };

  const announceMatchTarget = (word) => {
    setMatchTarget(word);
    setMatchAnnouncedText(word ? announce(word, TEMPO[matchTempo].rate) : "");
  };

  const startMatchRound = useCallback(() => {
    const cells = buildInitialMatchGrid();
    setMatchGrid(cells);
    setMatchCorrectCount(0);
    announceMatchTarget(pickTargetFromGrid(cells));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildInitialMatchGrid]);

  useEffect(() => {
    if (mode === "match" && matchGrid.length === 0) startMatchRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => () => clearTimeout(matchTimeoutRef.current), []);

  const handleMatchCellClick = (cell) => {
    if (!matchPlaying || !matchTarget) return;
    if (cell.word.id === matchTarget.id) {
      setMatchFlashKey(cell.key);
      setMatchCorrectCount((c) => c + 1);
      clearTimeout(matchTimeoutRef.current);
      matchTimeoutRef.current = setTimeout(() => {
        setMatchFlashKey(null);
        setMatchGrid((prevGrid) => {
          const replacement = pickWordForCell(prevGrid);
          const nextGrid = prevGrid.map((c) => (c.key === cell.key ? { ...replacement, key: c.key } : c));
          announceMatchTarget(pickTargetFromGrid(nextGrid));
          return nextGrid;
        });
      }, Math.round(TEMPO[matchTempo].ms * 0.4));
    } else {
      setMatchShakeKey(cell.key);
      setTimeout(() => setMatchShakeKey(null), 400);
    }
  };

  const currentWord = history[0];

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        background: "#F6F1E7",
        color: "#23273A",
        minHeight: "100%",
        padding: "24px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Space+Mono:wght@400;700&family=Inter:wght@400;500;600&display=swap');
        .bingo-display { font-family: 'Fraunces', serif; }
        .bingo-mono { font-family: 'Space Mono', monospace; }
        @keyframes shake { 10%,90% { transform: translateX(-2px); } 20%,80% { transform: translateX(3px); } 30%,50%,70% { transform: translateX(-5px); } 40%,60% { transform: translateX(5px); } }
        .shake { animation: shake 0.4s; }
        @keyframes pop { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .pop { animation: pop 0.2s ease-out; }
        .bingo-cell { transition: transform 0.12s, box-shadow 0.12s, background 0.15s; }
        .bingo-cell:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(35,39,58,0.12); }
        .bingo-cell:active { transform: translateY(0); }
        .train-cell { transition: transform 0.12s, box-shadow 0.12s, background-color 0.4s; }
        .train-cell:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(35,39,58,0.12); }
      `}</style>

      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <header style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
          <div>
            <h1 className="bingo-display" style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>
              Deutsch-Bingo <span style={{ color: "#E8A93B" }}>·</span> Prototyp
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "#5A5F73" }}>
              {mode === "bingo" && "Solo gegen die Uhr — komplettes Board abdecken, Bestzeit schlagen."}
              {mode === "training" && "Endlos-Karussell — Bilder wechseln automatisch die Variante, damit der Begriff sitzt statt nur ein Foto."}
              {mode === "match" && "Ansage + Antippen, in Dauerschleife — mehrere Bilder desselben Worts dürfen gleichzeitig daliegen, gesucht ist die richtige Zuordnung."}
            </p>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              onClick={() => setMode("bingo")}
              style={{ ...pill, background: mode === "bingo" ? "#23273A" : "#FFFFFF", color: mode === "bingo" ? "#fff" : "#23273A", borderColor: mode === "bingo" ? "#23273A" : "#DDD6C7" }}
            >
              🎯 Bingo
            </button>
            <button
              onClick={() => setMode("training")}
              style={{ ...pill, background: mode === "training" ? "#23273A" : "#FFFFFF", color: mode === "training" ? "#fff" : "#23273A", borderColor: mode === "training" ? "#23273A" : "#DDD6C7" }}
            >
              🔁 Training
            </button>
            <button
              onClick={() => setMode("match")}
              style={{ ...pill, background: mode === "match" ? "#23273A" : "#FFFFFF", color: mode === "match" ? "#fff" : "#23273A", borderColor: mode === "match" ? "#23273A" : "#DDD6C7" }}
            >
              🧩 Zuordnen
            </button>
          </div>
        </header>

        {mode === "bingo" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
            {/* ---------------- Board ---------------- */}
            <div style={{ flex: "1 1 420px" }}>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${gridN}, 1fr)`, gap: 10 }}>
                {board.map((word) => {
                  const covered = coveredIds.has(word.id);
                  const called = calledIds.has(word.id);
                  return (
                    <button
                      key={word.id}
                      onClick={() => handleCellClick(word)}
                      className={`bingo-cell${shakeId === word.id ? " shake" : ""}`}
                      style={{
                        position: "relative",
                        aspectRatio: "1 / 1",
                        borderRadius: 12,
                        border: `3px solid ${GENUS_COLOR[word.genus]}`,
                        background: covered ? GENUS_COLOR[word.genus] : "#FFFFFF",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 6,
                      }}
                      title={called ? "Aufgerufen — klicken zum Abdecken" : "Noch nicht aufgerufen"}
                    >
                      <ImageIcon size={gridN === 3 ? 30 : 22} strokeWidth={1.5} color={covered ? "#FFFFFF" : "#B9B4A6"} />
                      {showWords && (
                        <span style={{ marginTop: 4, fontSize: gridN === 3 ? 13 : 11, fontWeight: 600, color: covered ? "#FFFFFF" : "#23273A", textAlign: "center" }}>
                          {ARTICLE[word.genus]} {word.word}
                        </span>
                      )}
                      {!called && (
                        <span style={{ position: "absolute", top: 4, right: 6, fontSize: 10, color: "#B9B4A6" }}>●</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {bingo && (
                <div className="pop bingo-display" style={{ marginTop: 16, padding: "14px 18px", borderRadius: 12, background: "#E8A93B", color: "#23273A", fontSize: 22, fontWeight: 700, textAlign: "center" }}>
                  🎉 BINGO! — {formatTime(elapsedMs)}
                  {newRecord && <div style={{ fontSize: 14, marginTop: 4 }}>🏆 Neuer Rekord!</div>}
                </div>
              )}

              {message && !bingo && <div style={{ marginTop: 10, fontSize: 13, color: "#B5473E" }}>{message}</div>}

              <div style={{ marginTop: 14, display: "flex", gap: 16, fontSize: 12, color: "#5A5F73" }}>
                {Object.entries(GENUS_LABEL).map(([g, label]) => (
                  <span key={g} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: GENUS_COLOR[g], display: "inline-block" }} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* ---------------- Steuerung ---------------- */}
            <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={statCard}>
                  <Clock size={15} />
                  <div>
                    <div style={statLabel}>Zeit</div>
                    <div className="bingo-mono" style={statValue}>{formatTime(elapsedMs)}</div>
                  </div>
                </div>
                <div style={statCard}>
                  <Trophy size={15} color="#E8A93B" />
                  <div>
                    <div style={statLabel}>Rekord {gridN}×{gridN}</div>
                    <div className="bingo-mono" style={statValue}>{formatTime(record)}</div>
                  </div>
                </div>
              </div>

              <div style={{ background: "#23273A", borderRadius: 14, padding: 18, color: "#F6F1E7" }}>
                <div style={{ fontSize: 11, letterSpacing: 1, opacity: 0.6, textTransform: "uppercase" }}>Aktueller Aufruf</div>
                <div className="bingo-mono" style={{ fontSize: 30, fontWeight: 700, minHeight: 40, marginTop: 4 }}>
                  {currentWord ? currentWord.word : "—"}
                </div>
                {currentWord && currentWord.announcedText !== currentWord.word && (
                  <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>{currentWord.announcedText}</div>
                )}
                <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                  {history.slice(1).map((w, i) => (
                    <span key={i} className="bingo-mono" style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, background: "rgba(255,255,255,0.1)", opacity: 1 - i * 0.1 }}>
                      {w.word}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setIsPlaying((p) => !p)} disabled={bingo} style={btnPrimary}>
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  {isPlaying ? "Pause" : "Start"}
                </button>
                <button onClick={drawNext} disabled={bingo || isPlaying} style={btnSecondary}>
                  Nächste Karte
                </button>
                <button onClick={repeatCurrent} disabled={!currentWord} style={btnIcon} title="Wiederholen">
                  <Repeat size={16} />
                </button>
              </div>

              <div>
                <div style={labelStyle}>Tempo</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {Object.entries(TEMPO).map(([key, t]) => (
                    <button key={key} onClick={() => setTempo(key)} style={{ ...pill, background: tempo === key ? "#E8A93B" : "#FFFFFF", borderColor: tempo === key ? "#E8A93B" : "#DDD6C7" }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={labelStyle}>Boardgröße</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[3, 4].map((n) => (
                    <button key={n} onClick={() => startNewGame(n)} style={{ ...pill, background: gridN === n ? "#8B5FBF" : "#FFFFFF", color: gridN === n ? "#fff" : "#23273A", borderColor: gridN === n ? "#8B5FBF" : "#DDD6C7" }}>
                      {n}×{n}
                    </button>
                  ))}
                </div>
              </div>

              <label style={toggleRow}>
                <input type="checkbox" checked={ttsOn} onChange={(e) => setTtsOn(e.target.checked)} />
                {ttsOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
                Wörter vorlesen (Sprachausgabe)
              </label>

              <label style={toggleRow}>
                <input type="checkbox" checked={satzModus} onChange={(e) => setSatzModus(e.target.checked)} />
                Sätze statt Wörter ansagen (Akkusativ-Training)
              </label>

              <label style={toggleRow}>
                <input type="checkbox" checked={showWords} onChange={(e) => setShowWords(e.target.checked)} />
                Wörter als Text zeigen (Testmodus — später nur Bild)
              </label>

              <button onClick={() => startNewGame(gridN)} style={btnGhost}>
                <RotateCcw size={14} /> Neues Board
              </button>

              <div style={{ fontSize: 11, color: "#8A8570", lineHeight: 1.5 }}>
                Ziehstapel: {drawPoolRef.current.length} Karten · Board: {gridN * gridN} Felder · {calledIds.size} aufgerufen
              </div>
            </div>
          </div>
        )}

        {mode === "training" && (
          /* ---------------- Trainingsmodus (Varianten-Karussell) ---------------- */
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 16 }}>
              <button onClick={() => setTrainingPlaying((p) => !p)} style={btnPrimary}>
                {trainingPlaying ? <Pause size={16} /> : <Play size={16} />}
                {trainingPlaying ? "Pause" : "Weiter"}
              </button>
              <button onClick={() => setTrainingTick((t) => t + 1)} style={btnSecondary}>
                <RefreshCw size={14} style={{ marginRight: 4 }} />
                Neue Varianten jetzt
              </button>
              <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
                {Object.entries(TEMPO).map(([key, t]) => (
                  <button key={key} onClick={() => setTrainingTempo(key)} style={{ ...pill, background: trainingTempo === key ? "#E8A93B" : "#FFFFFF", borderColor: trainingTempo === key ? "#E8A93B" : "#DDD6C7" }}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {Object.entries(GROUPINGS).map(([key, g]) => (
                  <button key={key} onClick={() => setGrouping(key)} style={{ ...pill, background: grouping === key ? "#8B5FBF" : "#FFFFFF", color: grouping === key ? "#fff" : "#23273A", borderColor: grouping === key ? "#8B5FBF" : "#DDD6C7" }}>
                    {g.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "#8A8570", marginLeft: "auto" }}>
                Runde {trainingTick + 1} · Bild antippen zum Anhören
              </div>
            </div>

            {groupWords(WORDS, grouping).map(([groupLabel, groupWordsList]) => (
              <div key={groupLabel} style={{ marginBottom: 20 }}>
                <div className="bingo-display" style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#5A5F73" }}>
                  {groupLabel}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 10 }}>
                  {groupWordsList.map((word) => {
                    const variantIdx = (seedFromId(word.id) + trainingTick) % VARIANT_COUNT;
                    return (
                      <button
                        key={word.id}
                        onClick={() => speakWord(word.word)}
                        className="train-cell"
                        style={{
                          position: "relative",
                          aspectRatio: "1 / 1",
                          borderRadius: 12,
                          border: `3px solid ${GENUS_COLOR[word.genus]}`,
                          backgroundColor: VARIANT_TINTS[variantIdx],
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 6,
                        }}
                        title={`${word.word} anhören`}
                      >
                        <ImageIcon size={22} strokeWidth={1.5} color="#8A8570" />
                        <span style={{ marginTop: 4, fontSize: 11, fontWeight: 600, textAlign: "center" }}>
                          {ARTICLE[word.genus]} {word.word}
                        </span>
                        <span style={{ position: "absolute", top: 4, right: 6, fontSize: 9, color: "#8A8570" }}>
                          {VARIANT_LABELS[variantIdx]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <p style={{ marginTop: 16, fontSize: 12, color: "#8A8570", maxWidth: 560 }}>
              Platzhalter-Hinweis: die Buchstaben A/B/C und Farbtöne stehen hier nur stellvertretend für
              unterschiedliche Fotos desselben Worts (z. B. roter/grüner Pullover). Sobald echte Bilder da
              sind, ersetzt jedes Wort seine 2–3 hinterlegten Varianten 1:1 an dieser Stelle.
            </p>
            {grouping === "thema" && (
              <p style={{ marginTop: 4, fontSize: 12, color: "#B5473E", maxWidth: 560 }}>
                Diese 22 Wörter sind nach Lautung ausgewählt, nicht nach Thema — deshalb wirkt die
                Themenfeld-Ansicht hier noch fragmentiert (mehrere Themen mit nur einem Wort). Das ist kein
                Bug, sondern Ergebnis dieses ersten Testsets; mit wachsendem Wortschatz füllen sich die
                Themenfelder von selbst.
              </p>
            )}
          </div>
        )}

        {mode === "match" && (
          /* ---------------- Zuordnen-Modus: Ansage + Tippen, Dauerschleife ---------------- */
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
            <div style={{ flex: "1 1 420px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 10 }}>
                {matchGrid.map((cell) => {
                  const isCorrectMatch = matchTarget && cell.word.id === matchTarget.id;
                  const flashed = matchFlashKey === cell.key;
                  return (
                    <button
                      key={cell.key}
                      onClick={() => handleMatchCellClick(cell)}
                      className={`train-cell${matchShakeKey === cell.key ? " shake" : ""}${flashed ? " pop" : ""}`}
                      style={{
                        position: "relative",
                        aspectRatio: "1 / 1",
                        borderRadius: 12,
                        border: `3px solid ${GENUS_COLOR[cell.word.genus]}`,
                        backgroundColor: flashed ? GENUS_COLOR[cell.word.genus] : VARIANT_TINTS[cell.variantIdx],
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 6,
                      }}
                      title={showWords ? undefined : "Zum passenden Wort tippen"}
                    >
                      <ImageIcon size={22} strokeWidth={1.5} color={flashed ? "#FFFFFF" : "#8A8570"} />
                      {showWords && (
                        <span style={{ marginTop: 4, fontSize: 11, fontWeight: 600, textAlign: "center", color: flashed ? "#FFFFFF" : "#23273A" }}>
                          {ARTICLE[cell.word.genus]} {cell.word.word}
                        </span>
                      )}
                      <span style={{ position: "absolute", top: 4, right: 6, fontSize: 9, color: flashed ? "#FFFFFF" : "#8A8570" }}>
                        {VARIANT_LABELS[cell.variantIdx]}
                      </span>
                    </button>
                  );
                })}
              </div>

              <p style={{ marginTop: 16, fontSize: 12, color: "#8A8570", maxWidth: 560 }}>
                Achtung, Platzhalter: weil alle Bilder gerade nur generische Icons sind, siehst du testweise den
                Wortlabel auf jeder Kachel. Mit echten Fotos wird "Wörter als Text zeigen" ausgeschaltet — dann
                zählt nur noch, ob Bild und Ansage zusammenpassen, nicht ob der Text übereinstimmt.
              </p>
            </div>

            <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#23273A", borderRadius: 14, padding: 18, color: "#F6F1E7" }}>
                <div style={{ fontSize: 11, letterSpacing: 1, opacity: 0.6, textTransform: "uppercase" }}>Gesucht</div>
                <div className="bingo-mono" style={{ fontSize: 30, fontWeight: 700, minHeight: 40, marginTop: 4 }}>
                  {matchTarget ? matchTarget.word : "—"}
                </div>
                {matchTarget && (
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                    {ARTICLE[matchTarget.genus]} {matchTarget.word} · {GENUS_LABEL[matchTarget.genus]}
                  </div>
                )}
                {matchTarget && matchAnnouncedText !== matchTarget.word && (
                  <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>{matchAnnouncedText}</div>
                )}
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setMatchPlaying((p) => !p)} style={btnPrimary}>
                  {matchPlaying ? <Pause size={16} /> : <Play size={16} />}
                  {matchPlaying ? "Pause" : "Weiter"}
                </button>
                <button
                  onClick={() => ttsOn && matchAnnouncedText && speakWord(matchAnnouncedText, TEMPO[matchTempo].rate)}
                  style={btnIcon}
                  title="Wiederholen"
                >
                  <Repeat size={16} />
                </button>
              </div>

              <div>
                <div style={labelStyle}>Tempo (Pause bis zur nächsten Ansage)</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {Object.entries(TEMPO).map(([key, t]) => (
                    <button key={key} onClick={() => setMatchTempo(key)} style={{ ...pill, background: matchTempo === key ? "#E8A93B" : "#FFFFFF", borderColor: matchTempo === key ? "#E8A93B" : "#DDD6C7" }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <label style={toggleRow}>
                <input type="checkbox" checked={ttsOn} onChange={(e) => setTtsOn(e.target.checked)} />
                {ttsOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
                Wörter vorlesen (Sprachausgabe)
              </label>

              <label style={toggleRow}>
                <input type="checkbox" checked={satzModus} onChange={(e) => setSatzModus(e.target.checked)} />
                Sätze statt Wörter ansagen (Akkusativ-Training)
              </label>

              <label style={toggleRow}>
                <input type="checkbox" checked={showWords} onChange={(e) => setShowWords(e.target.checked)} />
                Wörter als Text zeigen (Testmodus — später nur Bild)
              </label>

              <button onClick={startMatchRound} style={btnGhost}>
                <RotateCcw size={14} /> Neu mischen
              </button>

              <div style={statCard}>
                <Trophy size={15} color="#E8A93B" />
                <div>
                  <div style={statLabel}>Richtig erkannt</div>
                  <div className="bingo-mono" style={statValue}>{matchCorrectCount}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const btnPrimary = { display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, border: "none", background: "#23273A", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" };
const btnSecondary = { padding: "9px 14px", borderRadius: 10, border: "1px solid #DDD6C7", background: "#fff", fontSize: 13, cursor: "pointer" };
const btnIcon = { padding: "9px 12px", borderRadius: 10, border: "1px solid #DDD6C7", background: "#fff", cursor: "pointer" };
const btnGhost = { display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10, border: "1px dashed #B9B4A6", background: "transparent", fontSize: 12, cursor: "pointer", justifyContent: "center" };
const pill = { padding: "6px 12px", borderRadius: 20, border: "1px solid #DDD6C7", fontSize: 12, cursor: "pointer" };
const labelStyle = { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: "#8A8570", marginBottom: 6 };
const toggleRow = { display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#5A5F73" };
const statCard = { flex: 1, display: "flex", alignItems: "center", gap: 8, background: "#FFFFFF", border: "1px solid #DDD6C7", borderRadius: 10, padding: "8px 12px" };
const statLabel = { fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, color: "#8A8570" };
const statValue = { fontSize: 16, fontWeight: 700 };
