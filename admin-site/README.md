# MY GYM London back office (admin site)

Static site (no build step). Real data from Supabase through the `admin_*` database functions (see `app/supabase/migration-admin-backend.sql`). Roles: owner/admin, manager, reception, coach.

## Before it can work (one time)
1. Apply `app/supabase/migration-admin-backend.sql` to the live database (adds the `staff` table and the functions). A rolled-back test run on 2026-10-28 passed: owner sees everything; coach sees only dashboard, schedule and health forms; reception sees members and enquiries but not health forms; signed-out and non-staff people are refused.
2. The owner is admin because `profiles.is_admin` is already true for the owner's app account. Add staff later in the back office under Team and settings (they need an app account first).

## Hosting: Cloudflare Pages (admin.mygymlondon.co.uk)
1. Cloudflare dashboard, Workers & Pages, Create, Pages, Connect to Git: repo `mygym-website-and-backoffice`, project name `mygym-admin`, production branch `main`, root directory `admin-site`, no build command, output directory `.`. Every push to `main` then redeploys it.
2. Project, Custom domains, add `admin.mygymlondon.co.uk`. Cloudflare shows the CNAME target (`mygym-admin.pages.dev`).
3. DNS is held at Wix: add a `CNAME` record, host `admin`, pointing to that target. Wait for it to resolve.
4. Open https://admin.mygymlondon.co.uk and sign in with the owner's app email and password.
5. Check: Dashboard loads, Members shows the real members, Schedule shows today's classes. Turn on 2FA for the owner's accounts.
Security headers come from `_headers` (Cloudflare). `.htaccess` is only for Apache hosts and is ignored on Cloudflare.

## What is not here yet (2026-10-28 update: the migration is APPLIED live; Timetable and Analytics pages added)
- Plans and payments (still in Wix), coach access to health forms (needs a coach view of the roster), campaign editor (the existing page at app.mygymlondon.co.uk/admin-campaign.html is linked), staff invitations by email.
- Test with fake data locally: serve this folder with any static server and replace `vendor/supabase.js` with a stub; do not point it at real data from a shared computer.

## Sample figures
`config.js` has `SAMPLE_FIGURES: true`. While it is true, the three Wix-dependent items (monthly revenue, failed payments, members by plan) and the Plans and payments page show placeholder numbers with a yellow "Sample" tag and a blue banner. Everything else on the dashboard is real. Set it to `false` to hide the placeholders (those cards then say "Connect Wix payments").
The dashboard needs `admin_insights()` too: it is in the same migration file.

## Pages (2026-10-28)
Dashboard, Schedule, Timetable, Members, Day to day (check-in, waitlist, staff rota, tasks), Analytics, Marketing, Plans and payments (sample figures), Messages (enquiries), Forms and pages, Emails, Settings and health (system health, team, business details, security checklist). Needs migrations 1 to 3 in app/supabase (all applied live on 2026-10-28).
The waitlist is kept by hand (the app has no waitlist yet). Check-in starts counting attendance once staff use it.
