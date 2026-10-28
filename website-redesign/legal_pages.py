"""Draft legal pages for MyGym London: privacy policy, terms and conditions, cookie notice.

One source, two outputs: HTML views for the website mockup and a Markdown file for the owner and a solicitor.
Anything the owner must confirm is written as {{CONFIRM: ...}} and shown highlighted. DRAFT ONLY, not legal advice.
"""
import html as _h
import re

EMAIL = "info@mygymlondon.co.uk"
UPDATED = "26 October 2026"

# A block is a paragraph (str) or a bullet list (list of str).
PRIVACY = ("Privacy policy", "How MyGym London looks after your personal information on our website and in our app.", [
    ("Who we are", [
        "MyGym London (\"we\", \"us\") runs a private community gym and the MyGym London website and app. We are the controller of the personal information described in this policy, which means we decide how and why it is used.",
        "MyGym London is a sole trader business run by Pedro Ricardo Martins Das Neves, who is the person responsible for your information. Registered address: Binfield Road, Stockwell, SW4 6TD. We use the gym premises under an agreement with Bush Hill Park Primary School.",
        "Gym address: Main Avenue, Bush Hill Park, Enfield, EN1 1DS. Email: " + EMAIL + ". Phone: 07459 020381.",    ]),
    ("What this policy covers", [
        "This policy covers the MyGym London website (mygymlondon.co.uk), the MyGym London app (app.mygymlondon.co.uk), and information you give us at the gym, for example when you join or book a personal training session.",
    ]),
    ("What we collect", [
        "Depending on what you use, we collect:",
        ["Account details: your name and email address, and your login. Your password is stored securely and we cannot read it.",
         "Membership details: which plan you hold and whether it is active. The app checks this with our website system so that gym slots are only booked by members whose plan includes them.",
         "Bookings: the classes and gym slots you book, cancel or attend. If you book on our website, the app also shows that booking, matched to your app account by your email address. This is why we ask you to use the same email in both places.",
         "Reminders: if you switch on class reminders, a push notification address for your phone or browser, and a record of which reminders were sent.",
         "Training logs: workouts you record in the app. These are optional.",
         "Weight and body fat: only if you separately agree to this in the app. You can switch it off at any time and your measurements are then deleted.",
         "Health and safety form: your answers about health conditions, allergies and any notes you add, together with a record of the consents you gave. This is health information, which the law treats as special category data (see below).",
         "News and offers: if you tick the box to hear from us by email, we keep a record of the wording you agreed to, the date, and where you ticked it, so we can prove it and respect it if you change your mind.",
         "Service emails: we email the address on your account about your bookings and account, such as booking confirmations and cancellations, class reminders and a welcome message. We keep a short technical record of each email and whether it was sent.",
         "Website forms: what you type into our contact, personal training, free trial, offer, corporate and Kids Gym forms, the page you came from, and a scrambled (hashed) version of your IP address that we use only to stop spam. For Kids Gym this includes your child's details and any medical information you choose to give.",
         "Personal training and enquiries: your email address and the option you choose when you ask for a free personal training session or contact us.",
         "Referrals: if you refer a friend, the details needed to apply your reward.",
         "Sign-up attempts: if you try to create an app account, we keep your IP address and a scrambled (hashed) version of your email address for up to 24 hours, to stop repeated attempts and abuse. Our suppliers may also keep standard technical logs, such as IP addresses.",
         "Payments: payments are taken through Wix. We do not store your full card number."],
    ]),
    ("Why we use it and our legal basis", [
        "We only use your information where the law allows. The reasons we rely on are:",
        ["To provide your membership, account and bookings (contract). This covers account details, membership status and bookings.",
         "To keep you safe while you train (consent). We ask for your explicit consent before we collect your health and safety form answers.",
         "To record your own progress (consent). Weight and body fat tracking only happens if you opt in.",
         "To send class reminders (consent). You choose to switch these on and can switch them off at any time.",
         "To keep our service secure, prevent abuse and fix problems (legitimate interests).",
         "To keep accounting and tax records (legal obligation).",
         "To email you service messages about your account and bookings, such as confirmations, cancellations and class reminders, and to reply to your enquiries (contract, or steps you ask us to take before a contract). These are not marketing.",
         "To send you news and offers by email (consent). We only do this if you opt in, and you can unsubscribe at any time using the link in the email or by contacting us."],
    ]),
    ("Health information", [
        "Your health and safety form is special category data. We collect it only with your explicit consent, and only to help our trainers keep you safe and to decide when it is sensible to adjust a session.",
        "You can see, correct or delete your answers in the app under Profile, Health and consent. You can withdraw your consent at any time in the same place or by emailing us. If you withdraw, your health answers and any weight and body fat measurements are deleted. Withdrawing consent does not affect anything we did before you withdrew.",
        "We ask you to complete the form again after 12 months, or sooner if we change the questions.",
        "Only MY GYM London coaches and management who need it can see members' health forms, through a private login. Each member can see only their own answers.",
    ]),
    ("Who we share it with", [
        "We do not sell your information. We share it only with companies that help us run the service, and only as needed:",
        ["Supabase, which hosts the app database, logins and background functions.",
         "Hostinger, which hosts the MyGym London website.",
         "Wix, which runs our memberships, online checkout, payments and some gym bookings.",
         "Resend, which sends our emails from info@mygymlondon.co.uk: booking confirmations and cancellations, class reminders, welcome emails, replies to your enquiries and, only if you opted in, news and offers. It receives your email address, your first name and the details in the email (for example the class, date and time), and keeps its own delivery records for 30 days. We use its Ireland (EU) sending region.",
         "GitHub, which hosts the app files. It can see technical details, such as your IP address, when your device loads the app.",
         "Your phone or browser maker's push notification service (for example Apple, Google or Mozilla), if you switch on reminders."],
        "We may also share information where the law requires it, for example with the police, a regulator or a court.",
    ]),
    ("How long we keep it", [
        ["Account and booking records: while your account is open and for 12 months afterwards.",
         "Health and safety form answers: until you delete them or withdraw consent, until you delete your account, or after 12 months of not signing in to the app, whichever comes first. They are then deleted automatically.",
         "Weight and body fat measurements: until you switch the option off or delete your account.",
         "Reminder addresses: until you switch reminders off, log out on that device, or delete your account.",
         "Payment and accounting records: usually 6 years, as tax law requires.",
         "Website form enquiries: 2 years. Kids Gym registrations: 1 year.",
         "News and offers consent records: while you are subscribed and afterwards, so we can show that you withdrew."],
    ]),
    ("Where your information is stored", [
        "The app database is hosted by Supabase in Ireland.",
        "Our suppliers may store or process information outside the UK, for example in the EEA or the United States. Where they do, we rely on safeguards the law recognises, such as the UK extension to the EU-US Data Privacy Framework or standard contractual clauses with the UK addendum.",
    ]),
    ("Your rights", [
        "Under UK data protection law you have the right to:",
        ["be told how your information is used, which is the purpose of this policy;",
         "see the information we hold about you;",
         "have wrong information corrected;",
         "have your information deleted in certain cases;",
         "restrict or object to some uses of it;",
         "receive the information you gave us in a portable format;",
         "withdraw your consent at any time, where we rely on consent."],
        "To use any of these rights, use the controls in the app or email " + EMAIL + ". We reply within one month.",
    ]),
    ("Children", [
        "Our Kids Gym session is for children aged 8 and over. For anyone under 18, a parent or guardian creates the account and gives consent on their child's behalf.",
        "If you are a parent or guardian and think your child has given us information without your permission, email us and we will delete it.",
    ]),
    ("Cookies and similar technologies", [
        "The app and website use cookies and similar storage. See our Cookie notice for details and your choices.",
    ]),
    ("Changes to this policy", [
        "We may update this policy. The date at the top shows when it last changed. If a change affects how we use your health information, we will ask for your consent again.",
    ]),
    ("Contact and complaints", [
        "Questions about your information: email " + EMAIL + " or ask us at the gym.",
        "If you are unhappy with how we handle your information, you can complain to the Information Commissioner's Office at ico.org.uk or on 0303 123 1113. We would appreciate the chance to put things right first.",
    ]),
])

TERMS = ("Terms and conditions", "The rules for using the MyGym London website and app, and for joining and booking.", [
    ("About these terms", [
        "These terms apply when you use the MyGym London website, the MyGym London app, or book and join through them. By creating an account, booking or joining, you agree to them. If you do not agree, please do not use them.",
        "MyGym London is a sole trader business run by Pedro Ricardo Martins Das Neves. Registered address: Binfield Road, Stockwell, SW4 6TD. The gym is at Main Avenue, Bush Hill Park, Enfield, EN1 1DS, and we use the premises under an agreement with Bush Hill Park Primary School. Email: " + EMAIL + ". Phone: 07459 020381.",
    ]),
    ("Your account", [
        ["Accounts are for members of MyGym London. Use your own account and keep your login private.",
         "Give us correct information and keep it up to date.",
         "Tell us straight away if you think someone else has used your account.",
         "We may suspend or close an account that is misused, or that is used to cause harm to others or to us."],
    ]),
    ("Memberships and payments", [
        ["Our plans and prices are shown on the Services page and may change. A price change does not affect a period you have already paid for.",
         "Monthly plans have no minimum term. To cancel, give us at least 1 week's notice before your next billing date.",
         "Annual plans are paid in advance. You can ask for a refund within 1 month of paying. After that, we work out any refund by taking off the months you have already used, and if no full month is left, no refund is given. A month that has started counts as used.",
         "Pay as you go sessions can be paid for either when you book or when you arrive.",
         "Payments are taken through Wix.",
         "If a payment fails, we try to take it again 5 days after the failed attempt. If the second attempt also fails, your membership is suspended. A suspended member cannot use the gym, classes or booking in the app until they take out a new membership. You can sign up again using the same email address.",
         "Gym slots in the app are for members whose plan includes gym access."],
        "If you buy online or by phone, you normally have a right to cancel within 14 days. If you start using the service during that time, you must pay for what you have used.",
    ]),
    ("Booking classes and gym slots", [
        ["Booking is limited by the spaces available. Booking a place does not guarantee a place if you arrive late.",
         "You can cancel a booking in the app up to 10 minutes before the session starts. Please cancel as early as you can, or contact us, so that someone else can take your place.",
         "No charge is taken for a booking, whether you cancel it or not.",
         "We may change or cancel a class or session, for example because of illness or low numbers. If we cancel, we will tell you and you will not be charged for it.",
         "The timetable shown on the website and in the app is a guide. Times and availability can change."],
    ]),
    ("Health and safety", [
        ["Complete the health and safety form honestly before you train, and tell us if your health changes.",
         "Exercise carries a risk of injury. You take part at your own risk, but nothing in these terms removes your legal rights or our responsibility where the law does not allow that.",
         "Follow the instructions of our trainers and the rules displayed in the gym. Use equipment as shown and put it back.",
         "Do not train if you feel unwell, or if a doctor has advised you not to. If you are unsure, check with your doctor first.",
         "The workouts, exercises and tips in the app are general guidance. They are not medical advice."],
    ]),
    ("Personal training", [
        ["Your first personal training session is free where the offer is shown on the website. The free session can be used only once per person.",
         "Booking a free session through the website means you agree to these terms and to our privacy policy.",
         "You can reschedule or cancel a session free of charge if you give at least 24 hours' notice.",
         "If you give less than 24 hours' notice, 50% of the session price is charged.",
         "We do not give cash refunds for personal training. If you cancel late, the other 50% of the session price is added as credit towards your next purchase."],
    ]),
    ("Kids Gym", [
        ["Kids Gym is for children aged 8 and over, on Tuesdays and Thursdays from 4pm to 5pm.",
         "Parents can book a place through the class timetable, or just turn up while there are places left.",
         "During Kids Gym the gym is used only by the children and their coach. It is closed to adult members at that time.",
         "Parents or guardians do not have to stay during the session. Full responsibility for the child stays with the parent or guardian.",
         "Children with special needs must have someone to supervise them alongside the coach.",
         "A parent or guardian must complete the health and safety form for their child, and accept these terms on their child's behalf, when booking."],
    ]),
    ("Refer a friend", [
        ["If you refer a friend who buys a plan, you receive a 100% discount on your first billing cycle of the plan shown on the Refer Friends page. The reward goes to the member who refers, not to the friend.",
         "There is no limit on how many friends you can refer, or how many rewards you can earn.",
         "We may withdraw the offer, or refuse a reward where it is being abused."],
    ]),
    ("Using the website and app", [
        ["Do not misuse them, for example by trying to break into them, overload them or copy them.",
         "The content, logo, photos and design belong to MyGym London or are used with permission. Do not copy them without asking us.",
         "We try to keep the website and app available and accurate but cannot promise they will always work, or be free of errors.",
         "Links to other websites, such as Google Maps or Instagram, are provided for convenience. We are not responsible for their content."],
    ]),
    ("Our responsibility", [
        "We are not responsible for loss we could not reasonably have foreseen. We do not limit or exclude our liability for death or personal injury caused by our negligence, for fraud, or for anything else the law does not allow us to limit. Nothing in these terms affects your legal rights as a consumer.",
        "We are not responsible for lost or stolen belongings left in the gym. Belongings are left at your own risk.",
    ]),
    ("Your information", [
        "We handle your personal information as set out in our Privacy policy and Cookie notice.",
    ]),
    ("Changes and ending", [
        ["We may change these terms. We will post the new version here and show the date above. If the change is important, we will tell you.",
         "You can stop using the website and app and close your account at any time. We may end or suspend access if you break these terms."],
    ]),
    ("Law and complaints", [
        "These terms are governed by the law of England and Wales, and the courts of England and Wales can deal with any dispute. If you live in Scotland or Northern Ireland, you may also bring a claim in your local courts.",
        "If something goes wrong, email " + EMAIL + " first and we will do our best to sort it out.",
    ]),
])

COOKIES = ("Cookie notice", "What the website and app store on your device, and the choices you have.", [
    ("What this is", [
        "Cookies are small files saved on your device. We also use similar storage in your browser, such as local storage and a service worker. This notice explains what the MyGym London website and app use.",
    ]),
    ("The app (app.mygymlondon.co.uk)", [
        ["Essential: your login session, so you stay signed in, and app files saved on your device so the app opens quickly and works with a weak signal. The app does not work without these.",
         "Reminders: if you switch on class reminders, your browser saves a push address so we can send them. You can switch this off in the app and it is removed when you log out.",
         "Preferences: small settings such as your choices inside the app.",
         "The app does not use advertising or analytics tools. Its scripts and fonts are served from the app's own address."],
    ]),
    ("The website (mygymlondon.co.uk)", [
        "The website sets no cookies of its own and uses no advertising or analytics tools. Its scripts and fonts are served from its own address. Forms send what you type to our own database (Supabase). The checkout at join.mygymlondon.co.uk is run by Wix, which uses cookies to run the checkout and keep it secure.",
        "Because the website sets no non-essential cookies, it has no cookie banner. If that changes, we will ask for your consent first and make declining as easy as accepting.",
    ]),
    ("Links to other sites", [
        "Links to Instagram take you to that company's site, which has its own cookies and policy.",
        "The website shows a picture of a map. It links to Google Maps, which has its own cookies and policy, only if you click it.",
    ]),
    ("Your choices", [
        ["Block or delete cookies in your browser settings at any time.",
         "You can delete or block cookies and site data in your browser settings. If you block the essential ones in the app, you will not be able to stay logged in.",
         "You can switch off class reminders in the app, or in your device or browser notification settings."],
    ]),
    ("More information", [
        "See our Privacy policy for how we use personal information. Email " + EMAIL + " with any questions.",
    ]),
])

PAGES = [("terms", TERMS), ("privacy", PRIVACY), ("cookies", COOKIES)]

LEGAL_CSS = '''
#terms .phead,#privacy .phead,#cookies .phead{min-height:0;padding:60px 0 34px}
#terms .phead h1,#privacy .phead h1,#cookies .phead h1{max-width:none}
#terms,#privacy,#cookies{scroll-margin-top:84px}
.lgl{max-width:820px;margin:0 auto;font-size:16px;line-height:1.65;color:#17171a}
.lgl .upd{display:inline-block;margin-bottom:6px;padding:6px 12px;border:1px solid #e1e1e5;background:#f7f7f8;font-size:13px;color:#4a4a52}
.lgl .draft{margin:14px 0 6px;padding:12px 16px;border-left:4px solid #e03939;background:#fdecec;font-size:14px;color:#17171a}
.lgl h2{font-size:30px;line-height:1.05;margin:34px 0 10px}
.lgl h2,.lgl p,.lgl li{overflow-wrap:anywhere}
.lgl p{margin:0 0 12px;color:#2c2c31}
.lgl ul{margin:0 0 14px;padding-left:22px}.lgl li{margin:0 0 8px;color:#2c2c31}
.lgl a{color:#e03939;text-decoration:underline}
.lgl .tbc{background:#fff2b3;color:#5a4a00;padding:1px 5px;border-radius:3px;font-size:.92em}
.lgl .others{margin-top:30px;padding-top:18px;border-top:1px solid #e1e1e5;font-size:14px}
.legal a{display:inline;padding:0;opacity:1;text-decoration:underline;color:inherit}
@media(max-width:900px){#terms .phead,#privacy .phead,#cookies .phead{padding:0}#terms .phead .wrap,#privacy .phead .wrap,#cookies .phead .wrap{padding:26px 20px 18px}.lgl h2{font-size:26px}.lgl{font-size:15px}}
'''


def _inline(t):
    """escape text, highlight CONFIRM markers, link the email address"""
    t = _h.escape(t, quote=False)
    t = re.sub(r"\{\{(.*?)\}\}", lambda m: '<span class="tbc">[%s]</span>' % m.group(1), t)
    return t.replace(EMAIL, '<a href="mailto:%s">%s</a>' % (EMAIL, EMAIL))


def _md_inline(t):
    return re.sub(r"\{\{(.*?)\}\}", lambda m: "**[%s]**" % m.group(1), t)


def _lgl(key, page, link):
    """the text of one legal page; link(k) gives the address of another legal page"""
    title, intro, sections = page
    other = [(k, p[0]) for k, p in PAGES if k != key]
    parts = ['<div class="lgl"><span class="upd">Last updated %s</span>' % UPDATED,
             ]
    for h, blocks in sections:
        parts.append("<h2>%s</h2>" % _h.escape(h))
        for b in blocks:
            if isinstance(b, list):
                parts.append("<ul>%s</ul>" % "".join("<li>%s</li>" % _inline(x) for x in b))
            else:
                parts.append("<p>%s</p>" % _inline(b))
    parts.append('<p class="others">Also see: %s.</p>' % " · ".join('<a href="%s">%s</a>' % (link(k), _h.escape(t)) for k, t in other))
    parts.append("</div>")
    return "".join(parts)


def view_html(key, page):
    title, intro, sections = page
    return ('<section class="view" id="%s"><div class="phead"><div class="wrap"><span class="chip">Legal</span><h1>%s</h1><p>%s</p></div></div>'
            '<div class="wrap sec">%s</div></section>') % (key, _h.escape(title), _h.escape(intro), _lgl(key, page, lambda k: "#" + k))


APP_CSS = '''
:root{--bg:#f6f5f4;--line:#ececee;--txt:#1d1d20;--mut:#66656d;--acc:#e03939}
@font-face{font-family:"Barlow Condensed";font-weight:800;font-style:normal;font-display:swap;src:url(fonts/barlow-condensed-800.woff2) format("woff2")}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--txt);font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.top{background:#fff;border-bottom:1px solid var(--line);padding:12px 18px;display:flex;align-items:center;gap:14px}
.top a{color:var(--acc);font-weight:700;text-decoration:none}.top img{height:32px;border-radius:6px}
main{max-width:760px;margin:0 auto;padding:22px 18px 60px}
h1{font:800 44px/1 "Barlow Condensed",sans-serif;text-transform:uppercase;margin:6px 0 4px}
.sub{color:var(--mut);margin:0 0 14px}
.lgl h2{font:800 28px/1.05 "Barlow Condensed",sans-serif;text-transform:uppercase;margin:30px 0 8px}
.lgl p{margin:0 0 12px}.lgl ul{margin:0 0 14px;padding-left:22px}.lgl li{margin:0 0 8px}
.lgl a{color:var(--acc)}
.lgl h2,.lgl p,.lgl li{overflow-wrap:anywhere}
.upd{display:inline-block;padding:5px 11px;border:1px solid var(--line);background:#fff;font-size:13px;color:var(--mut)}
.draft{margin:14px 0 6px;padding:12px 16px;border-left:4px solid var(--acc);background:#fdecec;font-size:14px}
.tbc{background:#fff2b3;color:#5a4a00;padding:1px 5px;border-radius:3px;font-size:.92em}
.others{margin-top:28px;padding-top:16px;border-top:1px solid var(--line);font-size:14px}
'''


def standalone(key, page):
    """a complete page for the app (served from the app's own address)"""
    title, intro, _ = page
    return ('<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:; base-uri \'self\'; object-src \'none\'">'
            '<title>%s | MY GYM London</title><style>%s</style></head><body>'
            '<div class="top"><img src="icons/logo-header.png" alt="MY GYM London"><a href="./">Back to the app</a></div>'
            '<main><h1>%s</h1><p class="sub">%s</p>%s</main></body></html>') % (
        _h.escape(title), APP_CSS, _h.escape(title), _h.escape(intro), _lgl(key, page, lambda k: k + ".html"))


def all_views():
    return "".join(view_html(k, p) for k, p in PAGES)


def markdown():
    out = ["# MyGym London: draft legal documents", "",
           "Last updated %s. DRAFT for the owner and a solicitor to review. Not legal advice." % UPDATED, "",
           "Items shown as **[CONFIRM: ...]** need the owner's answer before these go live.", ""]
    for key, (title, intro, sections) in PAGES:
        out += ["---", "", "# " + title, "", "*" + intro + "*", ""]
        for h, blocks in sections:
            out += ["## " + h, ""]
            for b in blocks:
                if isinstance(b, list):
                    out += ["- " + _md_inline(x) for x in b] + [""]
                else:
                    out += [_md_inline(b), ""]
    return "\n".join(out)


if __name__ == "__main__":
    import os
    here = os.path.dirname(os.path.abspath(__file__))
    open(os.path.join(here, "LEGAL-DRAFTS.md"), "w", encoding="utf-8").write(markdown())
    n = sum(len(re.findall(r"\{\{", str(p))) for _, p in PAGES)
    print("wrote LEGAL-DRAFTS.md; open CONFIRM items:", n)
    import sys
    if "--app" in sys.argv:   # also write the three pages into the app folder (local only, not deployed)
        app = os.path.join(os.path.dirname(here), "app")
        for key, page in PAGES:
            open(os.path.join(app, key + ".html"), "w", encoding="utf-8").write(standalone(key, page))
        print("wrote privacy.html, terms.html, cookies.html into", app)
