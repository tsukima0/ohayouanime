import { useState, useCallback } from "react";
import { Download, Check } from "lucide-react";

interface DownloadButtonProps {
  videoUrl: string;
  fileName: string;
}

export default function DownloadButton({ videoUrl, fileName }: DownloadButtonProps) {
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleDownload = useCallback(async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setProgress(0);
    setIsDone(false);

    try {
      const res = await fetch(videoUrl);
      const contentLength = res.headers.get("content-length");
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      const reader = res.body?.getReader();

      if (!reader) {
        throw new Error("No reader available");
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
        }
      }

      const blob = new Blob(chunks);
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
    } catch {
      console.error("Download failed");
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
