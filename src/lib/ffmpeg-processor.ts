import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

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

/**
 * Parse VTT/SRT subtitle content and convert to SRT format for FFmpeg.
 */
function convertToSRT(content: string): string {
  // Remove VTT header if present
  let text = content.replace(/^WEBVTT\s*\n/i, "").trim();
  // Remove NOTE blocks
  text = text.replace(/^NOTE[\s\S]*?(?=\n\n|\n$)/gm, "").trim();

  const blocks = text.split(/\n\n+/).filter(Boolean);
  let srtIndex = 1;
  const srtBlocks: string[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").filter(Boolean);
    if (lines.length < 2) continue;

    // Find the timestamp line
    let timestampIdx = lines.findIndex((l) => l.includes("-->"));
    if (timestampIdx === -1) continue;

    let timestamp = lines[timestampIdx];
    // Convert VTT timestamps (00:01.000) to SRT format (00:00:01,000)
    timestamp = timestamp.replace(
      /(\d{1,2}:)?(\d{2}):(\d{2})\.(\d{3})/g,
      (_, h, m, s, ms) => {
        const hours = h ? h.replace(":", "") : "00";
        return `${hours.padStart(2, "0")}:${m}:${s},${ms}`;
      }
    );

    const textLines = lines.slice(timestampIdx + 1).join("\n");
    // Strip HTML tags from subtitle text
    const cleanText = textLines.replace(/<[^>]+>/g, "");

    srtBlocks.push(`${srtIndex}\n${timestamp}\n${cleanText}`);
    srtIndex++;
  }

  return srtBlocks.join("\n\n") + "\n";
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

  // Phase: Fetching assets
  onProgress({ phase: "fetching", percent: 0, message: "Downloading video..." });

  const videoData = await fetchFile(videoUrl);
  await ffmpeg.writeFile("input.mp4", videoData);
  onProgress({ phase: "fetching", percent: 60, message: "Video downloaded" });

  // Build filter chain
  const filters: string[] = [];
  const inputs: string[] = ["-i", "input.mp4"];

  // Write logo if available
  if (logoUrl) {
    try {
      const logoData = await fetchFile(logoUrl);
      await ffmpeg.writeFile("logo.png", logoData);
      inputs.push("-i", "logo.png");
      // Place logo at top-right with padding, semi-transparent
      filters.push("overlay=W-w-16:16");
      onProgress({ phase: "fetching", percent: 75, message: "Logo loaded" });
    } catch (e) {
      console.warn("Failed to load logo, skipping:", e);
    }
  }

  // Write subtitles if available
  let hasSubtitles = false;
  if (subtitleUrl) {
    try {
      const subResponse = await fetch(subtitleUrl);
      let subContent = await subResponse.text();
      onProgress({ phase: "fetching", percent: 90, message: "Subtitles loaded" });

      // Convert to SRT format
      subContent = convertToSRT(subContent);
      const encoder = new TextEncoder();
      await ffmpeg.writeFile("subs.srt", encoder.encode(subContent));
      hasSubtitles = true;
    } catch (e) {
      console.warn("Failed to load subtitles, skipping:", e);
    }
  }

  onProgress({ phase: "fetching", percent: 100, message: "All assets ready" });

  // Phase: Processing
  ffmpeg.on("progress", ({ progress }) => {
    const pct = Math.min(Math.round(progress * 100), 99);
    onProgress({
      phase: "processing",
      percent: pct,
      message: `Encoding: ${pct}%`,
    });
  });

  // Build FFmpeg command
  const cmd: string[] = [...inputs];

  if (filters.length > 0 || hasSubtitles) {
    const vf: string[] = [];

    if (filters.length > 0) {
      // If we have a logo overlay, we need complex filtergraph
      // [0:v][1:v] overlay=...
      // Then apply subtitles on top
    }

    // Build the complete command based on what we have
    if (filters.length > 0 && hasSubtitles) {
      // Logo overlay + subtitles
      cmd.push(
        "-filter_complex",
        `[0:v][1:v]overlay=W-w-16:16[v1];[v1]subtitles=subs.srt:force_style='FontSize=22,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,Outline=2,Shadow=1,MarginV=30'[vout]`,
        "-map", "[vout]",
        "-map", "0:a?"
      );
    } else if (filters.length > 0) {
      // Logo overlay only
      cmd.push(
        "-filter_complex",
        `[0:v][1:v]overlay=W-w-16:16[vout]`,
        "-map", "[vout]",
        "-map", "0:a?"
      );
    } else if (hasSubtitles) {
      // Subtitles only
      cmd.push(
        "-vf",
        `subtitles=subs.srt:force_style='FontSize=22,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,Outline=2,Shadow=1,MarginV=30'`
      );
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

  console.log("[FFmpeg] Running command:", cmd.join(" "));

  try {
    await ffmpeg.exec(cmd);
  } catch (err) {
    console.error("[FFmpeg] Processing failed, trying fallback without subtitles filter:", err);

    // Fallback: try without subtitles filter (drawtext approach)
    if (hasSubtitles) {
      // If subtitles filter failed, try without it
      const fallbackCmd: string[] = [...inputs];
      if (filters.length > 0) {
        fallbackCmd.push(
          "-filter_complex",
          `[0:v][1:v]overlay=W-w-16:16[vout]`,
          "-map", "[vout]",
          "-map", "0:a?"
        );
      }
      fallbackCmd.push(
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "23",
        "-c:a", "copy",
        "-movflags", "+faststart",
        "output.mp4"
      );

      console.log("[FFmpeg] Fallback command:", fallbackCmd.join(" "));
      await ffmpeg.exec(fallbackCmd);
    } else {
      throw err;
    }
  }

  const output = await ffmpeg.readFile("output.mp4");
  const uint8 = output as Uint8Array;
  const blob = new Blob([new Uint8Array(uint8)], { type: "video/mp4" });

  // Cleanup
  try {
    await ffmpeg.deleteFile("input.mp4");
    await ffmpeg.deleteFile("output.mp4");
    if (logoUrl) await ffmpeg.deleteFile("logo.png");
    if (hasSubtitles) await ffmpeg.deleteFile("subs.srt");
  } catch {}

  onProgress({ phase: "done", percent: 100, message: "Complete!" });
  return blob;
}
