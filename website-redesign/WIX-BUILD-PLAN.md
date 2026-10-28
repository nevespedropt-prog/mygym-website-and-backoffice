> SUPERSEDED 2026-10-11: the owner chose a pages-only code website (see `..\website-code\README.md`). Step 1 content fixes below (plans, Kids Gym plan, cookie text) still apply to the Wix side that stays for payments and members.

# Wix build plan (DRAFT for owner approval, nothing has been changed)

Written 2026-10-09. Site: MyGymLondon, www.mygymlondon.co.uk, Wix **classic Editor** site with Velo on, Premium plan, custom domain. Apps installed: Bookings, Pricing Plans, Members Area, Forms & Payments, Invoices, Online Programs, Video, Promote SEO, Hotels (unused?).

## What this means for how we build

The live site is a classic Editor site. Wix does not let me redraw its pages through the API. I can change the data behind the site (services, plans, sessions, prices, text in some apps) but the page layout, sections, photos and the menu are built in the Wix Editor, by a person clicking.

Three ways to get the new design onto the site:

| | A. Rebuild in the Wix Editor, with the mockup as the spec | B. Replace the site with a coded Wix Headless site (the mockup code) | C. Keep the layout, fix the content only |
|---|---|---|---|
| Who does the layout | You in the Editor, with my page-by-page text, photos and settings; or me driving the Editor in the browser (slow, fragile, you watch) | Me | Nobody |
| Keeps members, bookings, pricing plans working | Yes | Needs rebuilding on the Wix SDK. Highest risk to members and the app sync | Yes |
| Risk to the live site | Low if done on a draft and published once | High | Lowest |
| Result | New design | New design, full control for me | Old design, correct facts |

**Recommendation: A, in two steps.** First C (content fixes that are safe and I can do by API or text), then A one page at a time on a draft, with a screenshot of each page for your approval before publishing. B only if you want me to own the whole site long term, and then as a separate project after the payment provider decision.

## Step 1: safe content fixes (no layout changes)

1. Create the three missing Pricing Plans (Gym Membership, Gym Classes and 2 Personal Training, Kids Gym £20 a month). Needs your names and prices confirmed. Then I add their ids to the app's access lists.
2. Attach the Kids Gym plan to the Kids Gym service, unhide it, run the app sync, swap the app rows (steps are in PROJECT-NOTES.md).
3. Update the plan text "Access to over 40 classes a week" (the site has about 28 sessions).
4. Remove old classes still showing anywhere (Zumba, Family Fit, Aerobics Fusion, HIIT Glow) and delete the empty hidden Kids MyGym service, if you agree.
5. Cookie banner: switch on, make "decline" as easy as "accept".
6. Footer: link Terms, Privacy and Cookies on every page. Pages themselves are live in the app today (app.mygymlondon.co.uk/terms.html and so on); the website should carry its own copy as pages.
7. Google Business hours to 5am to midnight (yours to do).

## Step 2: page by page (from the mockup, in this order)

For each page: I give you the exact text, photo list and Wix settings; you or I build it on a Wix draft; screenshot at phone and desktop; you approve; next page. Nothing is published until all approved pages are checked together.

| # | Page | Source in the mockup | Needs from Wix | Open questions |
|---|---|---|---|---|
| 1 | Home | `#home` | Bookings widget for the open now line is not needed; Google map; Instagram feed widget | Real Google reviews to replace the sample quotes; app QR image |
| 2 | Classes | `#classes` | Wix Bookings schedule widget with member login; bookings list and cancel/reschedule in the Members Area | Booking policy must allow cancel and change; the mockup's filters may not exist in the Wix widget |
| 3 | Services (plans) | `#services` | Pricing Plans page with the 8 plans | Plan names and prices to confirm (see README assumptions); PAYG Gym £4 per visit |
| 4 | Personal Training | `#pt` | Form with the 5-step questions and the free session booking; emails you | Form storage and who gets the email |
| 5 | Book MyGym (gym slots) | `#book` | Wix Bookings service for open gym slots, members only | Tuesday and Thursday 4pm closed to adults (Kids Gym) |
| 6 | Kids Gym | `#kids-gym`, `KIDS-GYM-PAGE.md` | New page, class page text and photo on the service | Needs the £20 plan first |
| 7 | Refer Friends | `#refer` | Referral page or Wix referral setup | Confirm the 50% and 100% offers work with Wix Pricing Plans |
| 8 | FAQ | `#faq` | Page with 13 questions | none |
| 9 | Terms, Privacy, Cookies | `#terms`, `#privacy`, `#cookies`, `LEGAL-DRAFTS.md` | Three text pages, linked from footer and the PT form checkbox | Solicitor changes |
| 10 | Member login | `#login` | Wix Members login | Do not say "free account" |

## Before publishing

- Phone check at 320, 390 and desktop, no sideways scroll; click every button and link; check the Wix menu on phone.
- Redirect check for any page address that changes (SEO).
- Back up first: note the current page list and take screenshots of the live pages so we can rebuild if something breaks.
- Real phone check: yours.

## Decisions I need from you

1. A, B or C (recommended: C now, then A page by page).
2. Who builds the layout in the Editor: you, or me through the browser while you watch.
3. Plan names and prices for the three new plans.
4. Pay as you go classes and Kids Gym walk-ins (affects the app rule for suspended members).
5. Delete the old hidden Kids MyGym service in Wix: yes or no.
