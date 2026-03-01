import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2, GripVertical, Loader2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FeaturedItem {
  id: string;
  series_id: string;
  sort_order: number;
  series_title?: string;
  series_image?: string | null;
}

interface SeriesOption {
  id: string;
  title: string;
  image_url: string | null;
}

export default function FeaturedManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [featured, setFeatured] = useState<FeaturedItem[]>([]);
  const [allSeries, setAllSeries] = useState<SeriesOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeriesId, setSelectedSeriesId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: featData }, { data: seriesData }] = await Promise.all([
      supabase
        .from("featured_series")
        .select("id, series_id, sort_order")
        .order("sort_order", { ascending: true }),
      supabase
        .from("series" as any)
        .select("id, title, image_url")
        .order("title"),
    ]);

    const seriesList = (seriesData as any as SeriesOption[]) ?? [];
    const seriesMap = new Map(seriesList.map((s) => [s.id, s]));

    setAllSeries(seriesList);
    setFeatured(
      ((featData as any[]) ?? []).map((f) => ({
        ...f,
        series_title: seriesMap.get(f.series_id)?.title ?? "Unknown",
        series_image: seriesMap.get(f.series_id)?.image_url ?? null,
      }))
    );
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const availableSeries = allSeries.filter(
    (s) => !featured.some((f) => f.series_id === s.id)
  );

  const handleAdd = async () => {
    if (!selectedSeriesId || !user) return;
    setSubmitting(true);
    const nextOrder = featured.length > 0 ? Math.max(...featured.map((f) => f.sort_order)) + 1 : 0;

    const { error } = await supabase.from("featured_series").insert({
      series_id: selectedSeriesId,
      sort_order: nextOrder,
      created_by: user.id,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Series added to featured" });
      setSelectedSeriesId("");
      fetchData();
    }
    setSubmitting(false);
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove from featured?")) return;
    const { error } = await supabase.from("featured_series").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Removed from featured" });
      fetchData();
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const items = [...featured];
    const prevOrder = items[index - 1].sort_order;
    const currOrder = items[index].sort_order;

    await Promise.all([
      supabase.from("featured_series").update({ sort_order: currOrder }).eq("id", items[index - 1].id),
      supabase.from("featured_series").update({ sort_order: prevOrder }).eq("id", items[index].id),
    ]);
    fetchData();
  };

  const handleMoveDown = async (index: number) => {
    if (index >= featured.length - 1) return;
    const items = [...featured];
    const nextOrder = items[index + 1].sort_order;
    const currOrder = items[index].sort_order;

    await Promise.all([
      supabase.from("featured_series").update({ sort_order: currOrder }).eq("id", items[index + 1].id),
      supabase.from("featured_series").update({ sort_order: nextOrder }).eq("id", items[index].id),
    ]);
    fetchData();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-foreground">Featured ({featured.length})</h2>
      </div>

      {/* Add featured series */}
      <div className="p-4 rounded-2xl glass-card border border-border space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Add Series to Featured</h3>
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <select
              value={selectedSeriesId}
              onChange={(e) => setSelectedSeriesId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Select a series...</option>
              {availableSeries.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAdd}
            disabled={!selectedSeriesId || submitting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold glow-primary-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
        {availableSeries.length === 0 && featured.length > 0 && (
          <p className="text-xs text-muted-foreground">All series are already featured.</p>
        )}
      </div>

      {/* Featured list with reorder */}
      <div className="space-y-2">
        {featured.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No featured series. Add one above to show it in the hero banner!</p>
        )}
        {featured.map((item, index) => (
          <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl glass-card border border-border">
            {/* Reorder buttons */}
            <div className="flex flex-col gap-0.5 flex-shrink-0">
              <button
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors text-xs"
              >
                ▲
              </button>
              <button
                onClick={() => handleMoveDown(index)}
                disabled={index === featured.length - 1}
                className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors text-xs"
              >
                ▼
              </button>
            </div>

            {/* Thumbnail */}
            {item.series_image ? (
              <img src={item.series_image} alt={item.series_title} className="w-14 h-20 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-14 h-20 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 text-muted-foreground" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-display font-semibold text-foreground text-sm truncate">{item.series_title}</h4>
              <p className="text-xs text-muted-foreground">Position #{index + 1}</p>
            </div>

            {/* Remove */}
            <button
              onClick={() => handleRemove(item.id)}
              className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
