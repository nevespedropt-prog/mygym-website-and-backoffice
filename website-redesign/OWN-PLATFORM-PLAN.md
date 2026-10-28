# Own platform plan: move the website, payments and bookings off Wix (DRAFT, nothing built)

Written 2026-10-11. For owner approval. No live system has been changed.

## Goal
One address, www.mygymlondon.co.uk, serving the new design, with plans, payments, bookings, emails and a client list all running on our own system, so the "second link" problem disappears. Clients should notice the new look and nothing else.

## What already exists
- Supabase back end (eu-west-1): logins, profiles, health forms, consents, classes and timetable sync, booking tables, member access.
- The app at app.mygymlondon.co.uk (PWA).
- The new code website (`website-code`), tested at the test address.

## What must be added
| Part | Choice (proposed) | Notes |
|---|---|---|
| Hosting | Cloudflare Pages (or Netlify) | Domain can stay registered at Wix and only point to the new host |
| Plans and card payments | Stripe Billing (Checkout + Customer Portal) | Monthly subscriptions, Apple/Google Pay, retries, receipts, cancel and pause. Test mode first |
| Booking rules | Existing app tables plus plan check | No plan, no access rule; PAYG and Kids Gym walk-ins to decide |
| Emails | Resend or Postmark | Booking confirmation, reminders, receipts, failed payment |
| Client list (CRM) | Supabase tables plus an admin page | Members, plans, notes, suspended list. HubSpot is an option if wanted |
| Staff admin | Admin area in the app | Timetable, members, payments view |
| Contact and PT form | Stored in Supabase, email to info@ | Replaces the mailto link |

## Phases
1. **Decisions** (owner): payment provider, plan names and prices, PAYG and Kids Gym rules, CRM choice.
2. **Back end on a test copy:** Stripe test mode, webhook handler, plan table, access checks. No real money.
3. **Emails and admin page.**
4. **Test with the team:** test cards, failed payment, cancel, pause, refund, wrong-plan booking.
5. **Legal and compliance review:** privacy, terms, cookies updated (they currently mention Wix), refunds and cancellation wording, VAT position with the accountant, ICO registration.
6. **Member migration plan:** see below.
7. **Parallel run:** both systems available, new members join on the new site.
8. **Switch:** point the domain to the new host on a quiet day. Keep Wix untouched as a fallback for about a month. Do not delete anything at Wix.

## The main risk: existing subscriptions
- 55 active Wix subscriptions (227 total at last count). Stripe cannot read cards out of Wix.
- Option A: ask Wix and the payment processor about a card transfer. Possible in some cases, not guaranteed, takes time.
- Option B: members re-enter their card once on the new site. Plan a clear message beforehand and a grace period so nobody is cut off.
- Decision needed from the owner. Until switch-over, Wix keeps charging as normal.

## Other risks
- Payment bugs cost money or trust, so: test mode first, alerts on failed webhooks, a manual fallback.
- Support moves from Wix to us. A named person must own it.
- Legal and tax must be checked by a professional, not by me.
- Data: contacts export (854) and the Wix subscription numbers are the backup baseline.

## Costs (ESTIMATES from memory, verify before relying on them)
- Hosting: free to a few pounds a month.
- Stripe: per-transaction fees only; check current UK card rates and any Billing percentage.
- Email service: free tier likely enough at this size.
- Supabase: current plan, may need a paid tier for backups.
- Saved: the Wix Premium site plan once fully moved (owner knows the current price; not recorded here).
- Build time: several weeks of careful work, mostly payments, testing and the migration.

## Decisions needed
1. Stripe or another provider.
2. Existing members: try the card transfer first, or re-enter once.
3. Plan names and prices (three plans still missing in Wix).
4. PAYG classes and Kids Gym walk-ins under "no plan, no access".
5. Who owns support after the switch.
6. CRM: own admin page or a connected CRM.

## Not done and not tested
Everything above is a plan. No payment code, no Stripe account, no admin page, no domain change exist yet.
