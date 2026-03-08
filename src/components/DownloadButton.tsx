import { Download } from "lucide-react";

interface DownloadButtonProps {
  videoUrl: string;
  fileName: string;
}

export default function DownloadButton({ videoUrl, fileName }: DownloadButtonProps) {
  return (
    <div className="flex justify-end mt-4 gap-3 items-center">
      <a
        href={videoUrl}
        download={fileName}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-medium text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg"
      >
        <Download className="w-4 h-4" />
        <span>Download Episode</span>
      </a>
    </div>
  );
}
