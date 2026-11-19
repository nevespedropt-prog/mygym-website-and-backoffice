"""Services page layout: a 3-question plan helper, three headline memberships, and the other plans grouped underneath. Used by gen_site3.py (and kept in step with the built pages)."""
import os, re
HERE = os.path.dirname(os.path.abspath(__file__))
JS = open(os.path.join(HERE, "planquiz.js"), encoding="utf-8").read()

QUIZ = ('<div class="quiz" id="planQuiz"><h2>Not sure which plan? Answer 3 quick questions</h2><p class="sub">We will point you to the cheapest option for the way you train. No sign-up needed.</p><div class="qs">'
        '<div class="qq" data-q="what"><b>1. What do you want to do?</b><div class="qopts"><button type="button" class="qo" data-v="gym" aria-pressed="false">Use the gym</button><button type="button" class="qo" data-v="classes" aria-pressed="false">Do classes</button><button type="button" class="qo" data-v="both" aria-pressed="false">Gym and classes</button><button type="button" class="qo" data-v="coach" aria-pressed="false">Train with a coach</button></div></div>'
        '<div class="qq" data-q="freq"><b>2. How often will you train?</b><div class="qopts"><button type="button" class="qo" data-v="few" aria-pressed="false">A few times a month</button><button type="button" class="qo" data-v="regular" aria-pressed="false">Once or twice a week</button><button type="button" class="qo" data-v="lots" aria-pressed="false">3 or more times a week</button></div></div>'
        '<div class="qq" data-q="pay"><b>3. How would you like to pay?</b><div class="qopts"><button type="button" class="qo" data-v="month" aria-pressed="false">Monthly, no contract</button><button type="button" class="qo" data-v="year" aria-pressed="false">Yearly, to save money</button></div></div>'
        '</div><div class="qres" aria-live="polite"></div></div>')

CORE = ["Gym Membership", "Exercise Class Only Membership", "Gym & Exercise Class Membership"]
GROUPS = [("Pay as you go", "No membership. Pay only when you train.", ["PAYG Gym", "PAYG Class", "PAYG Pilates", "PAYG Kids Gym"]),
          ("Yearly plans", "Pay once a year and save.", ["Exercise Classes (Annual)", "Gym & Exercise Class Membership (Annual)"]),
          ("Personal training and special offer", "Train with a coach, alone or with friends.", ["Small Group Personal Training", "Gym, Classes & 2 Personal Training Membership"]),
          ("Kids Gym", "Tuesdays and Thursdays, 4pm to 5pm, ages 8 and over.", ["Kids Gym"])]
CSS = """
.quiz{background:var(--card,#fff);border:1px solid var(--line,#e6e2de);border-radius:22px;padding:24px;margin-bottom:34px}.quiz h2{margin:0 0 4px}.quiz .qs{display:grid;gap:18px;margin-top:18px}.quiz .qq b{display:block;margin-bottom:8px}.quiz .qopts{display:flex;flex-wrap:wrap;gap:8px}
.quiz .qo{border:1px solid var(--line,#d8d3ce);background:#fff;color:inherit;border-radius:999px;padding:10px 16px;font:inherit;font-weight:600;cursor:pointer;min-height:44px}.quiz .qo[aria-pressed=true]{background:var(--acc,#e03939);color:#fff;border-color:var(--acc,#e03939)}
.quiz .qres{display:none;margin-top:20px;padding:18px 20px;border-radius:16px;background:rgba(224,57,57,.07);border:1px solid rgba(224,57,57,.25)}.quiz .qres.on{display:block}.quiz .qres small{text-transform:uppercase;letter-spacing:.08em;font-weight:700;opacity:.7}.quiz .qres h3{margin:4px 0 6px}.quiz .qres p{margin:0 0 12px}
.grp{margin:6px 0 4px}.plans3{grid-template-columns:repeat(3,1fr)}.more{margin-top:18px;border:1px solid var(--line,#e6e2de);border-radius:18px;background:var(--card,#fff);padding:0 18px}.more summary{cursor:pointer;font-weight:700;padding:16px 0;list-style:none;display:flex;flex-direction:column;gap:2px}.more summary::-webkit-details-marker{display:none}.more summary span{font-weight:400;opacity:.7;font-size:14px}
.more summary::after{content:"+";position:absolute;right:18px;font-size:24px;font-weight:400}.more{position:relative}.more[open] summary::after{content:"\\2212"}.more[open] summary{border-bottom:1px solid var(--line,#e6e2de);margin-bottom:16px}.more .plans{padding-bottom:18px}
@media(max-width:900px){.plans3{grid-template-columns:1fr}}
"""

def build_block(plans_html):
    cards = {}
    for m in re.finditer(r'<article class="plan ([^"]*)">(.*?)</article>', plans_html, re.S):
        h = re.search(r"<h3>(.*?)</h3>", m.group(2), re.S).group(1).strip()
        cards[h] = (m.group(1).strip(), m.group(2))
    def art(name, style=None, flag=None):
        st, inner = cards[name]
        if style is not None: st = style
        if flag and "class=flag" not in inner and 'class="flag"' not in inner: inner = f"<span class=flag>{flag}</span>" + inner
        return f'<article class="plan {st}">{inner}</article>'
    out = QUIZ + '<h2 class="grp">Our memberships</h2><p class="sub">No contract. Cancel with one week\'s notice.</p><div class="plans plans3">'
    out += art(CORE[0]) + art(CORE[1]) + art(CORE[2], "best", "Best value") + "</div>"
    used = set(CORE)
    for title, blurb, names in GROUPS:
        names = [n for n in names if n in cards]
        used.update(names)
        out += f'<details class="more"><summary>{title}<span>{blurb}</span></summary><div class="plans">' + "".join(art(n) for n in names) + "</div></details>"
    left = [n for n in cards if n not in used]
    if left: raise SystemExit("cards not placed: %s" % left)
    return out


START = '<div class="wrap sec"><div class="plans">'
END = "</div></div></section>"
def transform(t, with_css=True, with_js=True):
    """t = the whole one-page mockup HTML with the services section in its old, flat form."""
    assert t.count(START) == 1, t.count(START)
    a = t.index(START) + len(START); b = t.index(END, a)
    block = build_block(t[a:b])
    t = t[:t.index(START)] + '<div class="wrap sec">' + block + t[b + len("</div>"):]
    if with_css:
        i = t.index("</style>"); t = t[:i] + CSS + t[i:]
    if with_js:
        j = t.rindex("</body>"); t = t[:j] + "<script>" + JS + "</script>" + t[j:]
    return t
