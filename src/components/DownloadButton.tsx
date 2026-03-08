import { useState, useCallback, useRef } from "react";
import { Download, Check, X } from "lucide-react";

interface DownloadButtonProps {
  videoUrl: string;
  fileName: string;
}

export default function DownloadButton({ videoUrl, fileName }: DownloadButtonProps) {
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsDownloading(false);
    setProgress(0);
  }, []);

  const handleDownload = useCallback(async () => {
    if (isDownloading) return;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsDownloading(true);
    setProgress(0);
    setIsDone(false);

    try {
      // Use download proxy edge function to get proper CORS + content-length headers
      const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-proxy?url=${encodeURIComponent(videoUrl)}`;
      const res = await fetch(proxyUrl);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const contentLength = res.headers.get("content-length");
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      const reader = res.body?.getReader();

      if (!reader) {
        // Fallback: direct link download
        const a = document.createElement("a");
        a.href = videoUrl;
        a.download = fileName;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setIsDownloading(false);
        return;
      }

      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (total > 0) {
          setProgress(Math.round((received / total) * 100));
        } else {
          // No content-length, show indeterminate progress
          setProgress(Math.min(95, Math.round(received / 1024 / 1024)));
        }
      }

      const blob = new Blob(chunks as BlobPart[], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setProgress(100);
      setIsDone(true);
      setTimeout(() => {
        setIsDone(false);
        setProgress(0);
      }, 3000);
    } catch (err) {
      console.error("Download failed, falling back to direct link:", err);
      // Fallback: open direct link
      const a = document.createElement("a");
      a.href = videoUrl;
      a.download = fileName;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setIsDownloading(false);
    }
  }, [videoUrl, fileName, isDownloading]);

  return (
    <div className="flex justify-end mt-4">
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="relative inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-colors shadow-lg disabled:cursor-not-allowed overflow-hidden bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {/* Border progress ring overlay */}
        {isDownloading && progress < 100 && (
          <span
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `conic-gradient(hsl(var(--primary-foreground) / 0.35) ${progress * 3.6}deg, transparent ${progress * 3.6}deg)`,
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "exclude",
              WebkitMaskComposite: "xor",
              padding: "2px",
            }}
          />
        )}

        {/* Bottom progress bar */}
        {isDownloading && (
          <span className="absolute bottom-0 left-0 h-[3px] bg-primary-foreground/80 transition-all duration-200 ease-linear rounded-b-full" style={{ width: `${progress}%` }} />
        )}

        {isDone ? (
          <Check className="w-4 h-4" />
        ) : (
          <Download className={`w-4 h-4 ${isDownloading ? "animate-pulse" : ""}`} />
        )}
        <span>
          {isDone
            ? "Downloaded!"
            : isDownloading
              ? `${progress}%`
              : "Download Episode"}
        </span>
      </button>
    </div>
  );
}
