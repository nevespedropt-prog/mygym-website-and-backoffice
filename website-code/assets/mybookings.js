/* MyGym London website: "My bookings". Members sign in with their app account, see upcoming bookings and cancel up to 10 minutes before.
   Uses the same sign-in and the same book-class function as the app, so the rules are identical (and Wix stays in step). */
(function () {
  "use strict";
  var CFG = window.MGL_FORMS || {};
  var $ = function (id) { return document.getElementById(id); };
  if (!window.supabase || !$("mbRoot")) return;
  var sb = window.supabase.createClient(CFG.supabaseUrl, CFG.anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
  var LIMIT_MIN = 10;

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function startMs(date, hm) { // UK local time of the session as a timestamp
    var p = String(hm).slice(0, 5).split(":"), parts = date.split("-");
    var guess = Date.UTC(+parts[0], +parts[1] - 1, +parts[2], +p[0], +p[1]);
    var fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    var f = fmt.formatToParts(new Date(guess)).reduce(function (a, x) { a[x.type] = x.value; return a; }, {});
    var shown = Date.UTC(+f.year, +f.month - 1, +f.day, +f.hour % 24, +f.minute);
    return guess - (shown - guess);
  }
  function nice(date, hm) { return new Date(date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) + " at " + String(hm).slice(0, 5); }
  function say(text, kind) { var m = $("mbMsg"); m.textContent = text || ""; m.className = "mbmsg" + (kind ? " " + kind : ""); m.hidden = !text; }

  /* ---- My account hub: membership card, usage, steps for new members, manage plan (same functions as the app) ---- */
  function fmtD(d) { return d ? new Date(String(d).slice(0, 10) + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""; }
  function fmtShort(d) { return d ? new Date(String(d).slice(0, 10) + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : ""; }
  function isoPlus(n) { var d = new Date(); d.setDate(d.getDate() + n); return iso(d); }
  function money(a) { return "£" + Number(a).toFixed(a % 1 ? 2 : 0); }
  function row(k, v) { var r = el("div", "mbrow"), i = el("div", "mbinfo"); i.appendChild(el("span", null, k)); i.appendChild(el("b", null, v)); r.appendChild(i); return r; }
  function field(label, node) { var f = el("div", "hf"); if (label) f.appendChild(el("label", "lb", label)); f.appendChild(node); return f; }
  var memSent = "";            // one-time confirmation shown after a request is sent
  var NOTICE = "Monthly plans have no minimum term. To cancel, give us at least 1 week’s notice before your next billing date. Nothing changes until we confirm it by email.";
  var PER = { MONTH: "every month", WEEK: "every week", YEAR: "every year" };

  function planCard(m, name) {
    var p = m.plan, c = el("div", "hubcard"), top = el("div", "hubtop");
    top.appendChild(el("span", null, "MyGym London")); top.appendChild(el("span", "hubchip", p.status === "paused" ? "Paused" : p.cancelling ? "Ending" : "Active")); c.appendChild(top);
    c.appendChild(el("div", "hubname", p.name));
    if (p.amount) c.appendChild(el("div", "hubprice", money(p.amount) + " " + (PER[p.unit] || "")));
    var bt = el("div", "hubbot"), l = el("div", null), r = el("div", null); r.style.textAlign = "right";
    l.appendChild(el("span", null, "Member")); l.appendChild(el("b", null, name || "")); r.appendChild(el("span", null, "Member since")); r.appendChild(el("b", null, fmtD(m.member_since || p.started)));
    bt.appendChild(l); bt.appendChild(r); c.appendChild(bt);
    var q = m.request;
    if (q && (q.status === "received" || ((q.status === "done" || q.status === "declined") && q.resolved_at && Date.now() - new Date(q.resolved_at).getTime() < 14 * 864e5))) {
      var what = { pause: "Pause", cancel: "Cancellation", change: "Plan change" }[q.type] || "Request", state = q.status === "received" ? "received" : q.status === "done" ? "confirmed" : "declined";
      var s = el("div", "hubreq " + state); s.appendChild(el("span", null, what + " request")); s.appendChild(el("b", null, state.charAt(0).toUpperCase() + state.slice(1))); c.appendChild(s);
    }
    return c;
  }

  /* new members: four steps from account to the app, and a way to tell us about a different checkout email */
  function journey(box, uid, email, health, wix, L, free, elig) {
    var card = el("div", "card loginf"); box.appendChild(card);
    card.appendChild(el("h3", null, "Welcome to MyGym"));
    card.appendChild(el("p", "sub", "Four steps to become a member and start booking."));
    var steps = [
      { t: "Create your account", d: "Done. You are signed in as " + email + ".", done: true },
      { t: "Complete the health form", d: health ? "Done. Thank you." : "Needed before you can book. It takes about 2 minutes in the app.", done: health, link: health ? null : ["Open the app to fill it in", "https://app.mygymlondon.co.uk/#login"] },
      { t: "Choose your plan", d: "Join a membership, or pay as you go for a single class. No joining fees.", done: false, link: ["See memberships", "join.html"], link2: ["Try a free class or gym session", "classes.html"] },
      { t: "Open the app", d: "Once your plan is active, your membership and bookings appear here and in the app.", done: false, link: ["Open the app", "https://app.mygymlondon.co.uk/#login"] }
    ];
    var ol = el("ol", "hubsteps"); card.appendChild(ol);
    steps.forEach(function (s, i) {
      var li = el("li", s.done ? "done" : ""), n = el("span", "hn", s.done ? "✓" : String(i + 1)), b = el("div", "hb");
      b.appendChild(el("b", null, s.t)); b.appendChild(el("p", null, s.d));
      [s.link, s.link2].forEach(function (k) { if (k) { var a = el("a", "btn sm ghost", k[0]); a.href = k[1]; if (/^https?:/.test(k[1]) && k[1].indexOf("mygymlondon.co.uk/#") === -1 && k[1].indexOf("app.mygymlondon") === -1) { a.target = "_blank"; a.rel = "noopener"; } b.appendChild(a); } });
      li.appendChild(n); li.appendChild(b); ol.appendChild(li);
    });
    freeCard(box, free, elig);
    /* paid with another email? staff check it and link it */
    var help = el("div", "card loginf"); box.appendChild(help);
    help.appendChild(el("h3", null, "Paid but cannot see your plan?"));
    help.appendChild(el("p", "sub", "We match your plan to your account by email. If you used a different email at checkout, tell us which one and we will check and link it. We never link it automatically, to keep your account safe."));
    var open = el("button", "btn ghost", "Tell us the email I paid with"); open.type = "button"; help.appendChild(open);
    var form = el("div", null); form.hidden = true; help.appendChild(form);
    var other = el("input", "wemail"); other.type = "email"; other.placeholder = "The email you used at checkout"; other.autocomplete = "email";
    var msg = el("textarea", "wemail"); msg.rows = 3; msg.maxLength = 500; msg.placeholder = "Anything that helps us find it, for example the plan and the date (optional)";
    var err = el("p", "mbmsg bad", ""); err.hidden = true; var send = el("button", "btn", "Send to the gym"); send.type = "button";
    form.appendChild(field("Email used at checkout", other)); form.appendChild(field("", msg)); form.appendChild(err); form.appendChild(send);
    open.addEventListener("click", function () { form.hidden = !form.hidden; });
    send.addEventListener("click", async function () {
      err.hidden = true; send.disabled = true;
      var r = await sb.rpc("request_plan_help", { p_other_email: other.value.trim(), p_message: msg.value || null });
      if (r.error) { err.textContent = r.error.message || "Could not send. Try again."; err.hidden = false; send.disabled = false; return; }
      while (form.firstChild) form.removeChild(form.firstChild);
      form.appendChild(el("p", "mbmsg ok", "Thank you. We will check and email you within 2 working days."));
    });
  }

  /* free sessions (2 in total): what was asked for, what happened, and a membership suggestion once they have tried one */
  function freeCard(box, free, elig) {
    free = free || []; elig = elig || {};
    if (!free.length && !(elig.eligible)) return;
    var card = el("div", "card loginf freecard"); box.appendChild(card);
    card.appendChild(el("h3", null, "Your free sessions"));
    var left = elig.remaining != null ? elig.remaining : 2;
    card.appendChild(el("p", "sub", left > 0 ? "You have " + left + " free " + (left === 1 ? "session" : "sessions") + " left. Try any class or gym session, in any mix." : "You have used your free sessions."));
    var LBL = { requested: "Requested", booked: "Confirmed", done: "Done", closed: "Closed" };
    free.forEach(function (f) {
      var r = el("div", "freerow"), i = el("div", "mbinfo");
      i.appendChild(el("b", null, f.what + (f.date ? " · " + fmtShort(f.date) : "") + (f.when ? " · " + String(f.when).split(" (")[0].toLowerCase() : "")));
      i.appendChild(el("span", null, f.state === "requested" ? "We will email you to confirm." : f.state === "booked" ? "Your place is booked. See you there." : f.state === "done" ? "Thanks for coming." : "This request was closed."));
      r.appendChild(i); r.appendChild(el("span", "freestate " + f.state, LBL[f.state] || f.state)); card.appendChild(r);
    });
    var acts = el("div", "hubacts");
    if (left > 0) { var a = el("a", "btn", "Choose a class"); a.href = "classes.html"; acts.appendChild(a); var g = el("a", "btn ghost", "Choose a gym hour"); g.href = "book.html"; acts.appendChild(g); card.appendChild(acts); }
    if (free.length && window.MGLSuggest) { var sug = el("div", null); box.appendChild(sug); window.MGLSuggest.render(sb, sug, free[0].kind); }
  }

  async function renderMem() {
    var box = $("mbMem"); if (!box) return; while (box.firstChild) box.removeChild(box.firstChild);
    var sess = (await sb.auth.getSession()).data.session; if (!sess) return;
    var res = await sb.rpc("my_membership"), m = res.data;
    if (res.error || !m) { box.appendChild(el("p", "sub", "We could not load your membership just now. Please refresh, or use the MyGym app.")); return; }
    var L = window.MGL_LINKS || {}, wix = (L.wix || "https://www.mygymlondon.co.uk"), email = sess.user.email;
    var pr = await sb.from("profiles").select("full_name").eq("id", sess.user.id).maybeSingle(), name = (pr.data && pr.data.full_name) || "";
    var hr = await sb.from("member_health").select("consent_version").eq("user_id", sess.user.id).maybeSingle(), health = !!(hr.data && hr.data.consent_version);
    var p = m.plan, q = m.request;
    var classPlan = !!(p && /class/i.test(p.name || "") && !/payg|pay as you go/i.test(p.name || "")), showCredits = !classPlan && m.credits > 0;   // classes are included in a class membership: credits are only for pay as you go
    if (!p && !q && !m.credits) {
      var fr = await sb.rpc("my_free_requests"), el2 = await sb.rpc("my_free_class_eligible");
      journey(box, sess.user.id, email, health, wix, L, fr.data || [], el2.data || {}); return;
    }

    if (p) {
      box.appendChild(planCard(m, name));
      var u = m.usage;
      if (u) {
        var st = el("div", "hubstats");
        [[u.month || 0, "visits this month"], [u.d30 || 0, "last 30 days"]].concat(showCredits ? [[m.credits, m.credits === 1 ? "class credit" : "class credits"]] : []).forEach(function (x) { var s = el("div", "hubstat"); s.appendChild(el("b", null, String(x[0]))); s.appendChild(el("small", null, x[1])); st.appendChild(s); });
        box.appendChild(st);
      }
    }
    var card = el("div", "card loginf"); box.appendChild(card);
    if (!health) { var hb = el("p", "mbmsg", "Your health form is not done yet. Complete it in the app so you can book."); var ha = el("a", "btn sm", "Open the app"); ha.href = "https://app.mygymlondon.co.uk/#login"; hb.appendChild(document.createTextNode(" ")); hb.appendChild(ha); card.appendChild(hb); }
    if (p) {
      card.appendChild(el("h3", null, "My membership"));
      if (p.payment_failed) card.appendChild(el("p", "mbmsg bad", "Your last payment did not go through. We try again 5 days after the failed attempt. To avoid your membership being suspended, update your card with the link below."));
      if (p.next_payment && p.status === "active" && !p.cancelling) card.appendChild(row("Next payment", fmtD(p.next_payment) + (p.amount ? " · " + money(p.amount) : "")));
      if (p.ends && (p.cancelling || p.status !== "active")) card.appendChild(row(p.cancelling ? "Ends" : "Until", fmtD(p.ends)));
      card.appendChild(row("You can book", p.type === "gym_classes" ? "Classes and gym slots" : p.type === "classes" ? "Classes" : p.type === "gym" ? "Gym slots" : "See your plan"));
      if (m.usage && m.usage.next) card.appendChild(row("Next booking", fmtShort(m.usage.next.date) + " · " + String(m.usage.next.time || "").slice(0, 5) + " " + (m.usage.next.name || "")));
      if (m.usage && m.usage.last_visit) card.appendChild(row("Last visit", fmtShort(m.usage.last_visit)));
      var acts = el("div", "hubacts"); card.appendChild(acts);
      var app = el("a", "btn", "Open the app"); app.href = "https://app.mygymlondon.co.uk/#login"; acts.appendChild(app);
      var upd = el("a", "btn ghost", "Update my card or see receipts"); upd.href = wix + (L.cardPage || "/my-subscriptions"); upd.target = "_blank"; upd.rel = "noopener"; acts.appendChild(upd);
    }
    if (showCredits) card.appendChild(el("p", "mbmsg ok", "🎟️ " + m.credits + (m.credits === 1 ? " class credit" : " class credits") + " available. Ask us at the gym to use it."));
    if (memSent) { card.appendChild(el("p", "mbmsg ok", memSent)); memSent = ""; }
    var lbl = { pause: "Pause", cancel: "Cancellation", change: "Plan change" };
    if (q && q.status === "received") {
      var what = q.type === "change" && q.target ? "Change plan to " + q.target : (lbl[q.type] || q.type);
      card.appendChild(el("p", "mbmsg ok", "Your request: " + what + " from " + fmtD(q.from_date) + ". Received. We reply within 2 working days and nothing changes until we confirm."));
      var w = el("button", "btn ghost", "Withdraw this request"); w.type = "button";
      w.addEventListener("click", async function () { w.disabled = true; await sb.rpc("withdraw_membership_request", { p_id: q.id }); renderMem(); });
      card.appendChild(w); card.appendChild(el("p", "mbmsg", NOTICE));
    } else if (p) {
      if (q && (q.status === "done" || q.status === "declined") && q.resolved_at && Date.now() - new Date(q.resolved_at).getTime() < 14 * 864e5) {
        var good = q.status === "done";
        card.appendChild(el("p", "mbmsg " + (good ? "ok" : "bad"), (lbl[q.type] || q.type) + (good ? " confirmed on " + fmtD(q.resolved_at) + "." : " could not be done on " + fmtD(q.resolved_at) + "." + (q.note ? " " + q.note : " We will be in touch."))));
      }
      card.appendChild(el("h4", "hubh", "Manage my plan"));
      card.appendChild(el("p", "mbmsg", NOTICE));
      var grid = el("div", "hubgrid"), panel = el("div", "hubpanel"); card.appendChild(grid); card.appendChild(panel);
      var dateInput = function () { var d = el("input", "wemail"); d.type = "date"; d.min = isoPlus(0); d.max = isoPlus(90); d.value = p.next_payment || isoPlus(7); return d; };
      var whySel = function () { var s = el("select", "wemail"); ["", "Moving away", "Cost", "Injury or health", "Not enough time", "Not what I expected", "Other"].forEach(function (t) { var x = el("option", null, t || "Mind telling us why? (optional)"); x.value = t; s.appendChild(x); }); return s; };
      var submit = async function (btn, errBox, type, date, why, msg, target, doneText) {
        btn.disabled = true; errBox.hidden = true;
        var r = await sb.rpc("request_membership_change", { p_type: type, p_from: date, p_reason: why || null, p_message: msg || null, p_target: target || null });
        if (r.error) { errBox.textContent = r.error.message || "Could not send. Try again."; errBox.hidden = false; btn.disabled = false; return; }
        memSent = doneText; renderMem();
      };
      var simple = function (type) {
        while (panel.firstChild) panel.removeChild(panel.firstChild);
        var date = dateInput(), why = whySel(), msg = el("textarea", "wemail"); msg.rows = 3; msg.maxLength = 600; msg.placeholder = "Anything else? (optional)";
        var err = el("p", "mbmsg bad", ""); err.hidden = true; var send = el("button", "btn", type === "cancel" ? "Send cancellation request" : "Send pause request"); send.type = "button";
        panel.appendChild(el("h4", "hubh", type === "cancel" ? "Cancel my membership" : "Pause my membership")); panel.appendChild(field("From which date?", date)); panel.appendChild(field("", why)); panel.appendChild(field("", msg));
        panel.appendChild(el("p", "fine", "This is a request. Your membership carries on as normal until we confirm it by email." + (type === "cancel" ? " Please give at least 1 week’s notice before your next billing date." : ""))); panel.appendChild(err); panel.appendChild(send);
        send.addEventListener("click", function () { submit(send, err, type, date.value, why.value, msg.value, null, (type === "cancel" ? "✅ Cancellation request received. " : "✅ Pause request received. ") + "We will email you within 2 working days to confirm. Until then your membership carries on as normal."); });
      };
      var confirmChange, changeScreen;
      confirmChange = function (o) {
        while (panel.firstChild) panel.removeChild(panel.firstChild);
        var date = dateInput(), msg = el("textarea", "wemail"); msg.rows = 3; msg.maxLength = 600; msg.placeholder = "Anything else? (optional)";
        var err = el("p", "mbmsg bad", ""); err.hidden = true; var send = el("button", "btn", "Send request"); send.type = "button";
        var back = el("button", "btn sm ghost", "‹ Back to plans"); back.type = "button"; back.addEventListener("click", changeScreen);
        panel.appendChild(back); panel.appendChild(el("h4", "hubh", "Change to " + o.name)); panel.appendChild(el("p", "sub", money(o.price) + " " + o.per)); panel.appendChild(field("From which date?", date)); panel.appendChild(field("", msg));
        panel.appendChild(el("p", "fine", "This is a request. Nothing changes until we confirm it by email, and your current plan carries on until then.")); panel.appendChild(err); panel.appendChild(send);
        send.addEventListener("click", function () { submit(send, err, "change", date.value, null, msg.value, o.name, "✅ Plan change request received (" + o.name + "). We will email you within 2 working days to confirm. Until then your current plan carries on as normal."); });
      };
      changeScreen = async function () {
        while (panel.firstChild) panel.removeChild(panel.firstChild); panel.appendChild(el("p", "sub", "Loading plans…"));
        var r = await sb.rpc("my_plan_options"), opts = r.data || [];
        while (panel.firstChild) panel.removeChild(panel.firstChild);
        if (r.error || !opts.length) { panel.appendChild(el("p", "mbmsg bad", "We could not load the plans. Please try again, or email info@mygymlondon.co.uk.")); return; }
        panel.appendChild(el("h4", "hubh", "Change my plan")); panel.appendChild(el("p", "sub", "Your plan is first. Choose a plan and we will confirm the change by email."));
        var cmp = el("div", "hubcmp"); panel.appendChild(cmp);
        var same = function (n) { return String(n).toLowerCase() === String(p.name).toLowerCase(); };
        var cur = opts.filter(function (o) { return same(o.name); })[0] || { name: p.name, price: p.amount, per: PER[p.unit] || "", includes: [] };
        var mk = function (o, isCur) {
          var c = el("div", "hubplan" + (isCur ? " cur" : ""));
          if (isCur) c.appendChild(el("span", "hubflag", "Your plan"));
          c.appendChild(el("div", "hubpn", o.name));
          var pp = el("div", "hubpp"); pp.appendChild(el("b", null, money(o.price))); pp.appendChild(el("span", null, " " + o.per)); c.appendChild(pp);
          var ul = el("ul", null); (o.includes || []).forEach(function (x) { ul.appendChild(el("li", null, x)); }); c.appendChild(ul);
          if (!isCur) { var up = Number(o.price) > Number(cur.price) && String(o.per) === String(cur.per); var bt = el("button", "btn sm", up ? "Upgrade to this" : "Switch to this"); bt.type = "button"; bt.addEventListener("click", function () { confirmChange(o); }); c.appendChild(bt); }
          return c;
        };
        cmp.appendChild(mk(cur, true));
        opts.filter(function (o) { return !same(o.name); }).forEach(function (o) { cmp.appendChild(mk(o, false)); });
      };
      [["Pause", function () { simple("pause"); }], ["Change plan", changeScreen], ["Cancel", function () { simple("cancel"); }]].forEach(function (a) {
        var b = el("button", "btn ghost", a[0]); b.type = "button";
        b.addEventListener("click", function () { Array.prototype.forEach.call(grid.children, function (x) { x.classList.toggle("sel", x === b); }); a[1](); panel.scrollIntoView({ behavior: "smooth", block: "nearest" }); });
        grid.appendChild(b);
      });
    }
  }

  async function loadPast(uid) {
    var box = $("mbPast"); if (!box) return; while (box.firstChild) box.removeChild(box.firstChild);
    var from = iso(new Date(Date.now() - 90 * 864e5)), to = iso(new Date());
    var b = await sb.from("class_bookings").select("id,class_id,date").eq("user_id", uid).gte("date", from).lte("date", to).order("date", { ascending: false }).limit(80);
    if (b.error) { box.appendChild(el("p", "sub", "We could not load your past bookings.")); return; }
    var ids = Array.from(new Set((b.data || []).map(function (x) { return x.class_id; })));
    var c = ids.length ? await sb.from("classes").select("id,name,start_time,kind").in("id", ids) : { data: [] };
    var by = {}; (c.data || []).forEach(function (x) { by[x.id] = x; });
    var rows = (b.data || []).map(function (x) { var k = by[x.class_id] || {}; return { date: x.date, time: k.start_time || "00:00", name: k.kind === "gym" ? "Gym session" : (k.name || "Class") }; })
      .filter(function (x) { return startMs(x.date, x.time) <= Date.now(); }).sort(function (a, z) { return startMs(z.date, z.time) - startMs(a.date, a.time); });
    if (!rows.length) { box.appendChild(el("p", "sub", "No past bookings in the last 90 days.")); return; }
    rows.forEach(function (r) { var row = el("div", "mbrow"), info = el("div", "mbinfo"); info.appendChild(el("b", null, r.name)); info.appendChild(el("span", null, nice(r.date, r.time))); row.appendChild(info); box.appendChild(row); });
  }
  async function load() {
    var s = (await sb.auth.getSession()).data.session;
    $("mbLogin").hidden = !!s; $("mbList").hidden = !s;
    if (!s) return;
    var list = $("mbItems"); while (list.firstChild) list.removeChild(list.firstChild);
    list.appendChild(el("p", "sub", "Loading..."));
    var b = await sb.from("class_bookings").select("id,class_id,date").eq("user_id", s.user.id).gte("date", iso(new Date(Date.now() - 864e5))).order("date");
    if (b.error) { while (list.firstChild) list.removeChild(list.firstChild); list.appendChild(el("p", "sub", "We could not load your bookings. Please try again.")); return; }
    var ids = Array.from(new Set((b.data || []).map(function (x) { return x.class_id; })));
    var c = ids.length ? await sb.from("classes").select("id,name,start_time,kind").in("id", ids) : { data: [] };
    var by = {}; (c.data || []).forEach(function (x) { by[x.id] = x; });
    var rows = (b.data || []).map(function (x) { var k = by[x.class_id] || {}; return { id: x.id, date: x.date, time: k.start_time || "00:00", name: k.kind === "gym" ? "Gym session" : (k.name || "Class") }; })
      .filter(function (x) { return startMs(x.date, x.time) > Date.now(); }).sort(function (a, z) { return startMs(a.date, a.time) - startMs(z.date, z.time); });
    while (list.firstChild) list.removeChild(list.firstChild);
    $("mbWho").textContent = s.user.email;
    renderMem();
    if (window.MGLPhoto && $("mbPhoto")) window.MGLPhoto.card(sb, $("mbPhoto"));
    loadPast(s.user.id);
    if (!rows.length) { list.appendChild(el("p", "sub", "You have no upcoming bookings. Book a class in the app.")); return; }
    rows.forEach(function (r) {
      var can = startMs(r.date, r.time) - Date.now() > LIMIT_MIN * 60000;
      var row = el("div", "mbrow"), info = el("div", "mbinfo"), btn = el("button", "btn ghost", can ? "Cancel" : "Too late to cancel");
      info.appendChild(el("b", null, r.name)); info.appendChild(el("span", null, nice(r.date, r.time)));
      btn.type = "button"; btn.disabled = !can;
      btn.addEventListener("click", async function () {
        if (!window.confirm("Cancel " + r.name + " on " + nice(r.date, r.time) + "?")) return;
        btn.disabled = true; say("Cancelling...", "");
        try {
          var t = (await sb.auth.getSession()).data.session.access_token;
          var res = await fetch(CFG.supabaseUrl + "/functions/v1/book-class", { method: "POST", headers: { "Content-Type": "application/json", apikey: CFG.anonKey, Authorization: "Bearer " + t }, body: JSON.stringify({ action: "cancel", booking_id: r.id }) });
          var j = await res.json().catch(function () { return {}; });
          if (!res.ok || j.error) { say(j.error || "We could not cancel this. Please try again, or email info@mygymlondon.co.uk.", "bad"); btn.disabled = false; return; }
          say("Cancelled. We have emailed you to confirm.", "ok"); load();
        } catch (e) { say("No connection. Please check your internet and try again.", "bad"); btn.disabled = false; }
      });
      row.appendChild(info); row.appendChild(btn); list.appendChild(row);
    });
  }

  $("mbForm").addEventListener("submit", async function (ev) {
    ev.preventDefault(); say("", ""); var go = $("mbGo"); go.disabled = true;
    var r = await sb.auth.signInWithPassword({ email: $("mbEmail").value.trim(), password: $("mbPass").value });
    go.disabled = false;
    if (r.error) { say("Email or password not right. Use the same details as the MyGym app.", "bad"); return; }
    $("mbPass").value = ""; load();
  });
  $("mbForgot").addEventListener("click", async function () {
    var e = $("mbEmail").value.trim(); if (!e) return say("Type your email above first, then press Forgot password.", "bad");
    try { await sb.auth.resetPasswordForEmail(e, { redirectTo: "https://app.mygymlondon.co.uk" }); } catch (x) { /* never reveal whether the email exists */ }
    say("If that email has an account, a reset link is on its way. Check your inbox and spam.", "ok");
  });
  $("mbOut").addEventListener("click", async function () { await sb.auth.signOut(); say("", ""); load(); });
  load().catch(function () { $("mbLogin").hidden = false; });
})();
