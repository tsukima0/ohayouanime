import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2, Edit2, Loader2, ImageIcon, Film } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Short {
  id: string;
  title: string;
  description: string;
  video_url: string | null;
  thumbnail_url: string | null;
  duration: number;
  created_at: string;
}

export default function ShortsManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("0");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState("");

  const fetchShorts = async () => {
    const { data } = await supabase
      .from("shorts" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setShorts(data as any as Short[]);
    setLoading(false);
  };

  useEffect(() => { fetchShorts(); }, []);

  const resetForm = () => {
    setTitle(""); setDescription(""); setDuration("0");
    setVideoFile(null); setThumbnailFile(null); setThumbnailPreview(null);
    setEditingId(null); setShowForm(false); setUploadProgress("");
  };

  const startEdit = (s: Short) => {
    setTitle(s.title);
    setDescription(s.description || "");
    setDuration(String(s.duration));
    setThumbnailPreview(s.thumbnail_url);
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    try {
      let videoUrl: string | null = null;
      let thumbUrl = thumbnailPreview;

      if (videoFile) {
        setUploadProgress("Uploading video...");
        videoUrl = await uploadFile("videos", videoFile, `shorts/${crypto.randomUUID()}.${videoFile.name.split(".").pop()}`);
      }
      if (thumbnailFile) {
        setUploadProgress("Uploading thumbnail...");
        thumbUrl = await uploadFile("thumbnails", thumbnailFile, `shorts/${crypto.randomUUID()}.${thumbnailFile.name.split(".").pop()}`);
      }

      const payload: any = {
        title,
        description,
        duration: parseInt(duration),
        thumbnail_url: thumbUrl,
        created_by: user.id,
      };
      if (videoUrl) payload.video_url = videoUrl;

      if (editingId) {
        const { error } = await supabase.from("shorts" as any).update(payload).eq("id", editingId);
        if (error) throw error;
        toast({ title: "Short updated" });
      } else {
        payload.video_url = videoUrl;
        const { error } = await supabase.from("shorts" as any).insert(payload);
        if (error) throw error;
        toast({ title: "Short created" });
      }

      resetForm();
      fetchShorts();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
      setUploadProgress("");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this short?")) return;
    const { error } = await supabase.from("shorts" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Short deleted" });
      fetchShorts();
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">Shorts ({shorts.length})</h2>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold glow-primary-sm hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Short
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl glass-card border border-border space-y-4">
          <h3 className="font-display font-semibold text-foreground">
            {editingId ? "Edit Short" : "New Short"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required
                className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Duration (seconds)</label>
              <input type="number" min="0" value={duration} onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Video File</label>
              <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                className="text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Thumbnail</label>
              <div className="flex items-center gap-3">
                {thumbnailPreview ? (
                  <img src={thumbnailPreview} alt="Thumb" className="w-12 h-16 rounded object-cover" />
                ) : (
                  <div className="w-12 h-16 rounded bg-secondary flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <input type="file" accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setThumbnailFile(f); setThumbnailPreview(URL.createObjectURL(f)); }
                  }}
                  className="text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-secondary file:text-secondary-foreground file:cursor-pointer" />
              </div>
            </div>
          </div>

          {uploadProgress && (
            <p className="text-xs text-primary flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> {uploadProgress}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting}
              className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold glow-primary-sm hover:bg-primary/90 disabled:opacity-50 transition-all">
              {submitting ? "Uploading..." : editingId ? "Update" : "Create"}
            </button>
            <button type="button" onClick={resetForm}
              className="px-6 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Shorts list */}
      <div className="space-y-3">
        {shorts.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No shorts yet. Add your first one!</p>
        )}
        {shorts.map((s) => (
          <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl glass-card border border-border">
            {s.thumbnail_url ? (
              <img src={s.thumbnail_url} alt={s.title} className="w-14 h-20 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-14 h-20 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <Film className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-display font-semibold text-foreground text-sm truncate">{s.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{s.description}</p>
              <p className="text-xs text-muted-foreground mt-1">{Math.floor(s.duration / 60)}:{String(s.duration % 60).padStart(2, "0")}</p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => startEdit(s)} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(s.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
