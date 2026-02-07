import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2, Edit2, Loader2, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Series {
  id: string;
  title: string;
  description: string;
  genres: string[];
  rating: number;
  image_url: string | null;
  status: string;
  episode_count: number;
  created_at: string;
}

const GENRE_OPTIONS = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy",
  "Horror", "Mecha", "Mystery", "Romance", "Sci-Fi",
  "Slice of Life", "Sports", "Supernatural", "Thriller",
];

export default function SeriesManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [rating, setRating] = useState("0");
  const [status, setStatus] = useState("ongoing");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const fetchSeries = async () => {
    const { data, error } = await supabase
      .from("series" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setSeriesList(data as any as Series[]);
    setLoading(false);
  };

  useEffect(() => { fetchSeries(); }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedGenres([]);
    setRating("0");
    setStatus("ongoing");
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (s: Series) => {
    setTitle(s.title);
    setDescription(s.description || "");
    setSelectedGenres(s.genres);
    setRating(String(s.rating));
    setStatus(s.status);
    setThumbnailPreview(s.image_url);
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    try {
      let imageUrl = thumbnailPreview;
      if (thumbnailFile) {
        imageUrl = await uploadFile("thumbnails", thumbnailFile, `series/${crypto.randomUUID()}.${thumbnailFile.name.split(".").pop()}`);
      }

      const payload = {
        title,
        description,
        genres: selectedGenres,
        rating: parseFloat(rating),
        status,
        image_url: imageUrl,
        created_by: user.id,
      };

      if (editingId) {
        const { error } = await supabase
          .from("series" as any)
          .update(payload as any)
          .eq("id", editingId);
        if (error) throw error;
        toast({ title: "Series updated" });
      } else {
        const { error } = await supabase
          .from("series" as any)
          .insert(payload as any);
        if (error) throw error;
        toast({ title: "Series created" });
      }

      resetForm();
      fetchSeries();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this series and all its episodes?")) return;
    const { error } = await supabase.from("series" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Series deleted" });
      fetchSeries();
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">Series ({seriesList.length})</h2>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold glow-primary-sm hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Series
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl glass-card border border-border space-y-4">
          <h3 className="font-display font-semibold text-foreground">
            {editingId ? "Edit Series" : "New Series"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required
                className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Rating (0–10)</label>
            <input type="number" min="0" max="10" step="0.1" value={rating} onChange={(e) => setRating(e.target.value)}
              className="w-32 px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Genres</label>
            <div className="flex flex-wrap gap-2">
              {GENRE_OPTIONS.map((g) => (
                <button key={g} type="button" onClick={() => toggleGenre(g)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedGenres.includes(g)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Thumbnail Image</label>
            <div className="flex items-center gap-4">
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Preview" className="w-24 h-16 rounded-lg object-cover" />
              ) : (
                <div className="w-24 h-16 rounded-lg bg-secondary flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setThumbnailFile(f);
                    setThumbnailPreview(URL.createObjectURL(f));
                  }
                }}
                className="text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting}
              className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold glow-primary-sm hover:bg-primary/90 disabled:opacity-50 transition-all">
              {submitting ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
            <button type="button" onClick={resetForm}
              className="px-6 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Series list */}
      <div className="space-y-3">
        {seriesList.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No series yet. Add your first one!</p>
        )}
        {seriesList.map((s) => (
          <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl glass-card border border-border">
            {s.image_url ? (
              <img src={s.image_url} alt={s.title} className="w-20 h-14 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-20 h-14 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-display font-semibold text-foreground text-sm truncate">{s.title}</h4>
              <p className="text-xs text-muted-foreground">{s.genres.join(", ")} · {s.episode_count} eps · ⭐ {s.rating}</p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              s.status === "ongoing" ? "bg-primary/10 text-primary" :
              s.status === "completed" ? "bg-green-500/10 text-green-500" :
              "bg-yellow-500/10 text-yellow-500"
            }`}>{s.status}</span>
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
