import { useState, useCallback } from "react";
import { Download, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DownloadButtonProps {
  videoUrl: string;
  fileName: string;
}

export default function DownloadButton({ videoUrl, fileName }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDone, setIsDone] = useState(false);


  const handleDownload = useCallback(() => {
    if (isDownloading) return;
    setIsDownloading(true);
    setIsDone(false);

    // Direct download via anchor tag
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = fileName;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();

    // Show downloading state briefly, then mark done
    setTimeout(() => {
      setIsDownloading(false);
      setIsDone(true);
      toast({
        title: "Download Started",
        description: `${fileName} download has been initiated.`,
      });
      setTimeout(() => {
        setIsDone(false);
      }, 3000);
    }, 1500);
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
