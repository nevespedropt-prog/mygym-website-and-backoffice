"""Build the pages-only CODE website (no Wix) from the approved mockup.

Source of truth: site-w.html (made by gen_site3.py). This script splits it into real pages,
swaps the demo parts for real behaviour, copies and self-hosts every photo and font, and writes
the result to ..\\website-code (plain HTML, CSS, JS; no build step at runtime).

Run:  python gen_site3.py   (only if the mockup text changed)
      python build_site.py
Needs internet once (downloads the photos from static.wixstatic.com and the Google fonts).
"""
import hashlib
import os
import re
import shutil
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "website-code")
APP = "https://app.mygymlondon.co.uk"
# Where members buy a plan today (Wix Pricing Plans). Change in ONE place if that moves.
JOIN_URL = "https://join.mygymlondon.co.uk"  # Wix checkout lives on this subdomain after the move (owner decision 2026-10-27)
SITE = "https://www.mygymlondon.co.uk"
SUPABASE_URL = "https://ldmksxyilykyfnqnuytv.supabase.co"
SUPABASE_KEY = "sb_publishable_gboSvVSFxQT0xDSEzbeYxw_E1OO3TRp"  # public publishable key, same as the app
FORMS_DIR = os.path.join(HERE, "..", "app", "supabase", "forms")  # ready-made form pages, made by app/supabase/forms/build.mjs
SUBMIT_URL = SUPABASE_URL + "/functions/v1/submit-form"

TEST = "--test" in sys.argv  # test copy: hidden from Google and labelled
OUT = os.path.join(HERE, "..", "website-code-test") if TEST else OUT

src = open(os.path.join(HERE, "site-w.html"), encoding="utf-8").read()

# ---------- split the mockup ----------
css = src[src.index("<style>") + 7 : src.index("</style>")]
header = src[src.index("<header>") : src.index("</header>") + 9]
footer = src[src.index("<footer>") : src.index("</footer>") + 9]
main_start = src.index("<main>") + 6
first_view = src.index('<section class="view" id="classes">')
home = src[main_start:first_view]
views = {}
for m in re.finditer(r'<section class="view" id="([a-z\-]+)">', src):
    end = src.index("</section>", m.start()) + 10
    views[m.group(1)] = src[m.start() : end]

js_all = src[src.index("<script>", src.index("</footer>")) + 8 : src.rindex("</script>")]

PAGES = {
    "home": ("index.html", "MyGym London | Private gym, classes & personal training in Enfield",
             "Private community gym in Bush Hill Park, Enfield EN1. Personal training, 25+ classes a week from £6, open 5am to midnight, no contract."),
    "classes": ("classes.html", "Exercise classes in Enfield | Timetable & prices | MyGym London",
                "Weekly class timetable at MyGym London, Bush Hill Park, Enfield: 25+ classes a week, most £6, Pilates £7. Pay as you go or membership."),
    "book": ("book.html", "Book the gym | MyGym London",
             "Members book open gym time slots in the MyGym app."),
    "services": ("services.html", "Gym membership prices in Enfield | MyGym London",
                 "Gym from £26 a month, classes £26, both £35, pay as you go gym £4 and classes £6. No contract, no joining fees. Bush Hill Park, Enfield."),
    "pt": ("personal-training.html", "Personal trainer in Enfield | Free first session | MyGym London",
           "One to one and small group personal training in Bush Hill Park, Enfield from £32.50 for a 30-minute session. Your first PT session is free."),
    "refer": ("refer-friends.html", "Refer friends | MyGym London",
              "Refer a friend to MyGym London and get rewarded."),
    "faq": ("faq.html", "FAQ: prices, opening hours, booking | MyGym London", "Answers about MyGym London in Enfield: no contract, open 5am to midnight, prices, booking, induction and personal training."),
    "kids-gym": ("kids-gym.html", "Kids Gym | MyGym London",
                 "Kids Gym at MyGym London for children aged 8 and over, Tuesday and Thursday 4pm to 5pm."),
    "terms": ("terms.html", "Terms and conditions | MyGym London", "Terms and conditions for MyGym London."),
    "privacy": ("privacy.html", "Privacy policy | MyGym London", "How MyGym London uses your personal data."),
    "cookies": ("cookies.html", "Cookie notice | MyGym London", "How MyGym London uses cookies."),
    "login": ("login.html", "Member log in | MyGym London", "Members log in to the MyGym app."),
}
LINK = {
    "#home": "index.html", "#classes": "classes.html", "#book": "book.html",
    "#services": "services.html", "#pt": "personal-training.html", "#refer": "refer-friends.html",
    "#faq": "faq.html", "#kids-gym": "kids-gym.html", "#terms": "terms.html",
    "#privacy": "privacy.html", "#cookies": "cookies.html", "#login": "login.html",
}


def fix_links(html):
    return re.sub(r'href="(#[a-z\-]+)"', lambda m: 'href="%s"' % LINK.get(m.group(1), m.group(1)), html)


# ---------- page bodies ----------
def sub_once(html, old, new, label):
    if old not in html:
        sys.exit("build_site: could not find %s" % label)
    return html.replace(old, new, 1)


# Home
home_body = home
home_body = home_body.replace('<b>30+</b><span>classes a week</span>', '<b>25+</b><span>classes a week</span>')
home_body = home_body.replace('href="#home">Get the MyGym app', 'href="%s">Get the MyGym app' % APP)

# Classes: live weekly timetable replaces the demo booking widget
cl = views["classes"]
cl = cl.replace("Over 30 classes every week, from £6 a session. Pick a day, book your spot, and manage your bookings right here.",
                "Over 25 classes every week, from £6 a session. See the timetable here, then book your spot in the MyGym app.")
cl = cl.replace("Class schedule &amp; bookings", "Class timetable")
a = cl.index('<div class="wrap sec" style="padding-bottom:20px">')
b = cl.index('<div class="alt2 sec">')
live = (
    '<div class="wrap sec" style="padding-bottom:20px">'
    '<div class="shead"><div><h2 id="timetable">Weekly timetable</h2>'
    '<p class="sub" id="ttsub">Loading the timetable...</p></div></div>'
    '<div class="dates" id="sdates"></div><div class="chips" id="sfilter"></div>'
    '<div id="sslots" class="slots"></div></div>'
    '<div class="wrap" style="padding-bottom:30px"><div class="card"><h3>Book and manage your classes in the app</h3>'
    '<p class="sub">Members book, cancel and change classes in the MyGym app. Classes start from £6 a session.</p>'
    '<a class="btn" href="%s/#timetable">Open the app</a> <a class="btn ghost" href="login.html">Log in</a></div></div>' % APP
)
cl = cl[:a] + live + cl[b:]
cl = cl.replace('href="#classes" data-cf="', 'href="classes.html#timetable" data-cf="')
views["classes"] = cl

# Book the gym: honest explainer, no demo slots
bk = views["book"]
a = bk.index('<div class="wrap sec">')
bk = bk[:a] + (
    '<div class="wrap sec"><div class="card"><h3>Open gym time slots</h3>'
    '<p class="sub">Members book an open gym time slot in the MyGym app, 5am to midnight, one hour at a time. '
    'Gym slots are for members on a gym plan. On Tuesdays and Thursdays 4pm to 5pm the gym is closed to adults for Kids Gym.</p>'
    '<a class="btn" href="%s/#timetable">Open the app to book</a> <a class="btn ghost" href="services.html">Explore plans</a></div></div></section>' % APP
)
views["book"] = bk

# Login: members use the app
views["login"] = (
    '<section class="view" id="login"><div class="phead"><div class="wrap"><span class="chip">Members</span>'
    '<h1>Log in to MyGym London</h1><p>Book classes and gym slots, manage your bookings and track your progress in the MyGym app.</p></div></div>'
    '<div class="wrap sec"><div class="loginwrap"><div class="card loginf"><h3>Members log in on the app</h3>'
    '<p class="sub">Use the same email and password you used to create your account.</p>'
    '<a class="btn" href="{APP}/#login">Log in on the app</a></div>'
    '<aside class="card loginnew"><h3>New to MyGym?</h3><p>Pick a plan to join. Classes start from £6.</p>'
    '<a class="btn" href="services.html">See our plans</a>'
    '<p class="fine">Already a member? Get 50% off for each friend you refer. <a href="refer-friends.html">See Refer Friends</a></p></aside></div></div></section>'.replace("{APP}", APP)
)

# Services: real join link; everything else stays
sv = views["services"]
sv = sv.replace('href="#login"', 'href="%s"' % JOIN_URL)
views["services"] = sv
rf = views["refer"].replace('href="#login"', 'href="%s/#login"' % APP)
views["refer"] = rf


# ---------- real forms (stored by the back end, emails sent) ----------
def form_html(fid):
    return open(os.path.join(FORMS_DIR, "html", fid + ".html"), encoding="utf-8").read().strip()


def with_form(view_html, fid, heading, intro):
    """Append a form block at the end of a page section."""
    block = ('<div class="wrap sec formsec" id="form-%s"><div class="shead"><div><h2>%s</h2><p class="sub">%s</p></div></div>%s</div>'
             % (fid, heading, intro, form_html(fid)))
    return view_html[: view_html.rindex("</section>")] + block + "</section>"


views["classes"] = with_form(views["classes"], "trial-class", "Try a free class", "Pick a class and a day. We confirm your place by email.")
views["faq"] = with_form(views["faq"], "contact", "Still have a question?", "Send us a message and we will reply within one working day.")
views["kids-gym"] = with_form(views["kids-gym"], "kids-registration", "Register your child", "For children aged 8 and over. We confirm each place within two working days.")

# the form's own big heading would repeat our section heading: hide it on the site (the heading stays in the form for screen readers)
def quiet_heading(h):
    return h.replace("<h2>", '<h2 class="sr-only">', 1)


for k in ("classes", "faq", "kids-gym"):
    views[k] = re.sub(r'(<form class="mgl-form"[^>]*>\s*)<h2>', r'\1<h2 class="sr-only">', views[k], count=1)
    views[k] = re.sub(r'(<form class="mgl-form"[^>]*>\s*<h2 class="sr-only">[^<]*</h2>\s*)<p class="intro">[^<]*</p>', r"\1", views[k], count=1)

# footer newsletter box on every page
NEWS_BLOCK = '<div class="fnews"><div class="fwrap2">' + form_html("newsletter-signup") + "</div></div>"


# PT quiz, last step: real form fields (name, phone, email, note, consents) instead of an email link
_a = views["pt"].index('<label class="lb" for="wemail">')
_b = views["pt"].index('<p class="note" id="wmsg"></p>')
views["pt"] = views["pt"][:_a] + (
    '<label class="lb" for="wname">Your name</label><input id="wname" class="wemail" type="text" autocomplete="name" maxlength="80" placeholder="Your name">'
    '<label class="lb" for="wphone">Phone number</label><input id="wphone" class="wemail" type="tel" autocomplete="tel" inputmode="tel" maxlength="25" placeholder="07...">'
    '<label class="lb" for="wemail">Your email</label><input id="wemail" class="wemail" type="email" autocomplete="email" inputmode="email" maxlength="120" placeholder="you@example.com">'
    '<p class="hint">We use your details only to arrange your free session.</p>'
    '<label class="lb" for="wnote">Anything we should know? (optional)</label><textarea id="wnote" class="wemail" rows="3" maxlength="300" placeholder="Injuries, events you are training for..."></textarea>'
    '<button type="button" class="chk" id="wterms"><span class="box"></span> I agree to the terms &amp; conditions and privacy policy</button>'
    '<p class="hint">Read the <a href="#terms">terms and conditions</a> and <a href="#privacy">privacy policy</a>.</p>'
    '<button type="button" class="chk" id="wnews"><span class="box"></span> Send me news and offers from MY GYM London by email (optional). I can unsubscribe at any time.</button>'
    '<div class="hp" aria-hidden="true"><label>Leave this empty <input type="text" id="whp" tabindex="-1" autocomplete="off"></label></div>'
    '<button type="button" class="btn" id="wbook">Send my free PT request</button>'
) + views["pt"][_b:]


# no inline handlers (the site's security headers forbid them); the quiz script stops the form from submitting itself
views["pt"] = views["pt"].replace(' onsubmit="return false"', '')
# Google's map embed sets cookies; use a plain map picture that links to Google Maps instead (keeps the site cookie-free)
MAP_LINK = "https://maps.app.goo.gl/wNNUX7us7yqXQyGd9"
home_body = re.sub(r'<iframe[^>]*maps\.google\.com[^>]*></iframe>',
                   '<a class="mapimg" href="%s" rel="noopener"><img src="map-static.jpg" alt="Map showing MyGym London, Main Avenue, Bush Hill Park, Enfield. Tap for directions." loading="lazy" style="width:100%%;height:100%%;object-fit:cover"></a>' % MAP_LINK, home_body)

# ---------- JS ----------
# burger menu + open now line: first two statements of the mockup script
burger = js_all[: js_all.index("(function(){\nvar D=")]
# PT questionnaire: keep, but the end sends a real email (mailto) instead of pretending to book
w0 = js_all.index('(function(){\nvar w=document.getElementById("wiz")')
w1 = js_all.index("})();", w0) + 5
wiz = js_all[w0:w1]
wiz = r"""
(function(){
var w=document.getElementById("wiz");if(!w)return;
var CFG=window.MGL_FORMS||{};
var A={},cur=1,N=5,time=null,terms=false,news=false,t0=Date.now();
var GOAL={"Lose body fat":"Lose weight","Build strength & muscle":"Build strength","General fitness & energy":"Get fitter","Mobility & longevity":"Get fitter","Confidence with exercise":"Get fitter","Sport-specific training":"Train for an event"};
var LEVEL={"Brand new":"New to it","Getting back into it":"Some experience","Regular trainer":"Experienced"};
function $(i){return document.getElementById(i)}
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function show(n){cur=n;[].forEach.call(w.querySelectorAll(".step"),function(s){s.classList.toggle("on",+s.dataset.s===n)});
 $("wbarI").style.width=(n*20)+"%";$("wstep").textContent="Step "+n+" of "+N;
 $("wback").style.visibility=n>1?"visible":"hidden";
 if(n===5)$("wsum").textContent=(A.goal||"")+" · "+(A.level||"")+" · "+(A.freq||"")+" · "+(A.style||"")}
w.addEventListener("submit",function(e){e.preventDefault()});
w.addEventListener("click",function(e){
 var c=e.target.closest(".qc");
 if(c){var g=c.parentNode;[].forEach.call(g.querySelectorAll(".qc"),function(x){x.classList.remove("on")});c.classList.add("on");A[g.dataset.g]=c.dataset.v;setTimeout(function(){show(Math.min(cur+1,N))},260);return}
 var o=e.target.closest("#wtime .opt");if(o){[].forEach.call(w.querySelectorAll("#wtime .opt"),function(x){x.classList.remove("on")});o.classList.add("on");time=o.dataset.v;$("wmsg").textContent="";return}
 if(e.target.closest("#wterms")){terms=!terms;$("wterms").classList.toggle("on",terms);$("wmsg").textContent="";return}
 if(e.target.closest("#wnews")){news=!news;$("wnews").classList.toggle("on",news);return}
 if(e.target.closest("#wback")){show(Math.max(cur-1,1));return}
 if(e.target.closest("#wbook")){
  var m=$("wmsg"),name=($("wname").value||"").trim(),phone=($("wphone").value||"").trim(),em=($("wemail").value||"").trim(),note=($("wnote").value||"").trim();
  if(!time){m.textContent="Please choose AM or PM.";return}
  if(name.length<2){m.textContent="Please enter your name.";$("wname").focus();return}
  if(!/^[0-9 +()\-]{7,25}$/.test(phone)){m.textContent="Please enter a phone number we can reach you on.";$("wphone").focus();return}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)){m.textContent="Please enter a valid email so we can confirm your session.";$("wemail").focus();return}
  if(!terms){m.textContent="Please agree to the terms & conditions.";return}
  if(!CFG.endpoint){m.textContent="Sorry, the form is not available right now. Please email info@mygymlondon.co.uk.";return}
  var q=new URLSearchParams(location.search);
  var info=("Quiz: "+(A.goal||"")+" | "+(A.level||"")+" | "+(A.freq||"")+" | "+(A.style||"")+" | prefers "+time+(note?" | Note: "+note:"")).slice(0,600);
  var body={form_id:"pt-enquiry",elapsed:Math.round((Date.now()-t0)/1000),hp:($("whp").value||""),
   data:{full_name:name,email:em,phone:phone,goal:GOAL[A.goal]||"Something else",experience:LEVEL[A.level]||"Some experience",times:[time==="AM"?"Mornings":"Evenings"],health_note:info,
    page_url:location.href.split("#")[0],utm_source:q.get("utm_source")||"",utm_medium:q.get("utm_medium")||"",utm_campaign:q.get("utm_campaign")||""},
   consent:news?{marketing:true}:{}};
  var btn=$("wbook");btn.disabled=true;m.textContent="Sending...";
  fetch(CFG.endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
   .then(function(r){return r.json().then(function(j){return{ok:r.ok&&j.ok,j:j}})})
   .then(function(res){
    if(!res.ok){m.textContent=(res.j.errors&&res.j.errors[0]&&res.j.errors[0].message)||res.j.error||"Sorry, that did not go through. Please try again or email info@mygymlondon.co.uk.";btn.disabled=false;return}
    var rec=A.style==="With friends"?["Small Group Personal Training","£60 a month · £15 each per session · minimum 4 sessions"]:A.style==="One to one"?["1-2-1 Personal Training","from £32.50 a session"]:["Your free session first","we'll find your best fit together"];
    var r=$("wres");
    r.innerHTML="<div class=\"ok\">✓</div><h3>Thanks, we have your request</h3><p>A coach will contact you within one working day to confirm your free <b>"+time+" PT session</b>. We have emailed a copy to <b>"+esc(em)+"</b>.</p><div class=\"rec\"><span>We'd suggest</span><h4>"+rec[0]+"</h4><small>"+rec[1]+"</small></div><p class=\"fine\">Goal: "+esc(A.goal||"")+" · "+esc(A.level||"")+" · "+esc(A.freq||"")+"</p>";
    [].forEach.call(w.querySelectorAll(".step,.wprog,.wtop"),function(x){x.style.display="none"});r.classList.add("on")})
   .catch(function(){m.textContent="No connection. Please check your internet and try again.";btn.disabled=false});
  return}});
})();
"""

LIVE_JS = r"""
(function(){
var URL="%(url)s",KEY="%(key)s",APP="%(app)s";
var days=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],short=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
var F=[["all","All classes"],["cardio","HIIT & cardio"],["strength","Strength"],["mind","Pilates"],["fifty","50+"],["kids","Kids"]];
var rows=[],sel=(new Date().getDay()+6)%%7,flt="all";
function $(i){return document.getElementById(i)}
function cat(n){n=n.toLowerCase();if(/kids/.test(n))return"kids";if(/50\+|vitality/.test(n))return"fifty";if(/pilates|yoga/.test(n))return"mind";if(/cardio|hiit|box/.test(n))return"cardio";if(/strength|abs|body/.test(n))return"strength";return"all"}
function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
function paint(){
 var h="";days.forEach(function(d,i){h+='<button type="button" class="dt'+(i===sel?" sel":"")+'" data-d="'+i+'"><small>'+short[i]+'</small><b>'+short[i]+'</b></button>'});$("sdates").innerHTML=h;
 h="";F.forEach(function(f){h+='<button type="button" class="fc'+(f[0]===flt?" on":"")+'" data-f="'+f[0]+'">'+f[1]+'</button>'});$("sfilter").innerHTML=h;
 var list=rows.filter(function(r){return r.day_name===days[sel]&&(flt==="all"||cat(r.name)===flt)}).sort(function(a,b){return a.start_time<b.start_time?-1:1});
 h="";list.forEach(function(r){h+='<div class="slot"><span class="tm">'+esc(String(r.start_time).slice(0,5))+'</span><div><b>'+esc(r.name)+'</b><small>'+esc(r.info||"")+(r.coach?" · "+esc(r.coach):"")+(r.capacity?" · "+r.capacity+" places":"")+'</small></div><a class="btn sm" href="'+APP+'/#timetable">Book in the app</a></div>'});
 if(!list.length)h='<p class="note">No matching classes this day. Try another day or filter.</p>';
 $("sslots").innerHTML=h}
document.addEventListener("click",function(e){var t=e.target.closest("button");if(!t||!$("sdates"))return;if(t.dataset.d){sel=+t.dataset.d;paint();return}if(t.dataset.f){flt=t.dataset.f;paint()}});
document.addEventListener("click",function(e){var a=e.target.closest("[data-cf]");if(!a||!$("sfilter"))return;e.preventDefault();flt=a.dataset.cf;paint();$("timetable").scrollIntoView({behavior:"smooth",block:"start"})});
if(!$("sdates"))return;
fetch(URL+"/rest/v1/classes?select=day_name,start_time,name,coach,info,capacity&active=eq.true&kind=eq.class&order=sort",{headers:{apikey:KEY,Authorization:"Bearer "+KEY}})
 .then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(d){rows=d;$("ttsub").textContent="The same timetable as the MyGym app. Book your place in the app.";paint()})
 .catch(function(){$("ttsub").innerHTML='We could not load the timetable. <a href="'+APP+'/#timetable">Open it in the app</a>.';paint()});
})();
""" % {"url": SUPABASE_URL, "key": SUPABASE_KEY, "app": APP}

SITE_JS = burger + "\n" + wiz + "\n" + LIVE_JS + """
document.addEventListener("click",function(e){var g=e.target.closest("[data-go]");if(g){var t=document.getElementById(g.dataset.go);if(t)t.scrollIntoView({behavior:"smooth",block:"center"})}});
"""

# ---------- CSS ----------
page_css = css
page_css = page_css.replace(".view{display:none}", ".view{display:block}")
page_css = re.sub(r"\.view:target\s*\{[^}]*\}", "", page_css)
page_css = re.sub(r"\.view:target ~ \.def,\.view\.def:has\(~ \.view:target\)\{[^}]*\}", "", page_css)
page_css = re.sub(r"\.def,\.view\.def:has\(~ \.view:target\)\{[^}]*\}", "", page_css)
page_css = re.sub(r"@import[^;]*;", "", page_css)
page_css = re.sub(r"body:has\(#home:target\)[^{]*\{", ".mnav a.on{", page_css)
page_css = re.sub(r"body:has\(#faq:target\) \.mnav \[data-n=faq\]\{", ".mnav a.on{", page_css)


# ---------- assets ----------
os.makedirs(os.path.join(OUT, "assets", "img"), exist_ok=True)
os.makedirs(os.path.join(OUT, "assets", "fonts"), exist_ok=True)
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36"


def fetch(url, binary=True):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
    return data if binary else data.decode("utf-8")


copied = {}


def asset(ref):
    """Return the local path for an image reference; download or copy it once."""
    if ref in copied:
        return copied[ref]
    if ref.startswith("http"):
        ext = os.path.splitext(ref.split("?")[0].split("/v1/")[0])[1].lower() or ".jpg"
        name = "w-" + hashlib.sha1(ref.encode()).hexdigest()[:10] + ext
        dst = os.path.join(OUT, "assets", "img", name)
        if not os.path.exists(dst):
            open(dst, "wb").write(fetch(ref))
    else:
        name = os.path.basename(ref)
        srcp = os.path.join(HERE, ref)
        dst = os.path.join(OUT, "assets", "img", name)
        shutil.copyfile(srcp, dst)
    copied[ref] = "assets/img/" + name
    return copied[ref]


def localise(html):
    def rep(m):
        ref = m.group(2)
        if ref.startswith("data:") or ref.startswith("#"):
            return m.group(0)
        if ref.startswith("http") and "wixstatic.com" not in ref:
            return m.group(0)
        if not ref.startswith("http") and not os.path.exists(os.path.join(HERE, ref)):
            return m.group(0)
        return '%s"%s"' % (m.group(1), asset(ref))
    html = re.sub(r'(src=)"([^"]+)"', rep, html)
    html = re.sub(r"url\(['\"]?(https://static\.wixstatic\.com[^'\")]+)['\"]?\)", lambda m: "url(%s)" % asset(m.group(1)), html)
    html = re.sub(r"url\(['\"]?([A-Za-z0-9_\-]+\.(?:jpg|png))['\"]?\)", lambda m: "url(%s)" % asset(m.group(1)) if os.path.exists(os.path.join(HERE, m.group(1))) else m.group(0), html)
    return html


# fonts, self-hosted
fcss = fetch("https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;500;600;700&display=swap", False)


def font_rep(m):
    u = m.group(1)
    name = hashlib.sha1(u.encode()).hexdigest()[:10] + ".woff2"
    dst = os.path.join(OUT, "assets", "fonts", name)
    if not os.path.exists(dst):
        open(dst, "wb").write(fetch(u))
    return "url(fonts/%s)" % name


fcss = re.sub(r"url\((https://[^)]+)\)", font_rep, fcss)
final_css = localise(fcss + "\n" + page_css)
final_css = final_css.replace("url(assets/img/", "url(img/")
open(os.path.join(OUT, "assets", "style.css"), "w", encoding="utf-8").write(final_css)
open(os.path.join(OUT, "assets", "site.js"), "w", encoding="utf-8").write(SITE_JS)
# forms: styles + script come from the app project (one copy to maintain), and the public settings
shutil.copyfile(os.path.join(FORMS_DIR, "forms.js"), os.path.join(OUT, "assets", "forms.js"))
open(os.path.join(OUT, "assets", "forms.css"), "w", encoding="utf-8").write(
    open(os.path.join(FORMS_DIR, "forms.css"), encoding="utf-8").read()
    + "\n.mgl-form,.mgl-form *{box-sizing:border-box}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}"
    + ".fnews{background:#17171a;padding:26px 16px}.fnews .mgl-form{border:0}.fnews .mgl-form h2{font-size:30px}"
    + ".formsec .mgl-form{margin:0}textarea.wemail{width:100%;font:inherit;padding:12px 14px;border:1.5px solid var(--line);resize:vertical}.hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}\n")
open(os.path.join(OUT, "assets", "forms-config.js"), "w", encoding="utf-8").write(
    'window.MGL_FORMS = { endpoint: "%s", supabaseUrl: "%s", anonKey: "%s" };\n' % (SUBMIT_URL, SUPABASE_URL, SUPABASE_KEY))

# ---------- pages ----------
NAV = {"home": "home", "classes": "classes", "book": "book", "services": "services", "pt": "pt", "refer": "refer", "faq": "faq", "kids-gym": "services", "login": "", "terms": "", "privacy": "", "cookies": ""}


def mark_active(html, key):
    n = NAV[key]
    if not n:
        return html
    return re.sub(r'(<nav class="mnav">.*?</nav>)', lambda m: m.group(1).replace('data-n="%s"' % n, 'data-n="%s" aria-current="page" class="on"' % n, 1), html, count=1, flags=re.S)


hdr = fix_links(header).replace("services.html\">Join now", "%s\">Join now" % JOIN_URL)
hdr = hdr.replace('class="login" href="login.html"', 'class="login" href="%s/#login"' % APP)
ftr = fix_links(footer).replace('href="index.html">Get the MyGym app', 'href="%s">Get the MyGym app' % APP)
ftr = ftr.replace('<a class="btn sm app" href="index.html">', '<a class="btn sm app" href="%s">' % APP)
ftr = ftr.replace("© 2024 by MyGymLondon.co.uk", "© MyGym London")
ftr = ftr.replace('<div class="legal">', NEWS_BLOCK + '<div class="legal">', 1)


LLMS_TXT = """# MyGym London

> MyGym London is a private community gym in Bush Hill Park, Enfield (EN1 1DS), North London. It offers gym access, 25+ exercise classes a week, personal training and a Kids Gym. Open every day from 5am to midnight. No contracts and no joining fees.

## Key facts
- Address: Main Avenue, Bush Hill Park, Enfield, EN1 1DS, United Kingdom
- Phone: 07459 020381 (+44 7459 020381)
- Email: info@mygymlondon.co.uk
- Opening hours: every day, 5am to midnight
- Booking: members book classes and gym slots in the MyGym app (https://app.mygymlondon.co.uk)
- Join and pay online: https://join.mygymlondon.co.uk
- Instagram: https://www.instagram.com/mygym_london

## Prices (GBP)
- Pay as you go gym: 4 pounds per visit
- Pay as you go class: 6 pounds (Pilates 7 pounds)
- Gym membership: 26 pounds a month
- Exercise class only membership: 26 pounds a month
- Gym and exercise class membership: 35 pounds a month, or 400 pounds a year (includes a free induction and introductory health check)
- Small group personal training: 60 pounds a month for 2 to 4 people (15 pounds each per session, minimum 4 sessions a month)
- Personal training: 30-minute sessions from 32.50 pounds, first session free
- Kids Gym: 20 pounds a month, Tuesdays and Thursdays 4pm to 5pm, minimum age 8

## Pages
- [Home](https://www.mygymlondon.co.uk/): overview of the gym
- [Classes](https://www.mygymlondon.co.uk/classes.html): weekly class timetable
- [Plans and prices](https://www.mygymlondon.co.uk/services.html): every membership and pay as you go option
- [Personal training](https://www.mygymlondon.co.uk/personal-training.html): one to one and small group, free first session
- [Kids Gym](https://www.mygymlondon.co.uk/kids-gym.html): kids sessions
- [Book the gym](https://www.mygymlondon.co.uk/book.html): how members book gym slots
- [FAQ](https://www.mygymlondon.co.uk/faq.html): answers on contracts, hours, prices, booking and cancellation
- [Refer friends](https://www.mygymlondon.co.uk/refer-friends.html)
- [Terms](https://www.mygymlondon.co.uk/terms.html) and [Privacy](https://www.mygymlondon.co.uk/privacy.html)
"""

REVIEWS = [
    ("MyGym London is a fantastic place to work out and get fit! It is truly inclusive with an atmosphere where everyone is welcome, irrespective of your fitness level.", "Emma Meads"),
    ("A very friendly atmosphere with no judgement, where you are truly pushed to be the best version of yourself.", "Lauren Brant"),
    ("MyGym London is spot on for a proper workout. ... Great value, with a no-nonsense atmosphere that kept me focused.", "Sid Hunter"),
]
REVIEWS_HTML = '<div class="qgrid">' + "".join('<blockquote><p>%s</p><cite>%s · Google review</cite></blockquote>' % (q, n) for q, n in REVIEWS) + "</div>"

import json, html as _hl
GYM_ID = SITE + "/#gym"
HOURS = {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], "opens": "05:00", "closes": "23:59"}


def _offer(name, price, desc, unit="MON"):
    spec = {"@type": "UnitPriceSpecification", "price": price, "priceCurrency": "GBP"}
    if unit:
        spec["unitCode"] = unit
    return {"@type": "Offer", "name": name, "description": desc, "price": price, "priceCurrency": "GBP",
            "url": JOIN_URL, "availability": "https://schema.org/InStock", "priceSpecification": spec}


OFFERS = [
    _offer("PAYG Gym", "4.00", "Pay as you go gym visit. No membership, no commitment.", None),
    _offer("PAYG Class", "6.00", "Pay as you go exercise class. Most classes 6 pounds, Pilates 7 pounds.", None),
    _offer("Gym Membership", "26.00", "Gym access every month. No contract."),
    _offer("Exercise Class Only Membership", "26.00", "All exercise classes every month. No contract."),
    _offer("Gym & Exercise Class Membership", "35.00", "Gym access and all exercise classes, with free induction and health check. 400 pounds a year as an annual plan."),
    _offer("Small Group Personal Training", "60.00", "2 to 4 friends train together, 15 pounds each per session, minimum 4 sessions a month."),
    _offer("Kids Gym", "20.00", "Kids gym sessions on Tuesdays and Thursdays 4pm to 5pm, minimum age 8."),
]


def gym_node():
    return {"@type": ["ExerciseGym", "HealthClub", "LocalBusiness"], "@id": GYM_ID, "name": "MyGym London",
            "alternateName": ["MY GYM London", "MyGym Enfield"], "url": SITE + "/",
            "description": "Private community gym in Bush Hill Park, Enfield with personal training and 25+ exercise classes a week. Open every day 5am to midnight. No contract.",
            "image": SITE + "/assets/img/hero-full.jpg", "logo": SITE + "/assets/img/logo.png",
            "telephone": "+447459020381", "email": "info@mygymlondon.co.uk", "priceRange": "£4-£400",
            "address": {"@type": "PostalAddress", "streetAddress": "Main Avenue, Bush Hill Park", "addressLocality": "Enfield", "addressRegion": "London", "postalCode": "EN1 1DS", "addressCountry": "GB"},
            "hasMap": MAP_LINK, "geo": {"@type": "GeoCoordinates", "latitude": 51.645068, "longitude": -0.0635231}, "openingHoursSpecification": HOURS, "currenciesAccepted": "GBP",
            "areaServed": [{"@type": "City", "name": "Enfield"}, {"@type": "Place", "name": "Bush Hill Park"}, {"@type": "Place", "name": "Winchmore Hill"}, {"@type": "Place", "name": "Palmers Green"}, {"@type": "Place", "name": "Southgate"}],
            "sameAs": ["https://www.instagram.com/mygym_london", "https://app.mygymlondon.co.uk"],
            "amenityFeature": [{"@type": "LocationFeatureSpecification", "name": n, "value": True} for n in ["Personal training", "Group exercise classes", "Free induction for combined members", "Kids Gym"]],
            "hasOfferCatalog": {"@type": "OfferCatalog", "name": "MyGym London plans and prices", "itemListElement": OFFERS}}


def faq_node(h):
    qa = re.findall(r'<details><summary>(.*?)</summary><p>(.*?)</p></details>', h, re.S)
    clean = lambda x: _hl.unescape(re.sub(r"<[^>]+>", "", x)).strip()
    if not qa:
        return None
    return {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": clean(q), "acceptedAnswer": {"@type": "Answer", "text": clean(a)}} for q, a in qa]}


def add_seo(h, key, fn, title, desc):
    url = SITE + "/" + ("" if fn == "index.html" else fn)
    graph = [{"@type": "WebSite", "@id": SITE + "/#site", "url": SITE + "/", "name": "MyGym London", "publisher": {"@id": GYM_ID}, "inLanguage": "en-GB"}]
    graph.append(gym_node() if key == "home" else {"@type": "ExerciseGym", "@id": GYM_ID, "name": "MyGym London", "url": SITE + "/"})
    ptype = {"classes": "CollectionPage", "services": "CollectionPage"}.get(key, "WebPage")
    graph.append({"@type": ptype, "@id": url + "#page", "url": url, "name": title, "description": desc, "isPartOf": {"@id": SITE + "/#site"}, "about": {"@id": GYM_ID}, "inLanguage": "en-GB"})
    if key != "home":
        crumb = title.split(" | ")[0]
        graph.append({"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"}, {"@type": "ListItem", "position": 2, "name": crumb, "item": url}]})
    if key == "faq" and faq_node(h):
        graph.append(faq_node(h))
    if key == "pt":
        graph.append({"@type": "Service", "serviceType": "Personal training", "name": "Personal training in Enfield", "provider": {"@id": GYM_ID}, "areaServed": "Enfield", "description": "One to one and small group personal training. First session free.", "offers": {"@type": "Offer", "price": "32.50", "priceCurrency": "GBP", "description": "30-minute sessions from 32.50 pounds. First PT session is free."}})
    if key == "kids-gym":
        graph.append({"@type": "Service", "serviceType": "Kids gym sessions", "name": "Kids Gym in Enfield", "provider": {"@id": GYM_ID}, "audience": {"@type": "PeopleAudience", "suggestedMinAge": 8}, "description": "Kids gym sessions every Tuesday and Thursday 4pm to 5pm, up to 12 children.", "offers": {"@type": "Offer", "price": "20.00", "priceCurrency": "GBP"}})
    ld = '<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/") + "</script>"
    extra = ('<meta property="og:type" content="website"><meta property="og:url" content="%s"><meta property="og:site_name" content="MyGym London"><meta property="og:locale" content="en_GB">'
             '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="%s"><meta name="twitter:description" content="%s"><meta name="twitter:image" content="%s/assets/img/hero-full.jpg">'
             '<meta name="robots" content="%s"><meta name="theme-color" content="#17171a">'
             % (url, _hl.escape(title), _hl.escape(desc), SITE, 'noindex,follow' if key == 'login' else 'index,follow,max-snippet:-1,max-image-preview:large'))
    return h.replace('<link rel="stylesheet" href="assets/style.css">', extra + ld + '<link rel="stylesheet" href="assets/style.css">', 1)


def page(key, body):
    fn, title, desc = PAGES[key]
    html = (
        '<!doctype html><html lang="en-GB"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1">'
        "<title>%s</title><meta name=\"description\" content=\"%s\">"
        '<link rel="canonical" href="%s/%s"><link rel="icon" href="assets/img/logo.png">'
        '<meta property="og:title" content="%s"><meta property="og:description" content="%s">'
        '<meta property="og:image" content="%s/assets/img/hero-full.jpg">'
        '<link rel="stylesheet" href="assets/style.css"><link rel="stylesheet" href="assets/forms.css"></head><body>%s<main>%s</main>%s'
        '<script src="assets/forms-config.js"></script><script src="assets/forms.js"></script><script src="assets/site.js"></script></body></html>'
    ) % (title, desc, SITE, "" if fn == "index.html" else fn, title, desc, SITE, mark_active(hdr, key), body, ftr)
    html = html.replace("30+ classes", "25+ classes").replace("Over 30 classes", "Over 25 classes")
    # launch clean-up (2026-10-27): no sample quotes or placeholder notes on the live site; rating from the public Google listing
    html = re.sub(r'<div class="qgrid">.*?</div>', lambda m: REVIEWS_HTML, html, flags=re.S)
    html = html.replace('<b>4.8</b>', '<b>4.9</b>').replace('Rated 4.8 on Google', 'Rated 4.9 on Google').replace('29 Google reviews', '35 Google reviews')
    html = re.sub(r'<p class="note">Placeholder photos\.[^<]*</p>', '', html)
    html = html.replace('alt="MyGym London on Instagram"', 'alt="Photo from MyGym London, opens our Instagram"')
    html = add_seo(html, key, fn, title, desc)
    if TEST:
        html = re.sub(r'<meta name="robots" content="index[^>]*>', '', html)
        html = re.sub(r'<link rel="canonical"[^>]*>', '<meta name="robots" content="noindex,nofollow">', html)
        html = re.sub(r'<script type="application/ld\+json">.*?</script>', '', html, flags=re.S)
        html = re.sub(r'<meta name="twitter:[^>]*>', '', html)
        html = re.sub(r'<meta property="og:[^>]*>', '', html)
        html = html.replace("<body>", '<body><div style="background:#17171a;color:#fff;text-align:center;font:600 13px Inter,sans-serif;padding:8px 12px">Test copy of the new MyGym London website. Not live. For checking only.</div>', 1)
    html = localise(fix_links(html))
    open(os.path.join(OUT, fn), "w", encoding="utf-8").write(html)
    return fn


written = [page("home", home_body.replace('class="view def"', 'class="view"'))]
for key in ["classes", "book", "services", "pt", "refer", "faq", "kids-gym", "terms", "privacy", "cookies", "login"]:
    written.append(page(key, views[key]))

# extras
open(os.path.join(OUT, "404.html"), "w", encoding="utf-8").write(
    open(os.path.join(OUT, "index.html"), encoding="utf-8").read().replace("<main>", '<main><section class="view"><div class="wrap sec"><h1>Page not found</h1><p class="sub">Try the <a href="index.html">home page</a> or the <a href="classes.html">classes</a>.</p></div></section><div style="display:none">', 1).replace("</main>", "</div></main>", 1))
_p404 = os.path.join(OUT, "404.html")
_t = open(_p404, encoding="utf-8").read()
_t = re.sub(r'<script type="application/ld\+json">.*?</script>|<link rel="canonical"[^>]*>|<meta name="robots"[^>]*>', '', _t, flags=re.S)
_t = re.sub(r'<title>.*?</title>', '<title>Page not found | MyGym London</title><meta name="robots" content="noindex">', _t, count=1)
open(_p404, "w", encoding="utf-8").write(_t)
ROBOTS_TEST = "User-agent: *\nDisallow: /\n"
ROBOTS_LIVE = ("User-agent: *\nAllow: /\n\n" + "".join("User-agent: %s\nAllow: /\n\n" % b for b in ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot", "Applebot-Extended", "Bingbot", "CCBot", "Amazonbot", "DuckAssistBot"]) + "Sitemap: %s/sitemap.xml\n" % SITE)
open(os.path.join(OUT, "robots.txt"), "w").write(ROBOTS_TEST if TEST else ROBOTS_LIVE)
if not TEST: open(os.path.join(OUT, "sitemap.xml"), "w").write(
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    + "".join("<url><loc>%s/%s</loc><lastmod>%s</lastmod></url>" % (SITE, "" if f == "index.html" else f, __import__("datetime").date.today().isoformat()) for f in written if f != "login.html")
    + "</urlset>")
if not TEST:
    open(os.path.join(OUT, "llms.txt"), "w", encoding="utf-8").write(LLMS_TXT)
print("built %d pages, %d images" % (len(written), len(copied)))
