import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import legal_pages
src = open(os.path.join(HERE, "gen_site.py"), encoding="utf-8").read()
src = src.split('build("a", CSS_A')[0]
exec(compile(src, "gen_site_base", "exec"))
w2 = open(os.path.join(HERE, "gen_site2.py"), encoding="utf-8").read()
CSS_W = w2.split("CSS_W = '''")[1].split("'''")[0]      # white theme CSS from v2

TICKER = ["No contract needed", "Classes from £6", "30+ classes a week", "Open 5am – midnight", "Free induction & health check", "Personal training from £32.50", "Bush Hill Park · Enfield"]
def ticker():
    one = "".join(f"<span>{t}</span><i>✕</i>" for t in TICKER)
    return f'<div class="ticker"><div class="track">{one}{one}</div></div>'

QUOTES = ["Finding MyGym has honestly been life changing for me.", "Welcoming atmosphere with friendly, supportive staff.", "Best decision I ever made was to walk into MyGym London."]
def quotes():
    return "".join(f'<blockquote><p>{q}</p><cite>Sample text · real Google reviews go here on the live site</cite></blockquote>' for q in QUOTES)

I_CHAT = ico('<path d="M4 5h16v11H9l-5 4z"/>')
INSTA_IMGS = ["pt-card.jpg", "gym-kettlebell.jpg", "book-banner.jpg", "pt-banner.jpg", "refer-banner.jpg", "classes-banner.jpg"]   # own gym photos stand in for the live Instagram feed
def insta():
    return "".join(f'<a class="ipost" href="https://www.instagram.com/mygym_london"><img src="{u}" alt="MyGym London on Instagram"><span class="iov">{I_HEART}{I_CHAT}{I_IG}</span></a>' for u in INSTA_IMGS)

PH = {
 "classes": "classes-banner.jpg",
 "memberships": "services-banner.jpg",
 "pt": "pt-banner.jpg",
 "book": "book-banner.jpg",
 "refer": "refer-banner.jpg",
}

def home_w():
    return f'''<section class="view def" id="home">
<div class="hero"><div class="himg"><img src="hero-full.jpg" alt="MyGym London gym floor with the turf START lane" class="hf"></div>
<div class="hcopy"><span class="chip">Bush Hill Park · Enfield</span>
<h1>The private gym where everybody <em>knows your name.</em></h1>
<p>Premium personal training and fun, effective classes for all abilities. Experienced trainers, new equipment, and a bespoke experience in every session.</p>
<div class="hbtns"><a class="btn" href="#memberships">Join now</a><a class="btn ghost" href="#classes">View our classes</a></div>
<div class="hstats"><div><b>30+</b><span>classes a week</span></div><div><b>£6</b><span>classes from</span></div><div><b>NO</b><span>contracts</span></div></div></div></div>
{ticker()}
<section class="sec"><div class="wrap"><span class="chip">Welcome</span><h2>Welcome to MyGym London</h2><p class="lead">We provide premium personal training services tailored to your fitness goals, and fun, effective exercise classes for all abilities. With experienced personal trainers and new equipment, every session is a bespoke experience, carefully crafted to meet your needs.</p>
<div class="pgrid">{pillars()}</div></div></section>
<section class="sec alt"><div class="wrap two">
<article class="feat"><img src="gym-kettlebell.jpg" alt="Kettlebell on the turf at MyGym London" class="kb"><div><h3>Classes that suit you</h3><p>Over 30 classes a week, from HIIT and strength to Pilates and cardio. Training for an event, unwinding or working up a sweat, there is a class for every age and ability.</p><a class="btn" href="#classes">View the classes</a></div></article>
<article class="feat"><img src="pt-card.jpg" alt="A MyGym London personal trainer spotting a client on the bench press" class="ptc"><div><h3>Expert personal training</h3><p>Our qualified Personal Trainer has years of experience and will design programmes that push your limits and get the results you want.</p><a class="btn" href="#pt">Expert personal training</a></div></article></div></section>
<section class="sec appsec"><div class="wrap two center">
<div class="phones"><img class="ph p1" src="app-dash.png" alt="MyGym app dashboard"><img class="ph p2" src="app-timetable.png" alt="MyGym app timetable"></div>
<div><span class="chip">The MyGym app</span><h2>Your gym, in your pocket.</h2><p class="lead">Book classes, log workouts and track your progress. Free for members, works offline. <b>DOWNLOAD TODAY!</b></p>
<ul class="ticks"><li>{I_CHECK}Book &amp; cancel classes in two taps</li><li>{I_CHECK}Log workouts, weight &amp; body fat</li><li>{I_CHECK}See your progress charts</li></ul>
<div class="qr"><img src="qr.png" alt="Scan to open the MyGym app"><span>Scan to open the app<br><b>app.mygymlondon.co.uk</b></span></div></div></div></section>
<section class="sec"><div class="wrap"><span class="chip">Inside MyGym</span><h2>Space to train. Room to breathe.</h2><div class="mosaic"><img class="m1" src="gallery-6.jpg" alt="Power bags and kettlebells on the rack"><img class="m2" src="gallery-1.jpg" alt="The gym floor with the box, barbell and turf lane"><img class="m3" src="gallery-5.jpg" alt="The gym floor with treadmill and bikes"><img class="m4" src="gallery-2.jpg" alt="Colour-coded power bags on the rack"><img class="m5" src="gallery-3.jpg" alt="A 4 kg slam ball on the rack"><img class="m6" src="gallery-4.jpg" alt="Kettlebells on the rack"></div></div></section>
<section class="sec alt"><div class="wrap"><span class="chip">Members say it better</span><h2>What members say</h2><a class="gbanner" href="https://www.google.com/maps/search/?api=1&amp;query=MyGym%20London%2C%20Main%20Avenue%2C%20Bush%20Hill%20Park%2C%20Enfield%20EN1%201DS" target="_blank" rel="noopener"><span class="gscore"><b>4.8</b><span class="gstars"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="#f5b301" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></svg><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="#f5b301" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></svg><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="#f5b301" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></svg><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="#f5b301" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></svg><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="#f5b301" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></svg></span></span><span class="gtext"><b>Rated 4.8 on Google</b><small>29 Google reviews · Read them on Google Maps</small></span><span class="btn sm">Read our Google reviews</span></a><div class="qgrid">{quotes()}</div></div></section>
<section class="sec insta"><div class="wrap"><div class="ihead"><div><span class="chip">Follow us</span><h2>On the gram <em>@mygym_london</em></h2></div><a class="btn ghost" href="https://www.instagram.com/mygym_london">Follow on Instagram</a></div>
<div class="igrid">{insta()}</div><p class="note">Placeholder photos. On the live site this banner shows your latest Instagram posts automatically.</p></div></section>
<section class="sec visit"><div class="wrap"><span class="chip">Visit us</span><h2>Find MyGym London</h2>
<div class="vgrid"><div class="map"><iframe title="MyGym London on Google Maps" src="https://maps.google.com/maps?q=Main%20Avenue%2C%20Bush%20Hill%20Park%2C%20Enfield%20EN1%201DS&amp;z=15&amp;output=embed" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>
<div class="vinfo"><div class="vcard"><h3>Contact</h3><p>{I_PIN}Main Avenue, Bush Hill Park<br>Enfield, EN1 1DS</p><p>{I_PHONE}<a href="tel:+447459020381">07459 020381</a></p><p>{I_MAIL}info@mygymlondon.co.uk</p><p>{I_IG}@mygym_london</p><a class="btn" href="https://www.google.com/maps/dir/?api=1&amp;destination=MyGym%20London%2C%20Main%20Avenue%2C%20Bush%20Hill%20Park%2C%20Enfield%20EN1%201DS&amp;travelmode=driving" target="_blank" rel="noopener">Get directions</a></div>
<div class="vcard"><h3>Opening hours</h3><div class="hrs"><div><span>Every day</span><b>5am – midnight</b></div></div><p class="open" id="openNow"></p></div>
<div class="vcard soft"><h3>Good to know</h3><p>{I_CHECK}Private studio gym</p><p>{I_CHECK}Free induction &amp; health check for members</p><p>{I_CHECK}Classes from £6, no contract</p></div></div></div></div></section>
<section class="sec cta"><div class="wrap"><h2>Ready to train?</h2><p>Classes from £6. No contract needed. Book in the app or online.</p><div class="hbtns"><a class="btn" href="#memberships">Join now</a><a class="btn ghost" href="#book">Book the gym</a></div></div></section>
</section>'''

def classes_w():
    return f'''<section class="view" id="classes"><div class="phead"><div class="himg"><img src="{PH["classes"]}" alt=""></div><div class="wrap"><span class="chip">Our classes</span><h1>Class schedule &amp; bookings</h1><p>Over 30 classes every week, from £6 a session. Pick a day, book your spot, and manage your bookings right here.</p></div></div>
<div class="wrap sec" style="padding-bottom:20px">
<div class="shead"><div><h2 id="timetable">Book a class</h2><p class="sub">Week starting Monday 5 October · Pilates now available to book · Sample timetable for the design preview</p></div><div class="who"><span class="dot"></span><span id="whoTxt">Preview: signed in as a member</span><button class="lnk" id="whoBtn" type="button">Switch to logged out</button></div></div>
<div class="dates" id="sdates"></div><div class="chips" id="sfilter"></div>
<div id="sslots" class="slots"></div></div>
<div class="wrap" style="padding-bottom:30px"><div class="mybk" id="mybk"><div class="toast" id="toast"></div>
<div class="mbh"><h2>Your bookings</h2><span class="tag" id="mbTag">Members only</span></div>
<p class="sub">Booking confirmations, cancellations and changes all live here.</p><div id="mblist"></div>
<div class="mbout"><p><b>Log in to book and manage classes.</b> Members can book, cancel and reschedule any class in two taps.</p><a class="btn" href="#login">Log in</a></div></div></div>
<div class="alt2 sec"><div class="wrap"><span class="chip">All classes</span><h2>Find your class</h2><div class="cgrid">{class_cards()}</div></div></div></section>'''

NAV[:] = [(k if k != "memberships" else "services", "Services" if k == "memberships" else t) for k, t in NAV]
_ord = ["home", "classes", "book", "services", "pt", "refer"]
NAV[:] = sorted(NAV, key=lambda kt: _ord.index(kt[0])) + [("faq", "FAQ")]

SERVICES = [
 # name, price, per, description, features, style, cta, href
 ("Gym & Exercise Class Membership (Annual)", "£400", "every year", "Valid for 2 years. Includes all exercise classes and gym use.", ["Access to over 30 classes a week", "Gym access", "Free induction", "Introductory health check", "Saving of £20"], "best", "Join now", "#login", "Best value"),
 ("Gym & Exercise Class Membership", "£35", "every month", "Includes all exercise classes and gym use.", ["Access to over 30 classes a week", "Gym access", "Free induction", "Introductory health check"], "", "Join now", "#login", ""),
 ("Gym, Classes & 2 Personal Training Membership", "£75", "every month", "Everything in the gym and class membership, plus two personal training sessions.", ["Gym access", "All exercise classes", "2 personal training sessions"], "special", "Claim the offer", "#login", "Special offer"),
 ("Gym Membership", "£26", "every month", "Use the gym whenever you like, with no contract.", ["Gym access"], "", "Join now", "#login", ""),
 ("Exercise Class Only Membership", "£26", "every month", "Book a space in any class (space is limited).", ["Access to over 30 classes a week"], "", "Join now", "#login", ""),
 ("Exercise Classes (Annual)", "£299", "every year", "Valid for 2 years. Annual saving £13.", ["Access to over 30 classes a week"], "", "Join now", "#login", ""),
 ("Small Group Personal Training", "£60", "per month", "Train with 2–4 friends and split the cost: £15 each per session.", ["2–4 people per group", "£15 each per session", "Minimum 4 sessions per month"], "", "Enquire", "#pt", ""),
 ("Kids Gym", "£20", "per month", "Kids gym sessions every Tuesday and Thursday from 4pm to 5pm. <a href=\"#kids-gym\">Read more</a>", ["Minimum 8 years old", "Tuesdays and Thursdays", "4pm to 5pm", "Up to 12 children", "Book ahead or just turn up"], "", "Join now", "#login", ""),
 ("PAYG Gym", "£4", "per visit", "Pay as you go. No membership and no commitment.", ["Gym access", "Pay only when you train"], "", "Book a visit", "#book", ""),
 ("PAYG Class", "£6", "per class, from", "Pay as you go. Pick any class and pay only for what you book. Most classes are £6 and Pilates is £7. No membership and no commitment.", ["Any of our 30+ classes a week", "Pay only when you train"], "", "Book a class", "#classes", ""),
]
SERVICES.sort(key=lambda r: float(r[1].replace("£", "").replace(",", "")))   # cheapest first
G[:] = ["gallery-%d.jpg" % i for i in range(1, 7)]   # "Space to train" photos (own gym photos)
def service_cards():
    out = ""
    for n, p, per, d, feats, style, cta, href, flag in SERVICES:
        li = "".join(f"<li>{I_CHECK}{f}</li>" for f in feats)
        out += f'<article class="plan {style}">{f"<span class=flag>{flag}</span>" if flag else ""}<h3>{n}</h3><div class="pp"><b>{p}</b><span>{per}</span></div><p>{d}</p><ul>{li}</ul><a class="btn" href="{href}">{cta}</a></article>'
    return out

def services_w():
    return f'''<section class="view" id="services"><div class="phead"><div class="himg"><img src="{PH["memberships"]}" alt=""></div><div class="wrap"><span class="chip">Services</span><h1>Our services</h1><p>Memberships, pay-as-you-go and personal training. Find what suits you. No sneaky joining fees, no contract needed.</p></div></div>
<div class="wrap sec"><div class="plans">{service_cards()}</div></div></section>'''

GOALS = ["Lose body fat", "Build strength & muscle", "General fitness & energy", "Mobility & longevity", "Confidence with exercise", "Sport-specific training"]
def qchips(g, opts):
    return '<div class="qrow" data-g="%s">' % g + "".join(f'<button type="button" class="qc" data-v="{o}">{o}</button>' for o in opts) + '</div>'

def pt_w():
    return f'''<section class="view" id="pt"><div class="phead"><div class="himg"><img src="{PH["pt"]}" alt=""></div><div class="wrap"><span class="chip">Personal training</span><h1>Personal Training at MyGym London</h1><p>Are you seeking specialist advice on how to reach your health goals? One-to-one or small-group sessions with our qualified personal trainers could help.</p></div></div>
<div class="wrap sec" style="padding-bottom:10px"><span class="chip">Training options</span><h2>Choose how you train</h2>
<div class="ptopts"><article class="ptopt"><h3>1-2-1 Personal Training</h3><div class="pp"><b>£32.50</b><span>per session, from</span></div><p>Your coach, your plan, your pace. Sessions start from as low as £32.50.</p><ul><li>{I_CHECK}Fully personalised programme</li><li>{I_CHECK}Free PT session to start</li></ul><a class="btn" href="#pt-form">Book a free session</a></article>
<article class="ptopt hot"><span class="flag">Train with friends</span><h3>Small Group Personal Training</h3><div class="pp"><b>£60</b><span>per month · £15 each per session</span></div><p>Train with 2–4 people and split the cost. Minimum 4 sessions per month.</p><ul><li>{I_CHECK}2–4 people per group</li><li>{I_CHECK}£15 each per session</li><li>{I_CHECK}Minimum 4 sessions per month</li></ul><a class="btn" href="#pt-form">Enquire now</a></article></div></div>
<div class="wrap sec two" id="pt-form" style="align-items:start">
<form class="card quiz" id="quiz" onsubmit="return false"><span class="chip">Mini questionnaire</span><h3>What's your fitness goal?</h3><p class="sub">Four quick questions. We'll suggest the best way to start.</p>
<label>1. What's your main goal?</label>{qchips("goal", GOALS)}
<label>2. How experienced are you?</label>{qchips("level", ["Brand new", "Getting back into it", "Regular trainer"])}
<label>3. How often would you like to train?</label>{qchips("freq", ["Once a week", "2–3 times a week", "4+ times a week"])}
<label>4. How do you like to train?</label>{qchips("style", ["One to one", "With friends", "Not sure yet"])}
<label>Anything we should know? (optional)</label><div class="ta">Injuries, events you're training for…</div>
<button type="button" class="btn" id="quizGo">Get my plan</button><p class="note" id="quizMsg"></p>
<div class="result" id="quizRes"></div></form>
<div class="side"><form class="card form"><h3>Book your free PT session</h3><label>Choose an option</label><div class="sel"><span class="opt on">AM PT session</span><span class="opt">PM PT session</span></div><label class="chk"><span class="box"></span> I agree to the terms &amp; conditions</label><a class="btn" href="#pt">Submit</a><p class="note">Complete and submit the form to book your free PT session.</p></form>
<div class="trainers card"><h3>Meet your trainers</h3><div class="tr"><span class="av">P</span><div><b>Pedro</b><small>Personal Trainer</small></div></div><div class="tr"><span class="av">I</span><div><b>Israel</b><small>Personal Trainer</small></div></div></div></div></div></section>'''

QUIZ_JS = r'''
(function(){
var q=document.getElementById("quiz");if(!q)return;
q.addEventListener("click",function(e){var c=e.target.closest(".qc");if(!c)return;
 var g=c.parentNode;[].forEach.call(g.querySelectorAll(".qc"),function(x){x.classList.remove("on")});c.classList.add("on");document.getElementById("quizMsg").textContent=""});
document.getElementById("quizGo").addEventListener("click",function(){
 var a={};[].forEach.call(q.querySelectorAll(".qrow"),function(r){var o=r.querySelector(".qc.on");a[r.dataset.g]=o?o.dataset.v:null});
 if(!a.goal||!a.level||!a.freq||!a.style){document.getElementById("quizMsg").textContent="Please answer all four questions.";return}
 var rec=a.style==="With friends"?["Small Group Personal Training","£60 a month · £15 each per session · minimum 4 sessions"]:a.style==="One to one"?["1-2-1 Personal Training","from £32.50 a session"]:["A free PT session","a relaxed first step so we can find your best fit"];
 var r=document.getElementById("quizRes");
 r.innerHTML="<b>Thanks! Here's where we'd start.</b><p>Goal: "+a.goal+" · "+a.level+" · "+a.freq+"</p><div class=\"rec\"><span>We suggest</span><h4>"+rec[0]+"</h4><small>"+rec[1]+"</small></div><p>A trainer will get in touch to book your free session.</p>";
 r.classList.add("on")});
})();
'''

I_ARROW = ico('<path d="M5 12h14M13 6l6 6-6 6"/>')
def pt_w():
    steps = [
        ("goal", "What's your main goal?", GOALS),
        ("level", "How experienced are you?", ["Brand new", "Getting back into it", "Regular trainer"]),
        ("freq", "How often would you like to train?", ["Once a week", "2–3 times a week", "4+ times a week"]),
        ("style", "How do you like to train?", ["One to one", "With friends", "Not sure yet"]),
    ]
    sh = ""
    for i, (g, t, o) in enumerate(steps, 1):
        sh += f'<div class="step{" on" if i == 1 else ""}" data-s="{i}"><h3>{t}</h3><p class="sub">Tap one and we\'ll move you on.</p>{qchips(g, o)}</div>'
    sh += f'''<div class="step" data-s="5"><h3>Book your free PT session</h3><p class="sub" id="wsum"></p>
<label class="lb">Choose a time</label><div class="sel" id="wtime"><button type="button" class="opt" data-v="AM">AM PT session</button><button type="button" class="opt" data-v="PM">PM PT session</button></div>
<label class="lb" for="wemail">Your email</label><input id="wemail" class="wemail" type="email" autocomplete="email" inputmode="email" placeholder="you@example.com"><p class="hint">We use it to confirm your free session.</p>
<label class="lb">Anything we should know? (optional)</label><div class="ta">Injuries, events you're training for…</div>
<button type="button" class="chk" id="wterms"><span class="box"></span> I agree to the terms &amp; conditions and privacy policy</button><p class="hint">Read the <a href="#terms">terms and conditions</a> and <a href="#privacy">privacy policy</a>.</p>
<button type="button" class="btn" id="wbook">Book my free PT session</button><p class="note" id="wmsg"></p></div>'''
    how = "".join(f'<div class="hw3"><b>{n}</b><div><h4>{t}</h4><p>{d}</p></div></div>' for n, t, d in [
        ("1", "Tell us your goal", "Answer four quick questions."), ("2", "Pick a free session", "Choose morning or afternoon."), ("3", "Meet your coach", "Train with Pedro and get your plan.")])
    return f'''<section class="view" id="pt"><div class="phead"><div class="himg"><img src="{PH["pt"]}" alt=""></div><div class="wrap"><span class="chip">Personal training</span><h1>Personal Training at MyGym London</h1><p>Are you seeking specialist advice on how to reach your health goals? One-to-one or small-group sessions with our qualified personal trainer could help.</p><div class="hbtns"><button type="button" class="btn" data-go="wiz">Book your free session</button></div></div></div>
<div class="wrap sec" style="padding-bottom:10px"><div class="how">{how}</div></div>
<div class="wrap sec" style="padding-top:30px;padding-bottom:10px"><span class="chip">Training options</span><h2>Choose how you train</h2>
<div class="ptopts"><article class="ptopt"><h3>1-2-1 Personal Training</h3><div class="pp"><b>£32.50</b><span>per session, from</span></div><p>Your coach, your plan, your pace. Sessions start from as low as £32.50.</p><ul><li>{I_CHECK}Fully personalised programme</li><li>{I_CHECK}Free PT session to start</li></ul><button type="button" class="btn" data-go="wiz">Book a free session</button></article>
<article class="ptopt hot"><span class="flag">Train with friends</span><h3>Small Group Personal Training</h3><div class="pp"><b>£60</b><span>per month · £15 each per session</span></div><p>Train with 2–4 people and split the cost. Minimum 4 sessions per month.</p><ul><li>{I_CHECK}2–4 people per group</li><li>{I_CHECK}£15 each per session</li><li>{I_CHECK}Minimum 4 sessions per month</li></ul><button type="button" class="btn" data-go="wiz">Enquire now</button></article></div></div>
<div class="wrap sec"><div class="ptgrid"><form class="card wiz" id="wiz" onsubmit="return false"><div class="wtop"><span class="chip">Free PT session</span><button type="button" class="lnk" id="wback" style="visibility:hidden">← Back</button></div>
<div class="wprog"><div class="wbar"><i id="wbarI"></i></div><span id="wstep">Step 1 of 5</span></div>{sh}
<div class="result" id="wres"></div></form>
<aside class="coach card"><span class="chip">Your coach</span><img class="cav pic" src="https://static.wixstatic.com/media/45b3f3_3017c07068de404d8dc7282e6e493f02~mv2.png/v1/fill/w_480,h_480,fp_0.51_0.46,q_75,enc_avif,quality_auto/45b3f3_3017c07068de404d8dc7282e6e493f02~mv2.png" alt="Pedro, Personal Trainer at MyGym London"><h3>Pedro</h3><small>Personal Trainer</small><p>I love helping people improve their strength and fitness, and as an ex-basketball player, sport has always been part of my life. My mission is to help you change your life for the better, become the best version of yourself and feel more confident, whether you are fit or have never trained before.</p><ul><li>{I_CHECK}Level 3 Personal Trainer</li><li>{I_CHECK}Over 10,000 sessions and classes delivered</li><li>{I_CHECK}Weight loss, strength, boxing, calisthenics and more</li><li>{I_CHECK}1-2-1 or small group</li></ul></aside></div></div></section>'''

WIZ_JS = r'''
(function(){
var w=document.getElementById("wiz");if(!w)return;
var A={},cur=1,N=5,time=null,terms=false;
function show(n){cur=n;[].forEach.call(w.querySelectorAll(".step"),function(s){s.classList.toggle("on",+s.dataset.s===n)});
 document.getElementById("wbarI").style.width=(n*20)+"%";document.getElementById("wstep").textContent="Step "+n+" of "+N;
 document.getElementById("wback").style.visibility=n>1?"visible":"hidden";
 if(n===5)document.getElementById("wsum").textContent=(A.goal||"")+" · "+(A.level||"")+" · "+(A.freq||"")+" · "+(A.style||"")}
w.addEventListener("click",function(e){
 var c=e.target.closest(".qc");
 if(c){var g=c.parentNode;[].forEach.call(g.querySelectorAll(".qc"),function(x){x.classList.remove("on")});c.classList.add("on");A[g.dataset.g]=c.dataset.v;setTimeout(function(){show(Math.min(cur+1,N))},260);return}
 var o=e.target.closest("#wtime .opt");if(o){[].forEach.call(w.querySelectorAll("#wtime .opt"),function(x){x.classList.remove("on")});o.classList.add("on");time=o.dataset.v;document.getElementById("wmsg").textContent="";return}
 if(e.target.closest("#wterms")){terms=!terms;document.getElementById("wterms").classList.toggle("on",terms);document.getElementById("wmsg").textContent="";return}
 if(e.target.closest("#wback")){show(Math.max(cur-1,1));return}
 if(e.target.closest("#wbook")){var m=document.getElementById("wmsg");
  if(!time){m.textContent="Please choose AM or PM.";return}var em=(document.getElementById("wemail").value||"").trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)){m.textContent="Please enter a valid email so we can confirm your session.";document.getElementById("wemail").focus();return}if(!terms){m.textContent="Please agree to the terms & conditions.";return}
  var rec=A.style==="With friends"?["Small Group Personal Training","£60 a month · £15 each per session · minimum 4 sessions"]:A.style==="One to one"?["1-2-1 Personal Training","from £32.50 a session"]:["Your free session first","we'll find your best fit together"];
  var r=document.getElementById("wres");
  r.innerHTML="<div class=\"ok\">✓</div><h3>You're booked in!</h3><p>Your free <b>"+time+" PT session</b> request is in. We'll confirm the exact time by email to <b>"+em.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")+"</b>.</p><div class=\"rec\"><span>We'd suggest</span><h4>"+rec[0]+"</h4><small>"+rec[1]+"</small></div><p class=\"fine\">Goal: "+A.goal+" · "+A.level+" · "+A.freq+"</p>";
  [].forEach.call(w.querySelectorAll(".step,.wprog,.wtop"),function(x){x.style.display="none"});r.classList.add("on");return}});
})();
document.addEventListener("click",function(e){var q=e.target.closest("a[href=\"#classes\"]");if(q&&q.closest(".plan")){setTimeout(function(){var t=document.getElementById("timetable");if(t)t.scrollIntoView({behavior:"smooth",block:"start"})},120)}var g=e.target.closest("[data-go]");if(g){var t=document.getElementById(g.dataset.go);if(t)t.scrollIntoView({behavior:"smooth",block:"center"})}});
'''
LOGIN_JS = r"""
(function(){var b=document.getElementById("lgBtn");if(!b)return;b.addEventListener("click",function(){var m=document.getElementById("lgMsg"),e=document.getElementById("lgEmail").value.trim(),p=document.getElementById("lgPass").value;m.textContent=!e||!p?"Enter your email and password.":"Design preview: members log in on the live site.";});})();
"""
BOOK_JS = r'''
(function(){var g=document.getElementById("gslots");if(!g)return;
var D=[["Mon",5],["Tue",6],["Wed",7],["Thu",8],["Fri",9],["Sat",10],["Sun",11]],FD={5:"Monday 5 October",6:"Tuesday 6 October",7:"Wednesday 7 October",8:"Thursday 8 October",9:"Friday 9 October",10:"Saturday 10 October",11:"Sunday 11 October"};
var sel=5,bk={},$=function(i){return document.getElementById(i)};
function hh(h){return("0"+h).slice(-2)+":00"}
function spots(h,d){return 2+((h*3+d)%5)}
function toast(m){var t=$("gtoast");t.textContent=m;t.classList.add("on");clearTimeout(toast.h);toast.h=setTimeout(function(){t.classList.remove("on")},3500)}
function strip(){var s="";D.forEach(function(d){s+='<button type="button" class="dt'+(d[1]===sel?" sel":"")+'" data-d="'+d[1]+'"><small>'+d[0]+'</small><b>'+d[1]+'</b></button>'});$("gdates").innerHTML=s}
function rows(){var s="";for(var h=5;h<=23;h++){var b=bk[sel+"-"+h],n=spots(h,sel)-(b?1:0);
 if((sel===6||sel===8)&&h===16){s+='<div class="slot"><span class="tm">16:00</span><div><b>Kids Gym</b><small>1 hr · Children only</small></div><span style="font-size:12px;font-weight:700;color:#66656d;text-align:right">Closed to adults</span></div>';continue}
 s+='<div class="slot"><span class="tm">'+hh(h)+'</span><div><b>Open Gym Access</b><small>1 hr · '+(b?'Booked ✓':(n<=3?'<em>only '+n+' spots left</em>':n+' spots left'))+'</small></div>'
  +(b?'<button type="button" class="btn sm ghost gcx" data-h="'+h+'">Cancel</button>':'<button type="button" class="btn sm gbk" data-h="'+h+'">Book</button>')+'</div>'}
 g.innerHTML=s;$("gsub").textContent="Week starting Monday 5 October · "+FD[sel]+" · Sample availability for the design preview"}
function paint(){strip();rows()}
document.addEventListener("click",function(e){var v=document.getElementById("book");if(!v||!v.contains(e.target))return;
 var d=e.target.closest("#gdates .dt");if(d){sel=+d.dataset.d;paint();return}
 var b=e.target.closest("#gslots .gbk");if(b){var h=+b.dataset.h;bk[sel+"-"+h]=1;paint();toast("Booked! Gym slot "+FD[sel].split(" ")[0].slice(0,3)+" "+sel+" Oct, "+hh(h)+".");return}
 var c=e.target.closest("#gslots .gcx");if(c){var k=+c.dataset.h;delete bk[sel+"-"+k];paint();toast("Booking cancelled. Your slot was released.");return}});
paint();
})();
document.addEventListener("click",function(e){var a=e.target.closest("[data-cf]");if(!a)return;e.preventDefault();var f=document.querySelector('#sfilter .fc[data-f="'+a.dataset.cf+'"]');if(f)f.click();var t=document.getElementById("timetable");if(t)t.scrollIntoView({behavior:"smooth",block:"start"})});
'''
QUIZ_JS = WIZ_JS + LOGIN_JS + BOOK_JS

CSS_ADD2 = '''
.how{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.hw3{display:flex;gap:16px;align-items:center;background:#fff;border:1px solid var(--line);padding:20px 22px}.hw3 b{flex:none;width:46px;height:46px;border-radius:50%;background:var(--acc);color:#fff;display:grid;place-items:center;font:800 26px var(--disp)}.hw3 h4{font:800 22px var(--disp);text-transform:uppercase}.hw3 p{font-size:14px;color:var(--mut)}
.ptgrid{display:grid;grid-template-columns:1.45fr 1fr;gap:24px;align-items:start}
.wiz{padding:30px;display:block}.wtop{display:flex;justify-content:space-between;align-items:center}.wprog{display:flex;align-items:center;gap:14px;margin:6px 0 22px}.wbar{flex:1;height:8px;background:var(--alt);border-radius:9px;overflow:hidden}.wbar i{display:block;height:100%;width:20%;background:var(--acc);border-radius:9px;transition:width .3s}.wprog span{font-size:12px;font-weight:700;color:var(--mut);white-space:nowrap}
.step{display:none}.step.on{display:block;animation:fadeIn .25s}@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.step h3{font-size:36px;margin-bottom:6px}.step .sub{margin-bottom:16px}.step .qc{padding:13px 20px;font-size:15px}
.lb{display:block;font-weight:700;font-size:14px;margin:18px 0 8px}
.wiz .sel{display:flex;gap:10px}.wiz .opt{flex:1;padding:16px;text-align:center;font:600 15px Inter,sans-serif;background:#fff;border:1.5px solid var(--line);cursor:pointer}.wiz .opt.on{border-color:var(--acc);background:var(--accs);color:var(--acc)}
.wiz .chk{display:flex;align-items:center;gap:12px;margin:16px 0 18px;background:none;border:0;font:600 14px Inter,sans-serif;cursor:pointer;text-align:left}.wiz .chk .box{width:22px;height:22px;border:1.5px solid var(--line);border-radius:5px;display:grid;place-items:center;flex:none;background:#fff}.wiz .chk.on .box{background:var(--acc);border-color:var(--acc)}.wiz .chk.on .box:after{content:"✓";color:#fff;font-size:15px;line-height:1}
.wiz #wbook{width:100%}.wiz .note{color:var(--acc);margin:10px 0 0;text-align:left;min-height:18px}
.wiz .result{margin:0;text-align:center;padding:30px 22px;border-left:0;border-top:4px solid #2e9e5b}.wiz .result .ok{width:56px;height:56px;border-radius:50%;background:#2e9e5b;color:#fff;font-size:30px;display:grid;place-items:center;margin:0 auto 12px}.wiz .result h3{font-size:36px}.wiz .rec{text-align:left}.wiz .fine{font-size:12px}
.coach{position:sticky;top:96px;padding:30px;text-align:left}.coach .cav{width:84px;height:84px;border-radius:50%;background:var(--acc);color:#fff;display:grid;place-items:center;font:800 46px var(--disp);margin:6px 0 12px}.coach h3{font-size:40px}.coach small{color:var(--mut);display:block;margin-bottom:12px}.coach p{color:var(--mut);font-size:14.5px}.coach ul{list-style:none;display:grid;gap:9px;margin-top:16px;font-weight:600;font-size:14px}.coach li svg{color:var(--acc)}
.cav.pic{object-fit:cover;object-position:50% 20%;width:128px;height:128px;border:3px solid var(--acc);display:block}
.referone{max-width:620px;margin:0 auto;text-align:center;padding:36px 30px}.referone .big{font:800 96px/1 var(--disp);color:var(--acc);display:block}.referone .btn{margin-top:18px}
.faq{max-width:820px;margin:0 auto;display:grid;gap:10px}.faq details{background:#fff;border:1px solid var(--line)}.faq summary{cursor:pointer;list-style:none;padding:18px 54px 18px 22px;font:700 17px Inter,sans-serif;position:relative}.faq summary::-webkit-details-marker{display:none}.faq summary:after{content:"+";position:absolute;right:22px;top:50%;transform:translateY(-50%);font:700 26px/1 Inter,sans-serif;color:var(--acc)}.faq details[open] summary:after{content:"–"}.faq details[open]{border-color:var(--acc)}.faq details p{padding:0 22px 20px;color:var(--mut);font-size:15px;line-height:1.6}
.faqcta{max-width:820px;margin:26px auto 0;text-align:center;padding:26px;background:var(--alt)}.faqcta h3{font-size:30px}
body:has(#faq:target) .mnav [data-n=faq]{color:var(--txt);border-bottom-color:var(--acc)}
.feat img.kb{object-position:60% 50%}
@media(min-width:1101px){.cgrid .cc:last-child:nth-child(3n+1){grid-column:2}}
.gbanner{display:flex;align-items:center;gap:22px;flex-wrap:wrap;background:#fff;border:1px solid var(--line);border-left:4px solid var(--acc);padding:18px 24px;margin:20px 0 22px;text-decoration:none;color:inherit}.gbanner:hover{box-shadow:0 8px 24px rgba(0,0,0,.08)}.gscore{display:flex;align-items:center;gap:12px}.gscore>b{font:800 56px/1 var(--disp)}.gstars{display:flex;gap:2px}.gtext{display:grid;gap:2px;flex:1;min-width:200px}.gtext b{font:800 24px var(--disp);text-transform:uppercase}.gtext small{color:var(--mut);font-size:14px}
@media(max-width:700px){.gbanner{padding:16px}.gbanner .btn{width:100%;text-align:center}}
.loginwrap{display:grid;grid-template-columns:1.2fr 1fr;gap:24px;max-width:900px;margin:0 auto;align-items:start}.loginf,.loginnew{padding:30px;display:block}.loginf h3,.loginnew h3{font-size:36px;margin-bottom:14px}.loginf label{display:block;font-weight:700;font-size:14px;margin:14px 0 6px}.loginf input{width:100%;padding:14px 14px;font:500 16px Inter,sans-serif;border:1.5px solid var(--line);background:#fff;border-radius:0}.loginf input:focus{outline:2px solid var(--acc);border-color:var(--acc)}.loginf .btn{width:100%;margin-top:20px}.loginf .note{color:var(--acc);margin:10px 0 0;text-align:left;min-height:18px}.loginf .lnk{display:inline-block;margin-top:6px;font-weight:600}.loginnew p{color:var(--mut);margin-bottom:18px}.loginnew .fine{font-size:13px;margin:18px 0 0}.loginnew .fine a{color:var(--acc);font-weight:700}
@media(max-width:900px){.loginwrap{grid-template-columns:1fr}.loginf,.loginnew{padding:22px 18px}}
#book .phead{min-height:420px}#book .himg{background:#fff}#book .himg img{object-fit:contain;object-position:right center;-webkit-mask-image:linear-gradient(to right,transparent 30%,#000 56%);mask-image:linear-gradient(to right,transparent 30%,#000 56%)}@media(max-width:900px){#book .himg img{object-fit:cover;object-position:60% 50%;-webkit-mask-image:none;mask-image:none}}
.dt.sel{display:block}
footer p a[href^="tel:"],.vcard p a[href^="tel:"]{display:inline;padding:0;margin:0;border:0;color:inherit;text-decoration:none}
.wiz input.wemail{width:100%;padding:14px;font:500 16px Inter,sans-serif;border:1.5px solid var(--line);border-radius:0}.wiz input.wemail:focus{outline:2px solid var(--acc);border-color:var(--acc)}.wiz .hint{font-size:13px;color:var(--mut);margin:6px 0 0}
@media(min-width:901px){#faq .himg:after{background:linear-gradient(90deg,rgba(255,255,255,.9) 0%,rgba(255,255,255,.62) 26%,rgba(255,255,255,0) 50%)}#faq .phead p{color:#17171a;font-weight:500;text-shadow:0 0 10px rgba(255,255,255,.95),0 0 4px rgba(255,255,255,.95),0 0 2px #fff}#faq .phead h1{text-shadow:0 0 14px rgba(255,255,255,.7)}}
:root{color-scheme:light!important}button,input,select,textarea{color:var(--txt,#17171a)}input,select,textarea{background-color:#fff}
@media(max-width:420px){.qr{flex-wrap:wrap}.qr span{min-width:0;overflow-wrap:anywhere}.ph{width:min(170px,40vw)}footer .fwrap{grid-template-columns:1fr}.hstats{flex-wrap:wrap;gap:16px 22px}.hstats>div{min-width:0}}
@media(max-width:700px){.dates{display:grid;grid-template-columns:repeat(7,1fr);gap:5px;overflow:visible}.dates .dt{width:auto;min-width:0;padding:8px 0}.dates .dt small{font-size:10px;letter-spacing:0}.dates .dt b{font-size:21px}}
.lnk{padding:10px 4px;min-height:36px}
.mosaic{display:grid;grid-template-columns:repeat(6,1fr);grid-template-rows:230px 230px 250px;gap:12px;margin-top:24px}.mosaic img{width:100%;height:100%;object-fit:cover;display:block;filter:none}.mosaic .m1{grid-column:1/5;grid-row:1/3;object-position:50% 60%}.mosaic .m2{grid-column:5/7;grid-row:1}.mosaic .m3{grid-column:5/7;grid-row:2}.mosaic .m4{grid-column:1/3;grid-row:3}.mosaic .m5{grid-column:3/5;grid-row:3}.mosaic .m6{grid-column:5/7;grid-row:3}
@media(max-width:900px){.mosaic{grid-template-columns:1fr 1fr;grid-template-rows:none;grid-auto-rows:auto;gap:10px}.mosaic img{height:auto}.mosaic .m1{grid-column:1/3;grid-row:auto;aspect-ratio:16/10}.mosaic .m2,.mosaic .m3,.mosaic .m4,.mosaic .m6{grid-column:auto;grid-row:auto;aspect-ratio:1/1}.mosaic .m5{grid-column:1/3;grid-row:auto;aspect-ratio:16/10;order:6}.mosaic .m6{order:5}}
@media(min-width:901px){.hero .himg{background:#fff}.hero .hcopy{padding-top:52px;padding-bottom:52px}.hero .himg img.hf{object-fit:cover;object-position:right bottom;transform:translateX(18%)}.hero .himg:after{background:linear-gradient(90deg,#fff 18%,rgba(255,255,255,.84) 38%,rgba(255,255,255,0) 66%)}}
.feat img.ptc{object-position:50% 38%}

@media(max-width:900px){.feat img{height:290px;min-height:0}.feat img.kb{height:440px;object-position:60% 62%}.feat>div{padding:22px 20px 24px;gap:12px}.feat>div h3{font-size:34px;line-height:1}.feat>div .btn{width:100%;justify-content:center;text-align:center;padding-left:12px;padding-right:22px;font-size:15px;letter-spacing:.04em;white-space:nowrap}}
@media(max-width:900px){.how,.ptgrid{grid-template-columns:1fr}.coach{position:static}.wiz{padding:22px 18px}.step h3{font-size:30px}.hw3{padding:16px}}
'''
_pages = pages
def pages_w(variant):
    full = _pages(variant)
    start = full.index('<section class="view def" id="home">')
    cstart = full.index('<section class="view" id="classes">')
    mstart = full.index('<section class="view" id="memberships">')
    bstart = full.index('<section class="view" id="book">')
    out = full[:start] + home_w() + classes_w() + services_w() + pt_w() + full[bstart:]
    for k in ("book", "refer"):
        out = out.replace('<section class="view" id="%s"><div class="phead">' % k,
                          '<section class="view" id="%s"><div class="phead"><div class="himg"><img src="%s" alt=""></div>' % (k, PH[k]), 1)
    return out + LOGIN_HTML + FAQ_HTML + KIDS_HTML + legal_pages.all_views()

LOGIN_HTML = '<section class="view" id="login"><div class="phead"><div class="wrap"><span class="chip">Members</span><h1>Log in to MyGym London</h1><p>Book classes and gym slots, manage your bookings and refer friends.</p></div></div><div class="wrap sec"><div class="loginwrap"><form class="card loginf" id="loginForm" onsubmit="return false"><h3>Log in</h3><label for="lgEmail">Email</label><input id="lgEmail" type="email" autocomplete="username" placeholder="you@example.com"><label for="lgPass">Password</label><input id="lgPass" type="password" autocomplete="current-password" placeholder="Your password"><button type="button" class="btn" id="lgBtn">Log in</button><p class="note" id="lgMsg"></p><a class="lnk" href="#login">Forgot your password?</a></form><aside class="card loginnew"><h3>New to MyGym?</h3><p>Pick a plan to join. Classes start from £6 and there is no contract.</p><a class="btn" href="#services">See our plans</a><p class="fine">Already a member? Get 50% off for each friend you refer. <a href="#refer">See Refer Friends</a></p></aside></div></div></section>'

FAQ_HTML = '<section class="view" id="faq"><div class="phead"><div class="himg"><img src="faq-banner.jpg" alt="MyGym London building in Bush Hill Park" style="object-position:50% 58%"></div><div class="wrap"><span class="chip">FAQ</span><h1>Frequently asked questions</h1><p>Quick answers about memberships, booking, opening hours and personal training.</p></div></div><div class="wrap sec"><div class="faq"><details><summary>Do I need a contract?</summary><p>No. There is no contract and no sneaky joining fees. Classes start from £6.</p></details><details><summary>What are your opening hours?</summary><p>We are open every day from 5am until midnight.</p></details><details><summary>Where are you?</summary><p>Main Avenue, Bush Hill Park, Enfield, EN1 1DS.</p></details><details><summary>How do I book a class or a gym slot?</summary><p>Members book, cancel and reschedule in the MyGym app (app.mygymlondon.co.uk) or online in two taps. Book MyGym gym slots are available to Gym &amp; Exercise Class members.</p></details><details><summary>Can I just pay as I go?</summary><p>Yes. PAYG Gym is £4 per visit, with no membership and no commitment. Classes can be booked from £6 a session.</p></details><details><summary>Which membership is right for me?</summary><p>Gym only is £26 a month, classes only is £26 a month, and Gym &amp; Exercise Classes is £35 a month or £400 a year. See the Services page for every option.</p></details><details><summary>Do I get an induction?</summary><p>Yes. The Gym &amp; Exercise Class Membership includes a free induction and an introductory health check.</p></details><details><summary>How much is personal training?</summary><p>Sessions start from as low as £32.50, and your first PT session is free. Small group personal training is £60 a month for 2 to 4 friends (£15 each per session, minimum 4 sessions a month).</p></details><details><summary>How do I cancel my membership?</summary><p>Monthly plans have no minimum term. Give us at least 1 week&#39;s notice before your next billing date. Annual plans can be refunded within 1 month of paying. After that, any refund is worked out by taking off the months you have used, and there is no refund if no full month is left. Full details are in our <a href="#terms">terms and conditions</a>.</p></details><details><summary>Can I cancel a class or gym booking?</summary><p>Yes. You can cancel in the app or <a href="#mybookings">on our website</a> up to 10 minutes before the session starts. Please cancel as early as you can so someone else can take your place. We do not give refunds for classes or gym sessions, but a cancelled pay as you go class becomes a credit for another class.</p></details><details><summary>What is the personal training cancellation policy?</summary><p>You can reschedule or cancel for free with at least 24 hours&#39; notice. With less notice, 50% of the session price is charged and the other 50% is added as credit towards your next purchase. We do not give cash refunds for personal training. Your free first session can be used once per person.</p></details><details><summary>How does the refer a friend offer work?</summary><p>Get a 50% discount on your first billing cycle for each friend you refer who buys a plan. Log in to refer.</p></details><details><summary>How do I get the app?</summary><p>Download it today: scan the QR code on the home page, or open app.mygymlondon.co.uk on your phone. On iPhone, tap Share, then Add to Home Screen. On Android, tap the menu, then Install app. It installs like any other app and there is nothing to look for in an app store.</p></details></div><div class="faqcta"><h3>Still have a question?</h3><p>Email <b>info@mygymlondon.co.uk</b> or ask us at the gym.</p></div></div></section>'

KIDS_HTML = """<section class="view" id="kids-gym"><div class="phead"><div class="himg"><img src="hero-full.jpg" alt="The MyGym London gym floor with the START turf" style="object-position:50% 72%"></div><div class="wrap"><span class="chip">Ages 8 and over</span><h1>Kids Gym</h1><p>Gym time just for kids, every Tuesday and Thursday from 4pm to 5pm.</p></div></div>
<div class="wrap sec"><div class="kg"><div class="kgtxt"><h2>A gym session made for children</h2>
<p>Kids Gym is a one hour session just for children aged 8 and over. While it runs, the gym is closed to adult members, so the children have the space to themselves with their coach.</p>
<p>Every session is led by one coach, with up to 12 children.</p>
<h2>For parents</h2>
<ul><li>Parents do not have to stay, but you remain responsible for your child during the session.</li><li>Children with special needs must have someone to supervise them alongside the coach.</li><li>A parent or guardian completes the health and safety form and accepts the <a href="#terms">terms and conditions</a> on their child's behalf.</li></ul>
<h2>Safety</h2>
<ul><li>Our coaches are DBS checked.</li><li>We have public liability insurance, with £1 million of cover.</li></ul>
<h2>Booking</h2>
<p>Book a place through the class timetable, or just turn up while there are places left.</p></div>
<aside class="card kgfacts"><h3>At a glance</h3><ul><li><b>When</b>Tuesdays and Thursdays, 4pm to 5pm</li><li><b>Ages</b>8 and over</li><li><b>Group</b>One coach, up to 12 children</li><li><b>Price</b>£20 per month</li><li><b>Where</b>Main Avenue, Bush Hill Park, Enfield, EN1 1DS</li></ul>
<a class="btn" href="#login">Join now</a><a class="btn ghost" href="#classes" data-cf="kids">See the timetable</a></aside></div></div></section>"""

CSS_ADD = '''
.phead{position:relative;overflow:hidden;background:#fff;padding:84px 0;min-height:330px}
.phead .himg{position:absolute;inset:0}.phead .himg img{width:100%;height:100%;object-fit:cover;object-position:60% 40%}
.phead .himg:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#fff 10%,rgba(255,255,255,.9) 36%,rgba(255,255,255,0) 68%)}
.phead h1{font-size:68px;max-width:620px}.phead p{max-width:520px}
.wrap.sec{padding-left:28px;padding-right:28px}
.phead .wrap{position:relative;z-index:2}
.shead{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap}
.who{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--mut);background:var(--alt);padding:8px 14px;border:1px dashed var(--line)}.who .dot{width:9px;height:9px;border-radius:50%;background:#2e9e5b}
.lnk{background:none;border:none;color:var(--acc);font-weight:700;cursor:pointer;text-decoration:underline;font-size:inherit}
.dates button{font:inherit;cursor:pointer;text-align:center}
.chips{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 18px}.fc{border:1.5px solid var(--line);background:#fff;padding:8px 16px;font-weight:600;font-size:13px;cursor:pointer;border-radius:99px}.fc.on{background:var(--txt);color:#fff;border-color:var(--txt)}
.slot em{color:var(--acc);font-style:normal;font-weight:700}.slot .done{margin-left:auto;font:800 20px var(--disp);color:#2e9e5b;text-transform:uppercase;letter-spacing:.06em}
.slot .btn{border:0}
.mybk{position:relative;background:#fff;border:1px solid var(--line);border-top:4px solid var(--acc);padding:28px 30px;box-shadow:0 8px 30px rgba(20,20,25,.07)}
.mbh{display:flex;justify-content:space-between;align-items:center}.mbh h2{margin:0;font-size:44px}.tag{background:var(--accs);color:var(--acc);font-weight:700;font-size:12px;letter-spacing:.12em;text-transform:uppercase;padding:6px 12px}
.toast{position:absolute;left:30px;right:30px;top:-18px;background:#17171a;color:#fff;padding:12px 18px;font-weight:600;opacity:0;transform:translateY(-6px);transition:.25s;pointer-events:none;border-left:5px solid #2e9e5b}.toast.on{opacity:1;transform:none}
.bkrow{display:flex;align-items:center;gap:20px;padding:16px 0;border-top:1px solid var(--line)}.bkd{width:76px;text-align:center;background:var(--alt);padding:8px 0}.bkd b{display:block;font:800 22px var(--disp);text-transform:uppercase}.bkd span{font-size:12px;color:var(--mut)}
.bki b{font-size:17px}.bki small{display:block;color:var(--mut)}.bka{margin-left:auto;display:flex;gap:10px}.bkrow>.btn{margin-left:auto}
.btn.sm.ghost{background:transparent;color:var(--txt);box-shadow:inset 0 0 0 2px var(--txt);clip-path:none;padding:9px 18px;border:0}.btn.sm.ghost.danger{color:var(--acc);box-shadow:inset 0 0 0 2px var(--acc)}
.bkrow.gone{opacity:.55}.bkrow.gone .bki b{text-decoration:line-through}
.rsbar{background:var(--accs);padding:12px 16px;margin:0 0 10px;font-size:14px;border-left:4px solid var(--acc)}
.mbout{display:none;align-items:center;justify-content:space-between;gap:20px;background:var(--alt);padding:20px 24px;margin-top:6px}.mybk.out #mblist{display:none}.mybk.out .mbout{display:flex}
.alt2{background:var(--alt)}
.insta .ihead{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap;margin-bottom:24px}.insta h2{margin:0}.insta h2 em{font-style:normal;color:var(--acc)}
.igrid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}.ipost{position:relative;display:block;aspect-ratio:1/1;overflow:hidden;background:#17171a}.ipost img{width:100%;height:100%;object-fit:cover;transition:.3s}
.iov{position:absolute;inset:0;background:rgba(224,57,57,.78);color:#fff;display:flex;align-items:center;justify-content:center;gap:6px;opacity:0;transition:.25s}.ipost:hover .iov{opacity:1}.ipost:hover img{transform:scale(1.06)}.iov svg{width:26px;height:26px;margin:0}
.visit{background:var(--alt)}.vgrid{display:grid;grid-template-columns:1.25fr 1fr;gap:22px;margin-top:10px}
.map{min-height:480px;border:1px solid var(--line);background:#e8e6e6}.map iframe{width:100%;height:100%;min-height:480px;border:0;filter:grayscale(.15)}
.vinfo{display:grid;gap:14px;align-content:start}.vcard{background:#fff;border:1px solid var(--line);border-left:4px solid var(--acc);padding:22px 24px}.vcard h3{margin-bottom:10px}.vcard p{margin-bottom:8px;font-size:15px}.vcard.soft{background:var(--accs);border-color:transparent;border-left-color:var(--acc)}
.hrs div{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line)}.hrs b{font:800 24px var(--disp)}.vcard .open{font-weight:700;margin:10px 0 0;color:var(--acc)}
@media(max-width:900px){.igrid{grid-template-columns:repeat(3,1fr)}.vgrid{grid-template-columns:1fr}.bkrow{flex-wrap:wrap}.bka{margin-left:0;width:100%}.phead .himg:after{background:linear-gradient(90deg,rgba(255,255,255,.95),rgba(255,255,255,.7))}.mbh h2{font-size:34px}.mybk{padding:22px 18px}}
'''

SCHED_JS = r'''
(function(){
var D=[["Mon",5],["Tue",6],["Wed",7],["Thu",8],["Fri",9],["Sat",10],["Sun",11]];
var C={cardio:["Cardio n Abs","cardio","45 min"],hiit:["HIIT","cardio","30 min"],box:["BoxFit","cardio","30 min"],vit:["Vitality 50+ Circuit","fifty","1 hr"],str:["Strength","strength","1 hr"],pil:["Pilates","mind","1 hr"],kids:["Kids Gym","kids","1 hr"],abs:["Abs Attack","strength","45 min"],body:["Body Conditioning","strength","45 min"]};
var W={11:[["09:00","str",8]],5:[["07:00","cardio",6],["09:30","vit",8],["12:30","hiit",5],["18:00","box",4],["19:15","pil",7]],6:[["07:00","cardio",6],["16:00","kids",12],["18:00","hiit",3],["19:15","abs",8]],7:[["07:00","hiit",6],["07:30","cardio",5],["09:30","str",8],["18:00","box",2]],8:[["07:00","cardio",7],["16:00","kids",12],["18:00","hiit",4]],9:[["07:00","cardio",6],["09:30","vit",8],["12:30","str",5],["18:00","body",6],["19:15","abs",3]],10:[["09:00","str",8],["10:15","pil",6]]};
var F=[["all","All classes"],["cardio","HIIT & cardio"],["strength","Strength"],["mind","Pilates"],["fifty","50+"],["kids","Kids"]];
var sel=5,flt="all",member=true,bk=[{id:1,day:11,t:"09:00",k:"str"},{id:2,day:6,t:"18:00",k:"hiit"}],uid=3,resc=null;
var $=function(i){return document.getElementById(i)};
var DN={11:"Sun 11 Oct",5:"Mon 5 Oct",6:"Tue 6 Oct",7:"Wed 7 Oct",8:"Thu 8 Oct",9:"Fri 9 Oct",10:"Sat 10 Oct"};
function toast(m){var t=$("toast");t.textContent=m;t.classList.add("on");clearTimeout(toast.h);toast.h=setTimeout(function(){t.classList.remove("on")},3500)}
function has(day,t,k){return bk.some(function(b){return !b.gone&&b.day===day&&b.t===t&&b.k===k})}
function strip(){var h="";D.forEach(function(d){h+='<button type="button" class="dt'+(d[1]===sel?" sel":"")+'" data-d="'+d[1]+'"><small>'+d[0]+'</small><b>'+d[1]+'</b></button>'});$("sdates").innerHTML=h}
function chips(){var h="";F.forEach(function(f){h+='<button type="button" class="fc'+(f[0]===flt?" on":"")+'" data-f="'+f[0]+'">'+f[1]+'</button>'});$("sfilter").innerHTML=h}
function slots(){var h="",rows=(W[sel]||[]).filter(function(r){return flt==="all"||C[r[1]][1]===flt});
 rows.forEach(function(r){var c=C[r[1]],b=has(sel,r[0],r[1]);
  h+='<div class="slot"><span class="tm">'+r[0]+'</span><div><b>'+c[0]+'</b><small>'+c[2]+' · '+(r[2]<=3?'<em>only '+r[2]+' spots left</em>':r[2]+' spots left')+'</small></div>'
   +(resc?'<button type="button" class="btn sm mv" data-t="'+r[0]+'" data-k="'+r[1]+'">Move here</button>':(b?'<span class="done">Booked ✓</span>':'<button type="button" class="btn sm bk" data-t="'+r[0]+'" data-k="'+r[1]+'">Book</button>'))+'</div>'});
 if(!rows.length)h='<p class="note">No matching classes this day. Try another day or filter.</p>';
 $("sslots").innerHTML=h}
function list(){var h="";
 bk.sort(function(a,b){return a.day-b.day||a.t.localeCompare(b.t)}).forEach(function(b){var c=C[b.k],p=DN[b.day].split(" ");
  h+='<div class="bkrow'+(b.gone?" gone":"")+'"><div class="bkd"><b>'+p[0]+'</b><span>'+p[1]+" "+p[2]+'</span></div><div class="bki"><b>'+c[0]+'</b><small>'+b.t+' · '+c[2]+(b.gone?' · Cancelled':' · Confirmed ✓')+'</small></div>'
   +(b.gone?'<button type="button" class="btn sm" data-undo="'+b.id+'">Undo</button>':'<div class="bka"><button type="button" class="btn sm ghost" data-rs="'+b.id+'">Reschedule</button><button type="button" class="btn sm ghost danger" data-cx="'+b.id+'">Cancel</button></div>')+'</div>'
   +(resc===b.id?'<div class="rsbar">Rescheduling <b>'+c[0]+'</b>: pick a new day above, then tap “Move here”. <button type="button" class="lnk" data-rc="1">Keep original</button></div>':'')});
 if(!bk.length)h='<p class="note">No upcoming bookings yet. Pick a class above.</p>';
 $("mblist").innerHTML=h}
function paint(){strip();chips();slots();list();$("mybk").classList.toggle("out",!member);$("whoTxt").textContent=member?"Preview: signed in as a member":"Preview: not signed in";$("whoBtn").textContent=member?"Switch to logged out":"Switch to logged in";$("mbTag").textContent=member?bk.filter(function(b){return !b.gone}).length+" upcoming":"Members only"}
document.addEventListener("click",function(e){var t=e.target.closest("button");if(!t||!$("sdates"))return;
 if(t.dataset.d){sel=+t.dataset.d;paint();return}
 if(t.dataset.f){flt=t.dataset.f;paint();return}
 if(t.id==="whoBtn"){member=!member;resc=null;paint();return}
 if(t.classList.contains("bk")){if(!member){toast("Log in to book this class.");return}bk.push({id:uid++,day:sel,t:t.dataset.t,k:t.dataset.k});toast("Booked! A confirmation has been sent to your email.");paint();return}
 if(t.classList.contains("mv")){var b=bk.filter(function(x){return x.id===resc})[0];b.day=sel;b.t=t.dataset.t;b.k=t.dataset.k;resc=null;toast("Moved! Your new time is confirmed.");paint();return}
 if(t.dataset.cx){bk.filter(function(x){return x.id==t.dataset.cx})[0].gone=1;toast("Booking cancelled. Your spot was released.");paint();return}
 if(t.dataset.undo){delete bk.filter(function(x){return x.id==t.dataset.undo})[0].gone;paint();return}
 if(t.dataset.rs){resc=+t.dataset.rs;paint();return}
 if(t.dataset.rc){resc=null;paint();return}});
if($("sdates"))paint();
})();
'''

CSS_ADD += '''
.burger{display:none;width:44px;height:44px;border:1.5px solid var(--line);background:#fff;cursor:pointer;padding:0;position:relative}
.burger i,.burger i:before,.burger i:after{position:absolute;left:11px;right:11px;height:2.5px;background:var(--txt);content:"";transition:.2s}.burger i{top:20px}.burger i:before{top:-8px;left:0;right:0}.burger i:after{top:8px;left:0;right:0}
header.open .burger i{background:transparent}header.open .burger i:before{top:0;transform:rotate(45deg)}header.open .burger i:after{top:0;transform:rotate(-45deg)}
.dates{overflow-x:auto;scrollbar-width:none}.dates::-webkit-scrollbar{display:none}.dt{flex:0 0 auto}
@media(max-width:900px){
 .burger{display:block}.hw{gap:10px;padding:8px 16px}.logo{height:46px}.hr{margin-left:auto}.hr .login{display:none}.hr .btn.sm{padding:9px 16px 9px 14px;font-size:15px}
 header.open .mnav{display:flex;flex-direction:column;align-items:stretch;position:absolute;top:100%;left:0;right:0;background:#fff;padding:8px 20px 18px;border-bottom:3px solid var(--acc);box-shadow:0 20px 30px rgba(0,0,0,.1)}
 header.open .mnav a{padding:14px 4px;border-bottom:1px solid var(--line);font-size:15px}
 .sec{padding:56px 0}.hero h1{font-size:50px}.hcopy{padding:26px 20px 34px}.hstats{gap:26px}.hstats b{font-size:44px}
 h2{font-size:38px}.phead{padding:0;min-height:0;overflow:visible}.phead .himg{position:relative;height:190px}.phead .himg:after{display:none}.phead .wrap{padding:26px 20px 30px}.phead h1{font-size:46px;max-width:none}.phead p{max-width:none}
 .two{grid-template-columns:1fr}.feat{grid-template-columns:1fr}.feat img{height:230px;min-height:0}.feat div{padding:22px}
 .phones{padding-bottom:20px}.p2{margin-top:36px}.ticker .track{font-size:20px}
 .shead{align-items:flex-start}.who{width:100%;justify-content:space-between;flex-wrap:wrap}
 .bkrow{gap:12px}.bkd{width:62px}.bka{margin-left:0;width:100%}.bka .btn{flex:1}
 .slot{gap:14px;padding:14px}.tm{min-width:62px;font-size:26px}
 .mbout{flex-direction:column;align-items:flex-start}.ihead .btn{width:100%}.map,.map iframe{min-height:320px}
 .gal{grid-template-columns:repeat(3,1fr)}.gal img{height:96px}.hours div,.hrs div{flex-wrap:wrap}
 footer .fwrap{grid-template-columns:1fr 1fr;gap:26px;padding-top:36px}.perk .big{font-size:64px}.plan{padding:22px}
 .cc{min-height:0}.cta .wrap{padding-left:20px;padding-right:20px}.opt{padding:12px 8px;font-size:14px}
}
'''
CSS_ADD += '''
.plans{grid-template-columns:repeat(3,1fr)}.plan{gap:10px}.plan.special{background:#17171a;color:#fff;border-color:#17171a}.plan.special .pp b{color:#ff6b6b}.plan.special li svg{color:#ff6b6b}.plan.special .flag{background:#ff6b6b;color:#17171a}.plan p{font-size:14px;opacity:.8}.plan h3{font-size:25px;min-height:0}
.ptopts{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:6px}.ptopt{position:relative;background:#fff;border:1px solid var(--line);border-top:4px solid var(--acc);padding:30px;display:flex;flex-direction:column;gap:12px;box-shadow:0 2px 12px rgba(20,20,25,.05)}
.ptopt.hot{background:var(--accs);border-color:var(--acc)}.ptopt .pp b{font:800 64px/1 var(--disp);color:var(--acc)}.ptopt .pp span{margin-left:8px;color:var(--mut);font-size:13px}.ptopt ul{list-style:none;display:grid;align-content:start;gap:8px;flex:1}.ptopt li svg{color:var(--acc)}.ptopt .btn{align-self:flex-start}
.ptopt .flag{position:absolute;top:-13px;left:24px;background:var(--acc);color:#fff;padding:5px 12px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
.quiz{display:grid;gap:12px;align-content:start}.quiz label{font-weight:700;font-size:14px;margin-top:6px}.quiz .sub{margin:0}
.qrow{display:flex;flex-wrap:wrap;gap:8px}.qc{border:1.5px solid var(--line);background:#fff;padding:10px 16px;font:600 14px Inter,sans-serif;cursor:pointer;border-radius:99px}.qc:hover{border-color:var(--acc)}.qc.on{background:var(--acc);border-color:var(--acc);color:#fff}
.ta{border:1.5px solid var(--line);padding:14px;min-height:76px;color:var(--mut);font-size:14px}
.quiz .note{color:var(--acc);margin:0;text-align:left}
.result{display:none;background:var(--alt);border-left:4px solid var(--acc);padding:18px 20px}.result.on{display:block}.result p{margin:8px 0;font-size:14px;color:var(--mut)}
.rec{background:#fff;border:1px solid var(--line);padding:14px 16px;margin:10px 0}.rec span{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--acc);font-weight:700}.rec h4{font:800 28px var(--disp);text-transform:uppercase}.rec small{color:var(--mut)}
.side{display:grid;gap:18px;align-content:start}.side .trainers{padding:24px}.side .tr{box-shadow:none}
@media(max-width:1100px){.plans{grid-template-columns:repeat(2,1fr)}}
@media(max-width:900px){.plans,.ptopts{grid-template-columns:1fr}.ptopt{padding:24px 20px}.ptopt .pp b{font-size:52px}.qc{padding:10px 14px}}
'''
CSS_ADD += CSS_ADD2
CSS_ADD += """
#kids-gym .phead .himg img{object-position:50% 72%}
.kg{display:grid;grid-template-columns:1.25fr .75fr;gap:34px;align-items:start}
.kgtxt h2{font-size:34px;margin:26px 0 8px}.kgtxt h2:first-child{margin-top:0}
.kgtxt p,.kgtxt li{font-size:16px;line-height:1.65;color:#2c2c31;margin:0 0 12px}
.kgtxt ul{padding-left:20px;margin:0 0 12px}.kgtxt a{color:var(--acc);text-decoration:underline}
.kgfacts{position:sticky;top:96px}.kgfacts ul{list-style:none;padding:0;margin:0 0 16px}
.kgfacts li{padding:10px 0;border-bottom:1px solid var(--line);font-size:15px;color:#17171a}
.kgfacts li b{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--mut);margin-bottom:2px}
.kgfacts .btn{display:flex;justify-content:center;margin-top:8px}
.plan p a{color:var(--acc);font-weight:700;text-decoration:underline}
@media(max-width:900px){.kg{grid-template-columns:1fr}.kgfacts{position:static}.kgtxt h2{font-size:28px}}
"""
BURGER_JS ='document.addEventListener("click",function(e){var b=e.target.closest(".burger"),h=document.querySelector("header");if(b){h.classList.toggle("open");return}if(h&&h.classList.contains("open")&&e.target.closest(".mnav a"))h.classList.remove("open")});'
OPEN_JS ='(function(){var d=new Date(),g=d.getDay(),h=d.getHours()+d.getMinutes()/60,o=[5,24],e=document.getElementById("openNow");if(e)e.textContent=(h>=o[0]&&h<o[1])?"We\'re open now.":"Closed right now. See hours.";})();'

_hdr = header().replace('<div class="hr">', '<div class="hr">', 1).replace('<a class="btn sm" href="#memberships">Join now</a></div>', '<a class="btn sm" href="#memberships">Join now</a><button class="burger" type="button" aria-label="Menu"><i></i></button></div>', 1)
html = f'''<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MyGym London – Website Design B (White)</title><link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAADZ0lEQVR4nO1Wz28TRxR+Mzv7y2sTx3aJXeSkOA2oQWlVJKgDHNr6QCgUIXrgVlRV6v8EPfRY0UOlSiFqD5FQ6YEDKUqhRTRxEwMLie043tjr/T2v2kVu4jTEtCi3fIfRzuzOfPO+772ZJd+cOAF7Cbqnq8M+wStg34O+YNv6hBCE/wkStYj4UgLkPPB8wgTo/ejVgZwLkrQTASHo+1IyWTh/3mu3iNDlIASQR5tDIDRsOQKl3cEtSyOnguiZ5l8zMyFHd4ubEXDfVwaTltGsTN9kikIEARG57wui+IIpcBwgwBQ1sG3aXWJTEAQqiW+dm6L/bG4bQRQguhstICRz/Lh+6xZT1VxxUv/lNiAGrjswOjpcKrntlrFYfn7nDlOU0DFKw5YQ7nnUEz3LDoPeQaKuUNEEGDl7tvHwj9TYkcHxcRaLmSvPEofy2eLJRze+CywrlssdvXKlWS5nJiaYpgmMOU1DTad/u34tnN6Lnj4hxLes9Pgxp7E2dvly9uQHTJY9s1248Knn2HatDgCZiYn8mTNEEPIffbzxuBK4Tvv5s069BhRiQwe57/VJ0xdB6D/fZqrqtduxbNZYWnpzcrI692vjwYPRixcdw1ienQVEKZGo3p2TEgN2vYaIjYVF7nmkV58d0lTUtOXZWVHT0PcBwLc68Xy+9eSpu77uIr9//Wsqss7qyjufX63enbPrtcc//QhAkHNELsa0MP12i4AAcC5KopZKdhpNUZFy7x5rLlcWbnyrDWhEYPZGK/5GOnkoW7k5zWR55FRxbaHMkcuqhgiO7cK/6me7J5xzWYsVSh+ibSVH8sOni6nCYQHxvS+uHv3sUtAx86eLY+emJEXJjBWGTxWTw3nCg/e/+vLtT6YC2wKB9vMA0Woa6+Ul6cABY7lSTWealQpSujg94zsOCGxl/r4oy65pGk/01d8fGk91RPLo+x8c0wxLx9vdZEKUdEoaTFX/LFMtDsj1e/NUksXBlFFbAyBqLrexWkfO5aEsD3z93rygKEyNGathgqkHh8R4IqyyLVZvElDG7PoaBZIvlUKveCgnoRSRR3Oi2JGHD5FVUX1R5DwqYhqOUMHUdQyCzZMGgGz9qwgPO9uG3lr/r2Cq+tKjglAqxuPwesAwpi18u79+fezfyX2xL1Ff7LlEfwMq9ZVBRaezxAAAAABJRU5ErkJggg==">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>{BASE}{CSS_W}{CSS_ADD}{legal_pages.LEGAL_CSS}</style></head><body>{_hdr}<main>{pages_w("b")}</main>{footer()}
<script>{BURGER_JS}{OPEN_JS}{SCHED_JS}{QUIZ_JS}</script></body></html>'''
for _a, _b in (('#memberships', '#services'), ('id="memberships"', 'id="services"'), ('=memberships]', '=services]'), ('#memberships:target', '#services:target')):
    html = html.replace(_a, _b)
open(os.path.join(HERE, "site-w.html"), "w", encoding="utf-8").write(html)
print("built site-w.html")
