import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile, deleteR2Files } from "@/lib/storage";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2, Loader2, Star, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DragDropZone from "./DragDropZone";

interface FeaturedItem {
  id: string;
  series_id: string;
  sort_order: number;
  banner_image_url: string | null;
  tagline: string | null;
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
  const [uploadingBannerId, setUploadingBannerId] = useState<string | null>(null);
  const [editingTaglineId, setEditingTaglineId] = useState<string | null>(null);
  const [taglineValue, setTaglineValue] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [{ data: featData }, { data: seriesData }] = await Promise.all([
      supabase
        .from("featured_series")
        .select("id, series_id, sort_order, banner_image_url, tagline")
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
    const item = featured.find((f) => f.id === id);
    const { error } = await supabase.from("featured_series").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      if (item?.banner_image_url) deleteR2Files([item.banner_image_url]);
      toast({ title: "Removed from featured" });
      fetchData();
    }
  };

  const handleBannerUpload = async (itemId: string, file: File | null) => {
    if (!file) return;
    setUploadingBannerId(itemId);
    try {
      const oldItem = featured.find((f) => f.id === itemId);
      const url = await uploadFile("thumbnails", file, `banners/${crypto.randomUUID()}.${file.name.split(".").pop()}`);
      const { error } = await supabase.from("featured_series").update({ banner_image_url: url }).eq("id", itemId);
      if (error) throw error;
      if (oldItem?.banner_image_url) deleteR2Files([oldItem.banner_image_url]);
      toast({ title: "Banner image updated" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploadingBannerId(null);
    }
  };

  const handleRemoveBanner = async (itemId: string) => {
    const item = featured.find((f) => f.id === itemId);
    const { error } = await supabase.from("featured_series").update({ banner_image_url: null }).eq("id", itemId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      if (item?.banner_image_url) deleteR2Files([item.banner_image_url]);
      toast({ title: "Banner image removed" });
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

      {/* Featured list with reorder & banner image */}
      <div className="space-y-3">
        {featured.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No featured series. Add one above to show it in the hero banner!</p>
        )}
        {featured.map((item, index) => (
          <div key={item.id} className="p-4 rounded-xl glass-card border border-border space-y-3">
            <div className="flex items-center gap-3">
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

              {/* Series thumbnail */}
              {item.series_image ? (
                <img src={item.series_image} alt={item.series_title} className="w-12 h-16 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-16 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <Star className="w-5 h-5 text-muted-foreground" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-display font-semibold text-foreground text-sm truncate">{item.series_title}</h4>
                <p className="text-xs text-muted-foreground">Position #{index + 1}</p>
                {item.banner_image_url ? (
                  <p className="text-xs text-primary mt-0.5">✓ Custom banner set</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">Using series cover image</p>
                )}
              </div>

              {/* Remove */}
              <button
                onClick={() => handleRemove(item.id)}
                className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Tagline */}
            <div className="pl-9 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground block">Tagline / Subtitle</label>
              {editingTaglineId === item.id ? (
                <div className="flex gap-2 max-w-md">
                  <input
                    value={taglineValue}
                    onChange={(e) => setTaglineValue(e.target.value)}
                    placeholder="e.g. New episodes every Friday!"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    maxLength={120}
                  />
                  <button
                    onClick={async () => {
                      const val = taglineValue.trim() || null;
                      await supabase.from("featured_series").update({ tagline: val }).eq("id", item.id);
                      setEditingTaglineId(null);
                      fetchData();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
                  >Save</button>
                  <button
                    onClick={() => setEditingTaglineId(null)}
                    className="px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs"
                  >Cancel</button>
                </div>
              ) : (
                <button
                  onClick={() => { setEditingTaglineId(item.id); setTaglineValue(item.tagline || ""); }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.tagline || <span className="italic text-xs">Click to add tagline…</span>}
                </button>
              )}
            </div>

            {/* Banner image section */}
            <div className="pl-9">
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Custom Banner Image (recommended: 1920×1080)
              </label>
              {item.banner_image_url ? (
                <div className="relative group">
                  <img
                    src={item.banner_image_url}
                    alt="Banner"
                    className="w-full max-w-md h-28 rounded-lg object-cover border border-border"
                  />
                  <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <label className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm cursor-pointer hover:bg-background text-muted-foreground hover:text-foreground transition-colors">
                      <ImageIcon className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleBannerUpload(item.id, f);
                        }}
                      />
                    </label>
                    <button
                      onClick={() => handleRemoveBanner(item.id)}
                      className="p-1.5 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {uploadingBannerId === item.id && (
                    <div className="absolute inset-0 rounded-lg bg-background/60 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="max-w-md">
                  {uploadingBannerId === item.id ? (
                    <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-border bg-secondary/50">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  ) : (
                    <DragDropZone
                      accept="image/*"
                      label="Drop banner image (16:9)"
                      icon="image"
                      file={null}
                      onFile={(f) => { if (f) handleBannerUpload(item.id, f); }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
