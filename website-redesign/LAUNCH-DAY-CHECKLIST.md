# Launch day: move www.mygymlondon.co.uk from Wix to the new website

Written 2026-10-28, updated 2026-11-06. Target date: 11 November 2026 (set when ready). Tick as you go. "You" = the owner, "Claude" = Claude. Where Wix or Hostinger screens differ from the words here, trust the screen and tell Claude.

**What stays at Wix after launch:** the domain registration and DNS (Wix keeps the nameservers), the Google email accounts (billed through Wix), Wix Pricing Plans (payments, plan checkout), Wix Bookings (sessions, spaces, bookings, synced with our app every 5 to 10 minutes), the Wix site itself, now at **join.mygymlondon.co.uk**.
**What moves:** www.mygymlondon.co.uk and mygymlondon.co.uk go to Hostinger (the new website). A new address admin.mygymlondon.co.uk serves the back office. The app stays at app.mygymlondon.co.uk (now on Cloudflare Pages, see the last section).

## DNS records as they are today (take a screenshot of the Wix DNS page too)
| Name | Type | Value now | After launch |
|---|---|---|---|
| mygymlondon.co.uk (root) | A | 185.230.63.171 (Wix; earlier also .107 and .186) | Hostinger IP address (from hPanel) |
| www | CNAME | cdn3.wixdns.net (Wix) | CNAME or A to Hostinger (hPanel tells which) |
| app | CNAME | mygym-app-5ge.pages.dev (Cloudflare Pages; was melodious-salamander-ad3f08.netlify.app until 2026-10-30) | no change |
| send | CNAME | send.forge.rmta.net (Resend sending) | no change |
| resend._domainkey | TXT | Resend DKIM key | no change |
| _dmarc | TXT | v=DMARC1; p=quarantine; pct=10; rua=mailto:info@mygymlondon.co.uk | no change |
| root | MX x5 | aspmx.l.google.com and alt1 to alt4 (Google email) | **never touch** |
| root | TXT | google-site-verification, v=spf1 include:_spf.google.com ~all | no change |
| root | NS | ns12.wixdns.net, ns13.wixdns.net | no change (Wix keeps DNS) |
| join | (new) | none | Wix checkout site (see step 2) |
| admin | (new) | none | Hostinger (back office) |

## 0. Before the day (days or weeks ahead)
- [ ] You: buy the Hostinger **web hosting** plan (not the website builder). Tell Claude the plan name. Log in to hPanel (hpanel.hostinger.com).
- [ ] You: free SSL switched on for the domain and the admin subdomain in hPanel. Note the Hostinger IP address.
- [ ] Claude: rebuild the site (`python build_site.py`), check no "sample" text, check links, make a zip of `website-code` and one of `admin-site`.
- [ ] Decide the day and time. Pick a quiet time (early morning, mid-week). Do not do it on the day of a big promotion.
- [ ] Wix: lower the DNS "TTL" (time to live) of the root and www records to the smallest value a day before, so changes spread faster (if Wix lets you).
- [ ] You: your unsaved Wix home page changes: decide (save or discard) BEFORE the day, so the Wix editor is clean. Claude checks the Personal Training page draft for the abandoned edit.
- [ ] Back up: export Wix site contacts and orders (Wix dashboard) and keep a copy of the DNS screenshot.
- [ ] Netlify: app builds are paused until the credits return on 19 November. All app code is already pushed to GitHub (2026-10-30), so nothing is waiting locally. If launch is before that, the app's newest parts (Log exercise search bar, Create exercise button, Watch on YouTube buttons, enquiries page, terms and privacy wording, App terms links) are not live yet: fine, nothing on launch day depends on them.

## 1. Set up the Hostinger side (before touching DNS, no one sees it yet)
- [ ] You: upload the CONTENTS of `website-code` (including the hidden `.htaccess`) to the main site folder (public_html) in hPanel File Manager.
- [ ] You: create the subdomain **admin.mygymlondon.co.uk** in hPanel and upload the CONTENTS of `admin-site` into its folder (including `.htaccess`).
- [ ] Claude: open the site on Hostinger's temporary preview address (or hosts file) and check the pages, forms, My bookings, the Instagram strip, redirects.
- [ ] Claude: confirm the security headers are being sent (CSP, HSTS) and nothing is blocked (browser console clean).

## 2. Move the Wix site to join.mygymlondon.co.uk (do this FIRST, while www still points to Wix)
- [ ] You, in Wix: Domains, add the subdomain **join.mygymlondon.co.uk** and connect it to the MyGymLondon site (Wix guides this; because Wix holds the DNS it creates the record itself). Make it the address members and checkout use.
- [ ] Claude: check https://join.mygymlondon.co.uk loads the Wix site, the plans page, log in, my subscriptions (`/my-subscriptions`), my orders.
- [ ] You: do a real small checkout test (a cheap plan or a coupon) or ask Claude to guide a test with a free/low-cost plan; confirm the member can log in and sees the plan; cancel the test afterwards.
- [ ] Claude: confirm the new website's "Join now" buttons, which already point to join.mygymlondon.co.uk, open the right page.

## 3. The switch (DNS)
- [ ] You, in Wix: Domains, mygymlondon.co.uk, DNS records. Change ONLY:
  - the root **A** record to the Hostinger IP address,
  - the **www** record to what hPanel says (usually a CNAME or the same A),
  - add **admin** (A record to the same Hostinger IP, or as hPanel says).
  Do not touch MX, TXT, send, resend._domainkey, _dmarc, app, or nameservers.
- [ ] Claude: watch propagation (nslookup from several resolvers) until www and the root show the Hostinger IP. Usually minutes, up to a few hours.
- [ ] You: in hPanel, make sure SSL is issued for www, the root and admin (hPanel does it automatically once DNS points there).

## 4. Check everything on the real address (Claude leads, you do the phone checks)
- [ ] https://www.mygymlondon.co.uk loads the NEW site; http:// and the root redirect to https://www.
- [ ] Old Wix addresses redirect: /our-classes, /schedule, /book-the-gym, /book-a-free-class, /services-4, /refer-friends, /privacy-notice, /t-and-cs, /memberships, /timetable, /trial, /pricing-plans/memberships, /my-subscriptions, /account/...
- [ ] Each form once with a real test (contact, personal training, free class, Kids Gym, newsletter with the confirmation email, corporate): the enquiry appears in Messages, the confirmation emails arrive, the unsubscribe link works.
- [ ] My bookings page: sign in with a test member and cancel a test booking (check the cancel email).
- [ ] The Instagram strip shows the latest posts. The Google map link and phone link work. Sitemap, robots.txt and llms.txt open.
- [ ] Back office: https://admin.mygymlondon.co.uk, sign in with the owner account, check Dashboard, Members and Schedule show real data, add staff accounts under Settings, Team.
- [ ] Email still works: send yourself a mail to info@mygymlondon.co.uk and from it (Google email is untouched).
- [ ] The app: https://app.mygymlondon.co.uk still works, the "Website" link in the app opens the new site.
- [ ] Phone check: open the new site on your phone on mobile data (not wifi).

## 5. Same day: the things that point at the old site
- [ ] **Email accounts:** the Google mailboxes are billed through Wix. Do NOT stop paying Wix for them. Confirm in Wix (Settings, Google Workspace or Domains and email) what is billed and when it renews. Moving the billing to Google directly is optional, later, and must be planned so no mailbox is cancelled.
- [ ] **Timetable rules still right after the sync:** Kids Gym Tue and Thu 4pm to 5pm (no gym slots then), HIIT Wednesday 07:00 for 30 minutes with Pedro, HIIT Glow gone. Look at the app timetable and the website Classes page.
- [ ] Google Business Profile: website link to https://www.mygymlondon.co.uk, check hours and photos (hours stay as they are).
- [ ] Google Search Console and Bing Webmaster Tools: add the site, verify (DNS or file), submit https://www.mygymlondon.co.uk/sitemap.xml.
- [ ] Instagram bio link, any QR codes, flyers or email signatures that use old Wix addresses (they redirect, but update the main ones).
- [ ] Wix: in the Wix dashboard check the Wix site is now only reachable at join.mygymlondon.co.uk and still shows "Published". Do NOT cancel the Wix plan.
- [ ] Wix referral reward: the new policy is **one free month** for the referring member (not a % discount). Check whether Wix Pricing Plans has a "free month" reward option; if not, turn the Wix referral reward off and handle rewards manually until a code-based reward is built.

## 6. Switch things off at Wix (only after steps 1 to 4 pass) and switch our own on
These are the "everything from our system" steps decided on 2026-10-28. Do them in this order:
- [ ] Wix automations OFF (Wix dashboard, Automations): the day-before session reminder ("Remind clients about upcoming sessions"); booking emails Wix still sends (confirmation, cancelled, changes) once checked that ours cover them.
- [x] **Payment emails — test mode LIVE (2026-11-08):** `sync-wix-payments` deployed, new email flow (PAR-Q, welcome-member, part2-workout, part3-nutrition) live. `app_flags_mode_check` constraint updated to allow 'off'/'test'/'on'. Flag is currently `mode = 'test'`, `test_emails = ['nevespedro.pt@gmail.com']` — emails fire only to the owner address. Steps done: (1) baseline complete (first run stored all existing orders, sent 0 emails); (2) test mode set and confirmed. **On transition day, in this order:** (3) switch Wix's 12 payment/subscription automations OFF in Wix dashboard; (4) run `update app_flags set mode = 'on' where key = 'wix_payment_emails';` to go live for everyone.
- [ ] Wix email campaigns: stop using them (campaigns now go through our back office with Resend). Do not delete subscribers: export them first if you want a copy.

## 7. After launch (first week)
- [ ] Watch Messages (enquiries), Emails (failed sends) and Settings and health for red items every day.
- [ ] Check Search Console for errors. Check Google Business Profile shows the new link.
- [ ] Check the first real new-member sign-up in the logs (member-signup, check-gym-access).
- [ ] Netlify credits return 19 November (or move the app to Cloudflare Pages, see below). The app commits are already pushed to GitHub, so a build starts by itself: check it went live, then test the new exercise features signed in as a member (search bar, Add exercise, Create exercise, Watch on YouTube, the "Your own" list, a row appearing in exercise_suggestions), the enquiries page, and then point gym alert emails to the enquiries page.
- [ ] Every Sunday 6 PM: exercise suggestions review (ask Claude: "Review the pending exercise suggestions for MY GYM and update the library."). Calendar file: `app/MYGYM-weekly-exercise-review.ics`, import it into Google Calendar once.
- [ ] DMARC: read the reports, then raise the policy from pct=10.
- [ ] (2FA and the Wix collaborators: owner decided not to change these. Skip.)
- [ ] Take down the old public test website (GitHub repo `mygym-website-test`: make it private or turn off GitHub Pages) so only the real site is online.
- [ ] Set GitHub repo `mygym-website-and-backoffice` back to **private** (Settings → General → scroll to bottom → Change visibility → Make private). It was made public temporarily for the GitHub Pages preview (2026-11-09). Once the real site is live on Hostinger, the public repo is no longer needed.
- [ ] Check Monday's weekly report email arrives at info@ (the weekly-report job) and does not start with [ATTENTION].
- [x] Back up the website and back office: private GitHub copy done 2026-10-30 (github.com/nevespedropt-prog/mygym-website-and-backoffice). After any change run `git push` in the MY GYM folder.

## Rollback (if something is badly wrong on the day)
1. In Wix DNS, put the root A record back to **185.230.63.171** and the www CNAME back to **cdn3.wixdns.net**. Leave everything else.
2. Within minutes to a few hours the old Wix site is back. join.mygymlondon.co.uk keeps working either way.
3. Tell Claude what went wrong before trying again. Forms and bookings in the app and database are not affected by the website being switched.

## Things Claude must not forget
- Never change MX, SPF, DKIM or DMARC records: Google email and Resend sending depend on them.
- Wix keeps Pricing Plans and Bookings: do not cancel the Wix plan.
- The Wix editor draft contains an abandoned Personal Training page edit: never press Publish in the editor without checking it.
- The new site's forms only accept posts from https://www.mygymlondon.co.uk and https://mygymlondon.co.uk. Any other address is refused.

## App hosting: moved to Cloudflare Pages (DONE 2026-10-30)
app.mygymlondon.co.uk is served by Cloudflare Pages (mygym-app-5ge.pages.dev, Active). In Wix DNS the `app` CNAME points to mygym-app-5ge.pages.dev (rollback: melodious-salamander-ad3f08.netlify.app). Never touch MX, TXT or nameservers. Every push to GitHub `mygym-app` main deploys by itself. Keep the Netlify site about a week as a fallback, then pause it (Netlify bills on 19 November).
