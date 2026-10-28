# MyGym London website (code, no Wix) - pages only, NOT DEPLOYED

Built 2026-10-11 from the approved mockup. Plain HTML, CSS and JS. No build step to run it, no framework.
Pages: index, classes, book, services, personal-training, refer-friends, faq, kids-gym, terms, privacy, cookies, login (sends members to the app), 404, plus robots.txt and sitemap.xml.

## How it is made
`website-redesign\build_site.py` reads the mockup `site-w.html` (made by `gen_site3.py`) and writes this folder. Do not hand-edit the generated files: change the generators, then run `python gen_site3.py` (if the mockup text changed) and `python build_site.py` (needs internet once to copy the photos and Google fonts into `assets\`). Everything is self-hosted: no Wix images, no Google fonts at runtime.
Settings at the top of `build_site.py`: `APP`, `JOIN_URL`, `SITE`.

## What is real and what is not
- Classes page: live weekly timetable read from the same Supabase `classes` table as the app (public key, classes only, `kind=class`). Booking happens in the app (buttons say "Book in the app").
- Book the gym: explains slots and sends members to the app.
- Login page and "Log in" links: go to https://app.mygymlondon.co.uk.
- Personal training questionnaire: at the end it opens the visitor's email app with their answers addressed to info@mygymlondon.co.uk. Nothing is stored on the site. A proper form (stored enquiries) needs a small backend and is a decision for the owner.
- Join now / plan buttons: go to `JOIN_URL` (today the Wix Pricing Plans page https://www.mygymlondon.co.uk/pricing-plans/memberships). Payments stay with Wix until the payment provider decision.
- Review quotes and the Instagram strip are still the mockup's placeholders (owner to replace with real Google reviews).

## Before going live (nothing below is done)
1. **Domain.** If www.mygymlondon.co.uk points here, the Wix pages (plan checkout, members area, old links) stop being reachable on that name. Decide where Wix lives (a subdomain such as join.mygymlondon.co.uk or its wixsite address), change `JOIN_URL`, then move the domain. Needs the owner's go-ahead.
2. Hosting: GitHub Pages in its own repo is the plan (free, same way the app is deployed).
3. Legal text: the Cookie notice and Privacy policy mention Wix running the website. Once the site is code, the wording must change (the site sets no cookies and has no analytics). Do not publish the old wording; solicitor check after.
4. The Kids Gym "Join now" goes to the Wix plans page; the £20 Kids Gym plan does not exist yet.
5. Redirects for old Wix addresses (/our-classes, /book-the-gym, /our-personal-training-offer, /pricing-plans/memberships, /privacy-notice, /t-and-cs, /refer-friends) so Google and members do not hit dead links.
6. Real phone check, and a check on the live address after deploy.
7. "25+ classes a week" is a safe true minimum (about 28 sessions in the timetable); change if you prefer another number.

## Update 2026-10-27: real forms built in (still NOT deployed)
- Personal training quiz now ends with name, phone, email, note and consent boxes and sends the request to the back end (`submit-form`, form `pt-enquiry`). It no longer opens an email app. Tested for real on a local copy: the enquiry was stored with the quiz answers and the emails went out (test data deleted).
- Free class form (classes page, live timetable list), contact form (FAQ page), Kids Gym registration (Kids page) and a newsletter box in the footer of every page. Forms and their styles come from `app\supabase\forms` (one copy to maintain).
- Join links now go to https://join.mygymlondon.co.uk (the Wix checkout after the move; owner decision 2026-10-27). That address shows the Wix HOME page only, so make the Wix home page the plans and checkout page, and test checkout and member login there before launch.
- The Google map embed is replaced by a map picture that links to Google Maps (keeps the site free of third-party cookies).
- `.htaccess` for Hostinger: HTTPS and www, redirects from old Wix addresses, security headers (scripts only from the site itself; forms may talk to *.supabase.co).
- Hours already say 5am to midnight every day.
- Rebuild: `python website-redesign\build_site.py` (add `--test` for the test copy `website-code-test`). The forms need `app\supabase\forms\html` and `forms.js`.

### Still to do before launch
1. Upload everything in this folder (including `.htaccess`) to Hostinger `public_html`; point the root and www records at Hostinger (keep MX, SPF, DKIM, DMARC, Resend records; Wix keeps the nameservers).
2. Check on the real address: each form once, the redirects, the headers, phone view.
3. Privacy policy and cookie notice wording for a code site (the old text says Wix runs it) and solicitor review.
4. Review quotes and the Instagram strip are still mockup placeholders.
5. The newsletter and every form only work on https://www.mygymlondon.co.uk and https://mygymlondon.co.uk (the function refuses other addresses).

## SEO, local and AI search (added 2026-10-27, built by `build_site.py`)
- Every page: keyword titles and descriptions, canonical, Open Graph and Twitter cards, `max-snippet` robots tag. Login and 404 are `noindex`.
- Structured data (JSON-LD, in `<head>`): `ExerciseGym`/`LocalBusiness` with address, phone, 5am-midnight hours, areas served, Instagram and the full price list as offers (home); `FAQPage` built from the FAQ (faq); `Service` for personal training and Kids Gym; breadcrumbs and `WebPage` on every page. If a price or opening hour changes, change it in `build_site.py` (`OFFERS`, `HOURS`) and in the page text, then rebuild.
- `robots.txt` explicitly allows the AI crawlers (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended, Applebot and others). `llms.txt` is a plain-text summary of the gym, prices and pages for AI assistants. `sitemap.xml` has lastmod dates.
- Not done, needs the owner or live site: Google Business Profile (name, address, phone and hours exactly as on the site; add the website link; ask members for reviews), Google Search Console and Bing Webmaster Tools (verify the domain, submit the sitemap, then use URL inspection on the home page), same name/address/phone on Instagram and any directory listing, real member reviews on the site (then add `aggregateRating` only if the reviews are real), geo coordinates in the schema (add `geo` once checked on the map), a few local landing sections (for example "gym near Winchmore Hill / Southgate / Palmers Green") only if they are true and useful.
