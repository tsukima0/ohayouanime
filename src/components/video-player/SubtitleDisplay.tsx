import { useState, useEffect, useRef } from "react";

interface Cue {
  start: number;
  end: number;
  /** HTML-safe rich text (already escaped, with <br>, <i>, <b>, <u>, <span>) */
  html: string;
  /** ASS alignment 1-9 (numpad layout). Optional. */
  align?: number;
  /** Optional explicit position { x, y } in script resolution coords */
  pos?: { x: number; y: number };
}

interface SubtitleDisplayProps {
  fileUrl: string | null;
  playerRef: React.RefObject<ReturnType<typeof import("video.js").default> | null>;
  playerReady: boolean;
  fontScale?: number;
  bgOpacity?: number;
  position?: "bottom" | "top";
  controlsVisible?: boolean;
}

interface ParsedSubs {
  cues: Cue[];
  /** Script resolution from ASS [Script Info]; defaults if not present */
  playResX: number;
  playResY: number;
}

/* ---------------- Timestamp parsing ---------------- */

function parseTimestamp(ts: string): number {
  const parts = ts.trim().split(":");
  if (parts.length === 3) {
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  }
  if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  return 0;
}

function parseASSTimestamp(ts: string): number {
  const parts = ts.split(":");
  if (parts.length === 3) {
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  }
  return 0;
}

/* ---------------- HTML escaping ---------------- */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ---------------- ASS rich-text -> HTML ---------------- */

interface ParsedASSText {
  html: string;
  align?: number;
  pos?: { x: number; y: number };
}

/**
 * Convert ASS dialogue text to HTML, honoring:
 *  \N \n  -> <br>
 *  \h     -> &nbsp;
 *  {\i1}{\i0} italic, {\b1}{\b0} bold, {\u1}{\u0} underline, {\s1}{\s0} strikethrough
 *  {\an1..9} alignment
 *  {\pos(x,y)} position
 *  {\c&Hbbggrr&} or {\1c&Hbbggrr&} primary color
 *  {\fs<size>} font size (relative)
 *  {\r} reset styles
 *  Other override tags are stripped silently.
 */
function assTextToHtml(raw: string): ParsedASSText {
  let align: number | undefined;
  let pos: { x: number; y: number } | undefined;

  // Track open tags so we can close them on \r or end
  const stack: string[] = [];
  const openTag = (tag: string, attrs = "") => {
    stack.push(tag);
    return `<${tag}${attrs ? " " + attrs : ""}>`;
  };
  const closeAll = () => {
    let out = "";
    while (stack.length) out += `</${stack.pop()}>`;
    return out;
  };
  const closeTag = (tag: string) => {
    const idx = stack.lastIndexOf(tag);
    if (idx === -1) return "";
    // Close everything above it, then it, then reopen the ones above
    const above = stack.splice(idx + 1);
    let out = "";
    for (let i = above.length - 1; i >= 0; i--) out += `</${above[i]}>`;
    out += `</${tag}>`;
    stack.splice(idx, 1);
    for (const t of above) {
      stack.push(t);
      out += `<${t}>`;
    }
    return out;
  };

  let html = "";
  let i = 0;
  while (i < raw.length) {
    const ch = raw[i];

    // Override block { ... }
    if (ch === "{") {
      const end = raw.indexOf("}", i);
      if (end === -1) {
        // unmatched, treat as literal
        html += escapeHtml(raw.slice(i));
        break;
      }
      const block = raw.slice(i + 1, end);
      // Process individual \tag entries inside the block
      const tagRegex = /\\([a-zA-Z0-9]+)((?:\([^)]*\))|(?:&H[^&]*&)|(?:[^\\}]*))?/g;
      let m: RegExpExecArray | null;
      while ((m = tagRegex.exec(block))) {
        const name = m[1];
        const arg = (m[2] || "").trim();
        switch (name) {
          case "N":
          case "n":
            // Shouldn't appear inside a tag block, ignore
            break;
          case "i1": html += openTag("i"); break;
          case "i0": html += closeTag("i"); break;
          case "b1": html += openTag("b"); break;
          case "b0": html += closeTag("b"); break;
          case "u1": html += openTag("u"); break;
          case "u0": html += closeTag("u"); break;
          case "s1": html += openTag("s"); break;
          case "s0": html += closeTag("s"); break;
          case "r":
            html += closeAll();
            break;
          default:
            if (name.startsWith("an") && name.length > 2) {
              const a = parseInt(name.slice(2));
              if (a >= 1 && a <= 9) align = a;
            } else if (name === "a" && arg) {
              // Legacy alignment (1=left, 2=center, 3=right, +4 top, +8 mid)
              const a = parseInt(arg);
              if (!Number.isNaN(a)) {
                // Map legacy to numpad
                const h = a & 3; // 1=L,2=C,3=R
                const v = a & 12;
                let row = 0; // 0=bottom
                if (v === 8) row = 1; // middle -> 4..6
                else if (v === 4) row = 2; // top -> 7..9
                align = row * 3 + (h === 0 ? 2 : h);
              }
            } else if (name === "pos" && arg.startsWith("(")) {
              const inner = arg.slice(1, -1);
              const [x, y] = inner.split(",").map((v) => parseFloat(v.trim()));
              if (!Number.isNaN(x) && !Number.isNaN(y)) pos = { x, y };
            } else if ((name === "c" || name === "1c") && arg.startsWith("&H")) {
              const hex = arg.slice(2).replace(/&$/, "").padStart(6, "0");
              // ASS color is BBGGRR
              const bb = hex.slice(-6, -4);
              const gg = hex.slice(-4, -2);
              const rr = hex.slice(-2);
              html += openTag("span", `style="color:#${rr}${gg}${bb}"`);
            } else if (name === "fs" && arg) {
              const size = parseFloat(arg);
              if (!Number.isNaN(size)) {
                // Treat as relative em scale (rough): 22 ≈ 1em
                const em = (size / 22).toFixed(2);
                html += openTag("span", `style="font-size:${em}em"`);
              }
            }
            // Unknown tags are ignored
            break;
        }
      }
      i = end + 1;
      continue;
    }

    // Escape sequences \N \n \h
    if (ch === "\\" && i + 1 < raw.length) {
      const next = raw[i + 1];
      if (next === "N" || next === "n") {
        html += "<br>";
        i += 2;
        continue;
      }
      if (next === "h") {
        html += "&nbsp;";
        i += 2;
        continue;
      }
    }

    // Real newline in source
    if (ch === "\n") {
      html += "<br>";
      i++;
      continue;
    }

    html += escapeHtml(ch);
    i++;
  }

  html += closeAll();
  return { html, align, pos };
}

/* ---------------- VTT/SRT parser ---------------- */

function parseVTT(text: string): Cue[] {
  const cues: Cue[] = [];
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
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
        // VTT supports a small set of inline tags; allow <i> <b> <u> <ruby> <rt>, escape the rest
        const joined = textLines.join("\n");
        const html = vttToHtml(joined);
        cues.push({ start, end, html });
      }
    } else {
      i++;
    }
  }
  return cues;
}

function vttToHtml(text: string): string {
  // Escape everything, then re-allow a whitelist of tags
  const escaped = escapeHtml(text).replace(/\n/g, "<br>");
  return escaped.replace(
    /&lt;(\/?)(i|b|u|ruby|rt)&gt;/gi,
    (_, slash, tag) => `<${slash}${tag.toLowerCase()}>`
  );
}

/* ---------------- ASS parser ---------------- */

function parseASS(text: string): { cues: Cue[]; playResX: number; playResY: number } {
  const cues: Cue[] = [];
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  // Find the Format: line under [Events] to know column order
  let inEvents = false;
  let inScriptInfo = false;
  let playResX = 384;
  let playResY = 288;
  let format: string[] | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("[")) {
      const section = trimmed.toLowerCase();
      inEvents = section === "[events]";
      inScriptInfo = section === "[script info]";
      format = null;
      continue;
    }

    if (inScriptInfo) {
      const lower = trimmed.toLowerCase();
      if (lower.startsWith("playresx:")) {
        const v = parseFloat(trimmed.substring(9).trim());
        if (!Number.isNaN(v) && v > 0) playResX = v;
      } else if (lower.startsWith("playresy:")) {
        const v = parseFloat(trimmed.substring(9).trim());
        if (!Number.isNaN(v) && v > 0) playResY = v;
      }
      continue;
    }

    if (!inEvents) continue;

    if (trimmed.toLowerCase().startsWith("format:")) {
      format = trimmed
        .substring("format:".length)
        .split(",")
        .map((s) => s.trim().toLowerCase());
      continue;
    }

    if (trimmed.toLowerCase().startsWith("dialogue:")) {
      const after = trimmed.substring("dialogue:".length);
      const cols = format ?? [
        "layer", "start", "end", "style", "name",
        "marginl", "marginr", "marginv", "effect", "text",
      ];
      const textIdx = cols.indexOf("text");
      const startIdx = cols.indexOf("start");
      const endIdx = cols.indexOf("end");
      if (textIdx === -1 || startIdx === -1 || endIdx === -1) continue;

      // Split on commas, but only up to textIdx; the rest is text (may contain commas)
      const parts: string[] = [];
      let rest = after;
      for (let c = 0; c < textIdx; c++) {
        const ci = rest.indexOf(",");
        if (ci === -1) { parts.push(rest); rest = ""; break; }
        parts.push(rest.slice(0, ci));
        rest = rest.slice(ci + 1);
      }
      const textContent = rest; // remainder is the dialogue text

      const startStr = (parts[startIdx] ?? "").trim();
      const endStr = (parts[endIdx] ?? "").trim();
      const parsed = assTextToHtml(textContent);

      // Skip drawing commands ({\p1}...{\p0}) which we can't render
      if (/\{[^}]*\\p[1-9]/.test(textContent)) continue;

      if (parsed.html.replace(/<[^>]+>/g, "").trim() === "" && !parsed.html.includes("&nbsp;")) {
        continue;
      }

      cues.push({
        start: parseASSTimestamp(startStr),
        end: parseASSTimestamp(endStr),
        html: parsed.html,
        align: parsed.align,
        pos: parsed.pos,
      });
    }
  }

  cues.sort((a, b) => a.start - b.start);
  return { cues, playResX, playResY };
}

/* ---------------- Format detection ---------------- */

function detectFormat(text: string): "vtt" | "srt" | "ass" {
  const trimmed = text.trim();
  if (trimmed.startsWith("WEBVTT")) return "vtt";
  if (
    trimmed.includes("[Script Info]") ||
    trimmed.includes("[V4+ Styles]") ||
    trimmed.includes("[V4 Styles]") ||
    trimmed.includes("[Events]")
  ) return "ass";
  return "srt";
}

/* ---------------- Component ---------------- */

export default function SubtitleDisplay({
  fileUrl,
  playerRef,
  playerReady,
  fontScale = 1,
  bgOpacity = 0.75,
  position = "bottom",
  controlsVisible = true,
}: SubtitleDisplayProps) {
  const [cues, setCues] = useState<Cue[]>([]);
  const [currentCue, setCurrentCue] = useState<Cue | null>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!fileUrl) {
      setCues([]);
      setCurrentCue(null);
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

  useEffect(() => {
    if (!playerReady || cues.length === 0) {
      setCurrentCue(null);
      return;
    }
    const tick = () => {
      const p = playerRef.current;
      if (!p || (p as any).isDisposed()) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const ct = p.currentTime() ?? 0;
      let found: Cue | null = null;
      for (const cue of cues) {
        if (ct >= cue.start && ct <= cue.end) {
          found = cue;
          break;
        }
        if (cue.start > ct) break;
      }
      setCurrentCue(found);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playerReady, cues, playerRef]);

  if (!currentCue) return null;

  // Resolve effective vertical position: cue \an overrides prop
  // ASS numpad: 1-3 bottom, 4-6 middle, 7-9 top; horizontal 1/4/7 left, 2/5/8 center, 3/6/9 right
  const align = currentCue.align;
  let vPos: "top" | "middle" | "bottom" = position === "top" ? "top" : "bottom";
  let hAlign: "left" | "center" | "right" = "center";
  if (align) {
    if (align >= 7) vPos = "top";
    else if (align >= 4) vPos = "middle";
    else vPos = "bottom";
    const hMod = ((align - 1) % 3) + 1;
    hAlign = hMod === 1 ? "left" : hMod === 3 ? "right" : "center";
  }

  const containerStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: hAlign === "left" ? "flex-start" : hAlign === "right" ? "flex-end" : "center",
    pointerEvents: "none",
    paddingLeft: "1rem",
    paddingRight: "1rem",
    zIndex: 2147483644,
  };

  if (vPos === "top") {
    containerStyle.top = "1.5rem";
  } else if (vPos === "middle") {
    containerStyle.top = "50%";
    containerStyle.transform = "translateY(-50%)";
  } else {
    containerStyle.bottom = controlsVisible ? "4rem" : "1.5rem";
    containerStyle.transition = "bottom 0.3s ease";
  }

  return (
    <div style={containerStyle}>
      <div
        className="px-3 py-1.5 rounded-lg max-w-[85%]"
        style={{
          background: `hsla(0, 0%, 0%, ${bgOpacity})`,
          color: "hsl(0, 0%, 100%)",
          fontSize: `calc(clamp(0.85rem, 2.2vw, 1.25rem) * ${fontScale})`,
          lineHeight: 1.4,
          textAlign: hAlign,
          textShadow: "0 1px 3px hsla(0, 0%, 0%, 0.8)",
        }}
        dangerouslySetInnerHTML={{ __html: currentCue.html }}
      />
    </div>
  );
}
