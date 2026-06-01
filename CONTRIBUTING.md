# Contributing to Ohayou Anime

Thanks for your interest in contributing! 🎉 This guide will help you get started.

## 🐛 Reporting Bugs

Open an issue with:
- A clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots / console errors if applicable
- Your environment (browser, OS, Node version)

## 💡 Suggesting Features

Open an issue tagged `enhancement` and describe:
- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

## 🛠️ Development Workflow

1. **Fork** the repository
2. **Clone** your fork:
   ```bash
   git clone https://github.com/tsukima0/ohayouanime.git
   cd ohayou-anime
   ```
3. **Install** dependencies:
   ```bash
   npm install
   ```
4. **Create a branch**:
   ```bash
   git checkout -b feat/your-feature-name
   ```
5. **Make your changes**, following the code style below
6. **Test** locally — `npm run dev` and verify the affected flows
7. **Commit** with a clear message:
   ```bash
   git commit -m "feat(player): add chapter markers to progress bar"
   ```
8. **Push** and open a **Pull Request**

## 📐 Code Style

- **TypeScript** — strict mode; type all props and return types
- **Tailwind** — use semantic tokens from `index.css` (e.g. `bg-primary`, `text-foreground`). Never hardcode colors like `bg-white` or `text-black`
- **Components** — small, focused, one component per file
- **Naming** — `PascalCase` for components, `camelCase` for hooks/utils
- **Imports** — use the `@/` alias for `src/`

## 🎨 Design System

- **Brand colors:** Vivid Red, Solid Black, Pure White (no orange)
- **Theme:** Dark = black + glass; Light = pure white
- All design tokens live in `src/index.css` and `tailwind.config.ts`

## 🔐 Security

- **Never commit secrets** — use `.env` (gitignored) or Supabase Edge Function secrets
- All sensitive keys must be accessed via `import.meta.env.*` (frontend) or `Deno.env.get()` (edge functions)
- New database tables **must** ship with RLS policies and explicit `GRANT` statements

## ✅ Pull Request Checklist

- [ ] Branch is up to date with `main`
- [ ] Code follows the style guide
- [ ] No hardcoded secrets or color values
- [ ] Tested locally on dark + light mode
- [ ] Mobile responsiveness verified (where applicable)
- [ ] Clear PR description with screenshots for UI changes

## 📝 Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation only
- `style:` formatting (no logic change)
- `refactor:` code change that neither fixes a bug nor adds a feature
- `perf:` performance improvement
- `chore:` build, tooling, dependencies

## 💬 Questions?

Open a discussion or reach out on the project's Telegram channel.

Thanks for helping make Ohayou Anime better! 🚀
