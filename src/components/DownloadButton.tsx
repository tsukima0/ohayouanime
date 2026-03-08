import { useState, useCallback, useRef } from "react";
import { Download, Check, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
      const res = await fetch(proxyUrl, { signal: controller.signal });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const contentLength = res.headers.get("x-content-length") || res.headers.get("content-length");
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
      toast({
        title: "Download Complete",
        description: `${fileName} has been downloaded successfully.`,
      });
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
    <div className="flex justify-end mt-4 gap-3 items-center">
      <div className="relative">
        {/* Red static border when downloading */}
        {isDownloading && (
          <span
            className="absolute inset-0 rounded-full pointer-events-none z-10 border-2 border-destructive"
          />
        )}

        <button
          onClick={isDownloading ? handleCancel : handleDownload}
          className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-colors shadow-lg ${
            isDownloading
              ? "bg-transparent text-destructive cursor-pointer hover:text-destructive/80"
              : isDone
                ? "bg-primary text-primary-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {isDone ? (
            <Check className="w-4 h-4" />
          ) : isDownloading ? (
            <X className="w-4 h-4" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>
            {isDone
              ? "Downloaded!"
              : isDownloading
                ? "Downloading..."
                : "Download Episode"}
          </span>
        </button>
      </div>
    </div>
  );
}
