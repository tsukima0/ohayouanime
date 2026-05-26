import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile, uploadVideoToR2, deleteR2Files, type UploadProgressInfo } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2, Edit2, Loader2, Film } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import UploadProgressDisplay from "./UploadProgressDisplay";
import DragDropZone from "./DragDropZone";

interface Series {
  id: string;
  title: string;
}

interface Episode {
  id: string;
  series_id: string;
  title: string;
  description: string;
  season: number;
  episode_number: number;
  duration: number;
  video_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

export default function EpisodeManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [season, setSeason] = useState("1");
  const [episodeNumber, setEpisodeNumber] = useState("1");
  const [duration, setDuration] = useState("0");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadDetail, setUploadDetail] = useState<UploadProgressInfo | null>(null);
  // Subtitle form state (optional)
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [subtitleLabel, setSubtitleLabel] = useState("English");
  const [subtitleLanguage, setSubtitleLanguage] = useState("en");

  useEffect(() => {
    const loadSeries = async () => {
      const { data } = await supabase.from("series" as any).select("id, title").order("title");
      if (data) setSeriesList(data as any as Series[]);
      setLoading(false);
    };
    loadSeries();
  }, []);

  useEffect(() => {
    if (!selectedSeries) { setEpisodes([]); return; }
    const loadEpisodes = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("episodes" as any)
        .select("*")
        .eq("series_id", selectedSeries)
        .order("season")
        .order("episode_number");
      if (data) setEpisodes(data as any as Episode[]);
      setLoading(false);
    };
    loadEpisodes();
  }, [selectedSeries]);

  const resetForm = () => {
    setTitle(""); setDescription(""); setSeason("1"); setEpisodeNumber("1"); setDuration("0");
    setVideoFile(null); setThumbnailFile(null); setThumbnailPreview(null); setEditingId(null);
    setShowForm(false); setUploadProgress(""); setUploadPercent(0); setUploadDetail(null);
  };

  const startEdit = (ep: Episode) => {
    setTitle(ep.title);
    setDescription(ep.description || "");
    setSeason(String(ep.season));
    setEpisodeNumber(String(ep.episode_number));
    setDuration(String(ep.duration));
    setThumbnailPreview(ep.thumbnail_url);
    setEditingId(ep.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedSeries) return;
    setSubmitting(true);

    try {
      let videoUrl: string | null = null;
      let thumbUrl = thumbnailPreview;
      const oldEp = editingId ? episodes.find(e => e.id === editingId) : null;

      if (videoFile) {
        setUploadProgress("Uploading video...");
        setUploadPercent(0);
        videoUrl = await uploadVideoToR2(videoFile, "episodes", (p) => setUploadPercent(p), (d) => setUploadDetail(d));
      }
      if (thumbnailFile) {
        setUploadProgress("Uploading thumbnail...");
        thumbUrl = await uploadFile("thumbnails", thumbnailFile, `episodes/${crypto.randomUUID()}.${thumbnailFile.name.split(".").pop()}`);
      }

      const payload: any = {
        series_id: selectedSeries,
        title,
        description,
        season: parseInt(season),
        episode_number: parseInt(episodeNumber),
        duration: parseInt(duration),
        thumbnail_url: thumbUrl,
        created_by: user.id,
      };
      if (videoUrl) payload.video_url = videoUrl;

      if (editingId) {
        const { error } = await supabase.from("episodes" as any).update(payload).eq("id", editingId);
        if (error) throw error;
        // Delete old R2 files if replaced
        const oldUrls: (string | null)[] = [];
        if (videoFile && oldEp?.video_url) oldUrls.push(oldEp.video_url);
        if (thumbnailFile && oldEp?.thumbnail_url) oldUrls.push(oldEp.thumbnail_url);
        if (oldUrls.length) deleteR2Files(oldUrls);
        toast({ title: "Episode updated" });
      } else {
        payload.video_url = videoUrl;
        const { error } = await supabase.from("episodes" as any).insert(payload);
        if (error) throw error;
        toast({ title: "Episode created" });
      }

      resetForm();
      // Refresh episodes
      const { data } = await supabase.from("episodes" as any).select("*").eq("series_id", selectedSeries).order("season").order("episode_number");
      if (data) setEpisodes(data as any as Episode[]);
    } catch (err: any) {
      console.error("Episode submit error:", err);
      toast({ title: "Error", description: err.message || "Unknown error", variant: "destructive" });
    } finally {
      setSubmitting(false);
      setUploadProgress("");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this episode?")) return;
    const ep = episodes.find((e) => e.id === id);
    const { error } = await supabase.from("episodes" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      if (ep) deleteR2Files([ep.video_url, ep.thumbnail_url]);
      toast({ title: "Episode deleted" });
      setEpisodes((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Series selector */}
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Select Series</label>
          <select value={selectedSeries} onChange={(e) => setSelectedSeries(e.target.value)}
            className="px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[200px]">
            <option value="">Choose a series...</option>
            {seriesList.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>

        {selectedSeries && (
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold glow-primary-sm hover:bg-primary/90 transition-all mt-5"
          >
            <Plus className="w-4 h-4" />
            Add Episode
          </button>
        )}
      </div>

      {!selectedSeries && (
        <p className="text-sm text-muted-foreground text-center py-8">Select a series to manage its episodes.</p>
      )}

      {showForm && selectedSeries && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl glass-card border border-border space-y-4">
          <h3 className="font-display font-semibold text-foreground">
            {editingId ? "Edit Episode" : "New Episode"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required
                className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Season</label>
                <input type="number" min="1" value={season} onChange={(e) => setSeason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Episode #</label>
                <input type="number" min="1" value={episodeNumber} onChange={(e) => setEpisodeNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Duration (s)</label>
                <input type="number" min="0" value={duration} onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DragDropZone
              accept="video/*"
              label="Drop video file"
              icon="video"
              file={videoFile}
              onFile={setVideoFile}
            />
            <DragDropZone
              accept="image/*"
              label="Drop thumbnail"
              icon="image"
              file={thumbnailFile}
              preview={thumbnailPreview}
              onFile={setThumbnailFile}
              onPreview={setThumbnailPreview}
            />
          </div>

          {uploadProgress && (
            <UploadProgressDisplay label={uploadProgress} percent={uploadPercent} detail={uploadDetail} />
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

      {/* Episodes list */}
      {selectedSeries && !loading && (
        <div className="space-y-3">
          {episodes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No episodes yet for this series.</p>
          )}
          {episodes.map((ep) => (
            <div key={ep.id} className="flex items-center gap-4 p-3 rounded-xl glass-card border border-border">
              {ep.thumbnail_url ? (
                <img src={ep.thumbnail_url} alt={ep.title} className="w-20 h-12 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-20 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <Film className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-display font-semibold text-foreground text-sm truncate">
                  S{ep.season}E{ep.episode_number} · {ep.title}
                </h4>
                <p className="text-xs text-muted-foreground">{formatDuration(ep.duration)}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => startEdit(ep)} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(ep.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedSeries && loading && (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      )}
    </div>
  );
}
