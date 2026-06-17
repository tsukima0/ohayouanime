# Ohayou Anime — Telegram Admin Uploader Bot

Standalone Node.js bot that lets a single admin upload **series** and **episodes** to Ohayou Anime via Telegram. Media is streamed directly from Telegram → Cloudflare R2 (S3 API); metadata is written to Supabase with the service-role key.

This bot is **not** part of the web app — it runs as its own process (VPS, Fly.io, Railway, Docker, etc.).

## Setup

```bash
cd telegram-bot
cp .env.example .env   # fill in values
npm install
npm start
```

## Required environment variables

| Var | Where to get it |
|---|---|
| `TELEGRAM_BOT_TOKEN` | [@BotFather](https://t.me/BotFather) → `/newbot` |
| `TELEGRAM_ADMIN_CHAT_ID` | Your numeric Telegram user id ([@userinfobot](https://t.me/userinfobot)) |
| `R2_ENDPOINT` | Cloudflare Dashboard → R2 → API → S3 endpoint |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Cloudflare R2 → Manage API tokens |
| `R2_BUCKET` | Bucket name (e.g. `ohayou-anime`) |
| `R2_PUBLIC_BASE_URL` | Your bound custom domain, e.g. `https://cdn.ohayouanime.com` |
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → `service_role` (server-only!) |
| `SUPABASE_ADMIN_USER_ID` | UUID of the admin auth user that should own inserted rows |
| `TELEGRAM_API_ROOT` *(optional)* | If you run a local Bot API server to lift the 20 MB download limit |

## Workflow

`/upload` → choose **🎬 Add New Series** or **📺 Add New Episode**.

- **Series:** Title → Status → Description (skippable) → Rating (0–10) → Audio (default Japanese) → Subtitle (default Burmese) → Genres (multi-select, then Done) → Thumbnail → inserted into `series`.
- **Episode:** Pick series → Title → Season → Episode # → Duration → Description (skippable) → Thumbnail → H.264 video (streamed in 10 MB parts to R2) → optional `.vtt`/`.srt` + label + lang code → inserted into `episodes` (and `subtitles` if provided).

`/cancel` aborts the current wizard.

## ⚠️ Large video files

The public Telegram Bot API caps **downloads** at **20 MB**. To upload full episodes you must either:

1. Run a local [Telegram Bot API server](https://github.com/tdlib/telegram-bot-api) (limit becomes 2 GB) and set `TELEGRAM_API_ROOT=http://localhost:8081`, or
2. Use the Telegram Client API (TDLib / MTProto) instead of the Bot API.

The streaming pipeline (`@aws-sdk/lib-storage` multipart, 10 MB parts) is already memory-safe for any size once the source stream is available.

## Security notes

- Only the configured `TELEGRAM_ADMIN_CHAT_ID` may interact; everyone else is rejected silently.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — keep it on the bot host only, never expose it to clients.
- Bot inserts use `created_by = SUPABASE_ADMIN_USER_ID` so rows respect existing admin-owned RLS expectations.
