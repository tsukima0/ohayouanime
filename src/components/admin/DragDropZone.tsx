import { useState, useRef, useCallback } from "react";
import { Upload, Film, ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  accept: string;
  label: string;
  icon?: "video" | "image";
  file: File | null;
  preview?: string | null;
  onFile: (file: File | null) => void;
  onPreview?: (url: string | null) => void;
}

export default function DragDropZone({ accept, label, icon = "video", file, preview, onFile, onPreview }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File | null) => {
    onFile(f);
    if (f && icon === "image" && onPreview) {
      onPreview(URL.createObjectURL(f));
    }
  }, [onFile, onPreview, icon]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFile(null);
    if (onPreview) onPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const IconComponent = icon === "video" ? Film : ImageIcon;

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all min-h-[100px]",
        dragging
          ? "border-primary bg-primary/10"
          : "border-border bg-secondary/50 hover:border-primary/50 hover:bg-secondary"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
      />

      {file ? (
        <div className="flex items-center gap-3 w-full">
          {preview && icon === "image" ? (
            <img src={preview} alt="Preview" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <IconComponent className="w-5 h-5 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
          </div>
          <button onClick={clear} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          {preview && icon === "image" ? (
            <div className="flex items-center gap-3 w-full">
              <img src={preview} alt="Current" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Current thumbnail</p>
                <p className="text-xs text-primary">Drop or click to replace</p>
              </div>
            </div>
          ) : (
            <>
              <Upload className={cn("w-6 h-6", dragging ? "text-primary" : "text-muted-foreground")} />
              <div className="text-center">
                <p className="text-xs font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Drag & drop or click to browse</p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
