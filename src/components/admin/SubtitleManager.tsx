import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile, deleteR2File } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2, Loader2, Subtitles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Series { id: string; title: string; }
interface Episode { id: string; series_id: string; title: string; season: number; episode_number: number; }
interface Subtitle { id: string; episode_id: string; language: string; label: string; file_url: string; }

export default function SubtitleManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [selectedSeries, setSelectedSeries] = useState("");
  const [selectedEpisode, setSelectedEpisode] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [label, setLabel] = useState("English");
  const [language, setLanguage] = useState("en");
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("series" as any).select("id, title").order("title");
      if (data) setSeriesList(data as any);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedSeries) { setEpisodes([]); setSelectedEpisode(""); return; }
    (async () => {
      const { data } = await supabase.from("episodes" as any).select("id, series_id, title, season, episode_number").eq("series_id", selectedSeries).order("season").order("episode_number");
      if (data) setEpisodes(data as any);
      setSelectedEpisode("");
    })();
  }, [selectedSeries]);

  useEffect(() => {
    if (!selectedEpisode) { setSubtitles([]); return; }
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("subtitles" as any).select("*").eq("episode_id", selectedEpisode).order("label");
      if (data) setSubtitles(data as any);
      setLoading(false);
    })();
  }, [selectedEpisode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedEpisode || !subtitleFile) return;
    setSubmitting(true);
    try {
      const ext = subtitleFile.name.split(".").pop() || "vtt";
      const fileUrl = await uploadFile("subtitles", subtitleFile, `subtitles/${selectedEpisode}/${crypto.randomUUID()}.${ext}`);
      const { error } = await supabase.from("subtitles" as any).insert({ episode_id: selectedEpisode, language, label, file_url: fileUrl, created_by: user.id });
      if (error) throw error;
      toast({ title: "Subtitle added" });
      setShowForm(false);
      setSubtitleFile(null);
      // Refresh
      const { data } = await supabase.from("subtitles" as any).select("*").eq("episode_id", selectedEpisode).order("label");
      if (data) setSubtitles(data as any);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subtitle?")) return;
    const sub = subtitles.find((s) => s.id === id);
    const { error } = await supabase.from("subtitles" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      if (sub) deleteR2File(sub.file_url);
      toast({ title: "Subtitle deleted" });
      setSubtitles((prev) => prev.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Series</label>
          <select value={selectedSeries} onChange={(e) => setSelectedSeries(e.target.value)}
            className="px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[200px]">
            <option value="">Choose a series...</option>
            {seriesList.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Episode</label>
          <select value={selectedEpisode} onChange={(e) => setSelectedEpisode(e.target.value)} disabled={!selectedSeries}
            className="px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[200px] disabled:opacity-50">
            <option value="">Choose an episode...</option>
            {episodes.map((ep) => <option key={ep.id} value={ep.id}>S{ep.season}E{ep.episode_number} · {ep.title}</option>)}
          </select>
        </div>
        {selectedEpisode && (
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold glow-primary-sm hover:bg-primary/90 transition-all mt-5">
            <Plus className="w-4 h-4" /> Add Subtitle
          </button>
        )}
      </div>

      {!selectedEpisode && (
        <p className="text-sm text-muted-foreground text-center py-8">Select a series and episode to manage subtitles.</p>
      )}

      {showForm && selectedEpisode && (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl glass-card border border-border space-y-4">
          <h3 className="font-display font-semibold text-foreground">Add Subtitle Track</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Label *</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} required placeholder="e.g. English"
                className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Language Code *</label>
              <input value={language} onChange={(e) => setLanguage(e.target.value)} required placeholder="e.g. en"
                className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">VTT File *</label>
              <input type="file" accept=".vtt,.srt,.ass,.ssa" onChange={(e) => setSubtitleFile(e.target.files?.[0] || null)} required
                className="text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting}
              className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold glow-primary-sm hover:bg-primary/90 disabled:opacity-50 transition-all">
              {submitting ? "Uploading..." : "Upload"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-6 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-all">
              Cancel
            </button>
          </div>
        </form>
      )}

      {selectedEpisode && !loading && (
        <div className="space-y-3">
          {subtitles.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No subtitles uploaded for this episode.</p>
          )}
          {subtitles.map((sub) => (
            <div key={sub.id} className="flex items-center gap-4 p-3 rounded-xl glass-card border border-border">
              <Subtitles className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-display font-semibold text-foreground text-sm">{sub.label}</h4>
                <p className="text-xs text-muted-foreground">{sub.language}</p>
              </div>
              <button onClick={() => handleDelete(sub.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedEpisode && loading && (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      )}
    </div>
  );
}
