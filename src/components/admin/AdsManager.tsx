import { useState, useRef } from "react";
import { useAdminAds, useCreateAd, useUpdateAd, useDeleteAd, type Ad } from "@/hooks/useAds";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, ExternalLink, ImageIcon, Upload, Video, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadFile } from "@/lib/storage";

export default function AdsManager() {
  const { data: ads = [], isLoading } = useAdminAds();
  const createAd = useCreateAd();
  const updateAd = useUpdateAd();
  const deleteAd = useDeleteAd();

  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [placement, setPlacement] = useState<string>("banner");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!imageFile) {
      toast.error("Please select an image");
      return;
    }

    try {
      setUploading(true);

      // Upload image to thumbnails bucket
      const imageUrl = await uploadFile("thumbnails", imageFile, `ads/${crypto.randomUUID()}.${imageFile.name.split(".").pop()}`);

      // Upload video if provided (for shorts ads)
      let videoUrl: string | undefined;
      if (videoFile && placement === "shorts") {
        videoUrl = await uploadFile("videos", videoFile, `ads/${crypto.randomUUID()}.${videoFile.name.split(".").pop()}`);
      }

      await createAd.mutateAsync({
        title: title.trim(),
        image_url: imageUrl,
        link_url: linkUrl.trim() || undefined,
        placement,
        video_url: videoUrl,
      });

      setTitle("");
      setLinkUrl("");
      setImageFile(null);
      setVideoFile(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
      toast.success("Ad created");
    } catch {
      toast.error("Failed to create ad");
    } finally {
      setUploading(false);
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

        {/* Image upload */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Ad Image *</label>
          <div
            className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => imageInputRef.current?.click()}
          >
            {imageFile ? (
              <div className="flex items-center gap-2 justify-center">
                <ImageIcon className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground truncate max-w-[200px]">{imageFile.name}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Click to upload image</span>
              </div>
            )}
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
        </div>

        {/* Video upload for shorts */}
        {placement === "shorts" && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">9:16 Video (optional, for Shorts Feed)</label>
            <div
              className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => videoInputRef.current?.click()}
            >
              {videoFile ? (
                <div className="flex items-center gap-2 justify-center">
                  <Video className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground truncate max-w-[200px]">{videoFile.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Video className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Click to upload 9:16 video</span>
                </div>
              )}
            </div>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
            />
          </div>
        )}

        <Input placeholder="Link URL (optional)" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
        <Select value={placement} onValueChange={(v) => { setPlacement(v); if (v !== "shorts") setVideoFile(null); }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="banner">Banner (Homepage / Watch)</SelectItem>
            <SelectItem value="shorts">Shorts Feed</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleCreate} disabled={uploading || createAd.isPending} className="w-full">
          {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
          {uploading ? "Uploading..." : "Create Ad"}
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
                  {ad.video_url && <Video className="w-3 h-3 text-muted-foreground" />}
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
