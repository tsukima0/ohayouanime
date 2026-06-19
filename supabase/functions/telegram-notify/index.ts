import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
};


const SITE_URL = "https://ohayouanime.lovable.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Auth: only accept calls bearing the internal shared secret stored in
    // public.internal_settings (readable only by service_role). The DB trigger
    // and the admin-only RPC both call this endpoint with that header. Public
    // JWTs (anon or user) are NOT accepted.
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const providedSecret = req.headers.get("x-internal-secret") ?? "";
    let authorized = false;
    if (providedSecret) {
      const { data: row } = await adminClient
        .from("internal_settings")
        .select("value")
        .eq("key", "telegram_notify_secret")
        .maybeSingle();
      const expected = (row?.value as string | undefined) ?? "";
      if (expected && providedSecret.length === expected.length) {
        let diff = 0;
        for (let i = 0; i < expected.length; i++) {
          diff |= providedSecret.charCodeAt(i) ^ expected.charCodeAt(i);
        }
        authorized = diff === 0;
      }
    }

    if (!authorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }




    const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const CHAT_ID = Deno.env.get("TELEGRAM_CHANNEL_ID");
    if (!BOT_TOKEN || !CHAT_ID) {
      return new Response(JSON.stringify({ error: "Missing Telegram secrets" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    // Support direct call ({episode_id}), DB trigger via pg_net, and Supabase DB webhook ({type, record}).
    const episodeId: string | undefined =
      body.episode_id ?? body?.record?.id ?? body?.new?.id;
    if (!episodeId) {
      return new Response(JSON.stringify({ error: "episode_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = adminClient;


    const { data: ep, error: epErr } = await supabase
      .from("episodes")
      .select("id, series_id, season, episode_number, title, description, thumbnail_url")
      .eq("id", episodeId)
      .maybeSingle();
    if (epErr || !ep) throw new Error(epErr?.message || "Episode not found");

    const { data: series, error: sErr } = await supabase
      .from("series")
      .select("title, image_url, genres, status, audio_language")
      .eq("id", ep.series_id)
      .maybeSingle();
    if (sErr || !series) throw new Error(sErr?.message || "Series not found");

    // Range of uploaded episodes in this season
    const { data: epRange } = await supabase
      .from("episodes")
      .select("episode_number")
      .eq("series_id", ep.series_id)
      .eq("season", ep.season)
      .order("episode_number", { ascending: true });
    const nums = (epRange ?? []).map((e: any) => e.episode_number);
    const minEp = nums.length ? Math.min(...nums) : ep.episode_number;
    const maxEp = nums.length ? Math.max(...nums) : ep.episode_number;
    const statusText = series.status === "completed" ? "Completed" : "Ongoing";

    // Per-episode subtitle languages
    const { data: subs } = await supabase
      .from("subtitles")
      .select("language, label")
      .eq("episode_id", ep.id);
    const subLangs = Array.from(
      new Set((subs ?? []).map((s: any) => (s.label || s.language || "").trim()).filter(Boolean))
    );
    const subtitlesText = subLangs.length ? subLangs.join(", ") : "Burmese";

    const esc = (s: string) =>
      String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const epTitlePart = ep.title?.trim() ? `: ${esc(ep.title.trim())}` : "";
    const title = `<b>${esc(series.title)} - Season ${ep.season} Episode ${ep.episode_number}${epTitlePart}</b>`;

    // Episode-only description (never fall back to series description)
    const rawEpDesc = (ep.description ?? "").trim().replace(/\s+/g, " ");
    const epDesc = rawEpDesc
      ? (rawEpDesc.length > 200 ? rawEpDesc.slice(0, 200).trimEnd() + "..." : rawEpDesc)
      : "";

    const caption =
      `${title}\n\n` +
      (epDesc ? `${esc(epDesc)}\n\n` : "") +
      `🎭 <b>Genre:</b> ${esc((series.genres ?? []).join(", ") || "—")}\n` +
      `🔊 <b>Audio:</b> ${esc(series.audio_language || "Japanese")}\n` +
      `📡 <b>Status:</b> Episode ${minEp} to ${maxEp} (${statusText})\n` +
      `📝 <b>Subtitles:</b> ${esc(subtitlesText)}\n\n` +
      `— @OhayouAM | Powered by Tsukima`;

    const photo = ep.thumbnail_url || series.image_url;
    const reply_markup = {
      inline_keyboard: [[
        { text: "📺 Watch Now", url: `${SITE_URL}/watch/${ep.id}` },
        { text: "📖 Review", url: `${SITE_URL}/series/${ep.series_id}` },
      ]],
    };

    const endpoint = photo
      ? `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`
      : `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const payload: Record<string, unknown> = photo
      ? { chat_id: CHAT_ID, photo, caption, parse_mode: "HTML", reply_markup }
      : { chat_id: CHAT_ID, text: caption, parse_mode: "HTML", reply_markup };

    const tgRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const tgJson = await tgRes.json();
    if (!tgRes.ok || !tgJson.ok) {
      console.error("Telegram error:", tgJson);
      return new Response(JSON.stringify({ error: "Telegram error", details: tgJson }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, message_id: tgJson.result?.message_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message ?? String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
