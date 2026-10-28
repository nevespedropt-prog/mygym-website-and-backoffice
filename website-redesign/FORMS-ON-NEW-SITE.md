# Forms on the new website (plan, 2026-10-27, nothing changed yet)

The new site is the code in `website-code`, built from `build_site.py` (do not hand-edit generated pages: change the generator, then run `python build_site.py`).
The back end already exists and is live: `submit-form` at https://ldmksxyilykyfnqnuytv.supabase.co/functions/v1/submit-form. It stores the enquiry, emails the gym and the person, and records marketing consent.
Allowed website addresses in the function: https://www.mygymlondon.co.uk, https://mygymlondon.co.uk (and the app). Test from any other address will be refused (CORS).

## Pages and forms
| New-site page | Form (id in supabase/forms/forms.mjs) | Today |
|---|---|---|
| personal-training.html | `pt-enquiry` | 5-step quiz ends by opening the visitor's email app (mailto) |
| classes.html / book.html (free class) | `trial-class` | none (buttons say "Book in the app") |
| a Contact section (footer or faq.html) | `contact` | none |
| kids-gym.html | `kids-registration` | none |
| footer on every page | `newsletter-signup` | none |
| landing pages (later) | `landing-offer` with `?offer=` | none |
| corporate page (if added) | `corporate-enquiry` | none |

## How to add them (no iframe needed on our own site)
1. Copy `app/supabase/forms/forms.css` and `forms.js` into `website-code/assets/`, and write `assets/forms-config.js` with `window.MGL_FORMS = { endpoint: ".../functions/v1/submit-form", supabaseUrl: "https://ldmksxyilykyfnqnuytv.supabase.co", anonKey: "<the public key in app/config.js>" }` (the public key is not secret).
2. Paste the ready HTML from `app/supabase/forms/html/<form>.html` into the page (the build script can include it with a small replace).
3. Hosting headers on Hostinger (`.htaccess`): allow connect to `https://*.supabase.co`, scripts from self only (no inline script), fonts from self.

## The personal training quiz (needs a small redesign)
The quiz collects: time (AM/PM), goal, experience level, how often, style, and an email. `pt-enquiry` also needs name and phone and a consent. Plan: keep the quiz, add a last step with name, phone, the health note and the tickboxes, then POST to `submit-form` instead of the mailto. Map goal -> `goal` option, level -> `experience`, time/frequency/style -> `health_note` text. Show the form's success message.

## Also on the same pass
- Opening hours: 5 AM to midnight, every day (the old text says Mon-Fri 7am-9pm etc.).
- Privacy and cookie text: say the site is code, sets no cookies, and forms are stored by us (see the updated app privacy page).
- Redirects for old Wix addresses (list in `website-code/README.md`).
- JOIN_URL: decide where Wix checkout lives (join.mygymlondon.co.uk) before launch.

## Open decisions for the owner
1. Hostinger plan and how files get there (File Manager upload or Git deploy).
2. Whether the quiz stays or becomes a plain form.
3. The Wix checkout address (join.mygymlondon.co.uk) and testing it.
