# MyGym London: website redesign (approved mockup, NOT yet deployed)

Status: approved by the owner, waiting for the go-ahead to build in Wix (www.mygymlondon.co.uk). Nothing has been published.
Rule from the app project still applies: ask before anything that could break or take the live site offline; plan, owner approves, build, show screenshots, owner approves, then publish.

## What this folder is
- `site-w.html`: the working mockup (open in a browser; pages switch by `#home`, `#classes`, `#services`, `#pt`, `#book`, `#refer`).
- `gen_site.py`, `gen_site2.py`, `gen_site3.py`: generators. Run `python gen_site3.py` to rebuild `site-w.html` (gen_site3 reads gen_site and gen_site2).
- `logo.png`, `qr.png`, `app-dash.png`, `app-timetable.png`: assets used by the mockup.
- `previews/`: screenshots (phone and desktop).
- The mockup hotlinks the owner's existing photos from static.wixstatic.com and loads Google Fonts; both need internet.

## Chosen design ("Design B on white")
White background, red `#e03939` / deep red `#a03535`, near-black `#17171a`. Barlow Condensed uppercase headings plus Inter body. Angled buttons. Original MyGym London logo. Keeps the turf "START" hero photo. Connected to the app (same colours, fonts, logo, app screenshots and QR on the home page).

## Pages and menu
Home, Classes, **Services** (renamed from "Membership offers"), Personal Training, Book MyGym, Refer Friends. Phone has a hamburger menu.

- **Home:** hero photo, scrolling banner, welcome and 4 pillars, two feature cards, "Your gym, in your pocket" app section (phones plus QR to app.mygymlondon.co.uk), gallery, real member reviews, Instagram feed banner (placeholder photos), Google map plus contact plus opening hours ("open now" line), Join CTA.
- **Classes:** schedule at the top (week strip, filters), "Your bookings" panel below it (confirmations, cancel with undo, reschedule, logged-out state), then the class catalogue. Needs Wix Bookings with member login to be real.
- **Services (8 cards):** Gym & Exercise Class (Annual) £400 (best value), Gym & Exercise Class £35/mo, Gym, Classes & 2 Personal Training Membership £75 (SPECIAL OFFER), Gym Membership £26, Exercise Class Only £26/mo, Exercise Classes (Annual) £299, Small Group Personal Training £60/mo (£15 each, 2-4 people, min 4 sessions/month), PAYG Gym £4.
- **Personal Training:** options (1-2-1 from £32.50; Small Group £60/mo), "How it works" strip, 5-step questionnaire (goal, experience, frequency, style) that ends with **booking the free PT session** (AM/PM + terms) and a plan suggestion, Pedro as the only coach.
- **Book MyGym:** open-gym slots (members only).
- **Refer Friends:** 50% for the friend, 100% for the member (first billing cycle of the gym and classes membership).

## Assumptions to confirm before building
- PAYG £4 is "per visit"; Gym Membership £26 and the £75 offer are "every month". Owner only gave the prices.
- The £75 offer includes gym, all classes and 2 PT sessions (assumed per month).
- Small Group PT counted as the 4th new service; it appears on Services and Personal Training.
- Two £26 plans now exist (Gym Membership and Exercise Class Only). Confirm intended.
- Confirmation wording "We'll confirm the exact time by email" is a placeholder.
- Class times and spots on the schedule are sample values (days come from the live class list; only Sunday 09:00 Strength was real data when captured). Real data must come from Wix Bookings.
- Pedro has no photo or bio yet (initial avatar only).
- Instagram banner uses placeholder photos; use Wix's Instagram feed widget.

## Build notes for Wix
- Questionnaire answers need a form or automation that emails the owner (nothing is stored in the mockup).
- Reschedule and cancel for members needs Wix Bookings, Members Area and a booking policy that allows changes.
- Phone check: 390px, no sideways scroll on any page. Page-title photos stack above the title on phones.
- HeyGen / video was dropped by the owner. Do not add video.

## Related
- App (live, deployed 2026-10-04): https://app.mygymlondon.co.uk, repo nevespedropt-prog/mygym-app, redesign commit d40b43d.
- Original site is on Wix (static.wixstatic.com media). Owner: nevespedro.pt@gmail.com.

## Offline copy (added 2026-10-06)
- `site-offline.html` is one self-contained file (photos, logo, fonts all inside, about 4 MB). Double-click it to open it with no internet and no server. It can be emailed or put on a USB stick.
- After changing the mockup: run `python gen_site3.py`, then `python make_offline.py` to rebuild it (the second step needs internet once, to copy the fonts and Wix photos).
- The Google map is replaced by an address card with a "Get directions" link. The `offline-assets` folder holds the Wix photos as downloaded.

## Full site check (2026-10-07)
Checked every page at 360 to 1920 px: no sideways scroll, no broken or clipped items, no console errors, all buttons, menus, filters, bookings and the free-PT questions work. Fixed: selected day chip layout, stale Book MyGym dates and slots (now week of 5 Oct, 05:00 to 23:00), Sunday-first strip on Classes, stock photos in the Instagram strip (now your own photos), duplicate map button, tiny tap target, and 3 links that were not real buttons. Rebuild with `python gen_site3.py` then `python make_offline.py` (use a Python with Pillow and numpy).

## Wix build checklist: legal pages (added 2026-10-08)
- Draft Terms, Privacy policy and Cookie notice are in `legal_pages.py` (HTML in the mockup, text in `LEGAL-DRAFTS.md`). A solicitor must check them before they go live.
- On the live Wix site, turn the cookie banner on and make declining non-essential cookies as easy as accepting. The Cookie notice promises this.
- Link Terms, Privacy and Cookies in the footer on every page, and from the personal training form checkbox.
- No highlighted notes left (owner confirmed no other suppliers). Solicitor pack: `MyGym-legal-pack-for-solicitor.docx`..
- Decided 2026-10-09: members can cancel in the app at any time (Terms and FAQ match the app), and the owner deletes old records by hand after 12 months. No live app change needed.
- App copy of the legal pages: `python legal_pages.py --app` writes `privacy.html`, `terms.html` and `cookies.html` into `..\app` (deployed to the live app on 2026-10-09 with commit 811f690). The app's health form notice links to `privacy.html`. The owner approved deploying them before the solicitor check; if the solicitor changes the text, regenerate with `--app`, bump the cache name in `sw.js` and ask before pushing.

- Kids Gym page text, photo and Wix settings: `KIDS-GYM-PAGE.md` (also the `#kids-gym` page in the mockup).

## Added 2026-10-14
- `OWN-PLATFORM-PLAN.md`: draft plan to move site, payments and bookings off Wix (nothing built).
- `APP-WIX-BOOKING-PLAN.md`: draft plan for app bookings to appear in Wix (tested by hand, not built or deployed).
- `..\vite-project`: empty Vite starter, unused.
