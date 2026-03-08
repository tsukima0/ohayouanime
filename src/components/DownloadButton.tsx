import { useState, useCallback } from "react";
import { Download, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DownloadButtonProps {
  videoUrl: string;
  fileName: string;
}

export default function DownloadButton({ videoUrl, fileName }: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleDownload = useCallback(async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setIsDone(false);

    try {
      // Get a presigned download URL with Content-Disposition: attachment
      const { data: sessionData } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-proxy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(sessionData?.session?.access_token
              ? { Authorization: `Bearer ${sessionData.session.access_token}` }
              : {}),
          },
          body: JSON.stringify({ videoUrl, fileName }),
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const { downloadUrl } = await res.json();

      // Open presigned URL - browser will download due to content-disposition
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      setIsDone(true);
      toast({
        title: "Download Started",
        description: `${fileName} download has been initiated.`,
      });
      setTimeout(() => setIsDone(false), 3000);
    } catch (err) {
      console.error("Download error:", err);
      // Fallback: open direct URL
      window.open(videoUrl, "_blank");
    } finally {
      setIsDownloading(false);
    }
  }, [videoUrl, fileName, isDownloading]);

  return (
    <div className="flex justify-end mt-4 gap-3 items-center">
      <div className="relative">
        {isDownloading && (
          <span className="absolute inset-0 rounded-full pointer-events-none z-10 border-2 border-destructive" />
        )}
        <button
          onClick={handleDownload}
          className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm transition-colors shadow-lg ${
            isDownloading
              ? "bg-transparent text-destructive cursor-pointer hover:text-destructive/80"
              : isDone
                ? "bg-primary text-primary-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {isDone ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          <span>
            {isDone ? "Downloaded!" : isDownloading ? "Downloading..." : "Download Episode"}
          </span>
        </button>
      </div>
    </div>
  );
}
