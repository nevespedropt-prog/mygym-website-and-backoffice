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

## Campaigns and class-cancelled emails (admin only)
- Marketing page, "Write and send a campaign": count the audience, send yourself a test, then send to every confirmed subscriber (second press confirms). Sends in batches of 40 and carries on until nobody is left; each person gets a campaign only once, so a retry never doubles up. Uses the `admin-campaign` function.
- Schedule page, "Class cancelled": checks who is booked on a date and emails them (`admin-class-cancelled` function). Before takeover, cancel the session in Wix afterwards; after takeover bookings are not removed, so switch the class off on the Timetable page if needed.
- Both functions only accept calls from https://admin.mygymlondon.co.uk (and localhost for tests), require a signed-in admin, and are deployed with JWT checking on.

## Enquiries
Website forms (free class, gym trial, contact) post to the `submit-form` function; staff are emailed a link to the Messages page here (`https://admin.mygymlondon.co.uk/#/enquiries`). The app has no forms.

## If the website host or DNS moves
This site stays on Cloudflare Pages. Only the DNS record matters: if the domain's DNS leaves Wix, copy the `admin` CNAME (to `mygym-admin.pages.dev`) to the new DNS.
