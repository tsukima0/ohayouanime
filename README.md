# Ohayou Anime 🎬👹

**Ohayou Anime** is a hybrid anime streaming platform that combines **full-length episode streaming** with a **TikTok-style short-form vertical feed** — built for modern anime fans who want both deep binge sessions and quick, immersive scrolling.

## ✨ Features

- 📺 **Full Episode Streaming** — Custom Video.js player with theater mode, double-tap skip (±10s), long-press 2× speed, and burned-in subtitle support
- 📱 **Short-Form Vertical Feed** — Immersive TikTok-style shorts with swipe navigation, likes, and comments
- 🔍 **Smart Discovery** — Search, filters, genres, watchlists, and continue-watching
- 👤 **User Profiles** — Custom avatars, usernames, watch history sync across devices
- 🛠️ **Admin Dashboard** — Manage series, episodes, subtitles, shorts, and ads
- 📢 **Telegram Notifications** — Auto-post new episodes to a Telegram channel
- 🎨 **Themed UI** — Dark glass + light pure-white modes, branded in Vivid Red / Black / White

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend:** Supabase (Auth, Postgres, RLS, Edge Functions)
- **Media Storage:** Cloudflare R2 (chunked uploads via edge proxy)
- **Player:** Video.js (custom theme)
- **Notifications:** Telegram Bot API

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A [Supabase](https://supabase.com) project
- (Optional) Cloudflare R2 bucket for media
- (Optional) Telegram bot for channel notifications

### 1. Clone the repository

```bash
git clone https://github.com/tsukima0/ohayouanime.git
cd ohayou-anime
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and fill in your own credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
VITE_SUPABASE_URL="https://<your-project>.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<your-anon-key>"
VITE_SUPABASE_PROJECT_ID="<your-project-id>"
```

### 4. Configure backend secrets (Supabase Edge Functions)

In your Supabase dashboard → **Project Settings → Edge Functions → Secrets**, add:

| Secret | Purpose |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Bot token from [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_CHANNEL_ID` | Target channel ID (e.g. `@YourChannel` or `-100...`) |
| `R2_ENDPOINT` | Cloudflare R2 S3 endpoint |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |

### 5. Run the database migrations

Apply the SQL migrations in `supabase/migrations/` via the Supabase CLI or dashboard SQL editor.

### 6. Start the dev server

```bash
npm run dev
```

App runs on [http://localhost:8080](http://localhost:8080).

## 📦 Project Structure

```
src/
  components/      # UI components (incl. admin/, video-player/, shorts/)
  pages/           # Route pages (Index, Watch, Shorts, Admin, ...)
  hooks/           # React hooks for data & auth
  integrations/    # Supabase client & types
supabase/
  functions/       # Edge Functions (telegram-notify, r2-upload, ...)
  migrations/      # SQL schema migrations
```

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

[MIT](./LICENSE) © Ohayou Anime contributors

## ⚠️ Disclaimer

This project is for educational and personal use. Users are responsible for ensuring any content they upload complies with copyright law in their jurisdiction.
