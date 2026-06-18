## Problem

Telegram notifications stopped firing after the security hardening pass. The edge function logs show:

```
TypeError: authClient.auth.getClaims is not a function
  at telegram-notify/index.ts:28
```

The `getClaims` API isn't available on the pinned `@supabase/supabase-js@2.45.0` client, so every call from the DB trigger now 500s before reaching Telegram.

## Fix

Replace the `getClaims` check in `supabase/functions/telegram-notify/index.ts` with a JWT validation that works on the installed SDK while still blocking unauthenticated callers:

- Keep the `Authorization: Bearer …` requirement.
- Validate the token by either:
  - calling `authClient.auth.getUser(token)` (available in 2.45.0), OR
  - comparing the bearer against `SUPABASE_ANON_KEY` / accepting a valid user token via `getUser`.
- Return 401 only when neither check passes; otherwise proceed to the existing Telegram send logic (unchanged).

No other files change. After the edit, verify by:
1. Tailing `telegram-notify` edge logs.
2. Creating a test episode in the admin UI and confirming the Telegram message posts with the "Powered by Tsukima" footer.
