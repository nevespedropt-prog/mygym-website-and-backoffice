# MY GYM London: security check-up, 20 October 2026

Scope: the app (app.mygymlondon.co.uk), its Supabase project, the public GitHub repo, the domain's DNS, and the public Wix site.
Method: outside-in, read-only. No accounts created, no data changed, no denial-of-service. Last time's tests (RLS reads, XSS, signup rate limit, data limits) were not repeated.
Also reviewed: the new phase 2 code I wrote (the `book-class` function), as an attacker would.

## Verdict
No leaked secrets, no open data, no way found for a stranger to read or change member data. The weak points are: four background functions that anyone can call, a DMARC setting that does not stop email spoofing, an over-powered Wix API key, and some abuse paths in my own booking code (now fixed in code, not yet deployed).

## What held (tested)
| Test | Result |
|---|---|
| Files that must stay private (notes, SQL, source maps, .git, .env, push key, .claude) on the live site | All 404 |
| Database API root, GraphQL, storage with the public key | Root needs a secret key; GraphQL off; no storage buckets |
| Logged-out READ on all 23 tables | Refused on all except the timetable (intended) and one gap, see L1 |
| Logged-out WRITE (update, delete) on 11 key tables incl. app_flags, sync_log, member_access, plans | Refused (permission denied) |
| `book-class` without login, or with only the public key | Refused (401) |
| Signup | Off for the public (`disable_signup`), all social logins off, no anonymous users |
| Secrets anywhere in the whole git history (keys, tokens, private keys) | None. GitHub secret scanning and push protection are on |
| Booking email text built from member names | HTML-escaped |
| Dangerous browser patterns (innerHTML, eval) in app code | None. Strict script CSP |
| Dangling DNS (subdomains pointing nowhere) | None found. `send`/`rsend` point at the email provider, `app` at GitHub Pages |
| IDOR: cancelling another member's booking via `book-class` | Refused (tested with a fake database) |

## Findings, highest first
### M1. Four background functions can be called by anyone (Medium)
`sync-wix-bookings`, `sync-timetable`, `send-class-reminders`, `send-booking-email` run with login checking off and have no shared secret. A stranger can:
- read booking and member counts from `sync-wix-bookings` (dry run),
- call it every minute so the real 5-minute sync is skipped (the once-a-minute guard blocks the real one),
- trigger Wix API calls and reminder pushes early (each is idempotent, so no data corruption found).
Fix (needs the owner): create a Supabase secret `CRON_SECRET`; each function checks header `x-cron-secret` against it (only when the secret exists, so nothing breaks in between); the three cron schedules and the email trigger send the header. Steps are in NEXT-SESSION.md. Not done: it needs a secret only the owner may create, four deploys and three schedule changes.

### M2. DMARC is `p=none` (Medium)
`_dmarc.mygymlondon.co.uk` = `v=DMARC1; p=none` (monitoring only). Anyone can send email that claims to be info@mygymlondon.co.uk and most inboxes will deliver it. A phishing mail to your members is believable. SPF is `~all` (soft fail) and lists only Google.
Fix (owner, in Wix DNS): change to `v=DMARC1; p=quarantine; pct=25; rua=mailto:dmarc_agg@vali.email`, watch the reports for a week, then raise `pct` and later use `p=reject`. Wix and Resend mail are signed with DKIM, so they should pass. Check the reports before raising it.

### M3. The Wix API key can do far more than the app needs (Medium)
Key `app-member-check` has Wix Stores, eCommerce, Pricing Plans, Bookings, Contacts and Members. The app needs Bookings (read, create, cancel), Pricing Plans (read) and Contacts and Members (read). If the key leaked from the Supabase secrets, an attacker could read customers and orders.
Fix (owner, Wix account, API Keys): remove Stores and eCommerce, keep the rest, then book and cancel once in the app to confirm it still works.

### M4. Abuse paths in my own booking function (Medium, fixed in code, NOT DEPLOYED)
Found by reviewing and attacking the code with a fake database and a fake Wix (21 scenarios, all pass after the fix):
- It created the Wix booking before the database rules ran, then cancelled it if refused. A member could make Wix flicker (create and cancel) over and over, burn Wix API calls, or briefly hold a space they were not allowed to book (gym slot without a plan). Fixed: date, weekday and gym-plan rules now run before Wix is touched.
- No limit on how many future bookings one member could take (one account could take every space, now visible on the website too). Fixed: maximum 30 upcoming bookings.
- No slow-down on repeated attempts. Fixed: one attempt every 4 seconds per member.
- Member-typed names went to Wix unchecked. Fixed: cleaned and cut to 40 characters.
- Unknown database errors were shown to members. Fixed: only the gym's own rule messages are shown.
- A crash could return internals. Fixed: generic message.
- If the rollback in Wix failed, nothing was logged. Fixed: logged in `sync_log` row `wix-book-issue`.
Status: code is in `supabase/functions/book-class` on this computer, tested, NOT deployed (the deploy click was blocked). To deploy: paste both files in the editor and click Deploy updates (see NEXT-SESSION.md). The live version still works as before.

### L1. Logged-out visitors hold SELECT on `email_log` (Low)
Row security shows them zero rows today, but one mistake would expose it. Also new tables get open permissions by default. Fix prepared: `supabase/migration-security-pass-2.sql` (owner pastes the statements, then runs the four check queries in its footer). Not applied.

### L2. Pre-registered accounts (accepted risk since 3 Oct, now slightly bigger) (Low)
Signup creates an account for any email that exists as a Wix member, with no email verification (`mailer_autoconfirm` is on). With phase 2 an attacker who knows a member's email could book and cancel in that member's name, and trigger confirmation emails to them. Needs a list of real member emails. Still accepted; the booking cap and throttle reduce the damage. Real fix: email verification, which needs a working email sender.

### L3. Owner's personal Gmail in the public repo (Low, my mistake)
`migration-book-class.sql` (commit d8dec38) contained it. Removed from the file locally; the old commit still shows it. Rewriting history would need a force push, which I do not recommend. Decide whether you care.

### L4. No security headers on the app (Low, known)
GitHub Pages sends no HSTS, no frame blocking. Clickjacking risk is low (no sensitive action on one click). Moving the app behind Cloudflare would fix it.

### L5. Account hygiene (Low, cannot be tested from outside)
Confirm two-step login (2FA) on: GitHub, Wix, Supabase, Google (email), Resend, the domain registrar. Branch protection and Dependabot are off on the repo (single owner, minor). Supabase free plan has no point-in-time backups: confirm how you would restore if data were lost. If the GitHub repo or Pages were deleted, `app.` could be taken over by someone else, so never delete it without moving the domain first.

## Not tested (and why)
- Anything as a logged-in member (rule bypass, IDOR on real data, rate limits as a member). Needs a test member account, and I may not create accounts. If you create one test member and give me its login in the chat, I can run these.
- Wix checkout, payments and the website's own login (Wix runs those).
- Real email delivery and spoofing tests.
- Load or denial-of-service testing.

## Prepared, waiting for the owner
1. Deploy hardened `book-class` (M4).
2. Run `migration-security-pass-2.sql` (L1) and its checks.
3. Create `CRON_SECRET` and update the schedules (M1). I will write and test the code changes first when you say go.
4. DMARC (M2) and Wix key permissions (M3).
5. 2FA check (L5).

## Update, 20 October 2026 (later the same day): what was fixed, with the owner doing each step
- M1 DONE: shared secret (CRON_SECRET). Strangers now get 401 on all four background functions; the schedules carry the secret and still run (200).
- M2 DONE: DMARC now p=quarantine, pct=10, reports to info@. Raise pct after a week of reports.
- M3 DONE and WORSE than first reported: the Wix key had nearly all account and organization permissions (manage domains, delete sites, create accounts...). Now only Pricing Plans, Wix Bookings, Wix Contacts & Members. Booking, cancel and the schedule verified; membership check and sign-up not yet verified with the smaller key.
- M4 DONE: hardened book-class deployed and verified live.
- L1 DONE: migration-security-pass-2.sql applied; logged-out visitors can no longer read email_log.
- Still open: L2 (pre-registration, accepted), L3 (old commit shows the owner's Gmail), L4 (no security headers on the app), L5 (2FA everywhere, backups, 5 collaborators on the Wix site), logged-in member attack tests (needs a test member account), push of the four cron-secret function files to the repo.
