import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { supabase } from "@/integrations/supabase/client";

let ffmpegInstance: FFmpeg | null = null;

export type ProgressCallback = (progress: {
  phase: "loading" | "fetching" | "processing" | "done";
  percent: number;
  message: string;
}) => void;

async function getFFmpeg(onProgress: ProgressCallback): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegInstance.loaded) return ffmpegInstance;

  onProgress({ phase: "loading", percent: 0, message: "Loading video processor..." });

  const ffmpeg = new FFmpeg();

  ffmpeg.on("log", ({ message }) => {
    console.log("[FFmpeg]", message);
  });

  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  ffmpegInstance = ffmpeg;
  onProgress({ phase: "loading", percent: 100, message: "Video processor ready" });
  return ffmpeg;
}

/** Fetch a remote file via the download-proxy edge function to avoid CORS issues */
async function fetchViaProxy(url: string): Promise<Uint8Array> {
  const { data: { session } } = await supabase.auth.getSession();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const res = await fetch(`${supabaseUrl}/functions/v1/download-proxy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ videoUrl: url, fileName: "file" }),
  });

  if (!res.ok) {
    throw new Error(`Proxy fetch failed: ${res.status}`);
  }

  const buffer = await res.arrayBuffer();
  return new Uint8Array(buffer);
}

/** Fetch a text file via proxy */
async function fetchTextViaProxy(url: string): Promise<string> {
  const data = await fetchViaProxy(url);
  return new TextDecoder().decode(data);
}

interface SubtitleCue {
  start: number; // seconds
  end: number;
  text: string;
}

/** Parse VTT/SRT content into cues with timestamps in seconds */
function parseSubtitleCues(content: string): SubtitleCue[] {
  // Remove VTT header
  let text = content.replace(/^WEBVTT\s*\n/i, "").trim();
  // Remove NOTE/STYLE blocks
  text = text.replace(/^(NOTE|STYLE)[\s\S]*?(?=\n\n|\n$)/gm, "").trim();

  const blocks = text.split(/\n\n+/).filter(Boolean);
  const cues: SubtitleCue[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").filter(Boolean);
    if (lines.length < 2) continue;

    const timestampIdx = lines.findIndex((l) => l.includes("-->"));
    if (timestampIdx === -1) continue;

    const timestamp = lines[timestampIdx];
    const match = timestamp.match(
      /(\d{1,2}:)?(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{1,2}:)?(\d{2}):(\d{2})[.,](\d{3})/
    );
    if (!match) continue;

    const startH = match[1] ? parseInt(match[1]) : 0;
    const startM = parseInt(match[2]);
    const startS = parseInt(match[3]);
    const startMs = parseInt(match[4]);
    const endH = match[5] ? parseInt(match[5]) : 0;
    const endM = parseInt(match[6]);
    const endS = parseInt(match[7]);
    const endMs = parseInt(match[8]);

    const start = startH * 3600 + startM * 60 + startS + startMs / 1000;
    const end = endH * 3600 + endM * 60 + endS + endMs / 1000;

    const subtitleText = lines
      .slice(timestampIdx + 1)
      .join("\n")
      .replace(/<[^>]+>/g, "") // Strip HTML tags
      .replace(/\{[^}]+\}/g, "") // Strip ASS-style tags
      .trim();

    if (subtitleText) {
      cues.push({ start, end, text: subtitleText });
    }
  }

  return cues;
}

/** Escape text for FFmpeg drawtext filter */
function escapeDrawtext(text: string): string {
  return text
    .replace(/\\/g, "\\\\\\\\")
    .replace(/'/g, "'\\\\\\''")
    .replace(/:/g, "\\\\:")
    .replace(/\[/g, "\\\\[")
    .replace(/\]/g, "\\\\]")
    .replace(/;/g, "\\\\;")
    .replace(/,/g, "\\\\,")
    .replace(/%/g, "%%")
    .replace(/\n/g, "\\n");
}

/** Build drawtext filter chain from subtitle cues */
function buildDrawtextFilters(cues: SubtitleCue[]): string {
  return cues
    .map((cue) => {
      const escapedText = escapeDrawtext(cue.text);
      return `drawtext=text='${escapedText}':fontsize=22:fontcolor=white:borderw=2:bordercolor=black:shadowcolor=black@0.5:shadowx=1:shadowy=1:x=(w-text_w)/2:y=h-60:enable='between(t,${cue.start.toFixed(3)},${cue.end.toFixed(3)})'`;
    })
    .join(",");
}

export interface ProcessVideoOptions {
  videoUrl: string;
  fileName: string;
  subtitleUrl?: string;
  logoUrl?: string;
  onProgress: ProgressCallback;
}

export async function processAndDownload({
  videoUrl,
  fileName,
  subtitleUrl,
  logoUrl,
  onProgress,
}: ProcessVideoOptions): Promise<Blob> {
  const ffmpeg = await getFFmpeg(onProgress);

  // Phase: Fetching assets via proxy to avoid CORS
  onProgress({ phase: "fetching", percent: 0, message: "Downloading video..." });

  const videoData = await fetchViaProxy(videoUrl);
  await ffmpeg.writeFile("input.mp4", videoData);
  onProgress({ phase: "fetching", percent: 60, message: "Video downloaded" });

  // Build filter components
  const inputs: string[] = ["-i", "input.mp4"];
  let hasLogo = false;
  let subtitleCues: SubtitleCue[] = [];

  // Write logo if available
  if (logoUrl) {
    try {
      const logoResponse = await fetch(logoUrl);
      const logoBuffer = await logoResponse.arrayBuffer();
      await ffmpeg.writeFile("logo.png", new Uint8Array(logoBuffer));
      inputs.push("-i", "logo.png");
      hasLogo = true;
      onProgress({ phase: "fetching", percent: 75, message: "Logo loaded" });
    } catch (e) {
      console.warn("[FFmpeg] Failed to load logo, skipping:", e);
    }
  }

  // Parse subtitles if available
  if (subtitleUrl) {
    try {
      const subContent = await fetchTextViaProxy(subtitleUrl);
      subtitleCues = parseSubtitleCues(subContent);
      console.log(`[FFmpeg] Parsed ${subtitleCues.length} subtitle cues`);
      onProgress({ phase: "fetching", percent: 90, message: `${subtitleCues.length} subtitle cues loaded` });
    } catch (e) {
      console.warn("[FFmpeg] Failed to load subtitles, skipping:", e);
    }
  }

  onProgress({ phase: "fetching", percent: 100, message: "All assets ready" });

  // Phase: Processing
  ffmpeg.on("progress", ({ progress }) => {
    const pct = Math.min(Math.round(progress * 100), 99);
    onProgress({ phase: "processing", percent: pct, message: `Encoding: ${pct}%` });
  });

  // Build FFmpeg command
  const cmd: string[] = [...inputs];
  const hasSubtitles = subtitleCues.length > 0;

  if (hasLogo || hasSubtitles) {
    // Build the filter graph
    if (hasLogo && hasSubtitles) {
      const drawtextChain = buildDrawtextFilters(subtitleCues);
      cmd.push(
        "-filter_complex",
        `[0:v][1:v]overlay=W-w-16:16,${drawtextChain}[vout]`,
        "-map", "[vout]",
        "-map", "0:a?"
      );
    } else if (hasLogo) {
      cmd.push(
        "-filter_complex",
        `[0:v][1:v]overlay=W-w-16:16[vout]`,
        "-map", "[vout]",
        "-map", "0:a?"
      );
    } else if (hasSubtitles) {
      const drawtextChain = buildDrawtextFilters(subtitleCues);
      cmd.push("-vf", drawtextChain);
    }
  }

  cmd.push(
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-crf", "23",
    "-c:a", "copy",
    "-movflags", "+faststart",
    "output.mp4"
  );

  console.log("[FFmpeg] Running command (length:", cmd.join(" ").length, "chars)");

  await ffmpeg.exec(cmd);

  const output = await ffmpeg.readFile("output.mp4");
  const uint8 = output as Uint8Array;
  const blob = new Blob([new Uint8Array(uint8)], { type: "video/mp4" });

  // Cleanup
  try {
    await ffmpeg.deleteFile("input.mp4");
    await ffmpeg.deleteFile("output.mp4");
    if (hasLogo) await ffmpeg.deleteFile("logo.png");
  } catch {}

  onProgress({ phase: "done", percent: 100, message: "Complete!" });
  return blob;
}
