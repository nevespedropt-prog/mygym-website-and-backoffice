import os, re
HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, "gen_site.py"), encoding="utf-8").read()
src = src.split('build("a", CSS_A')[0]          # reuse content + helpers, skip old builds
exec(compile(src, "gen_site_base", "exec"))

TICKER = ["No contract needed", "Classes from £6", "30+ classes a week", "Free induction & health check", "Personal training from £32.50", "Bush Hill Park · Enfield"]
def ticker():
    one = "".join(f"<span>{t}</span><i>✕</i>" for t in TICKER)
    return f'<div class="ticker"><div class="track">{one}{one}</div></div>'

QUOTES = ["Finding MyGym has honestly been life changing for me.", "Welcoming atmosphere with friendly, supportive staff.", "Best decision I ever made was to walk into MyGym London."]
def quotes():
    return "".join(f'<blockquote><p>{q}</p><cite>Real member review</cite></blockquote>' for q in QUOTES)

def home_w():
    return f'''<section class="view def" id="home">
<div class="hero"><div class="himg"><img src="{HERO}" alt="MyGym London gym floor"></div>
<div class="hcopy"><span class="chip">Bush Hill Park · Enfield</span>
<h1>The private gym where everybody <em>knows your name.</em></h1>
<p>Premium personal training and fun, effective classes for all abilities. Experienced trainers, new equipment, and a bespoke experience in every session.</p>
<div class="hbtns"><a class="btn" href="#memberships">Join now</a><a class="btn ghost" href="#classes">View our classes</a></div>
<div class="hstats"><div><b>30+</b><span>classes a week</span></div><div><b>£6</b><span>classes from</span></div><div><b>0</b><span>contracts</span></div></div></div></div>
{ticker()}
<section class="sec"><div class="wrap"><span class="chip">Welcome</span><h2>Welcome to MyGym London</h2><p class="lead">We provide premium personal training services tailored to your fitness goals, and fun, effective exercise classes for all abilities. With experienced personal trainers and new equipment, every session is a bespoke experience, carefully crafted to meet your needs.</p>
<div class="pgrid">{pillars()}</div></div></section>
<section class="sec alt"><div class="wrap two">
<article class="feat"><img src="{P1}" alt=""><div><h3>Classes to suit you</h3><p>Training for a special occasion, weekly Pilates to unwind, or a sweat to de-stress and build stamina and strength. A workout for all ages and abilities.</p><a class="btn" href="#classes">Classes to suit you</a></div></article>
<article class="feat"><img src="{P2}" alt=""><div><h3>Expert personal training</h3><p>Our qualified Personal Trainers have years of experience and will design programmes that push your limits and get the results you want.</p><a class="btn" href="#pt">Expert personal training</a></div></article></div></section>
<section class="sec appsec"><div class="wrap two center">
<div class="phones"><img class="ph p1" src="app-dash.png" alt="MyGym app dashboard"><img class="ph p2" src="app-timetable.png" alt="MyGym app timetable"></div>
<div><span class="chip">The MyGym app</span><h2>Your gym, in your pocket.</h2><p class="lead">Book classes, log workouts and track your progress. Free for members, works offline. <b>DOWNLOAD TODAY!</b></p>
<ul class="ticks"><li>{I_CHECK}Book &amp; cancel classes in two taps</li><li>{I_CHECK}Log workouts, weight &amp; body fat</li><li>{I_CHECK}See your progress charts</li></ul>
<div class="qr"><img src="qr.png" alt="Scan to open the MyGym app"><span>Scan to open the app<br><b>app.mygymlondon.co.uk</b></span></div></div></div></section>
<section class="sec"><div class="wrap"><span class="chip">Inside MyGym</span><h2>Space to train. Room to breathe.</h2><div class="gal">{gallery()}</div></div></section>
<section class="sec alt"><div class="wrap"><span class="chip">Members say it better</span><h2>Real reviews</h2><div class="qgrid">{quotes()}</div></div></section>
<section class="sec"><div class="wrap two center"><div><span class="chip">Opening hours</span><h2>Open 7 days a week</h2><p class="lead">Morning workouts, midday sessions, evening and weekend classes. We've got you covered. <b class="open" id="openNow"></b></p></div>
<div class="hours"><div><span>Every day</span><b>5am – midnight</b></div></div></div></section>
<section class="sec cta"><div class="wrap"><h2>Ready to train?</h2><p>Classes from £6. No contract needed. Book in the app or online.</p><div class="hbtns"><a class="btn" href="#memberships">Join now</a><a class="btn ghost" href="#book">Book the gym</a></div></div></section>
</section>'''

_pages = pages
def pages_w(variant):
    full = _pages(variant)
    start = full.index('<section class="view def" id="home">')
    end = full.index('<section class="view" id="classes">')
    return full[:start] + home_w() + full[end:]

CSS_W = '''
:root{--bg:#fff;--alt:#f6f5f4;--card:#fff;--txt:#17171a;--mut:#62616a;--acc:#e03939;--deep:#a03535;--accs:#fdecec;--line:#e6e4e4;--disp:"Barlow Condensed","Arial Narrow",sans-serif}
body{font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--txt);line-height:1.55}
h1,h2,h3{font-family:var(--disp);text-transform:uppercase;letter-spacing:.02em;font-weight:800;line-height:.98}
h1{font-size:96px}h2{font-size:56px;margin-bottom:16px}h3{font-size:28px}
header{background:rgba(255,255,255,.97);border-bottom:1px solid var(--line)}
.mnav a{white-space:nowrap;color:var(--mut);text-transform:uppercase;font-size:12.5px;letter-spacing:.06em;border-radius:0;border-bottom:2px solid transparent;padding:10px 12px}.mnav a:hover{color:var(--txt)}
body:has(#home:target) .mnav [data-n=home],body:not(:has(:target)) .mnav [data-n=home],body:has(#classes:target) .mnav [data-n=classes],body:has(#memberships:target) .mnav [data-n=memberships],body:has(#pt:target) .mnav [data-n=pt],body:has(#book:target) .mnav [data-n=book],body:has(#refer:target) .mnav [data-n=refer]{color:var(--txt);border-bottom-color:var(--acc)}
.login{color:var(--txt)}
.btn{background:var(--acc);color:#fff;border-radius:0;font-family:var(--disp);font-size:21px;letter-spacing:.1em;text-transform:uppercase;clip-path:polygon(0 0,100% 0,calc(100% - 12px) 100%,0 100%);padding-right:34px}.btn.sm{font-size:17px;padding:10px 26px 10px 18px}
.btn.ghost{background:transparent;color:var(--txt);box-shadow:inset 0 0 0 2px var(--txt);clip-path:none;padding:14px 26px}
.chip{display:inline-block;color:var(--acc);font-size:12px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;border-left:3px solid var(--acc);padding:2px 0 2px 12px;margin-bottom:12px}
.hero{position:relative;min-height:660px;display:grid;align-items:center;overflow:hidden;background:#fff}
.himg{position:absolute;inset:0}.himg img{width:100%;height:100%;object-fit:cover;object-position:60% center}
.himg:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#fff 20%,rgba(255,255,255,.88) 42%,rgba(255,255,255,0) 72%)}
.hcopy{position:relative;z-index:2;max-width:1160px;margin:0 auto;padding:80px 28px;width:100%}.hero h1{max-width:700px;margin:6px 0 20px}.hero h1 em{font-style:normal;color:var(--acc)}.hero p{max-width:520px;font-size:18px;color:var(--mut)}
.hstats{display:flex;gap:44px;margin-top:40px}.hstats b{font:800 64px/1 var(--disp);color:var(--acc)}.hstats span{display:block;font-size:12px;color:var(--mut);text-transform:uppercase;letter-spacing:.1em}
.ticker{background:var(--acc);color:#fff;overflow:hidden;transform:skewY(-1deg);margin:-14px 0 14px;padding:14px 0;position:relative;z-index:3}
.ticker .track{display:flex;gap:28px;white-space:nowrap;width:max-content;animation:tick 40s linear infinite;font:800 26px var(--disp);text-transform:uppercase;letter-spacing:.06em}
.ticker i{font-style:normal;opacity:.6}
@keyframes tick{to{transform:translateX(-50%)}}
.lead{max-width:760px;font-size:18px;color:var(--mut)}
.sec{padding:84px 0}.alt{background:var(--alt)}
.pil,.cc,.plan,.card,.slot,.tr,.feat{background:#fff;border:1px solid var(--line);box-shadow:0 2px 12px rgba(20,20,25,.05)}
.pil{border-top:3px solid var(--acc)}.pi{background:var(--accs);color:var(--acc)}
.feat img{height:100%}
.gal img{filter:saturate(1.05)}
.appsec .center,.center{align-items:center}
.phones{display:flex;justify-content:center;align-items:flex-start;padding:10px 0}
.ph{width:235px;height:auto;border-radius:30px;box-shadow:0 24px 60px rgba(20,20,25,.25);border:6px solid #17171a;background:#fff}
.p1{transform:rotate(-4deg);position:relative;z-index:1}.p2{margin-left:-46px;margin-top:56px;transform:rotate(4deg)}
.ticks{list-style:none;margin:18px 0;display:grid;gap:10px;font-weight:600}.ticks svg{color:var(--acc)}
.qr{display:flex;align-items:center;gap:16px;margin-top:20px}.qr img{width:110px;border:1px solid var(--line);padding:4px}.qr span{font-size:14px;color:var(--mut)}.qr b{color:var(--txt)}
.qgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}blockquote{background:#fff;border:1px solid var(--line);border-left:4px solid var(--acc);padding:26px}blockquote p{font:700 28px/1.1 var(--disp);text-transform:uppercase}blockquote cite{display:block;margin-top:14px;font-style:normal;font-size:12px;color:var(--mut)}
.hours{display:grid;gap:12px}.hours div{display:flex;justify-content:space-between;padding:18px 22px;background:#fff;border:1px solid var(--line);border-left:4px solid var(--acc)}.hours b{font:800 28px var(--disp)}.open{color:var(--acc)}
.cta{background:linear-gradient(100deg,#c62828,#ff4545);color:#fff;text-align:center}.cta .wrap{padding-top:36px;padding-bottom:36px}.cta .hbtns{justify-content:center}.cta .btn{background:#17171a}.cta .btn.ghost{background:transparent;color:#fff;box-shadow:inset 0 0 0 2px #fff}
.phead{background:linear-gradient(100deg,#fff 40%,#fdecec);border-bottom:3px solid var(--acc);padding:70px 0}.phead h1{font-size:76px;margin:6px 0 14px;max-width:900px}.phead p{max-width:640px;color:var(--mut);font-size:18px}
.plan.best{border-color:var(--acc);box-shadow:0 0 0 1px var(--acc),0 20px 50px rgba(224,57,57,.15)}.pp b{font-family:var(--disp);color:var(--acc)}.flag{background:var(--acc);color:#fff}
.cc .pr{font:800 38px var(--disp);color:var(--acc)}
.dt{background:#fff;border:1px solid var(--line)}.dt.sel{background:var(--acc);border-color:var(--acc);color:#fff}.dt b{font-family:var(--disp)}
.tm{font:800 32px var(--disp);color:var(--acc)}.opt.on{background:var(--accs)}
.perk.hi{border-color:var(--acc);background:var(--accs)}.perk .big{font-family:var(--disp)}
footer{background:#17171a;color:#fff;border-top:4px solid var(--acc);margin-top:0}footer h4{font:800 22px var(--disp);text-transform:uppercase;letter-spacing:.08em;color:#ff6b6b}footer .btn.app{background:var(--acc);color:#fff}.legal{border-top:1px solid #333}
.sub,.note{color:var(--mut);opacity:1}
@media(max-width:900px){h1{font-size:60px}h2{font-size:42px}.qgrid{grid-template-columns:1fr}.ph{width:170px}.hero{display:block;min-height:0}.himg{position:relative;height:250px}.himg:after{display:none}.hcopy{padding:28px 22px 40px}.hstats b{font-size:48px}.phead h1{font-size:52px}}
'''

html = f'''<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MyGym London – Website Design B (White)</title>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>{BASE}{CSS_W}</style></head><body>{header()}<main>{pages_w("b")}</main>{footer()}
<script>(function(){{var d=new Date(),g=d.getDay(),h=d.getHours()+d.getMinutes()/60,o=[5,24],e=document.getElementById("openNow");if(e)e.textContent=(h>=o[0]&&h<o[1])?"We're open now.":"Closed right now. See hours.";}})();</script></body></html>'''
open(os.path.join(HERE, "site-w.html"), "w", encoding="utf-8").write(html)
print("built site-w.html")
