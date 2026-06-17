import "dotenv/config";
import { Telegraf, Markup, session } from "telegraf";
import { randomUUID } from "node:crypto";
import { streamToR2 } from "./r2.js";
import { supabase } from "./supabase.js";
import { getTelegramFileStream } from "./telegramFile.js";

const {
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_ADMIN_CHAT_ID,
  SUPABASE_ADMIN_USER_ID,
} = process.env;

if (!TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is required");
if (!TELEGRAM_ADMIN_CHAT_ID) throw new Error("TELEGRAM_ADMIN_CHAT_ID is required");

const ADMIN_ID = String(TELEGRAM_ADMIN_CHAT_ID);

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama",
  "Fantasy", "Horror", "Mecha", "Mystery",
  "Romance", "Sci-Fi", "Slice of Life", "Sports",
  "Supernatural", "Thriller",
];

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);
bot.use(session({ defaultSession: () => ({}) }));

// ── Security gate ──────────────────────────────────────────
bot.use(async (ctx, next) => {
  const uid = String(ctx.from?.id ?? "");
  if (uid !== ADMIN_ID) {
    if (ctx.message || ctx.callbackQuery) {
      await ctx.reply("⛔ Unauthorized.");
    }
    return;
  }
  return next();
});

// ── Helpers ────────────────────────────────────────────────
const setStep = (ctx, step, patch = {}) => {
  ctx.session.flow = { ...(ctx.session.flow || {}), step, ...patch };
};
const clearFlow = (ctx) => { ctx.session.flow = null; };

const skipBtn = (cbData) => Markup.inlineKeyboard([Markup.button.callback("⏭ Skip", cbData)]);

function genreKeyboard(selected = []) {
  const rows = [];
  for (let i = 0; i < GENRES.length; i += 2) {
    rows.push(GENRES.slice(i, i + 2).map((g) => {
      const on = selected.includes(g);
      return Markup.button.callback(`${on ? "✅ " : ""}${g}`, `genre:${g}`);
    }));
  }
  rows.push([Markup.button.callback("✔️ Done", "genre:__done__")]);
  return Markup.inlineKeyboard(rows);
}

// ── Entry ──────────────────────────────────────────────────
bot.start((ctx) => ctx.reply("👋 Ohayou Anime uploader. Send /upload to begin."));

bot.command("upload", (ctx) => {
  clearFlow(ctx);
  return ctx.reply(
    "What would you like to add?",
    Markup.inlineKeyboard([
      [Markup.button.callback("🎬 Add New Series", "menu:series")],
      [Markup.button.callback("📺 Add New Episode", "menu:episode")],
    ]),
  );
});

bot.command("cancel", (ctx) => {
  clearFlow(ctx);
  return ctx.reply("❌ Cancelled.");
});

// ════════════════════════════════════════════════════════════
// PATH A — Add New Series
// ════════════════════════════════════════════════════════════
bot.action("menu:series", async (ctx) => {
  await ctx.answerCbQuery();
  setStep(ctx, "series:title", { type: "series", data: { genres: [] } });
  await ctx.reply("🎬 *New Series*\n\nSend the *Title*:", { parse_mode: "Markdown" });
});

bot.action(/^status:(ongoing|completed)$/, async (ctx) => {
  if (ctx.session.flow?.step !== "series:status") return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  ctx.session.flow.data.status = ctx.match[1];
  setStep(ctx, "series:description");
  await ctx.reply("Send a *Description* or skip:", { parse_mode: "Markdown", ...skipBtn("series:skipDesc") });
});

bot.action("series:skipDesc", async (ctx) => {
  if (ctx.session.flow?.step !== "series:description") return ctx.answerCbQuery();
  await ctx.answerCbQuery("Skipped");
  ctx.session.flow.data.description = null;
  setStep(ctx, "series:rating");
  await ctx.reply("Send *Rating* (0–10):", { parse_mode: "Markdown" });
});

bot.action("series:defaultAudio", async (ctx) => {
  if (ctx.session.flow?.step !== "series:audio") return ctx.answerCbQuery();
  await ctx.answerCbQuery("Japanese");
  ctx.session.flow.data.audio_language = "Japanese";
  setStep(ctx, "series:subtitle");
  await ctx.reply("Send *Subtitle Language* or use default:", {
    parse_mode: "Markdown",
    ...Markup.inlineKeyboard([Markup.button.callback("Burmese (default)", "series:defaultSub")]),
  });
});

bot.action("series:defaultSub", async (ctx) => {
  if (ctx.session.flow?.step !== "series:subtitle") return ctx.answerCbQuery();
  await ctx.answerCbQuery("Burmese");
  ctx.session.flow.data.subtitle_language = "Burmese";
  setStep(ctx, "series:genres");
  await ctx.reply("Pick *Genres* (tap to toggle, then Done):", {
    parse_mode: "Markdown", ...genreKeyboard(ctx.session.flow.data.genres),
  });
});

bot.action(/^genre:(.+)$/, async (ctx) => {
  if (ctx.session.flow?.step !== "series:genres") return ctx.answerCbQuery();
  const choice = ctx.match[1];
  const sel = ctx.session.flow.data.genres;

  if (choice === "__done__") {
    if (sel.length === 0) return ctx.answerCbQuery("Pick at least one genre");
    await ctx.answerCbQuery("Saved");
    setStep(ctx, "series:thumbnail");
    return ctx.reply("Send the *Thumbnail image* (as a photo or image file).", { parse_mode: "Markdown" });
  }

  const idx = sel.indexOf(choice);
  if (idx >= 0) sel.splice(idx, 1); else sel.push(choice);
  await ctx.answerCbQuery(choice);
  try {
    await ctx.editMessageReplyMarkup(genreKeyboard(sel).reply_markup);
  } catch { /* edit can fail if unchanged */ }
});

// ════════════════════════════════════════════════════════════
// PATH B — Add New Episode
// ════════════════════════════════════════════════════════════
bot.action("menu:episode", async (ctx) => {
  await ctx.answerCbQuery();
  const { data, error } = await supabase
    .from("series")
    .select("id, title")
    .order("title", { ascending: true })
    .limit(50);

  if (error) return ctx.reply(`❌ Failed to load series: ${error.message}`);
  if (!data?.length) return ctx.reply("No series yet. Add one first with /upload.");

  setStep(ctx, "episode:pickSeries", { type: "episode", data: {} });
  const buttons = data.map((s) => [Markup.button.callback(s.title, `pickSeries:${s.id}`)]);
  await ctx.reply("📺 Pick a series:", Markup.inlineKeyboard(buttons));
});

bot.action(/^pickSeries:(.+)$/, async (ctx) => {
  if (ctx.session.flow?.step !== "episode:pickSeries") return ctx.answerCbQuery();
  await ctx.answerCbQuery();
  ctx.session.flow.data.series_id = ctx.match[1];
  setStep(ctx, "episode:title");
  await ctx.reply("Send episode *Title*:", { parse_mode: "Markdown" });
});

bot.action("episode:skipDesc", async (ctx) => {
  if (ctx.session.flow?.step !== "episode:description") return ctx.answerCbQuery();
  await ctx.answerCbQuery("Skipped");
  ctx.session.flow.data.description = null;
  setStep(ctx, "episode:thumbnail");
  await ctx.reply("Send the *Thumbnail image*.", { parse_mode: "Markdown" });
});

bot.action("episode:skipSub", async (ctx) => {
  if (ctx.session.flow?.step !== "episode:subtitleFile") return ctx.answerCbQuery();
  await ctx.answerCbQuery("Skipped");
  await finalizeEpisode(ctx);
});

// ════════════════════════════════════════════════════════════
// TEXT ROUTER (wizard prompts)
// ════════════════════════════════════════════════════════════
bot.on("text", async (ctx) => {
  const flow = ctx.session.flow;
  if (!flow) return;
  const text = ctx.message.text.trim();
  if (text.startsWith("/")) return; // commands handled elsewhere

  // ── Series wizard ────────────────────────────────────────
  if (flow.type === "series") {
    switch (flow.step) {
      case "series:title":
        flow.data.title = text;
        setStep(ctx, "series:status");
        return ctx.reply("Pick *Status*:", {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([[
            Markup.button.callback("Ongoing", "status:ongoing"),
            Markup.button.callback("Completed", "status:completed"),
          ]]),
        });

      case "series:description":
        flow.data.description = text;
        setStep(ctx, "series:rating");
        return ctx.reply("Send *Rating* (0–10):", { parse_mode: "Markdown" });

      case "series:rating": {
        const n = Number(text);
        if (Number.isNaN(n) || n < 0 || n > 10) return ctx.reply("Please send a number 0–10.");
        flow.data.rating = n;
        setStep(ctx, "series:audio");
        return ctx.reply("Send *Audio Language* or use default:", {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([Markup.button.callback("Japanese (default)", "series:defaultAudio")]),
        });
      }

      case "series:audio":
        flow.data.audio_language = text;
        setStep(ctx, "series:subtitle");
        return ctx.reply("Send *Subtitle Language* or use default:", {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([Markup.button.callback("Burmese (default)", "series:defaultSub")]),
        });

      case "series:subtitle":
        flow.data.subtitle_language = text;
        setStep(ctx, "series:genres");
        return ctx.reply("Pick *Genres* (tap to toggle, then Done):", {
          parse_mode: "Markdown", ...genreKeyboard(flow.data.genres),
        });
    }
    return;
  }

  // ── Episode wizard ───────────────────────────────────────
  if (flow.type === "episode") {
    switch (flow.step) {
      case "episode:title":
        flow.data.title = text;
        setStep(ctx, "episode:season");
        return ctx.reply("Send *Season* number:", { parse_mode: "Markdown" });

      case "episode:season": {
        const n = parseInt(text, 10);
        if (!Number.isFinite(n) || n < 1) return ctx.reply("Send a positive integer.");
        flow.data.season = n;
        setStep(ctx, "episode:number");
        return ctx.reply("Send *Episode #*:", { parse_mode: "Markdown" });
      }

      case "episode:number": {
        const n = parseInt(text, 10);
        if (!Number.isFinite(n) || n < 1) return ctx.reply("Send a positive integer.");
        flow.data.episode_number = n;
        setStep(ctx, "episode:duration");
        return ctx.reply("Send *Duration* (seconds):", { parse_mode: "Markdown" });
      }

      case "episode:duration": {
        const n = parseInt(text, 10);
        if (!Number.isFinite(n) || n < 1) return ctx.reply("Send a positive integer (seconds).");
        flow.data.duration_seconds = n;
        setStep(ctx, "episode:description");
        return ctx.reply("Send *Description* or skip:", { parse_mode: "Markdown", ...skipBtn("episode:skipDesc") });
      }

      case "episode:description":
        flow.data.description = text;
        setStep(ctx, "episode:thumbnail");
        return ctx.reply("Send the *Thumbnail image*.", { parse_mode: "Markdown" });

      case "episode:subtitleLabel":
        flow.data._subLabel = text;
        setStep(ctx, "episode:subtitleLang");
        return ctx.reply("Send the *Language Code* (e.g. `en`, `my`):", { parse_mode: "Markdown" });

      case "episode:subtitleLang":
        flow.data._subLang = text;
        // Insert subtitle row, then finalize
        try {
          await supabase.from("subtitles").insert({
            episode_id: flow.data._episodeId,
            language: text,
            label: flow.data._subLabel,
            file_url: flow.data._subUrl,
            created_by: SUPABASE_ADMIN_USER_ID || null,
          });
          await ctx.reply("✅ Subtitle attached.");
        } catch (e) {
          await ctx.reply(`⚠️ Subtitle insert failed: ${e.message}`);
        }
        await finalizeEpisode(ctx, /*alreadyInserted*/ true);
        return;
    }
  }
});

// ════════════════════════════════════════════════════════════
// MEDIA ROUTER (photos, documents, videos)
// ════════════════════════════════════════════════════════════
async function uploadTelegramFileToR2(ctx, fileId, keyPrefix, contentType) {
  const { stream, size, suggestedName } = await getTelegramFileStream(ctx.telegram, fileId);
  const ext = (suggestedName.match(/\.[a-z0-9]+$/i)?.[0] || "").toLowerCase();
  const key = `${keyPrefix}/${randomUUID()}${ext}`;
  await ctx.reply(`⬆️ Uploading to R2${size ? ` (${(size / 1024 / 1024).toFixed(1)} MB)` : ""}…`);
  const url = await streamToR2({ key, body: stream, contentType });
  return { key, url };
}

bot.on(["photo", "document", "video"], async (ctx) => {
  const flow = ctx.session.flow;
  if (!flow) return;

  // Resolve file id + mime
  let fileId, mime;
  if (ctx.message.photo) {
    fileId = ctx.message.photo.at(-1).file_id;
    mime = "image/jpeg";
  } else if (ctx.message.video) {
    fileId = ctx.message.video.file_id;
    mime = ctx.message.video.mime_type || "video/mp4";
  } else {
    fileId = ctx.message.document.file_id;
    mime = ctx.message.document.mime_type || "application/octet-stream";
  }

  try {
    // ── Series thumbnail ──
    if (flow.type === "series" && flow.step === "series:thumbnail") {
      const { url } = await uploadTelegramFileToR2(ctx, fileId, "series/thumbnails", mime);
      flow.data.thumbnail_url = url;
      return finalizeSeries(ctx);
    }

    // ── Episode thumbnail ──
    if (flow.type === "episode" && flow.step === "episode:thumbnail") {
      const { url } = await uploadTelegramFileToR2(ctx, fileId, "episodes/thumbnails", mime);
      flow.data.thumbnail_url = url;
      setStep(ctx, "episode:video");
      return ctx.reply("Now send the *H.264 video file* (as Document or Video).", { parse_mode: "Markdown" });
    }

    // ── Episode video (large; streamed) ──
    if (flow.type === "episode" && flow.step === "episode:video") {
      const { url } = await uploadTelegramFileToR2(ctx, fileId, "episodes/videos", mime);
      flow.data.video_url = url;
      setStep(ctx, "episode:subtitleFile");
      return ctx.reply("Send a *.vtt/.srt* subtitle file or skip:", {
        parse_mode: "Markdown", ...skipBtn("episode:skipSub"),
      });
    }

    // ── Optional subtitle file ──
    if (flow.type === "episode" && flow.step === "episode:subtitleFile") {
      const { url } = await uploadTelegramFileToR2(ctx, fileId, "episodes/subtitles", mime || "text/vtt");
      // Episode must exist first to attach the subtitle FK
      const episodeId = await insertEpisode(ctx);
      flow.data._episodeId = episodeId;
      flow.data._subUrl = url;
      setStep(ctx, "episode:subtitleLabel");
      return ctx.reply("Send the subtitle *Label* (e.g. `English`):", { parse_mode: "Markdown" });
    }
  } catch (e) {
    console.error(e);
    await ctx.reply(`❌ Upload failed: ${e.message}`);
  }
});

// ════════════════════════════════════════════════════════════
// DB FINALIZERS
// ════════════════════════════════════════════════════════════
async function finalizeSeries(ctx) {
  const d = ctx.session.flow.data;
  const row = {
    title: d.title,
    status: d.status,
    description: d.description ?? null,
    rating: d.rating,
    audio_language: d.audio_language,
    subtitle_language: d.subtitle_language,
    genres: d.genres,
    thumbnail_url: d.thumbnail_url,
    created_by: SUPABASE_ADMIN_USER_ID || null,
  };
  const { data, error } = await supabase.from("series").insert(row).select("id").single();
  clearFlow(ctx);
  if (error) return ctx.reply(`❌ DB insert failed: ${error.message}`);
  return ctx.reply(`✅ Series created: \`${data.id}\``, { parse_mode: "Markdown" });
}

async function insertEpisode(ctx) {
  const d = ctx.session.flow.data;
  const row = {
    series_id: d.series_id,
    title: d.title,
    season: d.season,
    episode_number: d.episode_number,
    duration_seconds: d.duration_seconds,
    description: d.description ?? null,
    thumbnail_url: d.thumbnail_url,
    video_url: d.video_url,
    created_by: SUPABASE_ADMIN_USER_ID || null,
  };
  const { data, error } = await supabase.from("episodes").insert(row).select("id").single();
  if (error) throw new Error(error.message);
  return data.id;
}

async function finalizeEpisode(ctx, alreadyInserted = false) {
  try {
    if (!alreadyInserted) {
      const id = await insertEpisode(ctx);
      await ctx.reply(`✅ Episode created: \`${id}\``, { parse_mode: "Markdown" });
    } else {
      await ctx.reply(`✅ Episode created: \`${ctx.session.flow.data._episodeId}\``, { parse_mode: "Markdown" });
    }
  } catch (e) {
    await ctx.reply(`❌ DB insert failed: ${e.message}`);
  }
  clearFlow(ctx);
}

// ── Launch ─────────────────────────────────────────────────
bot.catch((err, ctx) => {
  console.error("Bot error:", err);
  ctx.reply?.(`💥 ${err.message}`).catch(() => {});
});

bot.launch().then(() => console.log("🤖 Ohayou uploader bot running"));
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
