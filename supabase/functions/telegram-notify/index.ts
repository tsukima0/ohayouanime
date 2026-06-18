import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://ohayouanime.lovable.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Auth: require a valid Bearer token. Accept either the project's anon key
    // (used by the DB trigger via pg_net) or a valid signed-in user JWT.
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.slice("Bearer ".length).trim();
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    let authorized = token === ANON_KEY;
    if (!authorized) {
      const authClient = createClient(Deno.env.get("SUPABASE_URL")!, ANON_KEY);
      const { data, error } = await authClient.auth.getUser(token);
      authorized = !error && !!data?.user;
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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: ep, error: epErr } = await supabase
      .from("episodes")
      .select("id, series_id, season, episode_number, title, description, thumbnail_url")
      .eq("id", episodeId)
      .maybeSingle();
    if (epErr || !ep) throw new Error(epErr?.message || "Episode not found");

    const { data: series, error: sErr } = await supabase
      .from("series")
      .select("title, description, image_url, genres, status, audio_language, subtitle_language")
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

    const esc = (s: string) =>
      String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const title = `<b>${esc(series.title)} - Season ${ep.season} Episode ${ep.episode_number}</b>`;
    const rawDesc = (ep.description?.trim() || series.description?.trim() || "").replace(/\s+/g, " ");
    const descText = rawDesc
      ? (rawDesc.length > 200 ? rawDesc.slice(0, 200).trimEnd() + "..." : rawDesc)
      : "none";
    const caption =
      `${title}\n\n` +
      `${esc(descText)}\n\n` +
      `🎭 <b>Genre:</b> ${esc((series.genres ?? []).join(", ") || "—")}\n` +
      `🔊 <b>Audio:</b> ${esc(series.audio_language || "Japanese")}\n` +
      `📡 <b>Status:</b> Episode ${minEp} to ${maxEp} (${statusText})\n` +
      `📝 <b>Subtitles:</b> ${esc(series.subtitle_language || "Burmese")}\n\n` +
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
