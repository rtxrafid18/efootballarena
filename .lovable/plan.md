## Security review result

I scanned the backend. One real issue, plus the same issue repeated across tables:

- **Anyone can edit everything.** All 7 tables (`settings`, `groups`, `teams`, `matches`, `goals`, `assist_stats`, `gk_stats`) allow the public to create, change and delete rows — not just read. Anyone with the site link could wipe matches, rewrite scores, or flip the tournament format.
- No leaked credentials, no personal data exposure, no other findings. The public key in the frontend code is safe to be there by design.

## Fix: shared admin passcode

Public visitors keep full read access. Every write moves behind one secret passcode you enter once in the admin panel.

### 1. Passcode secret
Store the admin passcode plus a session-encryption key as server-side secrets. You choose the passcode; the encryption key is generated automatically and never shown.

### 2. Database lockdown (migration)
Replace the "anyone can do anything" rules on all 7 tables with **read-only for the public**. No write path remains through the browser at all — even someone crafting their own requests can only read.

### 3. Server-side admin gate
New server-only module holding:
- `unlockAdmin(passcode)` — timing-safe comparison against the stored secret, sets an encrypted, http-only session cookie on success. Returns a generic failure otherwise.
- `lockAdmin()` — clears the session.
- `isAdminUnlocked()` — reports the current state to the UI.
- One write function per admin action (save settings, add/edit/delete team, add/edit/delete match, add/delete goal, save MVP, assist stats, keeper stats). Each one verifies the session first, then performs the write with elevated server privileges.

Inputs validated with zod (name lengths, score ranges, minute 0–130, valid ids) so bad data can't be pushed in.

### 4. Admin panel changes
- `/admin` shows a clean passcode screen (matching the World Cup styling) when locked.
- Once unlocked, the panel works exactly as it does today — all existing save/delete buttons switch from talking to the database directly to calling the gated server functions.
- A "Lock" button in the panel header ends the session.
- Session lasts 7 days per device.

### 5. Verify
- Confirm public pages still load matches, standings and awards.
- Confirm a direct write attempt from the browser is now rejected.
- Confirm unlock → edit → data appears live via realtime, and lock → panel is gated again.

### Note on the trade-off
A shared passcode is a gate, not real accounts: everyone who has it has the same power, and changing it means telling everyone the new one. That's fine for a tournament you run yourself. If you later want per-person logins with revocation, we can add proper admin accounts on top.

### Technical details
- Passcode compared with `timingSafeEqual` over sha256 digests, inside a `createServerFn` — never in client code.
- Session via `useSession` from `@tanstack/react-start/server`, http-only + secure cookie.
- Writes use the service-role client, imported dynamically inside handlers so it never reaches the browser bundle.
- RLS becomes `SELECT`-only for `anon`/`authenticated`; `service_role` retains full access.
- Realtime subscriptions in `useTournament.ts` and `GoalCelebration.tsx` are unaffected (read-only).
