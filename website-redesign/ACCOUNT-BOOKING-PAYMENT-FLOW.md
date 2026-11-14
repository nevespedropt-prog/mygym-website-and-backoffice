# Website: account, booking and payment flow (decisions answered 2026-11-14; steps 1 to 5 not built yet)

Written 2026-11-14. Goal: a visitor can find the website, see the timetable, create an account, pay as you go or buy a membership, and book, with the same access as today's Wix site. The app is for people with a membership. Every booking, payment and person ends up in one place, matched by email, with no manual steps.

## The one rule that keeps it tidy
**One person = one account = one email.** The account is the same login the app uses (our own sign-in, Supabase). Wix stays the till: plans, card payments, invoices, refunds and the booking calendar. The website and the app are two front doors to the same accounts and the same Wix bookings. Email is the key that joins them.

## The journey

1. **Visitor looks at the timetable** (public, live, read only).
2. **Visitor taps Book** on a class.
   - Not signed in: "Log in or create an account" (they stay on the website).
   - Creating an account: name, email, password, agree to terms, optional marketing tick (separate, never pre-ticked). The server also creates their contact in Wix so Wix and our system hold the same person. Health form (the short PAR-Q) is asked before the first booking, as in the app.
3. **Signed in. What happens depends on the person:**

| Person | What they see on Book | Result |
|---|---|---|
| Active **class** membership (or gym + class) | Book | Booked straight away by the same rules as the app (access, capacity, 10 minute cancel cut-off). Confirmation email. |
| **No plan** (new, or pay as you go) | "Pay as you go, £6" and "See memberships" | PAYG: Wix-hosted secure checkout for that exact class. After payment Wix creates the booking, we show it and email the confirmation. |
| Active **gym-only** membership, tapping a class | "Your plan covers the gym. Pay as you go for this class, or upgrade." | Same as above. |
| **Gym slot**, with a gym membership | Book | Booked straight away. |
| **Gym slot**, no gym membership | Needs a decision (see Decisions). | |

4. **Buying a membership:** signed in only. We open the Wix checkout for that plan (hosted by Wix, we never see card details) with their email attached. After payment the plan shows on their account and unlocks booking (within the 5 minute sync; see Loose ends for how we avoid a gap).
5. **The app:** members log in with the same email and password. A person with no membership who logs in sees "Book classes on the website" with a link; a member books in the app or on the website, whichever they prefer. Nothing to migrate: same account, same bookings.

## What already exists (verified in the repo)
- Our own account system (sign up, log in, password reset, consent) used by the app.
- `book-class` function: checks login, plan access, capacity (Wix is the source of truth) and creates the Wix booking.
- `sync-wix-bookings` every 5 minutes mirrors confirmed Wix bookings into our system, matched by email (anonymous counts for people with no account).
- `sync-wix-clients` / `sync-wix-payments`: Wix contacts, plans and orders copied every 30 minutes; back office shows them.
- `admin-add-member`, `member-signup`: create the Wix contact/member and our account from an email.
- Access mapping from Wix plan to what it allows (classes, gym).
- Wix checkout for plans at `join.mygymlondon.co.uk` (already used in the back office).

## What has to be built
1. **Website sign-up and log in** using the existing accounts (new pages on the website, same rules as the app, health form gate).
2. **Server function `website-checkout`:** for a signed-in person it returns the right Wix checkout link (PAYG class session or a plan), with their email attached, and remembers what was started. Card details only ever touch Wix.
3. **Return page** (thank you / payment pending): after Wix sends the person back, it checks the order or booking with Wix and shows the result. If the payment has not landed yet it says so and refreshes, instead of leaving them guessing.
4. **Booking on the website for members:** call `book-class` (allow the website address, same rules, rate limiting).
5. **Account page:** plan, upcoming bookings, cancel (same 10 minute rule), health form, marketing preference.
6. **Back office:** "Unmatched payments and bookings" list (anything from Wix with no matching account), so nothing is lost.
7. **App message** for people with no membership.
8. Terms, privacy and cookies wording updated (payments through Wix, bookings shared with Wix).

## Loose ends this design closes
- **Anonymous buyers.** Links to pay are only created for a signed-in person, so every payment has an account. If someone pays directly on a Wix page without an account, they are matched by email the day they sign up; until then they appear in the "unmatched" list.
- **Wrong or different email at checkout.** The email is attached to the checkout by our server, not typed again. Anything that still mismatches goes to the unmatched list; we never guess.
- **Paid but not booked / booked but not paid.** The return page and a scheduled check compare Wix orders with our bookings and flag differences.
- **Double booking.** Wix remains the source of truth for spaces; our function refuses if Wix refuses.
- **Gap between paying for a plan and being able to book.** The return page asks Wix for the order directly and unlocks booking at once instead of waiting for the 5 minute sync.
- **Cancelling a pay-as-you-go class.** Needs the credit rule decided (below). Until then the website says "Contact us to change a pay-as-you-go booking" so no money is lost.
- **Health form before first booking**, the same gate as the app.
- **Security:** no card data on our side, the Wix key never reaches the browser, the website address is the only one allowed to call the new functions, sign-in required for every action, rate limits on sign-up and checkout creation.

## Rule: nobody pays without an account
Confirmed by the owner. A payment link or checkout is only ever created for a person who is signed in, so every payment, booking and credit belongs to an account (one email). There is no "pay as a guest" path. Wix pages stay reachable directly, but nothing on our website links to them without sign-in; a payment made there anyway is matched by email later and listed under "unmatched" until the person has an account.

## Decisions (owner answers, 2026-11-14)
1. **Pay as you go options, kept on the side until the website moves.** Nothing is added to what the current Wix site shows. Each option exists in Wix but is switched off for the public:
   - **PAYG Gym Visit, 4 pounds (price still to be confirmed)**: created in Wix as a PRIVATE plan (id `b0a85203-cbb9-4232-b91d-8312b62c8ee8`). Wix does not allow a plan shorter than 7 days, so it is valid 7 days from purchase and is one visit. Not linked to the gym service, not on any page. Checked: the string does not appear on the public Wix plans or gym booking page.
   - **PAYG Kids Gym Visit, 4 pounds**: same, PRIVATE plan `f565d7c2-fab9-4170-96d1-1dde735c2395`.
   - **PAYG classes (6 pounds) and Pilates (7 pounds)**: already set up on the Wix class services; nothing created here. The owner said "yoga"; the timetable has Pilates at 7 pounds, so Pilates is assumed. Please confirm.
2. **Cancelled pay-as-you-go class = a credit, no refund.** Built: table `class_credits`, back office "Class credits" on each member (add, use, cancel), and `consume_class_credit()` for the booking function. Credits do not expire unless an expiry date is typed. Nothing creates or spends a credit automatically yet: that is wired in step 3.
3. **Wix is the till**, confirmed. Important finding: `join.mygymlondon.co.uk` does not exist yet (DNS lookup says no such domain, 2026-11-14). It is a launch-day step (the Wix site moves to join). Until then the back office "Open the Wix checkout" button points to the working Wix plans page on www (set in `admin-site/config.js` as `CHECKOUT_URL`); after launch change it to join.
4. **Real test payment: last**, together with the owner, on a pay-as-you-go class, then refunded by the owner in Wix (we cannot refund it from here).

## To-do at the website move (nothing here is live now)
- Create `join.mygymlondon.co.uk`, check Wix checkout works there, then set `CHECKOUT_URL` in `admin-site/config.js` and the `CHECKOUT` / `MANAGE` constants in `admin-edit-member`, `admin-add-member` and `sync-wix-payments` to join.
- Switch on the pay-as-you-go options: link PAYG Gym Visit to the Open Gym Access service and PAYG Kids Gym Visit to the Kids Gym service, make the plans buyable, confirm the gym price (4 pounds), confirm Pilates (7 pounds), then map the plan ids to access in the app (`gym_access_plans`) so a PAYG visit unlocks one booking and not a week of access. Until that mapping exists, a bought PAYG plan would otherwise unlock the gym for its whole 7 days.
- `_plan_type` already labels any plan with "PAYG" or "pay as you go" in its name as "Pay as you go". `admin-add-member` still uses its own copy of the old rule (a PAYG gym plan added by hand would be labelled Gym + Classes); fix it when that function is next redeployed.
- Steps 1 to 5 below.

## Proposed order (each step ends with a test you can see)
1. Website sign-up and log in + account page (no payments yet).
2. Booking on the website for members, plus the gym slot rule.
3. Pay-as-you-go checkout, return page, confirmation email, credit rule.
4. Membership purchase and instant unlock.
5. Back office "unmatched" list, app message for non-members, wording updates.
Nothing is switched on for the public until you approve; every step stays behind a switch that is off until then.

## Not verified yet
- Whether the Wix-hosted checkout accepts an email we pass in or asks the buyer to sign in to Wix again (this decides how smooth step 3 and 4 feel). Needs the test in decision 4.
- Whether the booking confirmation Wix sends for a PAYG booking is switched on (the 16 October notes say it must be checked).
- That the app can open straight to a class after login (otherwise "Book" opens the timetable).
