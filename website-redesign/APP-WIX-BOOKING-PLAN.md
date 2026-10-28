# App to Wix bookings plan (DRAFT for owner approval, nothing built or deployed)

Written 2026-10-14. Goal: when a member books a class or gym slot in the app, the booking also exists in Wix as a confirmed booking (takes a real space, no payment), so Wix and the app never disagree and nobody is double booked.

## What was tested on 2026-10-14 (live Wix, 2 test bookings, both cancelled)
- Create Booking works for class sessions: `POST https://www.wixapis.com/bookings/v2/bookings` with `bookedEntity.slot.eventId`, `contactDetails`, `totalParticipants: 1`, `participantNotification.notifyParticipants: false`. No payment option needed (custom checkout), no change to Wix settings.
- Status `CREATED` (the default) does NOT hold a space. Status `CONFIRMED` does: a session went 10 of 10 to 9 of 10, and back to 10 of 10 after cancel.
- Normal cancel is refused by the class booking policy (BOOKING_POLICY_VIOLATION). The documented override `flowControlSettings.ignoreCancellationPolicy: true` worked.
- Wix checks availability itself. A full session should be refused.
- Wix does NOT check the member's pricing plan. The app must.
- Not checked: emails Wix may have sent, a Pedro Neves contact in Wix, whether the booking shows in the Wix calendar.

## Design
1. **`book-class` edge function** (server side only; the Wix key never reaches the browser):
   1. Verify the member's login.
   2. Check access in the app: active plan from `member_access` and `class_access_plans` / `gym_access_plans`, and the suspended rule.
   3. Map the app class to its Wix service id (new table `wix_service_map`: class name or id to Wix service id).
   4. Find the Wix session: List Event Time Slots (`POST /_api/service-availability/v2/time-slots/event`) for that service and start time; read `eventId` and `remainingCapacity`.
   5. Create the Wix booking as `CONFIRMED`, notify off. Wix refuses if full.
   6. Save the app booking row with the Wix booking id. If this save fails, cancel the Wix booking again (rollback).
2. **`cancel-booking` function:** follows the owner's cancel rule (decision 3), then cancels in Wix and updates the app row.
3. **Reconcile job (every few minutes, pg_cron):** read Wix bookings and update app rows (status, bookings made in Wix by clients, cancellations by staff). Match clients by email; unmatched ones are logged, not guessed.
4. **Switch:** `app_settings.wix_booking_enabled`, default off. The app keeps working as today until it is switched on.
5. **Safety:** Wix is the source of truth for spaces. All Wix calls log to a table (no personal data beyond booking id). Alert if the sync fails.

## Needs from the owner (not mine to do)
- A Wix API key with Bookings permissions, created in Wix and stored as a Supabase secret by the owner. I do not type or see it.
- Permission rules for the Wix calls (already added once; may need again).
- Decisions below.

## Rules from Wix settings (HIIT checked; others to check)
- 1 person per booking, bookings open about 21 days ahead (30240 minutes), no waitlist, classes cannot be cancelled by the client, reschedule allowed up to 24 hours before.
- Session capacity can differ from the service default (service says 8, sessions show 10). Session value counts.

## Phases
1. Owner approves this plan and answers the decisions.
2. Build on a test copy: functions, tables, mapping, feature flag off. No live change.
3. Test in the Supabase test branch or with the flag off, using Wix test bookings for the owner's own contact and quiet sessions. Check emails, contacts, calendar.
4. Show the owner screenshots and results.
5. Owner approves, then deploy with the flag still off, then switch on for the owner only, then for everyone.
6. Update privacy page (bookings are shared with Wix), notes, skill, master prompt, README.

## Owner answers (2026-10-15)
- Pay as you go classes are paid on the website (Wix: HIIT accepts £6 online or 9 plans). Wix creates the booking; the reconcile job shows it in the app (matched by email). The app does not create or charge PAYG bookings; app bookings need an active plan.
- Kids Gym walk-ins are handled on the gym floor. No app rule.
- Checked in Wix: Open Gym Access is plan-only (no online price, 5 plans). A per-visit gym price would have to be a plan; not yet checked which plans are which.

- Access levels today (owner, 2026-10-15): (a) class membership = can book classes in the app; (b) gym and class membership = can book classes and the gym. More plans will be added later. Design: a mapping table from Wix plan id to access level (classes, gym), so a new plan is a new row, not new code. Anyone with no active plan gets no app booking access.

## Decisions needed
1. (CLOSED, see answers above) PAYG classes and Kids Gym walk-ins.
2. (ANSWERED, see access levels above; still to do: map each current Wix plan id to class or gym-and-class, and confirm whether a gym-only plan is still planned.)
3. (CLOSED 2026-10-16, scope checked: one policy covers all 22 services) Cancel rule: members can cancel up to 10 minutes before the session, in Wix AND the app. Wix Default booking policy updated (cancellation on, 10 minutes, new wording, reschedule still 24 hours, all else unchanged, revision 4 to 5). App v26 live: cancel buttons lock after the cutoff. Server rule in supabase/migration-cancel-limit.sql is written but NOT applied. Open: PAYG £6 cancellations are not auto-refunded by Wix (only plan sessions are returned); owner to decide manual refund.
4. (DECIDED 2026-10-16, NOT BUILT) Emails: every member gets a booking confirmation email whether they book in Wix or in the app. Wix-made bookings: Wix's own confirmation email (must be verified as switched on and working). App-made bookings: the app sends its own email. No double emails: bookings the app creates in Wix are sent with notifyParticipants false (as in the tests), and the reconcile job must never email for bookings that came from Wix. Needs: an email service (proposed: Resend, free tier), a verified sender address on mygymlondon.co.uk (DNS records; the domain is managed in Wix), the API key stored by the owner as a Supabase secret, an edge function `send-booking-email` fired when a booking row is added, a plain transactional template (class, date and time in London time, address, cancel rule, link to the app), and the privacy page updated to name the email service. The app has no email-sending code today (Supabase Auth only sends login and reset emails).
5. Gym slots (Open Gym Access, 6 spaces, hourly): book in Wix too?
6. If Wix is down: block bookings, or queue them?

## Not tested
Everything in the design beyond the two manual bookings. No function, table or schedule exists yet.

## Owner answer on PAYG cancellations (2026-10-16)
No refunds. A cancelled pay-as-you-go class becomes a credit for another class. Not designed or built. Open design points: where the credit lives (Wix plan or credit, or a table in the app), how it is used when booking, expiry, who can see it, and wording in the Terms.
