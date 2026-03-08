import { useState, useCallback } from "react";
import { Download, Check, Loader2, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { processAndDownload, type ProgressCallback } from "@/lib/ffmpeg-processor";
import logoUrl from "@/assets/logo.png";

interface SubtitleTrack {
  file_url: string | null;
  label: string | null;
  language: string | null;
}

interface DownloadButtonProps {
  videoUrl: string;
  fileName: string;
  subtitles?: SubtitleTrack[];
}

export default function DownloadButton({ videoUrl, fileName, subtitles = [] }: DownloadButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [progress, setProgress] = useState({ phase: "", percent: 0, message: "" });
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const handleDownload = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setIsDone(false);

    const controller = new AbortController();
    setAbortController(controller);

    const onProgress: ProgressCallback = (p) => {
      setProgress({ phase: p.phase, percent: p.percent, message: p.message });
    };

    try {
      // Use the first available subtitle
      const activeSub = subtitles.find((s) => s.file_url);

      const blob = await processAndDownload({
        videoUrl,
        fileName,
        subtitleUrl: activeSub?.file_url || undefined,
        logoUrl,
        onProgress,
      });

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setIsDone(true);
      toast({
        title: "Download Ready",
        description: `${fileName} has been processed and downloaded.`,
      });
      setTimeout(() => setIsDone(false), 3000);
    } catch (err) {
      console.error("Processing error:", err);
      toast({
        title: "Processing Failed",
        description: "Falling back to direct download without subtitles/logo.",
        variant: "destructive",
      });
      // Fallback: direct link download
      const a = document.createElement("a");
      a.href = videoUrl;
      a.download = fileName;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setIsProcessing(false);
      setAbortController(null);
      setProgress({ phase: "", percent: 0, message: "" });
    }
  }, [videoUrl, fileName, subtitles, isProcessing]);

  const handleCancel = useCallback(() => {
    abortController?.abort();
    setIsProcessing(false);
    setProgress({ phase: "", percent: 0, message: "" });
  }, [abortController]);

  return (
    <div className="flex flex-col items-end mt-4 gap-2">
      {isProcessing && (
        <div className="w-full max-w-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress.message}</span>
            <span>{progress.percent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground/60">
            ⚠ Processing in browser — may take several minutes for long videos
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        {isProcessing && (
          <button
            onClick={handleCancel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
        )}
        <button
          onClick={handleDownload}
          disabled={isProcessing}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-colors shadow-lg ${
            isProcessing
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : isDone
                ? "bg-primary text-primary-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isDone ? (
            <Check className="w-4 h-4" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>
            {isDone ? "Downloaded!" : isProcessing ? "Processing..." : "Download Episode"}
          </span>
        </button>
      </div>
    </div>
  );
}
