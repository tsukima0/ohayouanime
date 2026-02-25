import { useState } from "react";
import { useAdminAds, useCreateAd, useUpdateAd, useDeleteAd, type Ad } from "@/hooks/useAds";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, ExternalLink, ImageIcon } from "lucide-react";
import { toast } from "sonner";

export default function AdsManager() {
  const { data: ads = [], isLoading } = useAdminAds();
  const createAd = useCreateAd();
  const updateAd = useUpdateAd();
  const deleteAd = useDeleteAd();

  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [placement, setPlacement] = useState<string>("banner");

  const handleCreate = async () => {
    if (!title.trim() || !imageUrl.trim()) {
      toast.error("Title and image URL are required");
      return;
    }
    try {
      await createAd.mutateAsync({ title: title.trim(), image_url: imageUrl.trim(), link_url: linkUrl.trim() || undefined, placement });
      setTitle("");
      setImageUrl("");
      setLinkUrl("");
      toast.success("Ad created");
    } catch {
      toast.error("Failed to create ad");
    }
  };

  const handleToggleActive = async (ad: Ad) => {
    try {
      await updateAd.mutateAsync({ id: ad.id, is_active: !ad.is_active });
      toast.success(ad.is_active ? "Ad deactivated" : "Ad activated");
    } catch {
      toast.error("Failed to update ad");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAd.mutateAsync(id);
      toast.success("Ad deleted");
    } catch {
      toast.error("Failed to delete ad");
    }
  };

  return (
    <div className="space-y-6">
      {/* Create new ad */}
      <div className="p-4 rounded-xl border border-border bg-card space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Add New Ad</h3>
        <Input placeholder="Ad title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        <Input placeholder="Link URL (optional)" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
        <Select value={placement} onValueChange={setPlacement}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="banner">Banner (Homepage / Watch)</SelectItem>
            <SelectItem value="shorts">Shorts Feed</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleCreate} disabled={createAd.isPending} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          {createAd.isPending ? "Creating..." : "Create Ad"}
        </Button>
      </div>

      {/* Ads list */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading ads...</p>
      ) : ads.length === 0 ? (
        <p className="text-sm text-muted-foreground">No ads yet.</p>
      ) : (
        <div className="space-y-3">
          {ads.map((ad) => (
            <div key={ad.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
              {ad.image_url ? (
                <img src={ad.image_url} alt={ad.title} className="w-20 h-14 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-20 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{ad.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                    ad.placement === "banner" ? "bg-primary/20 text-primary" : "bg-accent text-accent-foreground"
                  }`}>
                    {ad.placement}
                  </span>
                  {ad.link_url && <ExternalLink className="w-3 h-3 text-muted-foreground" />}
                </div>
              </div>
              <Switch checked={ad.is_active} onCheckedChange={() => handleToggleActive(ad)} />
              <Button variant="ghost" size="icon" onClick={() => handleDelete(ad.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
