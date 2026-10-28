/* MY GYM London back office. Real data only: every number comes from the database through the admin_* functions,
   which check the signed-in person's role themselves. This page only decides what to show; it never opens a table. */
(function () {
  "use strict";
  var CFG = window.MYGYM_CONFIG || {};
  var sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  var $ = function (id) { return document.getElementById(id); };
  var me = null, current = null, loadSeq = 0;
  var ROLE_LABEL = { admin: "Owner / admin", manager: "Manager", reception: "Reception", coach: "Coach" };
  var FORMS = { "contact": "Contact", "pt-enquiry": "Personal training", "trial-class": "Free class", "landing-offer": "Offer", "corporate-enquiry": "Corporate", "kids-registration": "Kids Gym", "pause-cancel-request": "Pause / cancel", "feedback": "Feedback", "refer-a-friend": "Referral", "newsletter-signup": "Newsletter" };
  var STATUS = { "new": "New", contacted: "Contacted", trial: "Trial booked", joined: "Joined", not_now: "Not now", spam: "Spam" };
  var HIDE = { utm_source: 1, utm_medium: 1, utm_campaign: 1, page_url: 1 };

  /* ---------- small helpers ---------- */
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    for (var k in (attrs || {})) {
      var v = attrs[k]; if (v == null || v === false) continue;
      if (k === "class") e.className = v; else if (k === "text") e.textContent = v;
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? "" : v);
    }
    (kids || []).forEach(function (c) { if (c == null || c === false) return; e.appendChild(typeof c === "object" ? c : document.createTextNode(String(c))); });
    return e;
  }
  function clear(e) { while (e.firstChild) e.removeChild(e.firstChild); return e; }
  var TZ = "Europe/London";
  function fDate(d) { return new Date(d.length === 10 ? d + "T12:00:00" : d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: d.length === 10 ? undefined : TZ }); }
  function fDateTime(d) { return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ }); }
  function ago(d) { var s = (Date.now() - new Date(d).getTime()) / 1000; if (s < 90) return "just now"; if (s < 3600) return Math.round(s / 60) + " min ago"; if (s < 86400) return Math.round(s / 3600) + " h ago"; return Math.round(s / 86400) + " d ago"; }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function pretty(k) { return k.replace(/_/g, " ").replace(/^./, function (c) { return c.toUpperCase(); }); }
  function val(v) { return Array.isArray(v) ? v.join(", ") : (v && typeof v === "object") ? JSON.stringify(v) : String(v); }
  function initials(n) { var p = String(n || "").trim().split(/\s+/); return ((p[0] || "?")[0] + (p[1] ? p[1][0] : "")).toUpperCase(); }
  function can(roles) { return me && roles.indexOf(me.role) > -1; }
  function toast(msg, bad) { var t = $("toast"); t.textContent = msg; t.className = "toast on" + (bad ? " bad" : ""); clearTimeout(toast.t); toast.t = setTimeout(function () { t.className = "toast"; }, 3800); }
  async function rpc(name, args) {
    var r = await sb.rpc(name, args || {});
    if (r.error) { var e = new Error(/Not allowed/.test(r.error.message) ? "You do not have access to this." : r.error.message); e.code = r.error.code; throw e; }
    return r.data;
  }
  async function fn(name, body) {
    var s = (await sb.auth.getSession()).data.session;
    var r = await fetch(CFG.SUPABASE_URL + "/functions/v1/" + name, { method: "POST", headers: { "Content-Type": "application/json", apikey: CFG.SUPABASE_ANON_KEY, Authorization: "Bearer " + s.access_token }, body: JSON.stringify(body) });
    var j = await r.json().catch(function () { return {}; });
    return { ok: r.ok && j.ok, j: j };
  }
  function chip(text, cls) { return h("span", { class: "chip " + (cls || ""), text: text }); }
  function kpi(label, value, sub, alert) { return h("div", { class: "card kpi" + (alert ? " alert" : "") }, [h("div", { class: "lab", text: label }), h("div", { class: "val num", text: value }), sub ? h("div", { class: "dlt", text: sub }) : null]); }
  function card(title, sub, body, cls) { return h("section", { class: "card " + (cls || "") }, [h("div", { class: "hd" }, [h("h3", { text: title }), sub ? h("span", { class: "sub", text: sub }) : null]), h("div", { class: "bd" }, body)]); }
  function pageHead(title, lead, acts) { return h("div", { class: "ph" }, [h("div", null, [h("h1", { text: title }), lead ? h("p", { text: lead }) : null]), acts ? h("div", { class: "acts" }, acts) : null]); }
  function empty(msg) { return h("div", { class: "empty", text: msg }); }
  function fill(booked, cap) { var p = cap ? Math.min(100, Math.round(booked / cap * 100)) : 0; return h("div", { class: "bar " + (p >= 100 ? "warn" : p >= 70 ? "" : "ok"), title: booked + " of " + cap }, [h("i", { style: "width:" + p + "%" })]); }
  function errBox(e) { return h("div", { class: "banner bad" }, [h("div", null, [h("b", { text: "Could not load this page. " }), document.createTextNode(e.message || "Please try again.")])]); }

  /* ---------- sign in ---------- */
  function showGate(which) {
    $("shell").hidden = true; $("gate").hidden = false;
    $("loginForm").hidden = which !== "login"; $("denied").hidden = which !== "denied";
  }
  $("loginForm").addEventListener("submit", async function (ev) {
    ev.preventDefault();
    var msg = $("lMsg"); msg.hidden = true; $("lGo").disabled = true;
    var r = await sb.auth.signInWithPassword({ email: $("lEmail").value.trim(), password: $("lPass").value });
    $("lGo").disabled = false;
    if (r.error) { msg.textContent = "Email or password not right."; msg.hidden = false; return; }
    $("lPass").value = ""; start();
  });
  async function signOut() { await sb.auth.signOut(); me = null; showGate("login"); }
  $("signOut").addEventListener("click", signOut); $("deniedOut").addEventListener("click", signOut);

  /* ---------- shell and routing ---------- */
  var ROUTES = [
    { id: "dashboard", label: "Dashboard", roles: ["admin", "manager", "reception", "coach"], icon: "▦", view: vDashboard },
    { id: "schedule", label: "Schedule", roles: ["admin", "manager", "reception", "coach"], icon: "◷", view: vSchedule },
    { id: "members", label: "Members", roles: ["admin", "manager", "reception"], icon: "☺", view: vMembers, section: "People" },
    { id: "enquiries", label: "Enquiries", roles: ["admin", "manager", "reception"], icon: "✉", view: vEnquiries },
    { id: "emails", label: "Emails", roles: ["admin", "manager"], icon: "→", view: vEmails, section: "Communication" },
    { id: "marketing", label: "Marketing", roles: ["admin", "manager"], icon: "★", view: vMarketing },
    { id: "plans", label: "Plans and payments", roles: ["admin", "manager"], icon: "£", view: vPlans, section: "Business" },
    { id: "settings", label: "Team and settings", roles: ["admin"], icon: "⚙", view: vSettings }
  ];
  function buildNav() {
    var nav = clear($("nav")), sec = null;
    ROUTES.forEach(function (r) {
      if (!can(r.roles)) return;
      if (r.section && r.section !== sec) { sec = r.section; nav.appendChild(h("h6", { text: sec })); }
      nav.appendChild(h("a", { href: "#/" + r.id, "data-r": r.id }, [h("span", { class: "ico", text: r.icon }), r.label]));
    });
  }
  function route() {
    var id = (location.hash.replace(/^#\/?/, "") || "dashboard").split("?")[0];
    var r = ROUTES.filter(function (x) { return x.id === id && can(x.roles); })[0] || ROUTES[0];
    current = r;
    document.querySelectorAll("#nav a").forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-r") === r.id); });
    $("crumb").textContent = r.label;
    closeSide(); closeDrawer();
    var seq = ++loadSeq, page = clear($("page")); page.appendChild(h("div", { class: "empty", text: "Loading..." }));
    Promise.resolve().then(function () { return r.view(); }).then(function (node) { if (seq !== loadSeq) return; clear(page).appendChild(node); page.focus({ preventScroll: true }); window.scrollTo(0, 0); })
      .catch(function (e) { if (seq !== loadSeq) return; clear(page).appendChild(errBox(e)); });
  }
  function openSide() { $("side").classList.add("on"); $("scrim").classList.add("on"); }
  function closeSide() { $("side").classList.remove("on"); if (!$("drawer").classList.contains("on")) $("scrim").classList.remove("on"); }
  function openDrawer(title, body, foot) {
    var d = clear($("drawer"));
    d.appendChild(h("div", { class: "dh2" }, [h("h2", { text: title }), h("button", { class: "ibtn", "aria-label": "Close", onclick: closeDrawer, text: "×" })]));
    d.appendChild(h("div", { class: "db" }, body)); if (foot) d.appendChild(h("div", { class: "df" }, foot));
    d.classList.add("on"); d.setAttribute("aria-hidden", "false"); $("scrim").classList.add("on");
  }
  function closeDrawer() { $("drawer").classList.remove("on"); $("drawer").setAttribute("aria-hidden", "true"); if (!$("side").classList.contains("on")) $("scrim").classList.remove("on"); }
  function openModal(title, body, buttons) {
    var m = clear($("modal")); m.appendChild(h("h3", { text: title })); body.forEach(function (b) { m.appendChild(b); });
    m.appendChild(h("div", { class: "row" }, buttons)); m.classList.add("on"); $("scrim").classList.add("on");
  }
  function closeModal() { $("modal").classList.remove("on"); if (!$("drawer").classList.contains("on") && !$("side").classList.contains("on")) $("scrim").classList.remove("on"); }
  $("scrim").addEventListener("click", function () { closeSide(); closeDrawer(); closeModal(); });
  $("burger").addEventListener("click", openSide);
  $("refresh").addEventListener("click", route);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeSide(); closeDrawer(); closeModal(); } });
  window.addEventListener("hashchange", route);
  function tick() { $("clock").textContent = new Date().toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ }); }

  async function start() {
    var s = (await sb.auth.getSession()).data.session;
    if (!s) return showGate("login");
    try { me = await rpc("admin_whoami"); } catch (e) { me = { role: null }; }
    if (!me || !me.role) return showGate("denied");
    $("gate").hidden = true; $("shell").hidden = false;
    $("meName").textContent = me.name || me.email || "Staff"; $("meRole").textContent = ROLE_LABEL[me.role] || me.role; $("meAv").textContent = initials(me.name || me.email);
    buildNav(); tick(); if (!start.t) start.t = setInterval(tick, 30000);
    route();
  }

  /* ---------- dashboard ---------- */
  async function vDashboard() {
    var d = await rpc("admin_dashboard"), root = h("div");
    var greet = new Date().toLocaleString("en-GB", { hour: "numeric", hour12: false, timeZone: TZ }) * 1;
    var first = (me.name || "").split(" ")[0];
    root.appendChild(pageHead((greet < 12 ? "Good morning" : greet < 18 ? "Good afternoon" : "Good evening") + (first ? ", " + first : ""), "Here is how MY GYM London looks right now."));
    var k = [];
    if (d.members_total != null) { k.push(kpi("Members with an app account", d.members_total, d.members_7d + " new this week, " + d.members_30d + " in 30 days")); }
    k.push(kpi("Bookings in the next 7 days", d.upcoming_7d, "classes and gym slots"));
    if (d.enquiries_open != null) k.push(kpi("Open enquiries", d.enquiries_open, d.enquiries_new + " new, waiting for a reply", d.enquiries_new > 0));
    if (d.subscribers != null) k.push(kpi("News and offers subscribers", d.subscribers, d.subscribers_pending + " waiting to confirm"));
    root.appendChild(h("div", { class: "grid g4" }, k));
    var classes = (d.today_classes || []).filter(function (c) { return c.kind !== "gym"; });
    var gym = (d.today_classes || []).filter(function (c) { return c.kind === "gym"; });
    var gymBooked = gym.reduce(function (a, c) { return a + c.booked; }, 0);
    var list = h("div", { class: "list" });
    if (!classes.length) list.appendChild(empty("No classes today."));
    classes.forEach(function (c) {
      var full = c.capacity && c.booked >= c.capacity;
      list.appendChild(h("div", { class: "li" }, [h("div", { class: "time num", text: String(c.start).slice(0, 5) }), h("div", { class: "tx" }, [h("b", { text: c.name }), h("small", { text: c.coach ? "Coach " + c.coach : "No coach set" })]),
        h("div", { style: "width:110px" }, [fill(c.booked, c.capacity)]), h("span", { class: "num", text: c.booked + "/" + c.capacity }), h("span", { class: "hide-s" }, [full ? chip("Full", "warn") : c.booked ? chip("Booked", "ok") : chip("Open", "plain")])]));
    });
    var top = h("div", { class: "g-main grid", style: "margin-top:16px" });
    top.appendChild(card("Today's classes", fDate(d.today), [list, gym.length ? h("p", { class: "muted", text: "Gym floor: " + gymBooked + " booking" + (gymBooked === 1 ? "" : "s") + " across " + gym.length + " hourly slots today." }) : null]));
    var side = h("div", { class: "grid", style: "align-content:start" });
    var topc = h("div", { class: "list" }); (d.top_classes_30d || []).forEach(function (t, i, a) { topc.appendChild(h("div", { class: "li" }, [h("div", { class: "tx" }, [h("b", { text: t.name })]), h("div", { style: "width:90px" }, [h("div", { class: "bar" }, [h("i", { style: "width:" + Math.round(t.n / a[0].n * 100) + "%" })])]), h("span", { class: "num", text: t.n })])); });
    if (!(d.top_classes_30d || []).length) topc.appendChild(empty("No class bookings in the last 30 days yet."));
    side.appendChild(card("Most booked classes", "last 30 days", [topc]));
    if (d.latest_enquiries) {
      var le = h("div", { class: "list" }); d.latest_enquiries.forEach(function (e) { le.appendChild(h("a", { class: "li", href: "#/enquiries" }, [h("div", { class: "tx" }, [h("b", { text: e.name || "(no name)" }), h("small", { text: (FORMS[e.form_id] || e.form_id) + " · " + ago(e.at) })]), chip(STATUS[e.status] || e.status, e.status === "new" ? "bad" : "info")])); });
      if (!d.latest_enquiries.length) le.appendChild(empty("No open enquiries. Nice."));
      side.appendChild(card("Latest enquiries", "", [le]));
    }
    top.appendChild(side); root.appendChild(top);
    root.appendChild(card("Bookings per day", "last 14 days and the next 6", [barChart(d.bookings_by_day || [], d.today)], ""));
    root.lastChild.style.marginTop = "16px";
    if (d.emails_7d_sent != null) {
      root.appendChild(h("div", { class: "grid g3", style: "margin-top:16px" }, [kpi("Emails sent (7 days)", d.emails_7d_sent, "confirmations, reminders, replies"), kpi("Emails that failed", d.emails_7d_failed, d.emails_7d_failed ? "check the Emails page" : "all delivered", d.emails_7d_failed > 0), kpi("Today", fDate(d.today), "UK time")]));
    }
    return root;
  }
  function barChart(rows, today) {
    var max = Math.max.apply(null, rows.map(function (r) { return r.n; }).concat([1])), w = 100 / Math.max(rows.length, 1);
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("viewBox", "0 0 100 40"); svg.setAttribute("preserveAspectRatio", "none"); svg.setAttribute("class", "bars");
    rows.forEach(function (r, i) {
      var hh = r.n / max * 34, rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", i * w + w * 0.14); rect.setAttribute("width", w * 0.72); rect.setAttribute("y", 36 - hh); rect.setAttribute("height", Math.max(hh, 0.4)); rect.setAttribute("rx", 0.6);
      rect.setAttribute("fill", r.d === today ? "#e03939" : r.d > today ? "#f0b4b4" : "#cfcdd1");
      var t = document.createElementNS("http://www.w3.org/2000/svg", "title"); t.textContent = fDate(r.d) + ": " + r.n; rect.appendChild(t); svg.appendChild(rect);
    });
    var lab = h("div", { class: "barlab" }, [h("span", { text: rows.length ? fDate(rows[0].d) : "" }), h("span", { text: "today is red" }), h("span", { text: rows.length ? fDate(rows[rows.length - 1].d) : "" })]);
    return h("div", null, [svg, lab]);
  }

  /* ---------- schedule ---------- */
  var schedDate = new Date();
  async function vSchedule() {
    var ds = iso(schedDate), data = await rpc("admin_day", { p_date: ds }), root = h("div");
    var nav = [h("button", { class: "btn sm", onclick: function () { schedDate.setDate(schedDate.getDate() - 1); route(); }, text: "‹ Previous" }),
      h("input", { class: "in", type: "date", value: ds, "aria-label": "Date", onchange: function (e) { if (e.target.value) { schedDate = new Date(e.target.value + "T12:00:00"); route(); } } }),
      h("button", { class: "btn sm", onclick: function () { schedDate.setDate(schedDate.getDate() + 1); route(); }, text: "Next ›" }),
      h("button", { class: "btn sm", onclick: function () { schedDate = new Date(); route(); }, text: "Today" })];
    root.appendChild(pageHead("Schedule", fDate(ds) + ": who is booked into each session.", nav));
    var classes = data.filter(function (c) { return c.kind !== "gym"; }), gym = data.filter(function (c) { return c.kind === "gym"; });
    var wrap = h("div", { class: "grid", style: "gap:12px" });
    if (!classes.length) wrap.appendChild(card("Classes", "", [empty("No classes on this day.")]));
    classes.forEach(function (c) { wrap.appendChild(sessionCard(c, ds)); });
    root.appendChild(wrap);
    var gb = gym.reduce(function (a, c) { return a + c.booked; }, 0);
    var g = h("div", { class: "tbl-wrap" }, [h("table", { class: "t" }, [h("thead", null, [h("tr", null, ["Hour", "Booked", "Capacity", "Who"].map(function (x) { return h("th", { text: x }); }))]),
      h("tbody", null, gym.map(function (c) { return h("tr", { style: "cursor:default" }, [h("td", { class: "num", text: String(c.start).slice(0, 5) }), h("td", { class: "num", text: c.booked }), h("td", { class: "num", text: c.capacity }), h("td", { text: c.people.map(function (p) { return p.name; }).join(", ") || "-" })]); }))])]);
    root.appendChild(h("div", { style: "margin-top:16px" }, [card("Gym floor slots", gb + " booked", [gym.length ? g : empty("No gym slots on this day.")])]));
    return root;
  }
  function sessionCard(c, ds) {
    var head = h("div", { class: "li" }, [h("div", { class: "time num", text: String(c.start).slice(0, 5) }), h("div", { class: "tx" }, [h("b", { text: c.name }), h("small", { text: (c.coach ? "Coach " + c.coach : "No coach set") + (c.other_wix ? " · " + c.other_wix + " booked on the website only" : "") })]),
      h("div", { style: "width:120px" }, [fill(c.booked, c.capacity)]), h("span", { class: "num", text: c.booked + "/" + c.capacity }),
      can(["admin"]) ? h("button", { class: "btn sm dng", onclick: function () { cancelClass(c, ds); }, text: "Class cancelled" }) : null]);
    var people = c.people.length ? h("div", { class: "people" }, c.people.map(function (p) { return h("span", { class: "chip " + (p.source === "wix" ? "info" : "plain"), text: p.name }); })) : h("small", { class: "muted", text: "Nobody booked through the app yet." });
    return h("section", { class: "card" }, [h("div", { class: "bd" }, [head, people])]);
  }
  function cancelClass(c, ds) {
    var reason = h("input", { class: "in", id: "cReason", maxlength: "200", placeholder: "Optional, shown in the email (for example: our coach is unwell)" });
    var out = h("div", { class: "msg", hidden: true });
    var send = h("button", { class: "btn pri", disabled: true, text: "Email them" }), check = h("button", { class: "btn", text: "Check who is booked" });
    var checked = null;
    function call(action) { return fn("admin-class-cancelled", { action: action, class_id: c.id, date: ds, reason: reason.value }); }
    check.addEventListener("click", async function () {
      check.disabled = true; out.hidden = false; out.className = "msg"; out.textContent = "Checking...";
      var r = await call("preview"); check.disabled = false;
      if (!r.ok) { out.className = "msg bad"; out.textContent = r.j.error || "Something went wrong."; return; }
      if (!r.j.count) { out.textContent = "Nobody is booked, so there is nobody to email."; return; }
      checked = r.j; send.disabled = false; out.textContent = r.j.count + " booked (" + r.j.first_names.join(", ") + "). Press Email them to tell them the class is cancelled. Then cancel the session in Wix.";
    });
    send.addEventListener("click", async function () {
      if (!checked) return; send.disabled = true; check.disabled = true; out.className = "msg"; out.textContent = "Sending...";
      var r = await call("send"); check.disabled = false;
      if (!r.ok) { out.className = "msg bad"; out.textContent = r.j.error || "Something went wrong."; return; }
      out.className = "msg " + (r.j.failed ? "bad" : "ok"); out.textContent = "Sent " + r.j.sent + " of " + r.j.count + (r.j.failed ? ". " + r.j.failed + " failed: press Check, then Email them again." : ".");
    });
    openModal("Class cancelled", [h("p", { text: c.name + ", " + fDate(ds) + " at " + String(c.start).slice(0, 5) + ". This emails everyone booked through the app." }), h("div", { class: "field", style: "margin-top:12px" }, [h("label", { text: "Reason" }), reason]), out],
      [h("button", { class: "btn", onclick: closeModal, text: "Close" }), check, send]);
  }

  /* ---------- members ---------- */
  var memberQ = "";
  async function vMembers() {
    var rows = await rpc("admin_members", { p_q: memberQ, p_limit: 300 }), root = h("div");
    root.appendChild(pageHead("Members", "Everyone with an app account. Click a person for details."));
    var search = h("input", { class: "in", type: "search", placeholder: "Search name, email or phone", value: memberQ, "aria-label": "Search members" });
    var t;
    search.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { memberQ = search.value; route(); }, 350); });
    var body = h("tbody");
    rows.forEach(function (m) {
      var tr = h("tr", { onclick: function () { memberDrawer(m); } }, [
        h("td", null, [h("div", { class: "who" }, [h("span", { class: "av s", text: initials(m.name || m.email) }), h("div", null, [h("b", { text: m.name || "(no name)" }), h("small", { class: "block muted", text: m.email })])])]),
        h("td", { text: m.phone || "-" }), h("td", { class: "num", text: fDate(m.joined) }), h("td", { class: "num r", text: m.bookings }), h("td", { class: "num", text: m.last_booking ? fDate(m.last_booking) : "-" }),
        h("td", null, [m.staff_role || m.is_admin ? chip(ROLE_LABEL[m.is_admin ? "admin" : m.staff_role], "info") : m.gym_access ? chip("Gym access", "ok") : chip("No gym plan", "plain")]),
        h("td", null, [m.marketing === "subscribed" ? chip("Subscribed", "ok") : m.marketing === "withdrawn" ? chip("Unsubscribed", "warn") : chip("No", "plain")]),
        h("td", null, [m.health_form ? chip("Done", "ok") : chip("Missing", "warn")])]);
      body.appendChild(tr);
    });
    var tbl = h("div", { class: "tbl-wrap" }, [h("table", { class: "t" }, [h("thead", null, [h("tr", null, [["Member"], ["Phone"], ["Joined"], ["Bookings", "r"], ["Last booking"], ["Access"], ["News and offers"], ["Health form"]].map(function (x) { return h("th", { class: x[1] || "", text: x[0] }); }))]), body])]);
    root.appendChild(h("section", { class: "card" }, [h("div", { class: "toolbar" }, [search, h("span", { class: "muted", text: rows.length + " shown" })]), rows.length ? tbl : empty(memberQ ? "Nobody matches that search." : "No members yet.")]));
    return root;
  }
  async function memberDrawer(m) {
    var bk = h("div", { class: "list" }, [h("div", { class: "muted", text: "Loading bookings..." })]);
    var kv = h("dl", { class: "kv" }); [["Email", m.email], ["Phone", m.phone || "-"], ["Joined", fDate(m.joined)], ["Bookings so far", m.bookings], ["Gym access", m.gym_access ? "Yes" : "No"], ["News and offers", m.marketing === "subscribed" ? "Subscribed" : m.marketing === "withdrawn" ? "Unsubscribed" : "No"], ["Health form", m.health_form ? "Completed" : "Not completed"]]
      .forEach(function (p) { kv.appendChild(h("dt", { text: p[0] })); kv.appendChild(h("dd", { text: p[1] })); });
    var foot = [];
    if (can(["admin", "manager"])) foot.push(h("button", { class: "btn", onclick: function () { showHealth(m); }, text: "View health form (logged)" }));
    foot.push(h("a", { class: "btn pri", href: "mailto:" + m.email, text: "Email" }));
    openDrawer(m.name || m.email, [h("div", { class: "sect" }, [kv]), h("div", { class: "sect" }, [h("h4", { text: "Recent bookings" }), bk])], foot);
    try {
      var rows = await rpc("admin_member_bookings", { p_user: m.id }); clear(bk);
      if (!rows.length) bk.appendChild(h("div", { class: "muted", text: "No bookings yet." }));
      rows.forEach(function (b) { bk.appendChild(h("div", { class: "li" }, [h("div", { class: "tx" }, [h("b", { text: b.name }), h("small", { text: fDate(b.date) + " at " + String(b.time).slice(0, 5) })]), b.source === "wix" ? chip("Website", "info") : chip("App", "plain")])); });
    } catch (e) { clear(bk).appendChild(h("div", { class: "muted", text: e.message })); }
  }
  async function showHealth(m) {
    var body = [h("div", { class: "muted", text: "Loading..." })];
    openModal("Health form: " + (m.name || m.email), body, [h("button", { class: "btn", onclick: closeModal, text: "Close" })]);
    try {
      var d = await rpc("admin_member_health", { p_user: m.id }), box = $("modal").children[1];
      var out = [];
      if (!d.found) out.push(h("p", { text: "This member has not completed a health form." }));
      else {
        var kv = h("dl", { class: "kv" }), add = function (k, v) { kv.appendChild(h("dt", { text: k })); kv.appendChild(h("dd", { text: v })); };
        add("Consent given", d.consent_health ? "Yes, " + (d.consented_at ? fDate(d.consented_at) : "") : "No");
        add("Allergies", d.no_allergies ? "None" : (d.allergies || "-")); if (d.other_details) add("Other details", d.other_details);
        Object.keys(d.answers || {}).forEach(function (k) { add(pretty(k), val(d.answers[k])); });
        add("Last updated", d.updated_at ? fDate(d.updated_at) : "-");
        out.push(kv);
      }
      out.push(h("small", { class: "muted", text: "Special category data. Viewing is recorded. Use it only to keep the member safe." }));
      box.replaceWith(h("div", { style: "max-height:55vh;overflow:auto" }, out));
    } catch (e) { $("modal").children[1].textContent = e.message; }
  }

  /* ---------- enquiries ---------- */
  var enqFilter = "open";
  async function vEnquiries() {
    var rows = await rpc("admin_enquiries", { p_status: enqFilter }), root = h("div");
    var filters = [["open", "Open"], ["new", "New"], ["joined", "Joined"], ["not_now", "Not now"], ["spam", "Spam"], ["all", "Everything"]];
    root.appendChild(pageHead("Enquiries", "Every website form. Marking an enquiry Joined, Not now or Spam stops the follow-up emails to that person.",
      [h("div", { class: "seg" }, filters.map(function (f) { return h("button", { class: enqFilter === f[0] ? "on" : "", onclick: function () { enqFilter = f[0]; route(); }, text: f[1] }); }))]));
    if (!rows.length) { root.appendChild(card("Nothing here", "", [empty("No enquiries in this view.")])); return root; }
    var wrap = h("div", { class: "grid", style: "gap:12px" });
    rows.forEach(function (r) { wrap.appendChild(enquiryCard(r)); });
    root.appendChild(wrap); return root;
  }
  function enquiryCard(r) {
    var d = r.data || {}, name = d.full_name || d.parent_name || d.first_name || d.friend_name || d.email || "(no name)", email = d.email || d.friend_email, phone = d.phone;
    var dl = h("dl", { class: "kv" });
    Object.keys(d).forEach(function (k) { if (HIDE[k] || k === "email" || k === "phone" || k === "full_name" || d[k] === "" || d[k] == null) return; dl.appendChild(h("dt", { text: pretty(k) })); dl.appendChild(h("dd", { text: val(d[k]) })); });
    var note = h("textarea", { class: "in", maxlength: "500", placeholder: "Private note (staff only)", "aria-label": "Note for " + name }); note.value = r.note || "";
    var btns = h("div", { class: "btns" });
    function save(status, b) {
      var all = btns.querySelectorAll("button"); all.forEach(function (x) { x.disabled = true; });
      rpc("admin_set_enquiry", { p_id: r.id, p_status: status, p_note: note.value }).then(function () { toast("Saved"); route(); }).catch(function (e) { all.forEach(function (x) { x.disabled = false; }); toast(e.message, true); });
    }
    ["contacted", "trial", "joined", "not_now", "spam"].forEach(function (s) { btns.appendChild(h("button", { class: "btn sm" + (r.status === s ? " pri" : ""), onclick: function (ev) { save(s, ev.target); }, text: STATUS[s] })); });
    btns.appendChild(h("button", { class: "btn sm ghost", onclick: function (ev) { save(null, ev.target); }, text: "Save note" }));
    var links = []; if (email) links.push(h("a", { href: "mailto:" + email, text: email })); if (email && phone) links.push(document.createTextNode("  ·  ")); if (phone) links.push(h("a", { href: "tel:" + String(phone).replace(/[^+\d]/g, ""), text: phone }));
    return h("section", { class: "card" + (r.status === "new" ? " newq" : "") }, [h("div", { class: "bd" }, [
      h("div", { class: "head" }, [h("b", { text: name }), h("span", { class: "muted", text: (FORMS[r.form_id] || r.form_id) + " · " + fDateTime(r.created_at) }), chip(STATUS[r.status] || r.status, r.status === "new" ? "bad" : r.status === "joined" ? "ok" : "plain")]),
      h("div", { class: "contact" }, links), dl, note, btns])]);
  }

  /* ---------- emails ---------- */
  async function vEmails() {
    var d = await rpc("admin_emails", { p_limit: 150 }), root = h("div");
    root.appendChild(pageHead("Emails", "Every automatic email the system has sent, and whether it was delivered."));
    var sent = 0, failed = 0; d.by_template_30d.forEach(function (t) { sent += t.sent; failed += t.failed; });
    root.appendChild(h("div", { class: "grid g3" }, [kpi("Sent in 30 days", sent), kpi("Failed in 30 days", failed, failed ? "see the list below" : "all delivered", failed > 0), kpi("Types of email used", d.by_template_30d.length)]));
    var byT = h("div", { class: "tbl-wrap" }, [h("table", { class: "t", style: "min-width:0" }, [h("thead", null, [h("tr", null, [h("th", { text: "Email" }), h("th", { class: "r", text: "Sent" }), h("th", { class: "r", text: "Failed" })])]),
      h("tbody", null, d.by_template_30d.map(function (t) { return h("tr", { style: "cursor:default" }, [h("td", { text: t.template }), h("td", { class: "num r", text: t.sent }), h("td", { class: "num r", text: t.failed })]); }))])]);
    var log = h("div", { class: "tbl-wrap" }, [h("table", { class: "t" }, [h("thead", null, [h("tr", null, ["When", "Email", "To", "Result"].map(function (x) { return h("th", { text: x }); }))]),
      h("tbody", null, d.recent.map(function (e) { return h("tr", { style: "cursor:default" }, [h("td", { class: "num", text: fDateTime(e.at) }), h("td", { text: e.template }), h("td", { text: e.to || "" }), h("td", null, [e.status === "sent" ? chip("Sent", "ok") : chip(e.status, "bad"), e.status !== "sent" && e.detail ? h("small", { class: "block muted", text: e.detail }) : null])]); }))])]);
    root.appendChild(h("div", { class: "grid g2", style: "margin-top:16px;align-items:start" }, [card("Last 30 days by email", "", [d.by_template_30d.length ? byT : empty("Nothing sent yet.")]), card("Latest sends", "most recent first", [d.recent.length ? log : empty("Nothing sent yet.")])]));
    return root;
  }

  /* ---------- marketing ---------- */
  async function vMarketing() {
    var d = await rpc("admin_marketing"), root = h("div");
    root.appendChild(pageHead("Marketing", "People who agreed to hear from you by email. Only confirmed subscribers ever receive news and offers.",
      [h("a", { class: "btn pri", href: "https://app.mygymlondon.co.uk/admin-campaign.html", target: "_blank", rel: "noopener", text: "Write and send a campaign" })]));
    root.appendChild(h("div", { class: "grid g3" }, [kpi("Confirmed subscribers", d.confirmed, "can receive campaigns"), kpi("Waiting to confirm", d.pending, "they have not clicked the email yet"), kpi("Unsubscribed", d.withdrawn)]));
    var src = h("div", { class: "list" }); d.by_source.forEach(function (s) { src.appendChild(h("div", { class: "li" }, [h("div", { class: "tx" }, [h("b", { text: s.source })]), h("span", { class: "num", text: s.n })])); });
    if (!d.by_source.length) src.appendChild(empty("No subscribers yet."));
    var rec = h("div", { class: "tbl-wrap" }, [h("table", { class: "t" }, [h("thead", null, [h("tr", null, ["Email", "Where", "Asked", "Status"].map(function (x) { return h("th", { text: x }); }))]),
      h("tbody", null, d.recent.map(function (m) { return h("tr", { style: "cursor:default" }, [h("td", { text: m.email }), h("td", { text: m.source }), h("td", { class: "num", text: fDate(m.requested_at) }), h("td", null, [m.withdrawn_at ? chip("Unsubscribed", "warn") : m.confirmed_at ? chip("Confirmed", "ok") : chip("Waiting", "plain")])]); }))])]);
    root.appendChild(h("div", { class: "grid g2", style: "margin-top:16px;align-items:start" }, [card("Where subscribers came from", "", [src]), card("Latest sign-ups", "", [d.recent.length ? rec : empty("Nobody has signed up yet.")])]));
    return root;
  }

  /* ---------- plans and payments (Wix) ---------- */
  function vPlans() {
    var root = h("div");
    root.appendChild(pageHead("Plans and payments", "Memberships, payments and receipts."));
    root.appendChild(h("div", { class: "soon" }, [h("h3", { text: "Not connected yet" }), h("p", { text: "Plans, payments and invoices are still handled in Wix (checkout at join.mygymlondon.co.uk). Until they move to this system, this page cannot show real figures, and it will not show made-up ones." }),
      h("p", { text: "For now, open Wix to see plans, payments and failed payments:" }), h("p", null, [h("a", { class: "btn", href: "https://manage.wix.com/", target: "_blank", rel: "noopener", text: "Open Wix dashboard" })])]));
    root.appendChild(h("div", { class: "grid g3", style: "margin-top:16px" }, [card("Will show here", "", [h("ul", { class: "ticks" }, ["Active members by plan", "Monthly recurring revenue", "Failed and retried payments"].map(function (x) { return h("li", { text: x }); }))]),
      card("Why it matters", "", [h("p", { class: "muted", text: "Failed payments trigger the 3 reminder emails and the pause after 21 days. Those emails are built and wait for payment data." })]),
      card("Planned for", "", [h("p", { class: "muted", text: "After launch, when payments and member records move off Wix." })])]));
    return root;
  }

  /* ---------- team and settings (admin) ---------- */
  async function vSettings() {
    var staff = await rpc("admin_staff_list"), audit = await rpc("admin_audit", { p_limit: 60 }), root = h("div");
    root.appendChild(pageHead("Team and settings", "Who can sign in to this back office, and what they can see."));
    var email = h("input", { class: "in", type: "email", placeholder: "Their app account email", "aria-label": "Staff email" });
    var role = h("select", { class: "in sel", "aria-label": "Role" }, [["manager", "Manager"], ["reception", "Reception"], ["coach", "Coach"]].map(function (o) { return h("option", { value: o[0], text: o[1] }); }));
    var add = h("button", { class: "btn pri", text: "Add to team", onclick: function () {
      if (!email.value.trim()) return;
      rpc("admin_staff_set", { p_email: email.value, p_role: role.value }).then(function () { toast("Added"); route(); }).catch(function (e) { toast(e.message, true); });
    } });
    var rows = h("tbody", null, staff.map(function (s) { return h("tr", { style: "cursor:default" }, [h("td", null, [h("b", { text: s.name || s.email }), h("small", { class: "block muted", text: s.email })]), h("td", null, [chip(ROLE_LABEL[s.role] || s.role, s.role === "admin" ? "info" : "plain")]), h("td", { class: "num", text: fDate(s.since) }),
      h("td", { class: "r" }, [s.role === "admin" ? null : h("button", { class: "btn sm dng", text: "Remove", onclick: function () { if (window.confirm("Remove " + s.email + " from the team?")) rpc("admin_staff_remove", { p_user: s.user_id }).then(function () { toast("Removed"); route(); }).catch(function (e) { toast(e.message, true); }); } })])]); }));
    var tbl = h("div", { class: "tbl-wrap" }, [h("table", { class: "t", style: "min-width:0" }, [h("thead", null, [h("tr", null, [h("th", { text: "Person" }), h("th", { text: "Role" }), h("th", { text: "Since" }), h("th")])]), rows])]);
    root.appendChild(card("Team", staff.length + " with access", [tbl, h("div", { class: "toolbar", style: "padding:14px 0 0;border:0" }, [email, role, add]), h("p", { class: "muted", style: "margin-top:10px", text: "The person must already have an app account (they sign up in the member app). Owner = full access." })]));
    var perms = [["Dashboard, schedule", "Owner, Manager, Reception, Coach"], ["Members and enquiries", "Owner, Manager, Reception"], ["Health forms (every view is logged)", "Owner, Manager (coach access comes later)"], ["Emails, marketing, plans", "Owner, Manager"], ["Team and settings, cancel a class", "Owner only"]];
    root.appendChild(h("div", { style: "margin-top:16px" }, [card("What each role can see", "", [h("div", { class: "tbl-wrap" }, [h("table", { class: "t", style: "min-width:0" }, [h("tbody", null, perms.map(function (p) { return h("tr", { style: "cursor:default" }, [h("td", { text: p[0] }), h("td", { class: "muted", text: p[1] })]); }))])])])]));
    var log = h("div", { class: "tbl-wrap" }, [h("table", { class: "t" }, [h("thead", null, [h("tr", null, ["When", "Who", "Did", "Target"].map(function (x) { return h("th", { text: x }); }))]), h("tbody", null, audit.map(function (a) { return h("tr", { style: "cursor:default" }, [h("td", { class: "num", text: fDateTime(a.at) }), h("td", { text: a.who || "" }), h("td", { text: a.action.replace(/_/g, " ") }), h("td", { class: "muted", text: (a.target || "").slice(0, 40) })]); }))])]);
    root.appendChild(h("div", { style: "margin-top:16px" }, [card("Access log", "health form views and team changes", [audit.length ? log : empty("Nothing recorded yet.")])]));
    return root;
  }

  /* ---------- go ---------- */
  sb.auth.onAuthStateChange(function (ev) { if (ev === "SIGNED_OUT") { me = null; showGate("login"); } });
  start().catch(function () { showGate("login"); });
})();
