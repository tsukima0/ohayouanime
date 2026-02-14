import { useState, useEffect, useRef, useCallback } from "react";

interface Cue {
  start: number;
  end: number;
  text: string;
}

interface SubtitleDisplayProps {
  fileUrl: string | null;
  playerRef: React.RefObject<ReturnType<typeof import("video.js").default> | null>;
  playerReady: boolean;
  fontScale?: number;
  bgOpacity?: number;
  position?: "bottom" | "top";
}

function parseTimestamp(ts: string): number {
  // Handles "HH:MM:SS.mmm" or "H:MM:SS.mm" or "MM:SS.mmm"
  const parts = ts.trim().split(":");
  if (parts.length === 3) {
    const h = parseFloat(parts[0]);
    const m = parseFloat(parts[1]);
    const s = parseFloat(parts[2]);
    return h * 3600 + m * 60 + s;
  }
  if (parts.length === 2) {
    const m = parseFloat(parts[0]);
    const s = parseFloat(parts[1]);
    return m * 60 + s;
  }
  return 0;
}

function parseVTT(text: string): Cue[] {
  const cues: Cue[] = [];
  // Normalize line endings
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Look for timestamp lines: "00:00:01.000 --> 00:00:04.000"
    if (line.includes("-->")) {
      const [startStr, endStr] = line.split("-->");
      const start = parseTimestamp(startStr);
      const end = parseTimestamp(endStr);
      i++;
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== "") {
        textLines.push(lines[i]);
        i++;
      }
      if (textLines.length > 0) {
        cues.push({ start, end, text: textLines.join("\n") });
      }
    } else {
      i++;
    }
  }
  return cues;
}

function parseASS(text: string): Cue[] {
  const cues: Cue[] = [];
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  
  for (const line of lines) {
    // Dialogue lines: "Dialogue: 0,0:00:01.00,0:00:04.00,Default,,0,0,0,,Text here"
    if (line.startsWith("Dialogue:")) {
      const afterPrefix = line.substring("Dialogue:".length);
      const parts = afterPrefix.split(",");
      if (parts.length >= 10) {
        const startStr = parts[1].trim();
        const endStr = parts[2].trim();
        // Text is everything after the 9th comma
        const textContent = parts.slice(9).join(",").trim();
        // Strip ASS style overrides like {\b1}, {\an8}, etc.
        const cleanText = textContent
          .replace(/\{[^}]*\}/g, "")
          .replace(/\\N/g, "\n")
          .replace(/\\n/g, "\n")
          .trim();
        
        if (cleanText) {
          cues.push({
            start: parseASSTimestamp(startStr),
            end: parseASSTimestamp(endStr),
            text: cleanText,
          });
        }
      }
    }
  }
  
  // Sort by start time
  cues.sort((a, b) => a.start - b.start);
  return cues;
}

function parseASSTimestamp(ts: string): number {
  // ASS format: "H:MM:SS.cc" (centiseconds)
  const parts = ts.split(":");
  if (parts.length === 3) {
    const h = parseFloat(parts[0]);
    const m = parseFloat(parts[1]);
    const s = parseFloat(parts[2]);
    return h * 3600 + m * 60 + s;
  }
  return 0;
}

function detectFormat(text: string): "vtt" | "srt" | "ass" {
  const trimmed = text.trim();
  if (trimmed.startsWith("WEBVTT")) return "vtt";
  if (trimmed.includes("[Script Info]") || trimmed.includes("[V4+ Styles]") || trimmed.includes("[Events]")) return "ass";
  return "srt"; // SRT and VTT parsing are similar enough
}

export default function SubtitleDisplay({ fileUrl, playerRef, playerReady, fontScale = 1, bgOpacity = 0.75, position = "bottom" }: SubtitleDisplayProps) {
  const [cues, setCues] = useState<Cue[]>([]);
  const [currentText, setCurrentText] = useState<string | null>(null);
  const rafRef = useRef<number>();

  // Fetch and parse subtitle file
  useEffect(() => {
    if (!fileUrl) {
      setCues([]);
      setCurrentText(null);
      return;
    }

    (async () => {
      try {
        const res = await fetch(fileUrl);
        const text = await res.text();
        const format = detectFormat(text);
        const parsed = format === "ass" ? parseASS(text) : parseVTT(text);
        setCues(parsed);
      } catch {
        setCues([]);
      }
    })();
  }, [fileUrl]);

  // Sync current cue with player time
  useEffect(() => {
    if (!playerReady || cues.length === 0) {
      setCurrentText(null);
      return;
    }

    const tick = () => {
      const p = playerRef.current;
      if (!p || (p as any).isDisposed()) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const ct = p.currentTime() ?? 0;
      let found: string | null = null;
      for (const cue of cues) {
        if (ct >= cue.start && ct <= cue.end) {
          found = cue.text;
          break;
        }
        if (cue.start > ct) break;
      }
      setCurrentText(found);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playerReady, cues, playerRef]);

  if (!currentText) return null;

  const posStyle = position === "top"
    ? { top: "3rem", zIndex: 2147483644 }
    : { bottom: "4.5rem", zIndex: 2147483644 };

  return (
    <div
      className="absolute left-0 right-0 flex justify-center pointer-events-none"
      style={posStyle}
    >
      <div
        className="px-3 py-1.5 rounded-lg max-w-[85%] text-center"
        style={{
          background: `hsla(0, 0%, 0%, ${bgOpacity})`,
          color: "hsl(0, 0%, 100%)",
          fontSize: `calc(clamp(0.85rem, 2.2vw, 1.25rem) * ${fontScale})`,
          lineHeight: 1.4,
          textShadow: "0 1px 3px hsla(0, 0%, 0%, 0.8)",
        }}
      >
        {currentText.split("\n").map((line, i) => (
          <span key={i}>
            {i > 0 && <br />}
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}
