

# Link Shorts to Full Episodes

## Overview
Add an `episode_id` column to the `shorts` table so each short clip can be linked to a specific full episode. When a user taps the "Watch Full Episode" button on a short, they navigate to `/watch/:episodeId`. The admin panel will include a dropdown to select the linked episode when creating or editing a short.

---

## Step 1: Database Migration

Add a nullable `episode_id` column to the `shorts` table with a foreign key reference to `episodes.id`.

```sql
ALTER TABLE public.shorts
  ADD COLUMN episode_id uuid REFERENCES public.episodes(id) ON DELETE SET NULL;
```

This is nullable so existing shorts without a linked episode continue to work fine.

---

## Step 2: Admin Panel - ShortsManager

Update the admin shorts form (`src/components/admin/ShortsManager.tsx`) to include an episode selector:

- Fetch all episodes (with their series title) on mount.
- Add a dropdown labeled **"Link to Full Episode (optional)"** that groups episodes by series name.
- Display entries like: `Series Title - S1E3: Episode Title`.
- Save the selected `episode_id` into the payload on create/update.
- When editing, pre-select the currently linked episode.
- In the shorts list, show a small badge or label indicating which episode is linked (if any).

---

## Step 3: ShortCard - "Watch Full Episode" Button

Update `src/components/ShortCard.tsx` to show a transparent red "Watch Full Episode" button at the bottom of the short overlay:

- Only render the button if `short.episode_id` exists.
- Clicking it navigates to `/watch/${short.episode_id}` using React Router's `useNavigate`.
- Styled as a transparent button with a red/primary border and text, positioned in the bottom info area above the progress bar.
- The button needs `pointer-events-auto` since the parent overlay has `pointer-events-none`.

---

## Step 4: Update Data Fetching

Update `useShorts()` in `src/hooks/useSeriesData.ts` to include the new `episode_id` field. Since the types file auto-generates from the database schema, the `DbShort` type will automatically include `episode_id` after the migration.

Optionally join episode data so the button can show the episode title:
```ts
.select("*, episode:episode_id(id, title, series_id, series:series_id(title))")
```

---

## Technical Details

### Files to modify:
1. **New migration SQL** - Add `episode_id` column to `shorts` table
2. **`src/components/admin/ShortsManager.tsx`** - Add episode dropdown to form, show linked episode in list
3. **`src/components/ShortCard.tsx`** - Add "Watch Full Episode" button with navigation
4. **`src/hooks/useSeriesData.ts`** - Update `useShorts()` query to include episode relation

### UI Behavior:
- The "Watch Full Episode" button appears only on shorts that have a linked episode
- Button style: transparent with red/primary border, Play icon, text "Watch Full Episode"
- Tapping the button navigates away from shorts to the video player page for that episode
- In admin, the episode link is optional -- shorts without a linked episode simply won't show the button

