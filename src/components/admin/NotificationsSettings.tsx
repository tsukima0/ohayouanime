import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, CheckCircle2, Info } from "lucide-react";

interface Episode {
  id: string;
  title: string;
  season: number;
  episode_number: number;
  series_id: string;
}

export default function NotificationsSettings() {
  const { toast } = useToast();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("episodes" as any)
        .select("id, title, season, episode_number, series_id")
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setEpisodes(data as any as Episode[]);
    })();
  }, []);

  const sendTest = async () => {
    if (!selected) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("telegram-notify", {
        body: { episode_id: selected },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast({ title: "Sent to Telegram channel" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-2xl glass-card border border-border space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">Telegram Bot</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Bot Token and Channel Chat ID are stored securely as backend secrets.
          New episodes are automatically posted to your Telegram channel via a database trigger.
        </p>
        <div className="text-xs text-muted-foreground space-y-1">
          <div>✓ <span className="font-medium text-foreground">TELEGRAM_BOT_TOKEN</span> — configured</div>
          <div>✓ <span className="font-medium text-foreground">TELEGRAM_CHANNEL_ID</span> — configured</div>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-xl bg-secondary text-xs text-muted-foreground">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Set the Audio Language and Subtitle Language fields in the Series form. They are included
            in every Telegram post.
          </span>
        </div>
      </div>

      <div className="p-5 rounded-2xl glass-card border border-border space-y-4">
        <h3 className="font-display font-semibold text-foreground">Send Test Post</h3>
        <p className="text-xs text-muted-foreground">
          Pick a recent episode and post it to the channel to verify formatting.
        </p>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Choose an episode…</option>
          {episodes.map((ep) => (
            <option key={ep.id} value={ep.id}>
              S{ep.season}E{ep.episode_number} · {ep.title}
            </option>
          ))}
        </select>
        <button
          onClick={sendTest}
          disabled={!selected || sending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold glow-primary-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? "Sending…" : "Send Test Notification"}
        </button>
      </div>
    </div>
  );
}
