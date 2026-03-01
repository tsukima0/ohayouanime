import { Loader2 } from "lucide-react";
import type { UploadProgressInfo } from "@/lib/storage";

interface Props {
  label: string;
  percent: number;
  detail?: UploadProgressInfo | null;
}

function formatEta(seconds: number): string {
  if (seconds <= 0 || !isFinite(seconds)) return "calculating...";
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.ceil(seconds % 60);
  return `${m}m ${s}s`;
}

function formatSpeed(mbps: number): string {
  if (mbps <= 0 || !isFinite(mbps)) return "—";
  if (mbps < 1) return `${(mbps * 1024).toFixed(0)} KB/s`;
  return `${mbps.toFixed(1)} MB/s`;
}

export default function UploadProgressDisplay({ label, percent, detail }: Props) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-primary flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" />
          {label} {percent > 0 && `${percent}%`}
        </p>
        {detail && detail.percent > 1 && (
          <p className="text-xs text-muted-foreground">
            {formatSpeed(detail.speedMBps)} · ETA {formatEta(detail.etaSeconds)}
          </p>
        )}
      </div>
      <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
