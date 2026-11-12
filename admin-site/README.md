# MY GYM London back office (admin site)

Static site (no build step). Real data from Supabase through the `admin_*` database functions (see `app/supabase/migration-admin-backend.sql`). Roles: owner/admin, manager, reception, coach.

The member app has no admin pages and never will: the app holds only the timetable, bookings, workout logs and body measurements. Everything for staff lives here, in a web browser.

## Before it can work (one time)
1. Apply `app/supabase/migration-admin-backend.sql` and `migration-admin-backend-4.sql` (timetable editor) to the live database (adds the `staff` table and the functions). Both are applied live. A rolled-back test run on 2026-10-28 passed: owner sees everything; coach sees only dashboard, schedule and health forms; reception sees members and enquiries but not health forms; signed-out and non-staff people are refused.
2. The owner is admin because `profiles.is_admin` is already true for the owner's app account. Add staff later in the back office under Team and settings (they need an app account first).

## Hosting: Cloudflare Pages (admin.mygymlondon.co.uk)
1. Cloudflare dashboard, Workers & Pages, Create, Pages, Connect to Git: repo `mygym-website-and-backoffice`, project name `mygym-admin`, production branch `main`, root directory `admin-site`, no build command, output directory `.`. Every push to `main` then redeploys it.
2. Project, Custom domains, add `admin.mygymlondon.co.uk`. Cloudflare shows the CNAME target (`mygym-admin.pages.dev`).
3. DNS is held at Wix: add a `CNAME` record, host `admin`, pointing to that target. Wait for it to resolve.
4. Open https://admin.mygymlondon.co.uk and sign in with the owner's app email and password.
5. Check: Dashboard loads, Members shows the real members, Schedule shows today's classes. Turn on 2FA for the owner's accounts.
Security headers come from `_headers` (Cloudflare). `.htaccess` is only for Apache hosts and is ignored on Cloudflare.

## What is not here yet
- Plans and payments (still in Wix), coach access to health forms (needs a coach view of the roster), staff invitations by email.
- Test with fake data locally: serve this folder with any static server and replace `vendor/supabase.js` with a stub; do not point it at real data from a shared computer.

## Sample figures
`config.js` has `SAMPLE_FIGURES: true`. While it is true, the three Wix-dependent items (monthly revenue, failed payments, members by plan) and the Plans and payments page show placeholder numbers with a yellow "Sample" tag and a blue banner. Everything else on the dashboard is real. Set it to `false` to hide the placeholders (those cards then say "Connect Wix payments").
The dashboard needs `admin_insights()` too: it is in the same migration file.

## Pages (updated 2026-11-12)
Dashboard, Schedule, Timetable, Members, Day to day (check-in, waitlist, staff rota, tasks), Analytics, Marketing, Plans and payments (sample figures), Messages (enquiries), Forms and pages, Emails, Settings and health (system health, team, business details, security checklist). Needs migrations 1 to 3 in app/supabase (all applied live on 2026-10-28).
The waitlist is kept by hand (the app has no waitlist yet). Check-in starts counting attendance once staff use it.

## Timetable and launch day
The Timetable page adds, edits, switches off and removes classes and gym hours. Until launch day the website (Wix) still drives the timetable through the `sync-timetable` function, so Wix-sourced rows are put back every 10 minutes. On launch day the owner (admin only) presses "Take control of the timetable": this turns the website sync off (`app_flags` key `timetable_backoffice` = on) and turns every active Wix row into a normal row. To undo: set that flag's mode to `off`; check for doubled classes afterwards.

## Campaigns (Marketing page, admin only)
Database: `migration-marketing-campaigns.sql` (applied). Edge functions: `admin-campaign`, `send-scheduled-campaigns`, `resend-webhook`.
- **History:** every campaign is a row in `marketing_campaigns` (draft, scheduled, sending, sent). The page lists them with status and results; click one to open it. A sent campaign is read-only and can be duplicated as a new draft; if some emails failed it offers "Retry". Sent campaigns cannot be deleted from the page.
- **Audience (segments):** everyone who confirmed | members (have an app account) | website sign-ups without an app account | active members (booked in the last 30 days). Only people with confirmed, not withdrawn consent are ever included; `send-email` checks consent again at send time.
- **Writing:** templates, live preview, character counts and a checklist. The red button works only when the checklist is complete, including a test email sent for the exact wording (a passed test is remembered in the browser for that draft until the wording changes). Pressing it while locked says what is missing. Sending needs a second press to confirm.
- **Send now or schedule:** "Send now" sends in batches of 40 and the page keeps going until nobody is left. "Schedule" takes a London time (2 minutes to 90 days ahead); a scheduled campaign is locked until you unschedule it. The database schedule `send-scheduled-campaigns` runs every minute, starts due campaigns and carries on any that stalled. Each person gets a campaign once (dedupe key `campaign:<id>:<email>`), so retries and overlaps never double up.
- **Delivery results:** Resend reports delivered, bounced, spam-complaint and click events to the `resend-webhook` function (verified with a Svix signature, secret `RESEND_WEBHOOK_SECRET`), which fills `email_events`. A spam complaint or a permanent bounce also withdraws that person's marketing consent. Opens are deliberately not counted (mail apps hide them).
- **Resend setup (done 2026-11-12):** webhook with events delivered, bounced, complained, clicked pointing at `https://<project>.supabase.co/functions/v1/resend-webhook`; click tracking on through the tracking subdomain `links.mygymlondon.co.uk` (CNAME to `links2.resend-dns.com`, kept at Wix like the other DNS). If DNS ever moves, copy that record too. Emails sent before tracking was switched on have no click data.
- **Origins:** `admin-campaign` and `admin-class-cancelled` only accept calls from https://admin.mygymlondon.co.uk (not the pages.dev address). From any other address a send fails with "Could not reach the server".
- **To undo the campaign system:** `select cron.unschedule('send-scheduled-campaigns');` then drop the functions and table listed at the top of the migration file.

## Class-cancelled emails (Schedule page, admin only)
"Class cancelled" checks who is booked on a date and emails them (`admin-class-cancelled` function). Before takeover, cancel the session in Wix afterwards; after takeover bookings are not removed, so switch the class off on the Timetable page if needed. Not yet tested with a real send.

## Enquiries
Website forms (free class, gym trial, contact) post to the `submit-form` function; staff are emailed a link to the Messages page here (`https://admin.mygymlondon.co.uk/#/enquiries`). The app has no forms.

## If the website host or DNS moves
This site stays on Cloudflare Pages. Only the DNS record matters: if the domain's DNS leaves Wix, copy the `admin` CNAME (to `mygym-admin.pages.dev`) to the new DNS.
