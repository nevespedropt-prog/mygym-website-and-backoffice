/* MyGym London website: timetable for classes (classes.html) and open gym hours (book.html).
   Day, week and month views. Members book here (same booking function as the app). A new account clicking a slot is offered a free session
   (2 in total, any mix of classes and gym sessions); everyone else pays as you go on Wix, or books with their membership or class credit. */
(function () {
  "use strict";
  var root = document.getElementById("sched");
  if (!root || !window.supabase) return;
  var CFG = window.MGL_FORMS || {}, L = window.MGL_LINKS || {};
  var KIND = root.getAttribute("data-kind") === "gym" ? "gym" : "class";
  var sb = window.supabase.createClient(CFG.supabaseUrl, CFG.anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var F = [["all", "All classes"], ["cardio", "HIIT & cardio"], ["strength", "Strength"], ["mind", "Pilates"], ["fifty", "50+"], ["kids", "Kids"]];
  var PAYG_GYM = (L.wix || "") + (L.service || "/service-page/") + "open-gym-access";
  var SLUG = { "cardio n abs": "cardio-n-abs", "hiit": "hiit", "hiit glow": "hiit-glow", "boxfit": "boxfit", "strength": "strength", "vitality 50+ circuit": "vitality-50-circuit", "abs attack": "abs-attack", "pilates": "pilates", "body conditioning": "body-conditioning", "circuit training": "circuit-training" };
  var page = (location.pathname.split("/").pop() || "").toLowerCase(); if (!/^[a-z0-9-]+\.html$/.test(page)) page = KIND === "gym" ? "book.html" : "classes.html";

  var rows = [], view = "day", flt = "all", sess = null, ctx = null, loaded = false, mine = {};   // mine: "classId|date" -> booking id
  var today = londonToday(), selDate = today, monthFirst = today.slice(0, 8) + "01";

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function londonToday() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date()); }
  function londonHM() { var p = {}; new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour12: false, hour: "2-digit", minute: "2-digit" }).formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; }); return String(+p.hour % 24).padStart(2, "0") + ":" + p.minute; }
  function addDays(d, n) { var t = new Date(d + "T12:00:00Z"); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); }
  function dow(d) { return new Date(d + "T12:00:00Z").getUTCDay(); }
  function dnum(d) { return +d.slice(8, 10); }
  function pretty(d) { return SHORT[dow(d)] + " " + dnum(d) + " " + MONTHS[+d.slice(5, 7) - 1]; }
  function hm(r) { return String(r.start_time).slice(0, 5); }
  function cat(n) { n = String(n).toLowerCase(); if (/kids/.test(n)) return "kids"; if (/50\+|vitality/.test(n)) return "fifty"; if (/pilates|yoga/.test(n)) return "mind"; if (/cardio|hiit|box/.test(n)) return "cardio"; if (/strength|abs|body/.test(n)) return "strength"; return "all"; }
  function say(text, kind, links) {
    var m = document.getElementById("smsg"); if (!m) return;
    while (m.firstChild) m.removeChild(m.firstChild);
    m.className = "note" + (kind ? " " + kind : ""); m.hidden = !text; if (!text) return;
    m.appendChild(document.createTextNode(text));
    (links || []).forEach(function (l) { m.appendChild(document.createTextNode(" ")); var a = el("a", null, l[0]); a.href = l[1]; m.appendChild(a); });
    m.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function paygLink(name) { var s = SLUG[String(name).toLowerCase()]; return s ? ["Pay as you go for " + name, (L.wix || "") + (L.service || "/service-page/") + s] : null; }
  function joinLinks(kind) { return [["See memberships", "join.html"], kind === "gym" ? ["Pay as you go gym visit", PAYG_GYM] : null].filter(Boolean); }

  /* ---------- data ---------- */
  function slotsFor(date) {
    var name = DAYS[dow(date)];
    return rows.filter(function (r) { return r.day_name === name && (KIND === "gym" || flt === "all" || cat(r.name) === flt); }).sort(function (a, b) { return a.start_time < b.start_time ? -1 : 1; });
  }
  function started(date, r) { return date === today && hm(r) <= londonHM(); }
  function inRange(date) { return date >= today && date <= addDays(today, 60); }

  /* ---------- drawing ---------- */
  function slotButton(r, date) {
    var key = r.id + "|" + date, bid = mine[key], st = started(date, r), b;
    if (bid) {
      b = el("button", KIND === "gym" ? "gslot booked" : "btn sm ghost", KIND === "gym" ? hm(r) + " ✓" : "Booked · Cancel");
      b.type = "button"; b.setAttribute("data-cancel", bid); b.setAttribute("data-slot-key", key); b.title = "Tap to cancel this booking";
      var soon = startsInMinutes(date, r) < 10; if (soon) { b.disabled = true; b.title = "Too late to cancel (less than 10 minutes to start)"; }
      return b;
    }
    b = el("button", KIND === "gym" ? "gslot" : "btn sm", KIND === "gym" ? hm(r) : (st ? "Started" : (sess ? "Book" : "Log in to book")));
    b.type = "button"; b.disabled = st; b.setAttribute("data-slot", r.id); b.setAttribute("data-date", date); b.setAttribute("data-name", r.name);
    if (KIND === "gym") b.title = (st ? "Already started" : (sess ? "Book " : "Log in to book ") + hm(r));
    return b;
  }
  function startsInMinutes(date, r) { var n = londonHM(), mm = function (x) { return +x.slice(0, 2) * 60 + +x.slice(3, 5); }; return (date === today ? 0 : 1440 * Math.round((new Date(date + "T12:00:00Z") - new Date(today + "T12:00:00Z")) / 864e5)) + mm(hm(r)) - mm(n); }
  function slotList(date) {
    var list = slotsFor(date), box = el("div", KIND === "gym" ? "gslots" : "slots");
    if (!list.length) { box.appendChild(el("p", "note", KIND === "gym" ? "No open hours this day." : "No matching classes this day. Try another day or filter.")); return box; }
    list.forEach(function (r) {
      if (KIND === "gym") { box.appendChild(slotButton(r, date)); return; }
      var row = el("div", "slot"), t = el("span", "tm", hm(r)), mid = el("div", null), b = el("b", null, r.name);
      mid.appendChild(b); mid.appendChild(el("small", null, (r.info || "") + (r.coach ? " · " + r.coach : "") + (r.capacity ? " · " + r.capacity + " places" : "")));
      row.appendChild(t); row.appendChild(mid); row.appendChild(slotButton(r, date)); box.appendChild(row);
    });
    return box;
  }
  function dayTabs(box) {
    var tabs = el("div", "dates");
    for (var i = 0; i < 7; i++) {
      var d = addDays(today, i), b = el("button", "dt" + (d === selDate ? " sel" : ""));
      b.type = "button"; b.setAttribute("data-day", d);
      b.appendChild(el("small", null, i === 0 ? "Today" : SHORT[dow(d)])); b.appendChild(el("b", null, String(dnum(d)))); b.appendChild(el("small", null, MONTHS[+d.slice(5, 7) - 1]));
      tabs.appendChild(b);
    }
    box.appendChild(tabs);
  }
  function drawDay(body) {
    dayTabs(body);
    body.appendChild(el("h3", "sdayh", (selDate === today ? "Today, " : "") + DAYS[dow(selDate)] + " " + dnum(selDate) + " " + MONTHS_LONG[+selDate.slice(5, 7) - 1]));
    body.appendChild(slotList(selDate));
  }
  function drawWeek(body) {
    for (var i = 0; i < 7; i++) {
      var d = addDays(today, i), sec = el("section", "sweekday"), list = slotsFor(d);
      sec.appendChild(el("h3", null, (i === 0 ? "Today, " : "") + DAYS[dow(d)] + " " + dnum(d) + " " + MONTHS[+d.slice(5, 7) - 1]));
      if (KIND === "gym") {
        var s = el("p", "sub", list.length ? list.length + " open hours, " + hm(list[0]) + " to " + hm(list[list.length - 1]) + " " : "Closed to adults this day. ");
        if (list.length) { var a = el("button", "lnk", "See hours"); a.type = "button"; a.setAttribute("data-goday", d); s.appendChild(a); }
        sec.appendChild(s);
      } else sec.appendChild(slotList(d));
      body.appendChild(sec);
    }
  }
  function drawMonth(body) {
    var y = +monthFirst.slice(0, 4), m = +monthFirst.slice(5, 7), head = el("div", "smonthhead");
    var prev = el("button", "btn sm ghost", "‹"), next = el("button", "btn sm ghost", "›");
    prev.type = next.type = "button"; prev.setAttribute("data-mn", "-1"); next.setAttribute("data-mn", "1"); prev.setAttribute("aria-label", "Previous month"); next.setAttribute("aria-label", "Next month");
    prev.disabled = monthFirst <= today.slice(0, 8) + "01"; next.disabled = monthFirst >= addDays(today, 60).slice(0, 8) + "01";
    head.appendChild(prev); head.appendChild(el("b", null, MONTHS_LONG[m - 1] + " " + y)); head.appendChild(next); body.appendChild(head);
    var grid = el("div", "smonth"); ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach(function (h) { grid.appendChild(el("small", "smh", h)); });
    var lead = (dow(monthFirst) + 6) % 7; for (var i = 0; i < lead; i++) grid.appendChild(el("span", "smblank"));
    var days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    for (var n = 1; n <= days; n++) {
      var d = monthFirst.slice(0, 8) + String(n).padStart(2, "0"), c = slotsFor(d).length, ok = inRange(d) && c > 0;
      var b = el("button", "smday" + (d === selDate ? " cur" : "") + (d === today ? " today" : ""));
      b.type = "button"; b.disabled = !ok; b.setAttribute("data-day", d); b.setAttribute("data-stay", "1");
      b.appendChild(el("b", null, String(n))); b.appendChild(el("small", null, ok ? c + (KIND === "gym" ? " hrs" : " classes") : ""));
      grid.appendChild(b);
    }
    body.appendChild(grid);
    if (inRange(selDate) && selDate.slice(0, 7) === monthFirst.slice(0, 7)) { body.appendChild(el("h3", "sdayh", DAYS[dow(selDate)] + " " + dnum(selDate) + " " + MONTHS_LONG[+selDate.slice(5, 7) - 1])); body.appendChild(slotList(selDate)); }
  }
  function draw() {
    var tools = document.getElementById("stools"), body = document.getElementById("sbody"); if (!tools || !body) return;
    while (tools.firstChild) tools.removeChild(tools.firstChild); while (body.firstChild) body.removeChild(body.firstChild);
    var views = el("div", "sview", null); [["day", "Day"], ["week", "Week"], ["month", "Month"]].forEach(function (v) { var b = el("button", "fc" + (view === v[0] ? " on" : ""), v[1]); b.type = "button"; b.setAttribute("data-v", v[0]); views.appendChild(b); });
    tools.appendChild(views);
    if (KIND === "class") { var chips = el("div", "chips"); F.forEach(function (f) { var b = el("button", "fc" + (f[0] === flt ? " on" : ""), f[1]); b.type = "button"; b.setAttribute("data-f", f[0]); chips.appendChild(b); }); tools.appendChild(chips); }
    if (!loaded) { body.appendChild(el("p", "note", "Loading the timetable...")); return; }
    if (view === "week") drawWeek(body); else if (view === "month") drawMonth(body); else drawDay(body);
  }

  /* ---------- booking ---------- */
  async function loadCtx(force) {
    if (ctx && !force) return ctx;
    var a = await Promise.all([sb.rpc("my_features"), sb.rpc("my_free_class_eligible"), sb.rpc("my_membership")]);
    ctx = { f: a[0].data || {}, free: a[1].data || {}, m: a[2].data || {} };
    return ctx;
  }
  async function loadMine() {
    if (!sess) { mine = {}; return; }
    var r = await sb.from("class_bookings").select("id,class_id,date").eq("user_id", sess.user.id).gte("date", today);
    mine = {}; (r.data || []).forEach(function (x) { mine[x.class_id + "|" + x.date] = x.id; });
  }
  function hasClassPlan() { var p = ctx.m.plan; return !!(ctx.f.class_plan || (p && p.status === "active" && /class/i.test(p.name || "") && !/payg|pay as you go/i.test(p.name || ""))); }
  function hasGymPlan() { var p = ctx.m.plan; return !!(p && p.status === "active" && /gym/i.test(p.name || "") && !/payg|pay as you go/i.test(p.name || "")); }
  async function choose(id, date, name, btn) {
    var row = rows.filter(function (r) { return String(r.id) === String(id); })[0]; if (!row) return;
    if (!sess) { loggedOutDialog(row, date); return; }
    say("", "");
    if (!ctx) { if (btn) btn.textContent = "..."; try { await loadCtx(); } catch (e) { say("We could not check your account just now. Please try again.", "bad"); draw(); return; } }
    var free = ctx.free || {}, credits = ctx.m.credits || 0;
    if (KIND === "class") {
      if (hasClassPlan()) return book(row, date, btn);
      if (free.eligible) return freeDialog(row, date);
      if (ctx.f.class_plan_check) {
        if (credits > 0) { if (window.confirm("This class will use 1 of your " + credits + " class credit" + (credits === 1 ? "" : "s") + ". Continue?")) return book(row, date, btn); return; }
        var pl = paygLink(row.name); say("Classes are for members. Join a plan, or pay as you go for this class.", "bad", [["See memberships", "join.html"]].concat(pl ? [pl] : [])); return;
      }
      return book(row, date, btn);
    }
    if (hasGymPlan()) return book(row, date, btn);
    if (free.eligible) return freeDialog(row, date);
    say("Open gym hours are for members on a gym plan. Join a plan, or pay as you go for a gym visit.", "bad", joinLinks("gym"));
  }
  /* one tap: the button shows Booked straight away, and goes back if the booking is refused */
  async function book(row, date, btn) {
    var key = row.id + "|" + date;
    if (btn) { btn.disabled = true; btn.textContent = KIND === "gym" ? hm(row) + " …" : "Booking…"; }
    try {
      var t = (await sb.auth.getSession()).data.session.access_token;
      var r = await fetch(CFG.supabaseUrl + "/functions/v1/book-class", { method: "POST", headers: { "Content-Type": "application/json", apikey: CFG.anonKey, Authorization: "Bearer " + t }, body: JSON.stringify({ action: "book", class_id: Number(row.id), date: date }) });
      var j = await r.json().catch(function () { return {}; });
      if (!r.ok || j.error) {
        var msg = j.error || "We could not book this. Please try again."; draw();
        if (/gym booking is for/i.test(msg)) { say("Your gym access needs refreshing. Open the MyGym app once, then try again.", "bad", [["Open the app", "https://app.mygymlondon.co.uk/#timetable"]].concat(joinLinks("gym"))); return; }
        say(msg, "bad", /already booked|full|limit/i.test(msg) ? null : (KIND === "gym" ? joinLinks("gym") : [paygLink(row.name)].filter(Boolean))); return;
      }
      mine[key] = "pending"; draw();
      say("Booked: " + (KIND === "gym" ? "open gym" : row.name) + ", " + pretty(date) + " at " + hm(row) + ". Tap it again to cancel. We have emailed you.", "ok", [["My bookings", "my-bookings.html"]]);
      loadMine().then(function () { draw(); });
    } catch (e) { draw(); say("No connection. Please check your internet and try again.", "bad"); }
  }
  async function cancelBooking(id, btn) {
    var key = btn.getAttribute("data-slot-key"), label = key ? key.split("|")[1] : "";
    if (!window.confirm("Cancel this booking" + (label ? " on " + pretty(label) : "") + "?")) return;
    btn.disabled = true; btn.textContent = "Cancelling…";
    try {
      if (id === "pending") { await loadMine(); id = mine[key]; if (!id) { draw(); return; } }
      var t = (await sb.auth.getSession()).data.session.access_token;
      var r = await fetch(CFG.supabaseUrl + "/functions/v1/book-class", { method: "POST", headers: { "Content-Type": "application/json", apikey: CFG.anonKey, Authorization: "Bearer " + t }, body: JSON.stringify({ action: "cancel", booking_id: id }) });
      var j = await r.json().catch(function () { return {}; });
      if (!r.ok || j.error) { draw(); say(j.error || "We could not cancel this. Please try again, or email info@mygymlondon.co.uk.", "bad"); return; }
      delete mine[key]; draw(); say("Cancelled. We have emailed you to confirm.", "ok");
    } catch (e) { draw(); say("No connection. Please check your internet and try again.", "bad"); }
  }

  /* ---------- not logged in: log in or create an account, or pay as you go ---------- */
  function overlay() {
    var over = el("div", "sdlg"), box = el("div", "sdlg-in"); over.setAttribute("role", "dialog"); over.setAttribute("aria-modal", "true"); over.appendChild(box);
    over.addEventListener("click", function (e) { if (e.target === over && over.parentNode) over.parentNode.removeChild(over); });
    function close() { if (over.parentNode) over.parentNode.removeChild(over); }
    return { over: over, box: box, close: close };
  }
  function loggedOutDialog(row, date) {
    var o = overlay(), box = o.box, what = KIND === "gym" ? "gym session" : "class";
    try { sessionStorage.setItem("mgl_pending_slot", JSON.stringify({ id: row.id, date: date, kind: KIND, page: page })); } catch (e) { /* private window */ }
    box.appendChild(el("h3", null, "Log in to book"));
    box.appendChild(el("p", "sub", (KIND === "gym" ? "Open gym" : row.name) + " · " + pretty(date) + " at " + hm(row) + ". New here? Create a free account and your first two sessions (classes or gym) are free."));
    var acts = el("div", "hubacts");
    var c1 = el("a", "btn", "Create account"); c1.href = "login.html?mode=signup&next=" + page; var c2 = el("a", "btn ghost", "Log in"); c2.href = "login.html?next=" + page;
    acts.appendChild(c1); acts.appendChild(c2); box.appendChild(acts);
    box.appendChild(el("p", "fine", "Or, without an account:"));
    var alt = el("div", "hubacts");
    var pl = KIND === "gym" ? ["Pay as you go gym visit", PAYG_GYM] : paygLink(row.name);
    if (pl) { var a = el("a", "btn sm ghost", pl[0]); a.href = pl[1]; alt.appendChild(a); }
    var m = el("a", "btn sm ghost", "See memberships"); m.href = "join.html"; alt.appendChild(m); box.appendChild(alt);
    var x = el("button", "lnk", "Close"); x.type = "button"; x.addEventListener("click", o.close); box.appendChild(x);
    document.body.appendChild(o.over);
  }

  /* ---------- free session: ask first, then send the same request the website form sends ---------- */
  async function freeDialog(row, date) {
    var tomorrow = addDays(today, 1), last = addDays(today, 30);
    var free = ctx.free || {}, left = free.remaining != null ? free.remaining : 2;
    if (date < tomorrow || date > last) { say("Free sessions are booked from tomorrow, up to 30 days ahead. Please choose another day for your free " + (KIND === "gym" ? "gym session" : "class") + ".", "bad"); return; }
    var pr = await sb.from("profiles").select("full_name,phone").eq("id", sess.user.id).maybeSingle(), prof = pr.data || {};
    var t0 = Date.now(), what = KIND === "gym" ? "gym session" : "class", o = overlay(), box = o.box, close = o.close;
    box.appendChild(el("h3", null, "Your first " + what + " is free"));
    box.appendChild(el("p", "sub", (KIND === "gym" ? "Open gym" : row.name) + " · " + pretty(date) + " at " + hm(row) + ". " + (left > 1 ? "You have " + left + " free sessions to use on any class or gym session. " : "This is your last free session. ") + "We confirm your place by email, usually within one working day."));
    var phone = null;
    if (String(prof.phone || "").replace(/\D/g, "").length < 7) {   // only for older accounts made before the phone number was asked at sign-up
      box.appendChild(el("label", "lb", "Phone number (so we can reach you)")); phone = el("input", "wemail"); phone.type = "tel"; phone.maxLength = 25; phone.autocomplete = "tel"; box.appendChild(phone);
    }
    var st = el("p", "mbmsg", ""); st.hidden = true; box.appendChild(st);
    var send = el("button", "btn", "Request my free " + what); send.type = "button";
    var no = el("button", "btn ghost", "No thanks, I will pay as you go"); no.type = "button";
    var x = el("button", "lnk", "Cancel"); x.type = "button";
    var acts = el("div", "hubacts"); acts.appendChild(send); acts.appendChild(no); box.appendChild(acts);
    box.appendChild(el("p", "fine", "By requesting you confirm you are fit to exercise, or that you will tell the coach about anything that might affect you."));
    box.appendChild(x);
    x.addEventListener("click", close);
    no.addEventListener("click", function () { close(); if (KIND === "gym") say("No problem. Pay as you go for a gym visit, or join a plan.", "", joinLinks("gym")); else { var pl = paygLink(row.name); say("No problem. You can pay as you go for this class, or join a plan.", "", [["See memberships", "join.html"]].concat(pl ? [pl] : [])); } });
    send.addEventListener("click", async function () {
      st.hidden = true;
      var ph = phone ? phone.value.trim() : String(prof.phone).trim();
      if (String(ph).replace(/\D/g, "").length < 7) { st.className = "mbmsg bad"; st.textContent = "Please add a phone number we can reach you on."; st.hidden = false; return; }
      send.disabled = true;
      var part = Number(hm(row).slice(0, 2)) < 12 ? "Morning (5am–12pm)" : Number(hm(row).slice(0, 2)) < 17 ? "Afternoon (12pm–5pm)" : "Evening (5pm–midnight)";
      var data = KIND === "gym"
        ? { full_name: prof.full_name || sess.user.email, email: sess.user.email, phone: ph, preferred_date: date, preferred_time: part, page_url: location.href.split("#")[0] }
        : { full_name: prof.full_name || sess.user.email, email: sess.user.email, phone: ph, class_name: row.name, class_date: pretty(date), class_time: hm(row), class_duration: row.info || "", page_url: location.href.split("#")[0] };
      try {
        var r = await fetch(CFG.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ form_id: KIND === "gym" ? "trial-gym" : "free-class", data: data, consent: { health_ready: true }, hp: "", elapsed: Math.max(4, Math.round((Date.now() - t0) / 1000)) }) });
        var j = await r.json().catch(function () { return {}; });
        if (!r.ok || j.ok === false) throw new Error((j.errors && j.errors[0] && j.errors[0].message) || j.error || "fail");
      } catch (e) { st.className = "mbmsg bad"; st.textContent = e.message && e.message !== "fail" ? e.message : "Sorry, that did not go through. Please try again, or email info@mygymlondon.co.uk."; st.hidden = false; send.disabled = false; return; }
      ctx.free = { eligible: left > 1, remaining: left - 1, pending: (free.pending || 0) + 1 };
      while (box.firstChild) box.removeChild(box.firstChild);
      box.appendChild(el("h3", null, "Request received"));
      box.appendChild(el("p", "sub", "Thank you. We will email you to confirm your free " + what + " (" + pretty(date) + (KIND === "gym" ? ", " + part.split(" (")[0].toLowerCase() : " at " + hm(row)) + "). You can follow it, and see our memberships, on your account page."));
      var a = el("a", "btn", "Go to my account"); a.href = "my-bookings.html"; box.appendChild(a);
      var cl = el("button", "lnk", "Close"); cl.type = "button"; cl.addEventListener("click", close); box.appendChild(cl);
    });
    document.body.appendChild(o.over);
  }

  /* ---------- events ---------- */
  root.addEventListener("click", function (e) {
    var t = e.target.closest("button"); if (!t) return;
    if (t.getAttribute("data-v")) { view = t.getAttribute("data-v"); draw(); return; }
    if (t.getAttribute("data-f")) { flt = t.getAttribute("data-f"); draw(); return; }
    if (t.getAttribute("data-goday")) { selDate = t.getAttribute("data-goday"); view = "day"; draw(); return; }
    if (t.getAttribute("data-mn")) { var y = +monthFirst.slice(0, 4), m = +monthFirst.slice(5, 7) + Number(t.getAttribute("data-mn")); if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; } monthFirst = y + "-" + String(m).padStart(2, "0") + "-01"; draw(); return; }
    if (t.getAttribute("data-cancel")) { cancelBooking(t.getAttribute("data-cancel"), t); return; }
    if (t.getAttribute("data-slot")) { choose(t.getAttribute("data-slot"), t.getAttribute("data-date"), t.getAttribute("data-name"), t); return; }
    if (t.getAttribute("data-day")) { selDate = t.getAttribute("data-day"); draw(); return; }
  });
  document.addEventListener("click", function (e) { var a = e.target.closest("[data-cf]"); if (!a || KIND !== "class") return; e.preventDefault(); flt = a.getAttribute("data-cf"); view = "day"; draw(); var tt = document.getElementById("timetable"); if (tt) tt.scrollIntoView({ behavior: "smooth", block: "start" }); });

  function resumePending() {
    var p = null; try { p = JSON.parse(sessionStorage.getItem("mgl_pending_slot") || "null"); sessionStorage.removeItem("mgl_pending_slot"); } catch (e) { p = null; }
    if (!p || p.kind !== KIND || p.date < today) return;
    var go = function () { selDate = p.date; view = "day"; draw(); var row = rows.filter(function (r) { return String(r.id) === String(p.id); })[0]; if (row && ctx && ctx.free && ctx.free.eligible && !(KIND === "class" ? hasClassPlan() : hasGymPlan())) freeDialog(row, p.date); };
    if (loaded) go(); else { var n = 0, t = setInterval(function () { if (loaded || ++n > 40) { clearInterval(t); go(); } }, 150); }
  }
  root.innerHTML = "";
  var tools = el("div", null); tools.id = "stools"; var msg = el("p", "note", ""); msg.id = "smsg"; msg.hidden = true; msg.setAttribute("role", "status"); var body = el("div", null); body.id = "sbody";
  root.appendChild(tools); root.appendChild(msg); root.appendChild(body); draw();
  var sub = document.getElementById("ttsub");
  sb.auth.getSession().then(function (r) { sess = r.data.session; if (loaded) draw(); if (sess) { loadMine().then(function () { draw(); }).catch(function () {}); loadCtx().then(resumePending).catch(function () {}); } });
  fetch(CFG.supabaseUrl + "/rest/v1/classes?select=id,day_name,start_time,name,coach,info,capacity&active=eq.true&kind=eq." + KIND + "&order=sort", { headers: { apikey: CFG.anonKey, Authorization: "Bearer " + CFG.anonKey } })
    .then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (d) { rows = d; loaded = true; if (sub) sub.textContent = KIND === "gym" ? "Open gym hours, one hour at a time. Choose a day, a week or a month." : "The same timetable as the MyGym app. Choose a day, a week or a month, then book."; draw(); })
    .catch(function () { loaded = true; if (sub) { sub.textContent = ""; sub.appendChild(document.createTextNode("We could not load the timetable. ")); var a = el("a", null, "Open it in the app"); a.href = "https://app.mygymlondon.co.uk/#timetable"; sub.appendChild(a); } draw(); });
})();
