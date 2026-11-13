import os
OUT = os.path.dirname(os.path.abspath(__file__))
M = "https://static.wixstatic.com/media/"
def W(u,w,h):
    return u+"/v1/fill/w_%d,h_%d,al_c,q_80/"%(w,h)+u.split("/media/")[1]

HERO = W(M + "45b3f3_cb324400bc334a19b5b504a25b47054c~mv2.jpg",1800,900)
P1 = W(M + "45b3f3_dad9105170484ea4b301d38a01b5afac~mv2.jpg",900,1000)
P2 = W(M + "45b3f3_7f1e7b6bb97544568bca2e13d0699ac2~mv2.jpg",900,1000)
G = [W(M + x,420,320) for x in [
    "11062b_c979697e74704106966bd5f8e943ebce~mv2.jpg", "11062b_0122a680a07d4a6bae7d4ef812b5ead8~mv2.jpg",
    "11062b_c22336652ab74a1b926d683d156b6afb~mv2.jpg", "fd6edb_41f6c041db3e4b579bb17b6f6d865b2b~mv2.jpg",
    "11062b_2f76f53cf2bb4516bfc6a88bfc019c30~mv2.jpg", "11062b_1b71fa144fb0467ea9a1a0e776497981~mv2.jpg"]]

CLASSES = [
 ("Cardio n Abs", "Let it burn!", "Mon–Fri", "Varies", "£6"),
 ("HIIT", "Maximise your potential in minutes!", "Mon, Tue, Thu", "Varies", "£6"),
 ("BoxFit", "Unleash your inner warrior!", "Mon, Wed", "30 min", "£6"),
 ("Vitality 50+ Circuit", "Over 50+ - Thrive in motion!", "Mon, Fri", "1 hr", "£6"),
 ("Strength", "Strengthen yourself!", "Mon, Wed, Fri, Sat, Sun", "Varies", "£6"),
 ("Circuit Training", "Dynamic circuits to keep you on track!", "", "", "£6"),
 ("Pilates", "Unleash your power within!", "Mon", "1 hr", "£7"),
 ("Kids Gym", "Gym time just for kids. Minimum 8 years old.", "Tue, Thu", "4pm – 5pm", "£20 / month"),
 ("Body Conditioning", "Sculpt, Tone, Energise!", "Fri", "Varies", "£6"),
 ("Abs Attack", "Sculpted abs, empowered core!", "Tue, Fri", "Varies", "£6"),
]
PLANS = [
 ("Gym & Exercise Class Membership (Annual)", "£400", "every year", "Valid for 2 years. Includes all exercise classes and gym use.", ["Access to over 30 classes a week", "Gym access", "Free induction", "Introductory health check", "Saving of £20"], True),
 ("Gym & Exercise Class Membership", "£35", "every month", "Includes all exercise classes and gym use.", ["Access to over 30 classes a week", "Gym access", "Free induction", "Introductory health check"], False),
 ("Exercise Class Only Membership", "£26", "every month", "Book a space in any class (space is limited).", ["Access to over 30 classes a week"], False),
 ("Exercise Classes (Annual)", "£299", "every year", "Valid for 2 years. Annual saving £13.", ["Access to over 30 classes a week"], False),
]
PILLARS = [
 ("Exclusivity Redefined", "Our exclusive membership gives you the space and attention you deserve. Say goodbye to crowded workout spaces and hello to a gym that prioritises your journey."),
 ("Premium Service", "Qualified Personal Trainers and Instructors committed to your success, with expert guidance and personalised programmes."),
 ("Studio Charm", "An intimate, state-of-the-art gym. Escape the noise and distractions of larger, intimidating facilities."),
 ("Flexibility at its Core", "Morning workouts, midday sessions, evening and weekend classes. Fitness that fits your daily routine."),
]
DAYS = [("Mon", 5), ("Tue", 6), ("Wed", 7), ("Thu", 8), ("Fri", 9), ("Sat", 10), ("Sun", 11)]
SLOTS = ["%02d:00" % h for h in range(5, 24)]   # gym is open 5am to midnight

def ico(d):
    return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>'
I_CHECK = ico('<path d="M5 12l5 5L20 7"/>')
I_PIN = ico('<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>')
I_PHONE = ico('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"/>')
I_MAIL = ico('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>')
I_IG = ico('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/>')
I_CLOCK = ico('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>')
I_USERS = ico('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-4 3.2-6 6.5-6s6 2 6.5 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2 .6 3.3 2.4 3.5 6"/>')
I_HOME = ico('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>')
I_HEART = ico('<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z"/>')
I_CAL = ico('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>')
PICONS = [I_HOME, I_USERS, I_HEART, I_CAL]

NAV = [("home", "Home"), ("classes", "Classes"), ("memberships", "Membership offers"), ("pt", "Personal Training"), ("book", "Book MyGym"), ("refer", "Refer Friends")]

def nav_links():
    return "".join(f'<a href="#{k}" data-n="{k}">{t}</a>' for k, t in NAV)

def datestrip():
    return '<div class="dates">' + "".join(
        f'<div class="dt{" sel" if d == "Mon" else ""}"><small>{d}</small><b>{n}</b></div>' for d, n in DAYS) + '</div>'

def class_cards():
    out = ""
    for n, t, d, dur, p in CLASSES:
        meta = " · ".join(x for x in [d, dur] if x) or "See schedule"
        grp = {"Cardio n Abs": "cardio", "HIIT": "cardio", "BoxFit": "cardio", "Vitality 50+ Circuit": "fifty", "Strength": "strength", "Circuit Training": "strength", "Pilates": "mind", "Body Conditioning": "strength", "Abs Attack": "strength", "Kids Gym": "kids"}.get(n, "all")
        out += f'<article class="cc"><div><h3>{n}</h3><p>{t}</p><span class="meta">{meta}</span></div><div class="cfoot"><span class="pr">{p}</span><a class="btn sm" href="#classes" data-cf="{grp}">Book now</a></div></article>'
    return out

def plan_cards():
    out = ""
    for n, p, per, d, feats, best in PLANS:
        li = "".join(f"<li>{I_CHECK}{f}</li>" for f in feats)
        out += f'<article class="plan{" best" if best else ""}">{"<span class=flag>Best value</span>" if best else ""}<h3>{n}</h3><div class="pp"><b>{p}</b><span>{per}</span></div><p>{d}</p><ul>{li}</ul><a class="btn" href="#refer">Join now</a></article>'
    return out

def slot_rows():
    return "".join(f'<div class="slot"><span class="tm">{s}</span><div><b>Open Gym Access</b><small>1 hr · 6 spots left</small></div><a class="btn sm" href="#book">Book</a></div>' for s in SLOTS)

def pillars():
    return "".join(f'<article class="pil"><span class="pi">{PICONS[i]}</span><h3>{t}</h3><p>{d}</p></article>' for i, (t, d) in enumerate(PILLARS))

def gallery():
    return "".join(f'<img src="{g}" alt="MyGym London">' for g in G)

def footer():
    return f'''<footer><div class="fwrap">
<div><img class="flogo" src="logo.png" alt="MyGym London"><p>Your private community gym in Bush Hill Park, Enfield. Premium personal training and classes from £6, no contract.</p></div>
<div><h4>Menu</h4>{nav_links()}</div>
<div><h4>Contact us</h4><p>{I_PIN}Main Avenue, Bush Hill Park<br>Enfield, EN1 1DS</p><p>{I_PHONE}<a href="tel:+447459020381">07459 020381</a></p><p>{I_MAIL}info@mygymlondon.co.uk</p><p>{I_IG}@mygym_london</p></div>
<div><h4>Opening hours</h4><p>Every day<br><b>5am – midnight</b></p><a class="btn sm app" href="#home">Get the MyGym app</a></div>
</div><div class="legal"><a href="#terms">Terms and conditions</a> · <a href="#privacy">Privacy policy</a> · <a href="#cookies">Cookie notice</a> · © <span class="yr">{__import__("datetime").date.today().year}</span> by MyGymLondon.co.uk</div></footer><script>document.querySelectorAll(".yr").forEach(function(e){{e.textContent=new Date().getFullYear()}})</script>'''

def header():
    return f'''<header><div class="hw"><a href="#home"><img class="logo" src="logo.png" alt="MyGym London"></a><nav class="mnav">{nav_links()}</nav><div class="hr"><a class="login" href="#login">Log in</a><a class="btn sm" href="#memberships">Join now</a></div></div></header>'''

def pages(variant):
    A = variant == "a"
    hero = f'''<section class="view def" id="home">
<div class="hero"><div class="hcopy"><span class="chip">Classes start from £6 · No contract needed</span>
<h1>The private gym where everybody knows your name.</h1>
<p>Premium personal training and fun, effective classes for all abilities. Experienced trainers, new equipment, and a bespoke experience in every session.</p>
<div class="hbtns"><a class="btn" href="#memberships">Join now</a><a class="btn ghost" href="#classes">View our classes</a></div>
<div class="hstats"><div><b>30+</b><span>classes a week</span></div><div><b>£6</b><span>classes from</span></div><div><b>0</b><span>contracts</span></div></div></div>
<div class="himg"><img src="{HERO if not A else P1}" alt="MyGym London"></div></div>
<section class="sec"><div class="wrap"><h2>Welcome to MyGym London</h2><p class="lead">We provide premium personal training services tailored to your fitness goals, and fun, effective exercise classes for all abilities. With experienced personal trainers and new equipment, every session is a bespoke experience, carefully crafted to meet your needs.</p>
<div class="pgrid">{pillars()}</div></div></section>
<section class="sec alt"><div class="wrap two">
<article class="feat"><img src="{P1 if A else P2}" alt=""><div><h3>Classes to suit you</h3><p>Training for a special occasion, weekly Pilates to unwind, or a sweat to de-stress and build stamina and strength. A workout for all ages and abilities.</p><a class="btn" href="#classes">Classes to suit you</a></div></article>
<article class="feat"><img src="{P2 if A else P1}" alt=""><div><h3>Expert personal training</h3><p>Our qualified Personal Trainers have years of experience and will design programmes that push your limits and get the results you want.</p><a class="btn" href="#pt">Expert personal training</a></div></article></div></section>
<section class="sec"><div class="wrap"><h2>Inside MyGym</h2><div class="gal">{gallery()}</div></div></section>
<section class="sec cta"><div class="wrap"><h2>Ready to train?</h2><p>Classes from £6. No contract needed. Book in the app or online.</p><div class="hbtns"><a class="btn" href="#memberships">Join now</a><a class="btn ghost" href="#book">Book the gym</a></div></div></section>
</section>'''
    classes = f'''<section class="view" id="classes"><div class="phead"><div class="wrap"><span class="chip">Our classes</span><h1>Over 30 classes every week</h1><p>There's something for everyone. Book a class for as low as £6 per session, or save by securing your class membership. Pilates classes now available to book.</p><div class="hbtns"><a class="btn" href="#book">See the weekly schedule</a><a class="btn ghost" href="#pt">Book a free exercise class</a></div></div></div>
<div class="wrap sec"><div class="cgrid">{class_cards()}</div></div>
<div class="wrap sec"><h2>Class schedule</h2><p class="sub">Sep – Oct 2026 · Filter by service: All</p>{datestrip()}<div class="slot"><span class="tm">09:00</span><div><b>Strength</b><small>1 hr · 8 spots left</small></div><a class="btn sm" href="#book">Book</a></div><p class="note">No classes on the other days this week. Check back for updates.</p></div></section>'''
    memberships = f'''<section class="view" id="memberships"><div class="phead"><div class="wrap"><span class="chip">Membership offers</span><h1>Check out our great value memberships</h1><p>Find a membership that suits you. No sneaky joining fees, no contract needed.</p></div></div>
<div class="wrap sec"><div class="plans">{plan_cards()}</div></div></section>'''
    pt = f'''<section class="view" id="pt"><div class="phead"><div class="wrap"><span class="chip">Personal training</span><h1>Personal Training at MyGym London</h1><p>Are you seeking specialist advice on how to reach your health goals? One-to-one sessions with one of our qualified personal trainers could help. Sessions start from as low as £32.50.</p></div></div>
<div class="wrap sec two"><form class="card form"><h3>Book your free PT session</h3><label>Choose an option</label><div class="sel"><span class="opt on">AM PT session</span><span class="opt">PM PT session</span></div><label class="chk"><span class="box"></span> I agree to the terms &amp; conditions</label><a class="btn" href="#pt">Submit</a><p class="note">Complete and submit the form to book your free PT session.</p></form>
<div class="trainers"><h3>Meet your trainers</h3><div class="tr"><span class="av">P</span><div><b>Pedro</b><small>Personal Trainer</small></div></div><div class="tr"><span class="av">I</span><div><b>Israel</b><small>Personal Trainer</small></div></div><img class="timg" src="{P2}" alt=""></div></div></section>'''
    book = f'''<section class="view" id="book"><div class="phead"><div class="wrap"><span class="chip">Book MyGym</span><h1>Book your MyGym time slot</h1><p>Only available to Gym &amp; Exercise Class members. Pick a time slot that suits you.</p><a class="btn ghost" href="#memberships" style="margin-top:16px">Explore plans</a></div></div>
<div class="wrap sec"><div class="card"><h3>Open Gym Access</h3></div><div class="gwrap" style="position:relative"><div class="toast" id="gtoast"></div><div class="dates" id="gdates"></div><p class="sub" id="gsub"></p><div class="slots" id="gslots"></div></div></div></section>'''
    refer = f'''<section class="view" id="refer"><div class="phead"><div class="wrap"><span class="chip">Refer friends</span><h1>Get a 100% discount for each friend you refer</h1><p>Our thank-you for bringing a friend to MyGym London.</p></div></div>
<div class="wrap sec"><article class="card perk hi referone"><b class="big">100%</b><h3>Get 100% off for each friend who buys a plan</h3><p>Applies to the first billing cycle of "Gym &amp; Exercise Class Membership". Refer as many friends as you like.</p><a class="btn" href="#login">Log in to refer</a></article></div></section>'''
    return hero + classes + memberships + pt + book + refer

BASE = '''*{box-sizing:border-box;margin:0;padding:0}.mnav a{white-space:nowrap}html{scroll-behavior:auto}
a{text-decoration:none;color:inherit}img{display:block;max-width:100%}
.wrap{max-width:1160px;margin:0 auto;padding:0 28px}
svg.i{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;flex:none;vertical-align:-3px;margin-right:8px}
.view{display:none}.view.def{display:block}.view:target{display:block}.view:target ~ .def,.view.def:has(~ .view:target){display:none}
header{position:sticky;top:0;z-index:20}.hw{max-width:1160px;margin:0 auto;padding:10px 28px;display:flex;align-items:center;gap:28px}
.logo{height:54px;border-radius:8px}.mnav{display:flex;gap:6px;flex:1;justify-content:center}.mnav a{padding:9px 14px;border-radius:99px;font-weight:600;font-size:14px}
.hr{display:flex;align-items:center;gap:16px}.login{font-weight:600;font-size:14px}
.btn{display:inline-block;padding:14px 26px;font-weight:700;cursor:pointer;text-align:center}.btn.sm{padding:10px 18px;font-size:14px}
.hbtns{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px}
.sec{padding:64px 0}.sub{opacity:.7;margin-bottom:14px}.note{opacity:.65;font-size:13px;margin-top:14px}
.pgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:34px}
.two{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.gal{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-top:24px}.gal img{width:100%;height:150px;object-fit:cover}
.cgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.cc{display:flex;flex-direction:column;justify-content:space-between;gap:18px;padding:22px;min-height:190px}
.cc h3{margin-bottom:6px}.cc p{opacity:.75;font-size:14px;margin-bottom:10px}.meta{font-size:12px;opacity:.65;font-weight:600}.cfoot{display:flex;justify-content:space-between;align-items:center}
.plans{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;align-items:stretch}.plan{padding:26px;display:flex;flex-direction:column;gap:12px;position:relative}
.plan h3{min-height:50px}.pp b{font-size:54px;line-height:1}.pp span{margin-left:6px;opacity:.7;font-size:13px}.plan ul{list-style:none;display:grid;align-content:start;gap:9px;font-size:14px;flex:1}.plan li svg{color:var(--acc)}
.flag{position:absolute;top:-12px;left:22px;padding:5px 12px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
.dates{display:flex;gap:10px;margin:18px 0}.dt{width:72px;padding:10px 0;text-align:center}.dt small{display:block;font-size:11px;font-weight:700;text-transform:uppercase;opacity:.7}.dt b{display:block;font-size:28px}
.slot{display:flex;align-items:center;gap:20px;padding:16px 20px;margin-bottom:10px}.slot small{display:block;opacity:.65}.slot .btn{margin-left:auto}.tm{min-width:84px}
.slots{display:grid;grid-template-columns:1fr 1fr;gap:0 18px}
.card{padding:28px}.form{display:grid;gap:14px;align-content:start}.form label{font-size:13px;font-weight:700;opacity:.75}
.sel{display:flex;gap:10px}.opt{flex:1;padding:14px;text-align:center;font-weight:600;border:1.5px solid var(--line)}.opt.on{border-color:var(--acc);color:var(--acc)}
.chk{display:flex;align-items:center;gap:10px}.box{width:20px;height:20px;border:1.5px solid var(--line);border-radius:5px}
.trainers{display:grid;gap:14px;align-content:start}.tr{display:flex;align-items:center;gap:14px;padding:16px}.av{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:20px;background:var(--acc);color:#fff}.tr small{opacity:.65;display:block}.timg{height:230px;width:100%;object-fit:cover}
.perk{text-align:left}.perk .big{display:block;font-size:84px;line-height:1;color:var(--acc);margin-bottom:8px}.perk p{opacity:.75;margin-top:8px}
.feat{display:grid;grid-template-columns:42% 1fr;overflow:hidden}.feat img{width:100%;height:100%;object-fit:cover;min-height:300px}.feat div{padding:28px;display:flex;flex-direction:column;gap:14px;justify-content:center;align-items:flex-start}.feat p{opacity:.8}
.pil{padding:24px}.pi{display:grid;place-items:center;width:48px;height:48px;margin-bottom:14px}.pi svg{margin:0;width:24px;height:24px}.pil h3{margin-bottom:8px}.pil p{font-size:14px;opacity:.78}
footer .fwrap{max-width:1160px;margin:0 auto;padding:50px 28px 30px;display:grid;grid-template-columns:1.3fr .8fr 1.1fr 1fr;gap:34px}
footer a{display:block;opacity:.85;padding:3px 0}footer h4{margin-bottom:12px}footer p{margin-bottom:12px;font-size:14px;opacity:.88}.flogo{height:64px;border-radius:8px;margin-bottom:14px}footer a.app{display:inline-block;margin-top:6px}
.legal{text-align:center;font-size:12px;padding:16px;opacity:.75}
body:has(#home:target) .mnav [data-n=home],body:not(:has(:target)) .mnav [data-n=home],body:has(#classes:target) .mnav [data-n=classes],body:has(#memberships:target) .mnav [data-n=memberships],body:has(#pt:target) .mnav [data-n=pt],body:has(#book:target) .mnav [data-n=book],body:has(#refer:target) .mnav [data-n=refer]{--on:1}
.mnav a[style],.mnav a{}
@media(max-width:900px){.pgrid,.plans{grid-template-columns:1fr 1fr}.cgrid{grid-template-columns:1fr 1fr}.two,.slots{grid-template-columns:1fr}.gal{grid-template-columns:repeat(3,1fr)}footer .fwrap{grid-template-columns:1fr 1fr}.mnav{display:none}.feat{grid-template-columns:1fr}.hw{justify-content:space-between}}
@media(max-width:600px){.pgrid,.plans,.cgrid{grid-template-columns:1fr}.wrap{padding:0 18px}}
'''

CSS_A = '''
:root{--bg:#f6f5f4;--card:#fff;--txt:#1d1d20;--mut:#66656d;--acc:#e03939;--brand:#a03535;--accs:#fdecec;--line:#e4e2e2;--disp:"Barlow Condensed","Arial Narrow",sans-serif}
body{font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--txt);line-height:1.55}
h1,h2,h3{font-family:var(--disp);text-transform:uppercase;letter-spacing:.03em;font-weight:800;line-height:1.02}
h1{font-size:68px}h2{font-size:42px;margin-bottom:14px}h3{font-size:25px}
header{background:#fff;border-bottom:1px solid var(--line)}
.mnav a{color:var(--mut)}.mnav a:hover{background:var(--accs);color:var(--acc)}
body:has(#home:target) .mnav [data-n=home],body:not(:has(:target)) .mnav [data-n=home],body:has(#classes:target) .mnav [data-n=classes],body:has(#memberships:target) .mnav [data-n=memberships],body:has(#pt:target) .mnav [data-n=pt],body:has(#book:target) .mnav [data-n=book],body:has(#refer:target) .mnav [data-n=refer]{background:var(--accs);color:var(--acc)}
.btn{background:var(--acc);color:#fff;border-radius:14px;font-family:var(--disp);font-size:20px;letter-spacing:.07em;text-transform:uppercase}.btn.sm{font-size:17px;border-radius:99px}
.btn.ghost{background:transparent;color:var(--acc);border:2px solid var(--acc)}
.hero{display:grid;grid-template-columns:1.1fr .9fr;max-width:1160px;margin:30px auto;background:linear-gradient(160deg,#e03939,#a03535);color:#fff;border-radius:32px;overflow:hidden;box-shadow:0 18px 50px rgba(160,53,53,.28)}
.hcopy{padding:54px 48px}.hero h1{margin:14px 0 16px;font-size:74px}.hero p{font-size:17px;opacity:.94;max-width:520px}
.hero .btn{background:#fff;color:var(--brand)}.hero .btn.ghost{background:transparent;color:#fff;border-color:rgba(255,255,255,.7)}
.chip{display:inline-block;background:var(--accs);color:var(--acc);font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;border-radius:99px;padding:6px 14px}.hero .chip,.phead .chip{background:rgba(255,255,255,.18);color:#fff}
.hstats{display:flex;gap:34px;margin-top:34px}.hstats b{font:800 52px/1 var(--disp)}.hstats span{display:block;font-size:12px;opacity:.85}
.himg img{width:100%;height:100%;object-fit:cover}
.lead{max-width:760px;font-size:18px;color:var(--mut)}
.pil,.cc,.plan,.card,.slot,.tr,.feat{background:#fff;border-radius:22px;box-shadow:0 1px 3px rgba(0,0,0,.05)}
.pi{background:var(--accs);color:var(--acc);border-radius:14px}
.alt{background:#efeeed}.gal img{border-radius:16px}
.cta{text-align:center}.cta .wrap{background:var(--txt);color:#fff;border-radius:32px;padding:64px 28px}.cta .hbtns{justify-content:center}.cta p{opacity:.8;margin-bottom:6px}
.cta .btn.ghost{color:#fff;border-color:#fff}
.phead{background:linear-gradient(160deg,#e03939,#a03535);color:#fff;margin:24px auto 0;max-width:1160px;border-radius:32px;padding:50px 0}.phead .wrap{padding:0 48px}.phead h1{font-size:60px;margin:12px 0 12px;max-width:820px}.phead p{max-width:640px;opacity:.94;font-size:17px}
.phead .btn{background:#fff;color:var(--brand)}.phead .btn.ghost{background:transparent;color:#fff;border-color:#fff}
.pp b{font-family:var(--disp);color:var(--acc)}.plan.best{background:var(--txt);color:#fff}.plan.best .pp b{color:#ff6b6b}.flag{background:var(--acc);color:#fff;border-radius:99px}
.price,.cc .pr{font:800 34px var(--disp);color:var(--acc)}
.dt{background:#fff;border-radius:16px}.dt.sel{background:var(--acc);color:#fff}.dt b{font-family:var(--disp)}
.tm{font:800 30px var(--disp)}
.opt{border-radius:14px}.opt.on{background:var(--accs)}
.perk.hi{background:var(--txt);color:#fff}.perk.hi .big{color:#ff6b6b}
.feat img{border-radius:0}
footer{background:#1d1d20;color:#fff;margin-top:40px}footer h4{font:800 22px var(--disp);text-transform:uppercase;letter-spacing:.05em}footer .btn.app{background:var(--acc);color:#fff}.legal{border-top:1px solid #333}
'''

CSS_B = '''
:root{--bg:#0e0e11;--card:#1a1a1f;--card2:#23232a;--txt:#f4f4f5;--mut:#a0a0aa;--acc:#ff4545;--line:#34343c;--disp:"Barlow Condensed","Arial Narrow",sans-serif}
body{font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--txt);line-height:1.55}
h1,h2,h3{font-family:var(--disp);text-transform:uppercase;letter-spacing:.02em;font-weight:800;line-height:.98}
h1{font-size:96px}h2{font-size:56px;margin-bottom:16px}h3{font-size:28px}
header{background:rgba(14,14,17,.96);border-bottom:1px solid var(--line)}
.mnav a{white-space:nowrap;color:var(--mut);text-transform:uppercase;font-size:12.5px;letter-spacing:.06em;border-radius:0;border-bottom:2px solid transparent;padding:10px 12px}.mnav a:hover{color:#fff}
body:has(#home:target) .mnav [data-n=home],body:not(:has(:target)) .mnav [data-n=home],body:has(#classes:target) .mnav [data-n=classes],body:has(#memberships:target) .mnav [data-n=memberships],body:has(#pt:target) .mnav [data-n=pt],body:has(#book:target) .mnav [data-n=book],body:has(#refer:target) .mnav [data-n=refer]{color:#fff;border-bottom-color:var(--acc)}
.btn{background:var(--acc);color:#fff;border-radius:0;font-family:var(--disp);font-size:21px;letter-spacing:.1em;text-transform:uppercase;clip-path:polygon(0 0,100% 0,calc(100% - 12px) 100%,0 100%);padding-right:34px}.btn.sm{font-size:17px;padding:10px 26px 10px 18px}
.btn.ghost{background:transparent;color:#fff;box-shadow:inset 0 0 0 2px #fff;clip-path:none;padding:14px 26px}
.hero{position:relative;min-height:640px;display:grid;align-items:center;background:#000;overflow:hidden}
.himg{position:absolute;inset:0}.himg img{width:100%;height:100%;object-fit:cover;opacity:.55}
.himg:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#0e0e11 8%,rgba(14,14,17,.55) 55%,rgba(255,69,69,.18))}
.hcopy{position:relative;z-index:2;max-width:1160px;margin:0 auto;padding:80px 28px;width:100%}.hero h1{max-width:760px;margin:16px 0 18px}.hero h1:first-line{color:#fff}.hero p{max-width:540px;font-size:18px;color:#d8d8de}
.chip{display:inline-block;color:var(--acc);font-size:12px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;border-left:3px solid var(--acc);padding:2px 0 2px 12px}
.hstats{display:flex;gap:44px;margin-top:40px}.hstats b{font:800 64px/1 var(--disp);color:var(--acc)}.hstats span{display:block;font-size:12px;color:var(--mut);text-transform:uppercase;letter-spacing:.1em}
.lead{max-width:760px;font-size:18px;color:var(--mut)}
.pil,.cc,.plan,.card,.slot,.tr,.feat{background:var(--card);border:1px solid var(--line)}
.pil{border-top:3px solid var(--acc)}.pi{background:rgba(255,69,69,.12);color:var(--acc)}
.alt{background:#15151a}.gal img{filter:saturate(.9)}
.cta{background:linear-gradient(100deg,#c62828,#ff4545);text-align:center}.cta .wrap{padding-top:72px;padding-bottom:72px}.cta p{margin-bottom:6px}.cta .hbtns{justify-content:center}
.cta .btn{background:#0e0e11}.cta .btn.ghost{background:transparent}
.phead{background:linear-gradient(100deg,#0e0e11 40%,#3a1212);border-bottom:3px solid var(--acc);padding:70px 0}.phead h1{font-size:76px;margin:14px 0 14px;max-width:900px}.phead p{max-width:640px;color:#d0d0d6;font-size:18px}
.plan.best{border-color:var(--acc);box-shadow:0 0 0 1px var(--acc),0 20px 50px rgba(255,69,69,.15)}.pp b{font-family:var(--disp);color:var(--acc)}.flag{background:var(--acc);color:#fff}
.cc .pr{font:800 38px var(--disp);color:var(--acc)}
.dt{background:var(--card);border:1px solid var(--line)}.dt.sel{background:var(--acc);border-color:var(--acc)}.dt b{font-family:var(--disp)}
.tm{font:800 32px var(--disp);color:var(--acc)}
.opt.on{background:rgba(255,69,69,.12)}
.perk.hi{border-color:var(--acc)}.perk .big{font-family:var(--disp)}
.sec{padding:80px 0}
footer{background:#08080a;border-top:3px solid var(--acc);margin-top:20px}footer h4{font:800 22px var(--disp);text-transform:uppercase;letter-spacing:.08em;color:var(--acc)}footer .btn.app{background:var(--acc);color:#fff}.legal{border-top:1px solid var(--line)}
.sub,.note{color:var(--mut);opacity:1}
'''

def build(variant, css, title):
    html = f'''<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>{BASE}{css}</style></head><body>{header()}<main>{pages(variant)}</main>{footer()}</body></html>'''
    open(os.path.join(OUT, f"site-{variant}.html"), "w", encoding="utf-8").write(html)

build("a", CSS_A, "MyGym London – Website Design A")
build("b", CSS_B, "MyGym London – Website Design B")
print("built")
