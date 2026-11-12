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
  var HIDE = { answers: 1, form_title: 1, utm_source: 1, utm_medium: 1, utm_campaign: 1, page_url: 1 };

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
  async function fn(name, body, seconds) {
    // never leaves the page waiting for ever: a failed network call, a missing sign-in or a slow reply all come back as a readable error
    var ctl = new AbortController(), timer = setTimeout(function () { ctl.abort(); }, (seconds || 60) * 1000);
    try {
      var got = await Promise.race([sb.auth.getSession(), new Promise(function (res) { setTimeout(function () { res(null); }, 10000); })]);
      var s = got && got.data && got.data.session;
      if (!s) return { ok: false, j: { error: "Your sign-in could not be checked. Reload the page and sign in again." } };
      var r = await fetch(CFG.SUPABASE_URL + "/functions/v1/" + name, { method: "POST", signal: ctl.signal, headers: { "Content-Type": "application/json", apikey: CFG.SUPABASE_ANON_KEY, Authorization: "Bearer " + s.access_token }, body: JSON.stringify(body) });
      var j = await r.json().catch(function () { return {}; });
      if (!r.ok && !j.error) j.error = r.status === 401 ? "Your sign-in has expired. Reload the page and sign in again." : "The server answered with error " + r.status + ".";
      return { ok: r.ok && j.ok, j: j };
    } catch (e) {
      return { ok: false, j: { error: e && e.name === "AbortError" ? "No answer from the server after " + (seconds || 60) + " seconds. Nothing was lost; check your connection and try again." : "Could not reach the server (" + (e && e.message || "network error") + ")." } };
    } finally { clearTimeout(timer); }
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
    { id: "dashboard", label: "Dashboard", roles: ["admin", "manager", "reception", "coach"], icon: "▦", view: vDashboard, section: "Overview" },
    { id: "schedule", label: "Schedule", roles: ["admin", "manager", "reception", "coach"], icon: "◷", view: vSchedule, section: "Operations" },
    { id: "timetable", label: "Timetable", roles: ["admin", "manager", "reception", "coach"], icon: "▤", view: vTimetable },
    { id: "members", label: "Members", roles: ["admin", "manager", "reception"], icon: "☺", view: vMembers },
    { id: "daytoday", label: "Day to day", roles: ["admin", "manager", "reception", "coach"], icon: "✓", view: vDayToDay },
    { id: "analytics", label: "Analytics", roles: ["admin", "manager"], icon: "↗", view: vAnalytics, section: "Growth" },
    { id: "marketing", label: "Marketing", roles: ["admin", "manager"], icon: "★", view: vMarketing },
    { id: "plans", label: "Plans and payments", roles: ["admin", "manager"], icon: "£", view: vPlans, section: "Business" },
    { id: "enquiries", label: "Messages", roles: ["admin", "manager", "reception"], icon: "✉", view: vEnquiries },
    { id: "forms", label: "Forms and pages", roles: ["admin", "manager", "reception"], icon: "▣", view: vForms },
    { id: "emails", label: "Emails", roles: ["admin", "manager"], icon: "→", view: vEmails },
    { id: "templates", label: "Email templates", roles: ["admin", "manager"], icon: "✎", view: vTemplates },
    { id: "settings", label: "Settings and health", roles: ["admin", "manager"], icon: "⚙", view: vSettingsHub, section: "System" }
  ];
  function buildNav() {
    var nav = clear($("nav")), sec = null;
    ROUTES.forEach(function (r) {
      if (!can(r.roles)) return;
      if (r.section && r.section !== sec) { sec = r.section; nav.appendChild(h("h6", { text: sec })); }
      nav.appendChild(h("a", { href: "#/" + r.id, "data-r": r.id }, [h("span", { class: "nico", text: r.icon }), r.label]));
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

  /* ---------- dashboard (same design as the 25 October mock-up, real data; Wix-dependent figures are SAMPLE until connected) ---------- */
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fromHtml(str) { var t = document.createElement("template"); t.innerHTML = str.trim(); return t.content.firstChild; }
  var IC = {
    clip: "M9 3h6v3H9zM7 5H5v16h14V5h-2M9 12h6M9 16h4", users: "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-2a4 4 0 0 0-3-3.9M16 2.1a4 4 0 0 1 0 7.8",
    inbox: "M22 12h-6l-2 3h-4l-2-3H2M5.5 5h13L22 12v7H2v-7z", plus: "M12 5v14M5 12h14", alert: "M12 3l10 18H2zM12 10v5M12 18h0", clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
    up: "M7 17L17 7M8 7h9v9", down: "M7 7l10 10M17 8v9H8", dumb: "M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11", pulse: "M22 12h-4l-3 9L9 3l-3 9H2", pound: "M18 7c0-2.2-2-4-4.5-4S9 4.8 9 7v4H6m3 0v6c0 1.7-1 3-3 3h12M6 14h8",
    mail: "M3 5h18v14H3zM3 7l9 7 9-7", cal: "M3 5h18v16H3zM3 10h18M8 3v4M16 3v4", check: "M20 6L9 17l-5-5", card: "M2 6h20v12H2zM2 10h20M6 15h4"
  };
  function icon(n) { return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (IC[n] || "") + '"/></svg>'; }
  function spark(pts, color) {
    if (!pts || pts.length < 2) return "";
    var w = 84, hh = 30, mx = Math.max.apply(null, pts), mn = Math.min.apply(null, pts), r = (mx - mn) || 1;
    var p = pts.map(function (v, i) { return (i / (pts.length - 1)) * w + "," + (hh - 3 - ((v - mn) / r) * (hh - 8)); }).join(" ");
    return '<svg class="spark" width="' + w + '" height="' + hh + '" viewBox="0 0 ' + w + " " + hh + '" aria-hidden="true"><polyline fill="none" stroke="' + color + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" points="' + p + '"/></svg>';
  }
  function sampleTag() { return '<span class="chip warn plain sampletag" title="Placeholder figure until Wix payments are connected">Sample</span>'; }
  function kpiX(lab, ic, val, unit, delta, dir, sp, cls, sample) {
    return '<div class="card kpi ' + (cls || "") + '"><div class="lab">' + icon(ic) + " " + esc(lab) + (sample ? " " + sampleTag() : "") + '</div><div class="val num">' + esc(val) + (unit ? "<small>" + esc(unit) + "</small>" : "") + '</div><div class="dlt ' + (dir || "flat") + '">' + (dir === "up" ? icon("up") : dir === "dn" ? icon("down") : "") + esc(delta) + "</div>" + (sp || "") + "</div>";
  }
  function barChart(rows, today) {
    var W = 640, H = 230, L = 32, B = 28, T = 10, mx = Math.ceil(Math.max.apply(null, rows.map(function (r) { return r.n; }).concat([1])) / 10) * 10 || 10, bw = (W - L) / rows.length, ch = H - B - T, g = "", b = "";
    for (var i = 0; i <= 4; i++) { var y = T + ch - (ch * i) / 4; g += '<line x1="' + L + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="#efedec"/><text x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + Math.round((mx * i) / 4) + "</text>"; }
    rows.forEach(function (r, i) {
      var hh = Math.max(3, (r.n / mx) * ch), x = L + i * bw + bw * 0.16, last = r.d === today;
      b += '<rect x="' + x + '" y="' + (T + ch - hh) + '" width="' + bw * 0.68 + '" height="' + hh + '" rx="5" fill="' + (last ? "#e03939" : "#f1c0c0") + '"><title>' + esc(fDate(r.d) + ": " + r.n + " bookings") + "</title></rect>";
      if (i % 2 === 0 || last) b += '<text x="' + (x + bw * 0.34) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(new Date(r.d + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })) + "</text>";
    });
    return '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Bookings per day">' + g + b + "</svg>";
  }
  function donut(segs) {
    var tot = segs.reduce(function (a, s) { return a + s.v; }, 0), R = 62, C = 2 * Math.PI * R, off = 0;
    var arcs = segs.map(function (s) { var len = (s.v / tot) * C, a = '<circle r="' + R + '" cx="80" cy="80" fill="none" stroke="' + s.c + '" stroke-width="22" stroke-dasharray="' + (len - 2) + " " + (C - len + 2) + '" stroke-dashoffset="' + -off + '" transform="rotate(-90 80 80)"><title>' + esc(s.n + ": " + s.v) + "</title></circle>"; off += len; return a; }).join("");
    return '<svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="Members by plan"><circle r="' + R + '" cx="80" cy="80" fill="none" stroke="#f0eeec" stroke-width="22"/>' + arcs + '<text x="80" y="82" text-anchor="middle" style="font:800 34px var(--disp);fill:#1b1b1f">' + tot + '</text><text x="80" y="100" text-anchor="middle" style="font:600 11px sans-serif;fill:#6b6a72">members</text></svg>';
  }
  var WD = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  function heatHtml(rows) {
    if (!rows || !rows.length) return '<div class="empty">No class bookings yet. This fills in as members book.</div>';
    var times = Array.from(new Set(rows.map(function (r) { return String(r.time).slice(0, 5); }))).sort();
    var html = '<div class="heat" style="grid-template-columns:48px repeat(7,1fr)"><span></span>' + WD.map(function (d) { return '<span class="hl" style="justify-content:center">' + d.slice(0, 3) + "</span>"; }).join("");
    times.forEach(function (t) {
      html += '<span class="hl">' + t + "</span>";
      WD.forEach(function (d) {
        var c = rows.filter(function (x) { return x.day === d && String(x.time).slice(0, 5) === t; })[0];
        if (!c) { html += '<span class="hc" style="background:transparent;border:1px dashed #ece9e7"></span>'; return; }
        var pc = Math.min(1, c.avg / Math.max(1, c.cap));
        html += '<span class="hc" style="background:rgba(224,57,57,' + (0.1 + pc * 0.85).toFixed(2) + ')" title="' + esc(c.name + " · " + d + " " + t + " · " + Math.round(pc * 100) + "% full on average") + '"></span>';
      });
    });
    return html + "</div>";
  }
  function sampleOn() { return CFG.SAMPLE_FIGURES !== false; }
  var SAMPLE = {
    plans: [{ n: "Gym + Classes", v: 28, c: "#e03939" }, { n: "Classes only", v: 12, c: "#2f6fd0" }, { n: "Gym only", v: 9, c: "#238a52" }, { n: "Annual", v: 4, c: "#c26b13" }, { n: "PT bundles", v: 2, c: "#7a5cc7" }],
    revenue: [1290, 1350, 1420, 1500, 1590, 1710, 1778], failed: 2
  };
  async function vDashboard() {
    var results = await Promise.all([rpc("admin_dashboard"), rpc("admin_insights")]), d = results[0], ins = results[1], root = h("div");
    var ps = null; if (can(["admin", "manager"])) { try { ps = await rpc("admin_payments_summary"); } catch (e) { ps = null; } }
    var live = !!(ps && ps.synced), smp = smp && !live;
    var hr = new Date().toLocaleString("en-GB", { hour: "numeric", hour12: false, timeZone: TZ }) * 1, first = (me.name || "").split(" ")[0];
    var days = d.bookings_by_day || [], last14 = days.slice(0, 14);
    // the day to show: today, or the next day with sessions
    var dayISO = d.today, dayLabel = "today", dayClasses = d.today_classes || [], off = 0;
    while (!dayClasses.length && off < 7) { off++; var dd = new Date(d.today + "T12:00:00"); dd.setDate(dd.getDate() + off); dayISO = iso(dd); dayLabel = off === 1 ? "tomorrow" : WD[(dd.getDay() + 6) % 7]; dayClasses = await rpc("admin_day", { p_date: dayISO }); }
    var booked = dayClasses.reduce(function (a, c) { return a + c.booked; }, 0), cap = dayClasses.reduce(function (a, c) { return a + (c.capacity || 0); }, 0);
    var todayN = (days.filter(function (x) { return x.d === dayISO; })[0] || {}).n;
    var prevD = new Date(dayISO + "T12:00:00"); prevD.setDate(prevD.getDate() - 7);
    var lastW = (days.filter(function (x) { return x.d === iso(prevD); })[0] || {}).n;
    var diff = lastW == null ? null : (todayN || booked) - lastW;
    var spk = last14.map(function (x) { return x.n; });
    var cum = 0, signups = (ins.signups_by_day || []).map(function (n) { cum += n; return cum; });
    var k = [];
    k.push(kpiX("Bookings " + dayLabel, "clip", booked, "/ " + cap, diff == null ? "" : (diff >= 0 ? "+" : "") + diff + " vs last " + WD[(prevD.getDay() + 6) % 7], diff > 0 ? "up" : diff < 0 ? "dn" : "flat", spark(spk, "#e03939")));
    k.push(kpiX("Spaces left " + dayLabel, "dumb", Math.max(0, cap - booked), "", cap ? Math.round(booked / cap * 100) + "% of " + dayLabel + "'s capacity booked" : "No sessions", "flat"));
    if (d.members_total != null) k.push(kpiX("Members with an app account", "users", d.members_total, "", "+" + d.members_30d + " in 30 days", d.members_30d > 0 ? "up" : "flat", spark(signups, "#238a52")));
    if (live) k.push(kpiX("Monthly income", "pound", "\u00A3" + Math.round(ps.mrr).toLocaleString("en-GB"), "", ps.active + " active members", ps.new_30d >= ps.left_30d ? "up" : "dn"));
    else if (smp) k.push(kpiX("Monthly revenue", "pound", "£" + SAMPLE.revenue[SAMPLE.revenue.length - 1].toLocaleString("en-GB"), "", "+4.0% vs last month", "up", spark(SAMPLE.revenue, "#e03939"), "", true));
    else k.push(kpiX("Monthly revenue", "pound", "-", "", "Connect Wix payments", "flat"));
    if (d.members_7d != null) { var pv = ins.members_prev_7d || 0; k.push(kpiX("New sign-ups this week", "plus", d.members_7d, "", (d.members_7d - pv >= 0 ? "+" : "") + (d.members_7d - pv) + " vs last week", d.members_7d > pv ? "up" : d.members_7d < pv ? "dn" : "flat")); }
    k.push(kpiX("Average class fill", "pulse", ins.avg_fill_14d == null ? "-" : ins.avg_fill_14d, ins.avg_fill_14d == null ? "" : "%", "last 14 days", "flat"));
    if (d.enquiries_new != null) k.push(kpiX("New enquiries", "inbox", d.enquiries_new, "", d.enquiries_new ? "Reply to keep response time low" : "All caught up", d.enquiries_new ? "dn" : "up", "", d.enquiries_new ? "alert" : ""));
    if (live) k.push(kpiX("Failed payments", "alert", ps.failed, "", ps.failed ? "Chase these today" : "None", ps.failed ? "dn" : "up", "", ps.failed ? "alert" : ""));
    else if (can(["admin", "manager"])) k.push(kpiX("Failed payments", "alert", smp ? SAMPLE.failed : "-", "", smp ? "Needs a follow-up" : "Connect Wix payments", smp ? "dn" : "flat", "", smp ? "alert" : "", smp));

    var nowHM = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
    var tc = dayClasses.filter(function (c) { return c.kind !== "gym"; });
    var tcHtml = tc.length ? tc.map(function (c) {
      var pc = c.capacity ? Math.round(c.booked / c.capacity * 100) : 0, st = String(c.start).slice(0, 5), done = dayLabel === "today" && st < nowHM, full = c.capacity && c.booked >= c.capacity;
      var chipH = done ? '<span class="chip plain">Done</span>' : full ? '<span class="chip warn">Full</span>' : '<span class="chip ok">Open</span>';
      return '<div class="li"><span class="time num">' + esc(st) + '</span><div class="tx"><b>' + esc(c.name) + "</b><small>" + esc(c.coach || "No coach set") + " · " + c.booked + "/" + c.capacity + ' booked</small><div class="bar ' + (pc >= 90 ? "warn" : "") + '" style="margin-top:6px"><i style="width:' + Math.min(100, pc) + '%"></i></div></div>' + chipH + "</div>";
    }).join("") : '<div class="empty">No classes today.</div>';

    var attn = [];
    if (live && ps.failed) attn.push('<a class="li" href="#/plans"><span class="ico bad">' + icon("alert") + '</span><div class="tx"><b>' + ps.failed + " failed payment" + (ps.failed === 1 ? "" : "s") + "</b><small>Open Plans and payments to chase them</small></div></a>");
    if (can(["admin", "manager"]) && smp) attn.push('<div class="li"><span class="ico bad">' + icon("alert") + '</span><div class="tx"><b>' + SAMPLE.failed + " failed payments " + sampleTag() + "</b><small>Retry or contact the members</small></div></div>");
    if (d.enquiries_new) attn.push('<a class="li" href="#/enquiries"><span class="ico acc">' + icon("inbox") + '</span><div class="tx"><b>' + d.enquiries_new + " new enquir" + (d.enquiries_new === 1 ? "y" : "ies") + "</b><small>Newest: " + esc(((d.latest_enquiries || [])[0] || {}).name || "") + "</small></div></a>");
    (ins.tomorrow_busy || []).forEach(function (t) { attn.push('<div class="li"><span class="ico warn">' + icon("clock") + '</span><div class="tx"><b>' + esc(t.name) + " tomorrow is almost full</b><small>" + t.booked + " of " + t.capacity + " spaces taken</small></div></div>"); });
    if (ins.health_missing) attn.push('<div class="li"><span class="ico warn">' + icon("users") + '</span><div class="tx"><b>' + ins.health_missing + " member" + (ins.health_missing === 1 ? "" : "s") + " without a health form</b><small>They cannot book until it is done</small></div></div>");
    if (d.emails_7d_failed) attn.push('<a class="li" href="#/emails"><span class="ico bad">' + icon("mail") + '</span><div class="tx"><b>' + d.emails_7d_failed + " email" + (d.emails_7d_failed === 1 ? "" : "s") + " failed this week</b><small>Open the Emails page</small></div></a>");
    if (!attn.length) attn.push('<div class="empty">Nothing needs attention right now.</div>');
    var KIND = { booking: ["cal", "acc"], member: ["users", "ok"], enquiry: ["inbox", "acc"], email: ["mail", "bad"] };
    var act = (ins.activity || []).map(function (a) { var k2 = KIND[a.kind] || ["check", "ok"]; return '<div class="li"><span class="ico ' + k2[1] + '">' + icon(k2[0]) + '</span><div class="tx"><b>' + esc(a.title) + "</b><small>" + esc(a.sub || "") + '</small></div><small class="hide-s" style="color:var(--faint)">' + esc(ago(a.at)) + "</small></div>"; }).join("") || '<div class="empty">Nothing yet. Activity shows here as members book and sign up.</div>';
    var segs = live ? [{ n: "Gym + Classes", v: ps.by_type.gym_classes || 0, c: "#e03939" }, { n: "Classes only", v: ps.by_type.classes || 0, c: "#2f6fd0" }] : SAMPLE.plans;
    var donutHtml = (smp || live) ? '<div class="donut-wrap">' + donut(segs) + '<div class="donut-leg">' + segs.map(function (s) { return '<div><i style="background:' + s.c + '"></i>' + esc(s.n) + '<span class="num">' + s.v + "</span></div>"; }).join("") + "</div></div>" : '<div class="empty">Connect Wix plans to see members by plan.</div>';
    var JOBN = { "sync-wix-bookings": "Wix booking sync", "sync-timetable": "Timetable sync", "class-reminder-emails": "Class reminder emails", "engagement-emails": "Engagement emails", "lead-and-referral-emails": "Lead follow-ups", "weekly-report": "Weekly report", "send-class-reminders": "Phone reminders" };
    var health = (ins.jobs || []).map(function (j) { var ok = j.status === "succeeded"; return '<div><b style="display:flex;align-items:center;gap:8px;font:650 14px sans-serif"><span class="chip ' + (ok ? "ok" : j.status ? "bad" : "plain") + '">' + (ok ? "OK" : esc(j.status || "No run")) + "</span>" + esc(JOBN[j.job] || j.job) + '</b><small style="color:var(--mut)">' + (j.at ? "last run " + esc(ago(j.at)) : "") + "</small></div>"; }).join("");

    root.appendChild(pageHead((hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening") + (first ? ", " + first : ""), new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ }) + " · here's how the gym is doing"));
    if (smp && can(["admin", "manager"])) root.appendChild(h("div", { class: "banner" }, [h("div", null, [h("b", { text: "Sample figures. " }), document.createTextNode("Items marked Sample (revenue, failed payments, members by plan) are placeholders until payments are connected. Everything else is real.")])]));
    root.appendChild(fromHtml('<div class="grid g4">' + k.join("") + "</div>"));
    root.appendChild(fromHtml('<div class="grid g-main" style="margin-top:16px"><div class="card"><div class="hd"><h3>Bookings, last 14 days</h3><span class="sub">' + spk.reduce(function (a, b) { return a + b; }, 0) + ' in total</span></div><div class="bd">' + barChart(last14, d.today) + '</div></div><div class="card"><div class="hd"><h3>' + (dayLabel === "today" ? "Today's" : dayLabel === "tomorrow" ? "Tomorrow's" : dayLabel + "'s") + ' classes</h3><span class="sub">' + tc.length + ' sessions</span></div><div class="bd"><div class="list">' + tcHtml + "</div></div></div></div>"));
    root.appendChild(fromHtml('<div class="grid g-eq" style="margin-top:16px"><div class="card"><div class="hd"><h3>When people train</h3><span class="sub">average class fill, last 4 weeks</span></div><div class="bd">' + heatHtml(ins.heat) + '</div></div><div class="card"><div class="hd"><h3>Members by plan ' + (smp ? sampleTag() : "") + '</h3></div><div class="bd">' + donutHtml + "</div></div></div>"));
    root.appendChild(fromHtml('<div class="grid g2" style="margin-top:16px"><div class="card"><div class="hd"><h3>Needs attention</h3></div><div class="bd"><div class="list">' + attn.join("") + '</div></div></div><div class="card"><div class="hd"><h3>Recent activity</h3></div><div class="bd"><div class="list">' + act + "</div></div></div></div>"));
    if (health) root.appendChild(fromHtml('<div class="card" style="margin-top:16px"><div class="hd"><h3>System health</h3><span class="sub">automatic jobs</span></div><div class="bd stat-row">' + health + "</div></div>"));
    return root;
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
    var head = h("div", { class: "li" }, [h("div", { class: "time num", text: String(c.start).slice(0, 5) }), h("div", { class: "tx" }, [h("b", { text: c.name, style: c.cancelled ? "text-decoration:line-through" : "" }), h("small", { text: (c.cancelled ? "CANCELLED" + (c.cancel_reason ? ": " + c.cancel_reason : "") + " · " : "") + (c.coach ? "Coach " + c.coach : "No coach set") + (c.other_wix ? " · " + c.other_wix + " booked on the website only" : "") })]),
      h("div", { style: "width:120px" }, [fill(c.booked, c.capacity)]), h("span", { class: "num", text: c.booked + "/" + c.capacity }),
      can(["admin"]) ? h("button", { class: "btn sm " + (c.cancelled ? "" : "dng"), onclick: function () { cancelClass(c, ds); }, text: c.cancelled ? "Cancelled: manage" : "Cancel class" }) : null]);
    var people = c.people.length ? h("div", { class: "people" }, c.people.map(function (p) { return h("span", { class: "chip " + (p.source === "wix" ? "info" : "plain"), text: p.name }); })) : h("small", { class: "muted", text: "Nobody booked through the app yet." });
    return h("section", { class: "card" }, [h("div", { class: "bd" }, [head, people])]);
  }
  function cancelClass(c, ds) {
    var reason = h("input", { class: "in", id: "cReason", maxlength: "200", placeholder: "Optional, shown in the email (for example: our coach is unwell)", value: c.cancel_reason || "" });
    var out = h("div", { class: "msg", hidden: true });
    var list = h("div", { class: "people", style: "margin-top:10px;display:flex;flex-wrap:wrap;gap:6px" });
    var cancelled = !!c.cancelled, changedAny = false, checked = null, ttMode = "wix", pending = "", busy = false;
    var bEmailCancel = h("button", { class: "btn pri", text: "Cancel class and email" }), bCancel = h("button", { class: "btn", text: "Cancel class, no email" });
    var bEmail = h("button", { class: "btn pri", text: "Email them" }), bRestore = h("button", { class: "btn", text: "Restore class" });
    var bClose = h("button", { class: "btn", text: "Close", onclick: function () { closeModal(); if (changedAny) route(); } });
    rpc("admin_timetable_control_get").then(function (m) { ttMode = m && m.mode; }).catch(function () {});
    function say(t, cls) { out.hidden = false; out.className = "msg" + (cls ? " " + cls : ""); out.textContent = t; }
    function emailable() { return checked ? checked.count - checked.no_email : 0; }
    function labels() {
      var n = emailable();
      bEmailCancel.textContent = pending === "emailcancel" ? "Yes, cancel and email " + n : "Cancel class and email" + (checked ? " " + n : "");
      bCancel.textContent = pending === "cancel" ? "Yes, cancel the class" : "Cancel class, no email";
      bEmail.textContent = "Email " + n + (n === 1 ? " person" : " people");
      bRestore.textContent = pending === "restore" ? "Yes, restore the class" : "Restore class";
      [bEmailCancel, bCancel, bEmail, bRestore].forEach(function (b) { b.disabled = busy; });
      bEmailCancel.hidden = cancelled || !checked || emailable() === 0; bCancel.hidden = cancelled;
      bEmail.hidden = !cancelled || !checked || emailable() === 0; bRestore.hidden = !cancelled;
    }
    function callFn(action) { return fn("admin-class-cancelled", { action: action, class_id: c.id, date: ds, reason: reason.value }, 90); }
    async function look() {
      busy = true; labels(); say("Checking who is booked, including the website..."); clear(list);
      var r = await callFn("preview"); busy = false;
      if (!r.ok) { checked = { count: 0, no_email: 0, wix_ok: false }; labels(); return say(r.j.error || "Something went wrong.", "bad"); }
      checked = r.j;
      r.j.people.forEach(function (p) { list.appendChild(h("span", { class: "chip " + (p.source === "website" ? "info" : "plain"), title: p.source === "website" ? "Booked on the website" : "Booked in the app", text: p.name + (p.source === "website" ? " (website)" : "") + (p.can_email ? "" : " (no email)") })); });
      var after = ttMode === "backoffice" ? "" : " The website still shows the session, so cancel it in Wix as well.";
      say((r.j.count ? r.j.count + " booked: " + r.j.app_count + " in the app, " + r.j.website_count + " on the website only." : "Nobody is booked on this class on this date.") + (r.j.wix_ok ? "" : " The website could not be checked just now, so this list may be missing people.") + (r.j.no_email ? " " + r.j.no_email + " have no email on file." : "") + " " + (cancelled ? "This class is cancelled: the app shows it as cancelled and nobody can book it." : "Cancelling hides it from members' upcoming lists and stops new bookings. Their bookings stay in the history. Emailing them is optional.") + (cancelled ? "" : after), r.j.wix_ok ? "" : "bad");
      labels();
    }
    async function doCancel(withEmail) {
      busy = true; pending = ""; labels(); say("Cancelling...");
      try { await rpc("admin_class_date_cancel", { p_class: c.id, p_date: ds, p_reason: reason.value }); } catch (e) { busy = false; labels(); return say(e.message, "bad"); }
      cancelled = true; changedAny = true;
      if (!withEmail) { busy = false; labels(); say("Cancelled. The app now shows this class as cancelled. Nobody was emailed.", "ok"); return; }
      say("Cancelled. Emailing the people booked...");
      var r = await callFn("send"); busy = false; labels();
      if (!r.ok) return say("Cancelled, but the emails did not go: " + (r.j.error || "something went wrong") + " Press Email them to try again.", "bad");
      say("Cancelled. Emailed " + r.j.sent + " of " + r.j.count + (r.j.skipped ? " (" + r.j.skipped + " skipped: no email)" : "") + (r.j.failed ? ". " + r.j.failed + " failed: press Email them to try again." : "."), r.j.failed ? "bad" : "ok");
    }
    function twoStep(key, go) { return function () { if (busy) return; if (pending !== key) { pending = key; labels(); say(key === "restore" ? "This puts the class back on the timetable for members. Press the button again to confirm." : "This stops bookings and hides the class from members. Press the button again to confirm.", "bad"); return; } go(); }; }
    bEmailCancel.addEventListener("click", twoStep("emailcancel", function () { doCancel(true); }));
    bCancel.addEventListener("click", twoStep("cancel", function () { doCancel(false); }));
    bRestore.addEventListener("click", twoStep("restore", async function () {
      busy = true; pending = ""; labels();
      try { await rpc("admin_class_date_restore", { p_class: c.id, p_date: ds }); cancelled = false; changedAny = true; busy = false; labels(); say("Restored. Members can book this class again.", "ok"); } catch (e) { busy = false; labels(); say(e.message, "bad"); }
    }));
    bEmail.addEventListener("click", async function () {
      if (busy || !checked || !checked.wix_ok) return; busy = true; labels(); say("Sending...");
      var r = await callFn("send"); busy = false; labels();
      if (!r.ok) return say(r.j.error || "Something went wrong.", "bad");
      say("Emailed " + r.j.sent + " of " + r.j.count + (r.j.skipped ? " (" + r.j.skipped + " skipped: no email)" : "") + (r.j.failed ? ". " + r.j.failed + " failed: press Email them to try again." : "."), r.j.failed ? "bad" : "ok");
    });
    reason.addEventListener("input", function () { pending = ""; labels(); });
    openModal(cancelled ? "Cancelled class" : "Cancel class", [h("p", { text: c.name + ", " + fDate(ds) + " at " + String(c.start).slice(0, 5) + ". Everyone booked is listed below, in the app and on the website." }), list, h("div", { class: "field", style: "margin-top:12px" }, [h("label", { text: "Reason (optional, shown in the email)" }), reason]), out],
      [bClose, bRestore, bCancel, bEmailCancel, bEmail]);
    labels(); look();
  }

  /* ---------- timetable: weekly grid or list; owner and manager can add, edit, switch off and remove ---------- */
  var ttView = "classes", ttAll = false, ttLayout = "", ttDay = "all";
  var TT_LENGTHS = ["30 min", "45 min", "1 hr", "1 hr 15 min"];
  function ttMissing(e) { return !!e && (e.code === "PGRST202" || e.code === "42883" || /could not find the function|schema cache/i.test(e.message || "")); }
  function ttName(c) { return c.day + " " + String(c.time).slice(0, 5) + " " + c.name; }
  function ttSort(a, b) { var d = WD.indexOf(a.day) - WD.indexOf(b.day); return d || (a.time < b.time ? -1 : a.time > b.time ? 1 : 0); }

  async function vTimetable() {
    var data = null, rows, legacy = false;
    try { data = await rpc("admin_timetable_edit"); rows = data.rows; }
    catch (e) { if (!ttMissing(e)) throw e; legacy = true; rows = await rpc("admin_timetable"); }
    var mode = data ? data.mode : null, canEdit = !legacy && can(["admin", "manager"]), root = h("div"), ctx = { mode: mode, canEdit: canEdit, rows: rows, legacy: legacy };
    var gym = ttView === "gym", layout = ttLayout || (window.innerWidth < 760 ? "list" : "grid");
    var list = rows.filter(function (c) { return (gym ? c.kind === "gym" : c.kind !== "gym") && (ttAll || c.active) && (ttDay === "all" || c.day === ttDay); }).sort(ttSort);
    var acts = [
      h("div", { class: "seg" }, [h("button", { class: !gym ? "on" : "", onclick: function () { ttView = "classes"; route(); }, text: "Classes" }), h("button", { class: gym ? "on" : "", onclick: function () { ttView = "gym"; route(); }, text: "Gym hours" })]),
      h("div", { class: "seg" }, [h("button", { class: layout === "grid" ? "on" : "", onclick: function () { ttLayout = "grid"; route(); }, text: "Grid" }), h("button", { class: layout === "list" ? "on" : "", onclick: function () { ttLayout = "list"; route(); }, text: "List" })]),
      h("select", { class: "in sel", "aria-label": "Show one day", onchange: function (e) { ttDay = e.target.value; route(); } }, [h("option", { value: "all", text: "All days", selected: ttDay === "all" })].concat(WD.map(function (d) { return h("option", { value: d, text: d, selected: ttDay === d }); }))),
      h("button", { class: "btn sm", onclick: function () { ttAll = !ttAll; route(); }, text: ttAll ? "Hide switched off" : "Show switched off" })];
    if (canEdit && !gym) acts.push(h("button", { class: "btn", onclick: function () { ttCoachDays(ctx); }, text: "Coaches by day" }));
    if (canEdit) acts.push(h("button", { class: "btn pri", onclick: function () { ttEdit(null, ctx); }, text: gym ? "Add gym hour" : "Add class" }));
    var lead = legacy ? "Your weekly classes and open gym hours." : canEdit ? "Your weekly classes and open gym hours. Click one to change it, or add a new one." : "Your weekly classes and open gym hours. Ask the owner or a manager to change them.";
    root.appendChild(pageHead("Timetable", lead, acts));
    root.appendChild(ttBanner(ctx));
    if (!list.length) { root.appendChild(card("Nothing here", "", [empty("No sessions to show.")])); return root; }
    root.appendChild(layout === "list" ? ttList(list, gym, ctx) : ttGrid(list, ctx));
    return root;
  }

  function ttBanner(ctx) {
    if (ctx.legacy) return h("div", { class: "banner" }, [h("div", null, [h("b", { text: "View only for now. " }), document.createTextNode("Classes are still changed in Wix, and the app follows within minutes.")])]);
    if (ctx.mode === "backoffice") return h("div", { class: "banner ok" }, [h("div", null, [h("b", { text: "You control the timetable. " }), document.createTextNode("Changes made here show in the app and on the website straight away. The Wix website no longer changes it.")])]);
    return h("div", { class: "banner" }, [
      h("div", { style: "flex:1" }, [h("b", { text: "The timetable still syncs from the Wix website every 10 minutes. " }), document.createTextNode("Changes to classes that came from Wix are put back until you switch control to this back office. Classes you add here are never touched.")]),
      can(["admin"]) ? h("button", { class: "btn sm", onclick: function () { ttTakeControl(ctx); }, text: "Take control of the timetable (do this on launch day)" }) : null]);
  }

  function ttNextText(c) { return c.next_date == null || c.booked_next == null ? "-" : c.booked_next + " of " + c.capacity; }

  function ttList(list, gym, ctx) {
    var tb = h("tbody", null, list.map(function (c) {
      var over = c.booked_next != null && c.booked_next > c.capacity;
      return h("tr", { tabindex: "0", "aria-label": ttName(c), onclick: function () { ttDrawer(c, ctx); }, onkeydown: function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ttDrawer(c, ctx); } } }, [
        h("td", { text: c.day }), h("td", { class: "num", text: String(c.time).slice(0, 5) }),
        h("td", null, [h("b", { text: c.name }), c.coach ? h("small", { class: "block muted", text: c.coach }) : null]),
        h("td", { text: gym ? "-" : (c.info || "-") }), h("td", { class: "num", text: c.capacity }),
        h("td", null, [h("span", { class: "num", text: ttNextText(c) }), over ? h("small", { class: "block" }, [chip("Over capacity", "bad")]) : null]),
        h("td", null, [chip(c.source === "wix" ? "Wix" : "Added here", c.source === "wix" ? "info" : "plain")]),
        h("td", null, [chip(c.active ? "On" : "Off", c.active ? "ok" : "plain")])]);
    }));
    var heads = ["Day", "Time", gym ? "Gym hour" : "Class", "Length", "Places", "Booked next", "Source", "Status"];
    return h("div", { class: "card" }, [h("div", { class: "tbl-wrap" }, [h("table", { class: "t" }, [h("thead", null, [h("tr", null, heads.map(function (x) { return h("th", { text: x }); }))]), tb])])]);
  }

  function ttGrid(list, ctx) {
    var hours = list.map(function (c) { return parseInt(String(c.time).slice(0, 2), 10); }), lo = Math.min.apply(null, hours), hi = Math.max.apply(null, hours);
    var todayIdx = (new Date().getDay() + 6) % 7, g = '<div class="wk"><div class="dh" style="border-right:0"></div>' + WD.map(function (d, i) { return '<div class="dh' + (i === todayIdx ? " today" : "") + '">' + d.slice(0, 3) + "</div>"; }).join("");
    for (var hr = lo; hr <= hi; hr++) {
      g += '<div class="hr">' + String(hr).padStart(2, "0") + ":00</div>";
      WD.forEach(function (d) {
        var inCell = list.filter(function (c) { return c.day === d && parseInt(String(c.time).slice(0, 2), 10) === hr; }), n = inCell.length, cell = "";
        inCell.forEach(function (c, i) {
          var pc = c.capacity ? Math.min(100, Math.round(c.avg / c.capacity * 100)) : 0, cl = !c.active ? "off" : c.kind === "gym" ? "g" : /kid/i.test(c.name) ? "k" : "c";
          cell += '<button class="cls ' + cl + '" data-id="' + c.id + '" style="' + (n > 1 ? "right:auto;left:calc(" + (i * 100 / n) + "% + 3px);width:calc(" + (100 / n) + "% - 6px)" : "") + '"><b>' + esc(c.name) + "</b><small>" + esc(String(c.time).slice(0, 5)) + (c.coach ? " · " + esc(c.coach) : "") + '</small><span class="mini"><i style="width:' + pc + '%"></i></span></button>';
        });
        g += '<div class="cell">' + cell + "</div>";
      });
    }
    g += "</div>";
    var wrap = fromHtml('<div class="card" style="overflow:hidden"><div class="tbl-wrap">' + g + "</div></div>");
    wrap.querySelectorAll(".cls").forEach(function (b) { b.addEventListener("click", function () { var c = ctx.rows.filter(function (x) { return String(x.id) === b.getAttribute("data-id"); })[0]; ttDrawer(c, ctx); }); });
    return h("div", null, [fromHtml('<div class="legend" style="margin-bottom:12px"><span><i style="background:#f6cfcf"></i>Class</span><span><i style="background:#cfdcf4"></i>Gym hour</span><span><i style="background:#c8e8d4"></i>Kids</span><span><i style="background:#e3e1df"></i>Switched off</span><span>The bar inside each block is the average fill over the last 4 weeks</span></div>'), wrap]);
  }

  function ttDrawer(c, ctx) {
    var kv = h("dl", { class: "kv" });
    [["Day and time", c.day + " " + String(c.time).slice(0, 5)], ["Type", c.kind === "gym" ? "Gym hour" : "Class"], ["Coach", c.coach || "Not set"], ["Length", c.kind === "gym" ? "-" : (c.info || "-")], ["Places", c.capacity],
      ["Booked next session", c.next_date == null || c.booked_next == null ? "-" : fDate(c.next_date) + ": " + c.booked_next + " of " + c.capacity], ["Booked ahead, all dates", c.booked_ahead == null ? "-" : c.booked_ahead],
      ["Average booked (4 weeks)", c.avg], ["Status", c.active ? "On" : "Switched off"], ["Source", c.source === "wix" ? "Wix website" : "Added in this back office"]]
      .forEach(function (p) { kv.appendChild(h("dt", { text: p[0] })); kv.appendChild(h("dd", { text: p[1] })); });
    var body = [h("div", { class: "sect" }, [kv])];
    if (ctx.canEdit) {
      body.push(h("div", { class: "btns" }, [
        h("button", { class: "btn pri", onclick: function () { ttEdit(c, ctx); }, text: "Edit" }),
        h("button", { class: "btn", onclick: function () { ttToggle(c); }, text: c.active ? "Switch off" : "Switch on" }),
        h("button", { class: "btn dng", onclick: function () { ttRemove(c); }, text: "Remove" })]));
      if (ctx.mode === "wix" && c.source === "wix") body.push(h("p", { class: "muted", text: "This one came from Wix. Until you take control of the timetable, changes to its day, time, name, length, places or on/off are put back within 10 minutes. A change of coach stays." }));
      body.push(h("p", { class: "muted", text: "To cancel just one date and email the people booked, use the Schedule page (owner only)." }));
    } else {
      body.push(h("p", { class: "muted", text: ctx.legacy ? "To change a class, edit it in Wix. The app and this page follow within minutes." : "Ask the owner or a manager to change this." }));
    }
    openDrawer(c.name, body);
  }

  function coachNames(ctx) { var seen = {}, out = []; (ctx.rows || []).forEach(function (x) { var n = (x.coach || "").trim(); if (n && !seen[n.toLowerCase()]) { seen[n.toLowerCase()] = 1; out.push(n); } }); return out.sort(); }
  async function ttCoachDays(ctx) {
    var def = {}; try { def = await rpc("admin_coach_defaults"); } catch (e) { return toast(e.message, true); }
    var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], inputs = {};
    var dl = h("datalist", { id: "ttCoachDays" }, coachNames(ctx).map(function (n) { return h("option", { value: n }); }));
    var rows = days.map(function (d) { inputs[d] = h("input", { class: "in", list: "ttCoachDays", maxlength: "60", placeholder: "No coach", value: def[d] || "", "aria-label": "Coach for " + d }); return h("div", { class: "field", style: "display:grid;grid-template-columns:110px 1fr;align-items:center;gap:10px;margin-top:8px" }, [h("label", { text: d }), inputs[d]]); });
    var all = h("input", { type: "checkbox", id: "ttAllNow", checked: true }), out = h("div", { class: "msg", hidden: true });
    var go = h("button", { class: "btn pri", text: "Save coaches" });
    go.addEventListener("click", async function () {
      go.disabled = true; var set = {}; days.forEach(function (d) { set[d] = inputs[d].value.trim(); });
      try {
        await rpc("admin_coach_defaults", { p_set: set });
        if (all.checked) { var byCoach = {}; days.forEach(function (d) { (byCoach[set[d]] = byCoach[set[d]] || []).push(d); }); for (var cn in byCoach) await rpc("admin_classes_set_coach", { p_days: byCoach[cn], p_coach: cn, p_only_empty: false }); }
        closeModal(); toast("Coaches saved."); route();
      } catch (e) { go.disabled = false; out.hidden = false; out.className = "msg bad"; out.textContent = e.message; }
    });
    openModal("Coach for each day", [h("p", { text: "Who normally teaches on each day. New classes get this coach automatically. You can still change the coach on any single class." }), dl].concat(rows, [h("label", { style: "display:flex;gap:8px;margin-top:14px;align-items:flex-start;font-size:13.5px" }, [all, h("span", { text: "Also set these coaches on all the classes already on the timetable (this replaces coaches you set one by one)." })]), out]), [h("button", { class: "btn", onclick: closeModal, text: "Close" }), go]);
  }
  function ttEdit(c, ctx) {
    var isNew = !c, kind = c ? c.kind : (ttView === "gym" ? "gym" : "class"), isGym = kind === "gym", dayDefault = c ? c.day : (ttDay !== "all" ? ttDay : "Monday");
    var day = h("select", { class: "in sel", id: "ttDay" }, WD.map(function (d) { return h("option", { value: d, text: d, selected: d === dayDefault }); }));
    var time = h("input", { class: "in", id: "ttTime", type: "time", step: "300", min: "05:00", max: "23:59", required: true, value: c ? String(c.time).slice(0, 5) : "" });
    var name = isGym ? null : h("input", { class: "in", id: "ttName", maxlength: "60", required: true, placeholder: "For example HIIT", value: c ? c.name : "" });
    var coach = h("input", { class: "in", id: "ttCoach", maxlength: "60", list: "ttCoaches", placeholder: "Pick a coach or type a new name", value: c ? (c.coach || "") : "" });
    var coachList = h("datalist", { id: "ttCoaches" }, coachNames(ctx).map(function (n) { return h("option", { value: n }); }));
    var info = isGym ? null : h("input", { class: "in", id: "ttInfo", maxlength: "60", list: "ttLen", placeholder: "For example 45 min", value: c ? (c.info || "") : "" });
    var lens = h("datalist", { id: "ttLen" }, TT_LENGTHS.map(function (v) { return h("option", { value: v }); }));
    var cap = h("input", { class: "in", id: "ttCap", type: "number", min: "0", max: "100", step: "1", inputmode: "numeric", required: true, value: c ? String(c.capacity) : (isGym ? "6" : "8") });
    var on = h("input", { type: "checkbox", id: "ttOn", checked: c ? !!c.active : true });
    var warn = h("p", { class: "ttwarn", role: "status", hidden: true });
    function showWarn() {
      var msgs = [], n = Number(cap.value);
      if (c && c.booked_next != null && c.next_date != null && cap.value !== "" && c.booked_next > n) msgs.push(c.booked_next + " people are booked for " + fDate(c.next_date) + ", more than " + n + " places. Their bookings stay, but nobody else can book that session.");
      if (c && ctx.mode === "wix" && c.source === "wix") msgs.push("This one came from Wix. Until you take control of the timetable, changes to its day, time, name, length, places or on/off are put back within 10 minutes. A change of coach stays.");
      warn.textContent = msgs.join(" "); warn.hidden = !msgs.length;
    }
    cap.addEventListener("input", showWarn); showWarn();
    var save = h("button", { class: "btn pri", type: "submit", form: "ttForm", text: isNew ? (isGym ? "Add gym hour" : "Add class") : "Save changes" });
    function doSave() {
      var payload = { id: c ? c.id : null, kind: kind, day_name: day.value, start_time: time.value, name: isGym ? "Open Gym" : name.value, coach: coach.value, info: isGym ? "" : info.value, capacity: cap.value === "" ? null : Number(cap.value), active: on.checked };
      save.disabled = true;
      rpc("admin_class_save", { p: payload }).then(function (res) {
        var msg = isNew ? (isGym ? "Gym hour added." : "Class added.") : "Saved.";
        if (res.sync_will_revert) msg += " It came from Wix, so it will be put back within 10 minutes.";
        if (res.booked_next != null && res.booked_next > payload.capacity) msg += " " + res.booked_next + " are booked next session, more than the places.";
        closeDrawer(); toast(msg); route();
      }).catch(function (e) { save.disabled = false; toast(e.message, true); });
    }
    var form = h("form", { id: "ttForm", class: "ttform", novalidate: false, onsubmit: function (e) { e.preventDefault(); doSave(); } }, [
      h("div", { class: "row2" }, [h("div", { class: "field" }, [h("label", { for: "ttDay", text: "Day" }), day]), h("div", { class: "field" }, [h("label", { for: "ttTime", text: "Start time" }), time])]),
      isGym ? h("p", { class: "muted", text: "Gym hours are always called Open Gym." }) : h("div", { class: "field" }, [h("label", { for: "ttName", text: "Class name" }), name]),
      h("div", { class: "row2" }, [h("div", { class: "field" }, [h("label", { for: "ttCoach", text: "Coach" }), coach, coachList]), isGym ? null : h("div", { class: "field" }, [h("label", { for: "ttInfo", text: "Length" }), info, lens])]),
      h("div", { class: "row2" }, [h("div", { class: "field" }, [h("label", { for: "ttCap", text: "Places (capacity)" }), cap])]),
      h("label", { class: "chkline" }, [on, h("span", { text: "On: show it in the app and on the website" })]),
      warn]);
    openDrawer(isNew ? (isGym ? "Add a gym hour" : "Add a class") : "Edit " + c.name, [form], [h("button", { class: "btn", type: "button", onclick: closeDrawer, text: "Cancel" }), save]);
    (isGym ? time : name).focus();
  }

  function ttConfirm(title, kids, label, action) {
    var go = h("button", { class: "btn dng", text: label });
    go.addEventListener("click", function () { go.disabled = true; Promise.resolve(action()).then(function () { go.disabled = false; }); });
    openModal(title, kids, [h("button", { class: "btn", onclick: closeModal, text: "Cancel" }), go]);
  }
  function ttCall(fnName, args, okMsg) {
    return rpc(fnName, args).then(function (res) {
      var m = typeof okMsg === "function" ? okMsg(res) : okMsg;
      if (res && res.sync_will_revert) m += " It came from Wix, so it will be put back within 10 minutes.";
      closeModal(); closeDrawer(); toast(m); route();
    }).catch(function (e) { toast(e.message, true); });
  }
  function ttToggle(c) {
    if (!c.active) { ttCall("admin_class_set_active", { p_id: c.id, p_on: true, p_force: false }, "Switched on."); return; }
    var kids = [h("p", { text: ttName(c) + " will disappear from the app and the website. Bookings already made are kept." })];
    if (c.booked_ahead) kids.push(h("p", { text: c.booked_ahead + " people are booked ahead. They are not told automatically. To cancel one date and email them, use the Schedule page (owner only)." }));
    ttConfirm("Switch off " + c.name + "?", kids, "Switch off", function () { return ttCall("admin_class_set_active", { p_id: c.id, p_on: false, p_force: true }, "Switched off."); });
  }
  function ttRemove(c) {
    var kids = [];
    if (!c.ever) kids.push(h("p", { text: "This deletes " + ttName(c) + " for good. Nobody has ever booked it. It cannot be undone." }));
    else {
      kids.push(h("p", { text: ttName(c) + " has booking history, so it cannot be deleted. It will be switched off instead, and everything already booked is kept." }));
      if (c.booked_ahead) kids.push(h("p", { text: c.booked_ahead + " people are booked ahead. They are not told automatically. To cancel one date and email them, use the Schedule page (owner only)." }));
    }
    ttConfirm(c.ever ? "Switch off " + c.name + "?" : "Delete " + c.name + "?", kids, c.ever ? "Switch off" : "Delete", function () {
      return ttCall("admin_class_remove", { p_id: c.id, p_force: true }, function (res) { return res && res.deleted ? "Deleted." : "Switched off, booking history kept."; });
    });
  }
  function ttTakeControl(ctx) {
    var n = ctx.rows.filter(function (x) { return x.source === "wix" && x.active; }).length;
    var typed = h("input", { class: "in", id: "ttType", autocomplete: "off", placeholder: "TAKE CONTROL", "aria-label": "Type TAKE CONTROL to confirm" });
    var go = h("button", { class: "btn dng", text: "Take control", disabled: true });
    typed.addEventListener("input", function () { go.disabled = typed.value.trim().toUpperCase() !== "TAKE CONTROL"; });
    go.addEventListener("click", function () {
      go.disabled = true;
      rpc("admin_timetable_control_set", { p_mode: "backoffice" }).then(function (res) { closeModal(); toast("You now control the timetable. " + res.converted + " classes and gym hours are managed here."); route(); })
        .catch(function (e) { go.disabled = false; toast(e.message, true); });
    });
    openModal("Take control of the timetable", [
      h("p", { text: "Do this once, on launch day. It switches off the Wix sync, and the " + n + " active classes and gym hours that came from Wix become ones you manage here. From then on the Wix website no longer changes the app or the new website." }),
      h("div", { class: "field", style: "margin-top:12px" }, [h("label", { for: "ttType", text: "Type TAKE CONTROL to confirm" }), typed])],
      [h("button", { class: "btn", onclick: closeModal, text: "Cancel" }), go]);
    typed.focus();
  }

  /* ---------- analytics ---------- */
  async function vAnalytics() {
    var d = await rpc("admin_analytics"), root = h("div");
    root.appendChild(pageHead("Analytics", "How members are booking and joining. Everything here is real, and fills in as more people book."));
    var wk = d.weekly || [], tb = wk.reduce(function (a, w) { return a + w.bookings; }, 0), ts = wk.reduce(function (a, w) { return a + w.signups; }, 0);
    var rep = d.members_booked_30d ? Math.round(100 * d.members_repeat_30d / d.members_booked_30d) : null;
    root.appendChild(fromHtml('<div class="grid g4">' + kpiX("Bookings, 12 weeks", "clip", tb, "", "about " + Math.round(tb / 12) + " a week", "flat") + kpiX("Sign-ups, 12 weeks", "plus", ts, "", "new app accounts", "flat") +
      kpiX("Members who booked", "users", d.members_booked_30d, "", "in the last 30 days", "flat") + kpiX("Booking again", "pulse", rep == null ? "-" : rep, rep == null ? "" : "%", "booked 2 or more times in 30 days", "flat") + "</div>"));
    function bars(rows, key, cls) {
      var mx = Math.max.apply(null, rows.map(function (r) { return r[key]; }).concat([1]));
      return rows.map(function (r) { return '<div class="li"><div class="tx"><b>' + esc(r.label) + '</b></div><div style="width:46%"><div class="bar"><i style="width:' + Math.round(r[key] / mx * 100) + '%"></i></div></div><span class="num">' + r[key] + "</span></div>"; }).join("") || '<div class="empty">No data yet.</div>';
    }
    var chartRows = wk.map(function (w) { return { d: w.week, n: w.bookings }; });
    var sRows = wk.map(function (w) { return { d: w.week, n: w.signups }; });
    root.appendChild(fromHtml('<div class="grid g2" style="margin-top:16px"><div class="card"><div class="hd"><h3>Bookings per week</h3><span class="sub">last 12 weeks</span></div><div class="bd">' + barChart(chartRows, wk.length ? wk[wk.length - 1].week : "") + '</div></div><div class="card"><div class="hd"><h3>New sign-ups per week</h3><span class="sub">last 12 weeks</span></div><div class="bd">' + barChart(sRows, wk.length ? wk[wk.length - 1].week : "") + "</div></div></div>"));
    var wd = WD.map(function (n) { var f = (d.by_weekday || []).filter(function (x) { return x.day === n; })[0]; return { label: n, n: f ? f.n : 0 }; });
    var hrs = (d.by_hour || []).map(function (x) { return { label: x.hour + ":00", n: x.n }; });
    var top = (d.top_classes_90d || []).map(function (x) { return { label: x.name, n: x.n }; });
    var src = (d.bookings_by_source_90d || []).map(function (x) { return { label: x.source === "wix" ? "Website (Wix)" : "App", n: x.n }; });
    root.appendChild(fromHtml('<div class="grid g2" style="margin-top:16px"><div class="card"><div class="hd"><h3>Busiest days</h3><span class="sub">last 90 days</span></div><div class="bd"><div class="list">' + bars(wd, "n") + '</div></div></div><div class="card"><div class="hd"><h3>Busiest hours</h3><span class="sub">last 90 days</span></div><div class="bd"><div class="list">' + bars(hrs, "n") + "</div></div></div></div>"));
    root.appendChild(fromHtml('<div class="grid g2" style="margin-top:16px"><div class="card"><div class="hd"><h3>Most popular classes</h3><span class="sub">last 90 days</span></div><div class="bd"><div class="list">' + bars(top, "n") + '</div></div></div><div class="card"><div class="hd"><h3>Where bookings come from</h3><span class="sub">last 90 days</span></div><div class="bd"><div class="list">' + bars(src, "n") + "</div></div></div></div>"));
    return root;
  }

  /* ---------- members ---------- */
  var memberQ = "";
  /* ---------- members: your real client list (Wix clients + app accounts) ---------- */
  var memberQ = memberQ || "", memberTab = "active", memberType = "all";
  var TYPE_LABEL = { gym_classes: "Gym + Classes", classes: "Classes only", pt: "Personal training", other: "Other plan" };
  var STATUS_LABEL = { active: "Active", failed: "Payment failed", paused: "Paused", cancelled: "Cancelled", ended: "Ended", lead: "Not a member" };
  var STATUS_CHIP = { active: "ok", failed: "bad", paused: "warn", cancelled: "plain", ended: "plain", lead: "plain" };
  function csvCell(v) { var s = v == null ? "" : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
  function downloadCsv(name, head, rows) {
    var text = [head.map(csvCell).join(",")].concat(rows.map(function (r) { return r.map(csvCell).join(","); })).join("\r\n");
    var a = h("a", { href: URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" })), download: name });
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function parseCsv(text) {
    var rows = [], row = [], cur = "", q = false, i = 0;
    text = text.replace(/^﻿/, "");
    for (; i < text.length; i++) {
      var c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); cur = ""; if (row.some(function (x) { return x.trim() !== ""; })) rows.push(row); row = []; }
      else cur += c;
    }
    row.push(cur); if (row.some(function (x) { return x.trim() !== ""; })) rows.push(row);
    return rows;
  }
  function inTab(m, tab) {
    if (tab === "all") return true;
    if (tab === "active") return m.status === "active" || m.status === "failed";
    if (tab === "lapsed") return m.lapsed;
    if (tab === "former") return m.status === "cancelled" || m.status === "ended";
    return m.status === tab;
  }
  async function vMembers() {
    var all = await rpc("admin_member_directory", { p_limit: 3000 }), root = h("div"), isAdmin = can(["admin", "manager"]);
    var cnt = function (f) { return all.filter(f).length; };
    root.appendChild(pageHead("Members", "Your clients from Wix and the app in one list. Click a name for everything about them.",
      isAdmin ? [h("button", { class: "btn pri", onclick: function () { addMemberDialog(); }, text: "Add member" }), h("button", { class: "btn", onclick: function () { exportSubscribers(); }, text: "Export email list" }), h("button", { class: "btn", onclick: function () { importDialog(); }, text: "Import email list" }), h("button", { class: "btn", onclick: function () { accessCheck(); }, text: "Check editing access" })] : null));
    root.appendChild(h("div", { class: "grid g4" }, [
      kpi("Active members", cnt(function (m) { return m.status === "active" || m.status === "failed"; }), "paying now"),
      kpi("Gym + Classes", cnt(function (m) { return (m.status === "active" || m.status === "failed") && m.plan_type === "gym_classes"; })),
      kpi("Classes only", cnt(function (m) { return (m.status === "active" || m.status === "failed") && m.plan_type === "classes"; })),
      kpi("Not trained in 3 weeks", cnt(function (m) { return m.lapsed; }), "good people to message", cnt(function (m) { return m.lapsed; }) > 0)]));
    var tabs = [["active", "Active"], ["lapsed", "Not training"], ["failed", "Payment failed"], ["paused", "Paused"], ["former", "Former"], ["lead", "Leads and contacts"], ["all", "Everyone"]];
    var bar = h("div", { class: "toolbar", style: "flex-wrap:wrap;gap:8px" });
    tabs.forEach(function (t) { var n = cnt(function (m) { return inTab(m, t[0]); }); bar.appendChild(h("button", { class: "btn sm" + (memberTab === t[0] ? " pri" : ""), onclick: function () { memberTab = t[0]; route(); }, text: t[1] + " " + n })); });
    var typeSel = h("select", { class: "sel", "aria-label": "Membership type", onchange: function () { memberType = typeSel.value; route(); } }, [["all", "All types"], ["gym_classes", "Gym + Classes"], ["classes", "Classes only"], ["pt", "Personal training"]].map(function (o) { return h("option", { value: o[0], text: o[1], selected: o[0] === memberType }); }));
    var search = h("input", { class: "in", type: "search", placeholder: "Search name, email or phone", value: memberQ, "aria-label": "Search members" }); var t;
    search.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { memberQ = search.value; route(); }, 300); });
    var q = memberQ.trim().toLowerCase();
    var rows = all.filter(function (m) { return inTab(m, memberTab) && (memberType === "all" || m.plan_type === memberType) && (!q || (m.name + " " + m.email + " " + m.phone).toLowerCase().indexOf(q) > -1); });
    var shown = rows.slice(0, 300), body = h("tbody");
    shown.forEach(function (m) {
      body.appendChild(h("tr", { onclick: function () { memberProfile(m); } }, [
        h("td", null, [h("div", { class: "who" }, [h("span", { class: "av s", text: initials(m.name || m.email) }), h("div", null, [h("b", { text: m.name || "(no name)" }), h("small", { class: "block muted", text: m.email })])])]),
        h("td", null, [m.plan_type ? chip(TYPE_LABEL[m.plan_type] + (m.staff_rate ? " (staff)" : ""), m.plan_type === "gym_classes" ? "acc" : "info") : chip("No plan", "plain")]),
        h("td", null, [chip(STATUS_LABEL[m.status] || m.status, STATUS_CHIP[m.status] || "plain"), m.lapsed ? h("span", { style: "margin-left:6px" }, [chip("Not training", "warn")]) : null]),
        h("td", { class: "num", text: m.amount != null ? "£" + Number(m.amount).toFixed(2) + (m.unit === "YEAR" ? "/yr" : m.unit === "MONTH" ? "/mo" : "") : "-" }),
        h("td", { class: "num", text: m.since ? fDate(m.since) : "-" }), h("td", { class: "num", text: m.last_booking ? fDate(m.last_booking) : "-" }),
        h("td", null, [m.role ? chip(ROLE_LABEL[m.role] || m.role, "info") : m.app ? chip("App", "ok") : chip("-", "plain")]),
        h("td", null, [m.marketing === "subscribed" ? chip("Yes", "ok") : m.marketing === "withdrawn" ? chip("Unsubscribed", "warn") : chip("No", "plain")])]));
    });
    var tbl = h("div", { class: "tbl-wrap" }, [h("table", { class: "t" }, [h("thead", null, [h("tr", null, ["Member", "Membership", "Status", "Price", "Member since", "Last booked", "App", "News and offers"].map(function (x) { return h("th", { text: x }); }))]), body])]);
    var actions = [search, typeSel, h("span", { class: "muted", text: rows.length + " people" + (rows.length > shown.length ? " (first 300 shown)" : "") }),
      isAdmin ? h("button", { class: "btn sm", onclick: function () { exportMembers(rows); }, text: "Export this list" }) : null];
    if (memberTab === "lapsed" && can(["admin"])) actions.push(h("a", { class: "btn sm pri", href: "#/marketing", text: "Email them: are you OK?" }));
    root.appendChild(h("section", { class: "card", style: "margin-top:16px" }, [h("div", { class: "bd" }, [bar]), h("div", { class: "toolbar" }, actions), rows.length ? tbl : empty("Nobody matches.")]));
    root.appendChild(h("small", { class: "muted", style: "display:block;margin-top:10px", text: "Wix clients are refreshed every 30 minutes. \"Not training\" means an active member with no booking for 21 days. Membership type and status come from the plan they bought." }));
    return root;
  }
  function exportMembers(rows) {
    downloadCsv("members-" + iso(new Date()) + ".csv", ["Name", "Email", "Phone", "Membership type", "Plan", "Status", "Price", "Billing", "Member since", "Last booked", "App account", "News and offers", "Date of birth"],
      rows.map(function (m) { return [m.name, m.email, m.phone, m.plan_type ? TYPE_LABEL[m.plan_type] : "", m.plan || "", STATUS_LABEL[m.status] || m.status, m.amount == null ? "" : m.amount, m.unit || "", m.since ? String(m.since).slice(0, 10) : "", m.last_booking || "", m.app ? "Yes" : "No", m.marketing === "subscribed" ? "Subscribed" : m.marketing === "withdrawn" ? "Unsubscribed" : "No", m.birthdate || ""]; }));
    toast("Exported " + rows.length + " people.");
  }
  async function exportSubscribers() {
    try { var d = await rpc("admin_subscribers_export"); downloadCsv("email-list-" + iso(new Date()) + ".csv", ["Email", "Name", "Where they signed up", "Confirmed on"], d.map(function (x) { return [x.email, x.name || "", x.source || "", x.confirmed ? String(x.confirmed).slice(0, 10) : ""]; })); toast("Exported " + d.length + " subscribers."); }
    catch (e) { toast(e.message, true); }
  }
  function importDialog() {
    var file = h("input", { type: "file", accept: ".csv,text/csv", class: "in" }), parsed = null;
    var label = h("input", { class: "in", maxlength: "60", placeholder: "Where did this list come from? For example: Wix newsletter 2024" });
    var basis = h("input", { type: "checkbox", id: "impBasis" });
    var out = h("div", { class: "msg", hidden: true }), go = h("button", { class: "btn pri", disabled: true, text: "Import" });
    function say(t, cls) { out.hidden = false; out.className = "msg" + (cls ? " " + cls : ""); out.textContent = t; }
    file.addEventListener("change", function () {
      var f = file.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        var rows = parseCsv(String(rd.result)); if (rows.length < 2) { parsed = null; go.disabled = true; return say("That file has no rows.", "bad"); }
        var head = rows[0].map(function (x) { return x.trim().toLowerCase(); });
        var ie = head.findIndex(function (x) { return /e-?mail/.test(x); }); if (ie < 0) { parsed = null; go.disabled = true; return say("I can't find an email column. The first row should have a heading like Email.", "bad"); }
        var inm = head.findIndex(function (x) { return /^(full )?name$/.test(x) || x === "contact name"; }), ifn = head.findIndex(function (x) { return /first/.test(x); }), iln = head.findIndex(function (x) { return /last/.test(x); });
        var ist = head.findIndex(function (x) { return /subscri|newsletter status|email status/.test(x); });
        var seen = {}, good = [], bad = 0, dup = 0, notSub = 0;
        rows.slice(1).forEach(function (r) {
          var em = (r[ie] || "").trim().toLowerCase();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) { bad++; return; }
          if (ist > -1 && !/^subscribed$/i.test((r[ist] || "").trim())) { notSub++; return; }
          if (seen[em]) { dup++; return; } seen[em] = 1;
          good.push({ email: em, name: (inm > -1 ? r[inm] : [ifn > -1 ? r[ifn] : "", iln > -1 ? r[iln] : ""].join(" ")).trim() });
        });
        parsed = good; go.disabled = !good.length; go.textContent = "Import " + good.length + " people";
        say(good.length + " usable emails. " + (bad ? bad + " were not valid emails. " : "") + (dup ? dup + " repeated. " : "") + (notSub ? notSub + " skipped because the file says they are not subscribed. " : "") + "People who already unsubscribed from you are always skipped.");
      };
      rd.readAsText(f);
    });
    go.addEventListener("click", async function () {
      if (!parsed || !parsed.length) return;
      if (!label.value.trim()) return say("Say where this list came from.", "bad");
      if (!basis.checked) return say("Tick the box to confirm these people agreed to hear from you.", "bad");
      go.disabled = true; say("Importing...");
      try {
        var r = await rpc("admin_import_subscribers", { p_rows: parsed, p_source: label.value.trim(), p_basis: "Imported by staff. " + label.value.trim() + ". Staff confirmed these people agreed to receive news and offers." });
        say("Done. Added " + r.added + ". Already on your list: " + r.already + ". Skipped because they unsubscribed before: " + r.unsubscribed + ".", "ok"); route();
      } catch (e) { go.disabled = false; say(e.message, "bad"); }
    });
    openModal("Import an email list", [h("p", { text: "Choose a CSV file (for example the subscribers export from Wix). It needs an Email column. Names are optional." }), h("div", { class: "field" }, [h("label", { text: "CSV file" }), file]),
      h("div", { class: "field", style: "margin-top:10px" }, [h("label", { text: "Where did this list come from?" }), label]),
      h("label", { style: "display:flex;gap:8px;margin-top:12px;align-items:flex-start;font-size:13.5px" }, [basis, h("span", { text: "I confirm these people agreed to receive news and offers from MY GYM London, and I can show where and when. You are responsible for this under UK data protection law." })]), out],
      [h("button", { class: "btn", onclick: closeModal, text: "Close" }), go]);
  }
  var HEALTH_QS = [["heart", "A doctor has told me I have a heart condition"], ["chest", "I get chest pain when I exercise or at rest"], ["dizzy", "I feel dizzy, or have fainted or lost consciousness"], ["joint", "I have a bone, joint or back problem that exercise could make worse"], ["meds", "I take medication for blood pressure or a heart condition"], ["pregnant", "I am pregnant, or gave birth in the last 6 months"], ["other", "I have another health condition or injury that could affect exercise"]];
  async function addMemberDialog() {
    var F = {}, plans = [];
    var inp = function (id, label, type, ph, max) { var el = h("input", { class: "in", type: type || "text", placeholder: ph || "", maxlength: String(max || 80) }); F[id] = el; return h("div", { class: "field", style: "margin-top:10px" }, [h("label", { text: label }), el]); };
    var chk = function (id, text, on) { var el = h("input", { type: "checkbox", checked: !!on }); F[id] = el; return h("label", { style: "display:flex;gap:8px;margin-top:8px;align-items:flex-start;font-size:13.5px" }, [el, h("span", { text: text })]); };
    var planSel = h("select", { class: "sel" }, [h("option", { value: "", text: "No plan yet" })]), paySel = h("select", { class: "sel" }, [h("option", { value: "in_person", text: "Paid in person (cash or card machine) - record it in Wix" }), h("option", { value: "card_link", text: "They pay by card now - open the Wix checkout" }), h("option", { value: "later", text: "Payment to come later" })]);
    var start = h("input", { class: "in", type: "date", value: iso(new Date()) });
    var hq = HEALTH_QS.map(function (q) { return chk("hq_" + q[0], q[1]); });
    var out = h("div", { class: "msg", hidden: true }), go = h("button", { class: "btn pri", text: "Add member" });
    var say = function (t, cls) { out.hidden = false; out.className = "msg" + (cls ? " " + cls : ""); out.textContent = t; };
    var body = [
      h("div", { class: "sect" }, [h("h4", { text: "1. Their details" }), h("div", { class: "grid g2" }, [inp("first", "First name", "text", "", 60), inp("last", "Last name", "text", "", 60)]), inp("email", "Email (leave empty if they have none)", "email", "name@example.com", 120), inp("phone", "Phone", "tel", "07...", 30), inp("birthdate", "Date of birth (for a birthday hello)", "date"),
        h("div", { class: "grid g2" }, [inp("em_name", "Emergency contact name (optional)", "text", "", 80), inp("em_phone", "Emergency contact phone", "tel", "", 30)])]),
      h("div", { class: "sect" }, [h("h4", { text: "2. Plan and payment" }), h("div", { class: "field" }, [h("label", { text: "Plan" }), planSel]), h("div", { class: "field", style: "margin-top:10px" }, [h("label", { text: "Starts on" }), start]), h("div", { class: "field", style: "margin-top:10px" }, [h("label", { text: "Payment" }), paySel]),
        h("small", { class: "muted", style: "display:block;margin-top:6px", text: "Card numbers are never typed here. Cards go through the secure Wix checkout." })]),
      h("div", { class: "sect" }, [h("h4", { text: "3. Health form (ask them, then tick what they tell you)" })].concat(hq, [chk("hq_none", "None of these apply to them"), inp("allergies", "Allergies (write them, or tick the box below)", "text", "", 300), chk("no_allergies", "They have no allergies"), inp("other_details", "Anything else they told you (optional)", "text", "", 500),
        chk("h_consent", "They agree we may store this health information to keep them safe"), chk("h_true", "They confirm the answers are true")])),
      h("div", { class: "sect" }, [h("h4", { text: "4. Agreements (they agree in person)" }), chk("terms", "They accept the MY GYM London terms and conditions"), chk("privacy", "They have seen the privacy notice"), chk("marketing", "They would like news and offers by email (optional)")]),
      h("div", { class: "sect" }, [h("h4", { text: "5. App" }), chk("create_app", "Create their app login and email them a welcome with a link to set a password (needs an email)", true)]), out];
    openDrawer("Add a member", body, [h("button", { class: "btn", onclick: closeDrawer, text: "Cancel" }), go]);
    fn("admin-add-member", { action: "plans" }, 30).then(function (r) { if (!r.ok) return; plans = r.j.plans || []; plans.forEach(function (p) { planSel.appendChild(h("option", { value: p.id, text: p.name + (p.amount ? " (\u00A3" + p.amount + ")" : "") })); }); });
    go.addEventListener("click", async function () {
      var pl = plans.filter(function (p) { return p.id === planSel.value; })[0] || {}, ans = {}; HEALTH_QS.forEach(function (q) { ans[q[0]] = F["hq_" + q[0]].checked; }); ans.none = F.hq_none.checked;
      go.disabled = true; say("Adding them...");
      var r = await fn("admin-add-member", { action: "create", first: F.first.value, last: F.last.value, email: F.email.value, phone: F.phone.value, birthdate: F.birthdate.value || null, emergency_name: F.em_name.value, emergency_phone: F.em_phone.value,
        plan_id: planSel.value, plan_name: pl.name || "", plan_amount: pl.amount || null, plan_unit: pl.unit || "", start_date: start.value, pay: paySel.value, create_app: F.create_app.checked, taken_by: me.name || "staff",
        health: { answers: ans, no_allergies: F.no_allergies.checked, allergies: F.allergies.value, other_details: F.other_details.value, consent_health: F.h_consent.checked, consent_truthful: F.h_true.checked }, consents: { terms: F.terms.checked, privacy: F.privacy.checked, marketing: F.marketing.checked } }, 90);
      go.disabled = false;
      if (!r.ok) return say(r.j.error || "Something went wrong.", "bad");
      clear(out); out.hidden = false; out.className = "msg ok"; out.appendChild(h("b", { text: "Added. Here is what happened:" }));
      r.j.steps.forEach(function (x) { out.appendChild(h("div", { style: "margin-top:6px" }, [h("b", { text: (x.ok ? "\u2713 " : "\u26A0 ") + x.name + ": " }), document.createTextNode(x.detail || "")])); });
      if (r.j.checkout_link) out.appendChild(h("div", { style: "margin-top:10px" }, [h("a", { class: "btn pri", href: r.j.checkout_link, target: "_blank", rel: "noopener", text: "Open the Wix checkout" })]));
      go.hidden = true; changedMember = true;
    });
  }
  var changedMember = false;
  /* ---------- editing a member: details, pause / resume / cancel, change plan (owner and manager; memberships owner only) ---------- */
  function doneEdit(msg) { toast(msg); closeModal(); closeDrawer(); route(); }
  async function accessCheck() {
    var out = h("div", { class: "msg", text: "Asking Wix..." });
    openModal("Can the back office edit things in Wix?", [h("p", { text: "This sends harmless test requests to Wix, about people and memberships that do not exist, to see whether the connection may make changes. Nothing is changed." }), out], [h("button", { class: "btn", onclick: closeModal, text: "Close" })]);
    var r = await fn("admin-edit-member", { action: "check" }, 60);
    if (!r.ok) { out.className = "msg bad"; out.textContent = r.j.error || "The check did not run."; return; }
    var j = r.j, lines = [["Read people", j.read_contacts.ok], ["Change names, phone numbers and dates of birth", j.edit_contacts.allowed], ["Pause, resume and cancel memberships", j.manage_orders.allowed], ["Record a plan that was paid in person", j.create_offline_order.allowed]];
    var all = lines.every(function (x) { return x[1]; }); clear(out); out.className = "msg " + (all ? "ok" : "bad");
    lines.forEach(function (x) { out.appendChild(h("div", null, [h("b", { text: (x[1] ? "\u2713 " : "\u2717 ") + x[0] })])); });
    if (!all) out.appendChild(h("div", { style: "margin-top:8px", text: "Where there is a cross, the Wix connection used by the back office needs that permission added in Wix. Until then the matching buttons will say that Wix refused." }));
  }
  function editDetailsDialog(m, p) {
    var c = p.contact || {}, parts = String(m.name || "").trim().split(/\s+/), F = {};
    var inp = function (id, label, type, val, max) { var el = h("input", { class: "in", type: type || "text", maxlength: String(max || 80) }); el.value = val || ""; F[id] = el; return h("div", { class: "field", style: "margin-top:10px" }, [h("label", { text: label }), el]); };
    var out = h("div", { class: "msg", hidden: true, style: "margin-top:12px" }), go = h("button", { class: "btn pri", text: "Save changes" });
    var say = function (t, cls) { out.hidden = false; out.className = "msg" + (cls ? " " + cls : ""); out.textContent = t; };
    openModal("Edit details", [h("small", { class: "muted", text: "Changes go to Wix and to the app profile if they have one." }),
      inp("first", "First name", "text", c.first_name || parts[0] || "", 60), inp("last", "Last name", "text", c.last_name != null ? c.last_name : parts.slice(1).join(" "), 60), inp("phone", "Phone", "tel", m.phone || c.phone || "", 30), inp("dob", "Date of birth", "date", m.birthdate ? String(m.birthdate).slice(0, 10) : "", 12),
      h("small", { class: "muted", style: "display:block;margin-top:10px", text: "Email: " + (m.email || "none") + ". To change an email address, do it in Wix." }), out],
      [h("button", { class: "btn", onclick: closeModal, text: "Cancel" }), go]);
    go.addEventListener("click", async function () {
      go.disabled = true; say("Saving...");
      var r = await fn("admin-edit-member", { action: "details", key: m.key || m.email, first: F.first.value, last: F.last.value, phone: F.phone.value, birthdate: F.dob.value }, 60);
      if (!r.ok) { go.disabled = false; return say(r.j.error || "Something went wrong.", "bad"); }
      doneEdit("Saved.");
    });
  }
  function orderDialog(m, o, op) {
    var T = {
      pause: ["Pause this membership?", "Payments stop while it is paused and the time paused is added to the end date. They cannot book while it is paused.", "Pause membership"],
      resume: ["Resume this membership?", "Payments start again and the time paused is added to the end date.", "Resume membership"],
      cancel_end: ["Stop it at the end of the period they have paid for?", "Nothing more is charged and nothing is refunded. They keep their place until the paid period ends, then it stops.", "Stop at end of period"],
      cancel_now: ["Cancel it now?", "It stops straight away. Nothing is refunded here: any refund is done in Wix. This cannot be undone.", "Cancel it now"]
    }[op];
    var out = h("div", { class: "msg", hidden: true, style: "margin-top:12px" }), go = h("button", { class: "btn " + (op === "cancel_now" ? "dng" : "pri"), text: T[2] });
    var say = function (t, cls) { out.hidden = false; out.className = "msg" + (cls ? " " + cls : ""); out.textContent = t; };
    openModal(T[0], [h("p", { text: (m.name || m.email) + ": " + o.plan }), h("p", { text: T[1] }), out], [h("button", { class: "btn", onclick: closeModal, text: "Not now" }), go]);
    go.addEventListener("click", async function () {
      go.disabled = true; say("Working in Wix... this can take a few seconds.");
      var r = await fn("admin-edit-member", { action: "order", key: m.key || m.email, order_id: o.id, op: op }, 60);
      if (!r.ok) { go.disabled = false; return say(r.j.error || "Something went wrong.", "bad"); }
      doneEdit(op === "pause" ? "Paused." : op === "resume" ? "Resumed." : op === "cancel_end" ? "Set to stop at the end of the period." : "Cancelled.");
    });
  }
  async function planDialog(m, o) {
    var plans = [], planSel = h("select", { class: "sel" }, [h("option", { value: "", text: "Loading plans..." })]);
    var whenSel = h("select", { class: "sel" }, [h("option", { value: "now", text: "Now" }), h("option", { value: "period_end", text: "At the end of the period they have paid for" })]);
    var paySel = h("select", { class: "sel" }, [h("option", { value: "in_person", text: "They pay in person now (cash or card machine): recorded in Wix" }), h("option", { value: "card_link", text: "They pay by card on the Wix checkout" })]);
    var out = h("div", { class: "msg", hidden: true, style: "margin-top:12px" }), go = h("button", { class: "btn pri", text: o ? "Change plan" : "Start plan" });
    var say = function (t, cls) { out.hidden = false; out.className = "msg" + (cls ? " " + cls : ""); out.textContent = t; };
    var fld = function (label, el) { return h("div", { class: "field", style: "margin-top:10px" }, [h("label", { text: label }), el]); };
    var note = o ? "The new plan is recorded first, then the old one is stopped. No refund or credit for the old plan is worked out here: do that in Wix if needed. If they pay by card, the old plan is stopped but they must complete the Wix checkout themselves, so tell them before you press the button."
      : "The plan is recorded in Wix for this person. If they pay by card they finish the payment on the Wix checkout.";
    openModal(o ? "Change plan" : "Start a plan", [h("p", { text: (m.name || m.email) + (o ? " is on " + o.plan + "." : " has no plan yet.") }), fld("New plan", planSel), o && o.unit ? fld("When does the old plan stop?", whenSel) : null, fld("Payment", paySel), h("small", { class: "muted", style: "display:block;margin-top:10px", text: note }), out].filter(Boolean), [h("button", { class: "btn", onclick: closeModal, text: "Close" }), go]);
    fn("admin-add-member", { action: "plans" }, 30).then(function (r) {
      clear(planSel); planSel.appendChild(h("option", { value: "", text: r.ok ? "Choose the plan" : "Could not load the plans" }));
      if (r.ok) { plans = r.j.plans || []; plans.forEach(function (x) { planSel.appendChild(h("option", { value: x.id, text: x.name + (x.amount ? " (\u00A3" + x.amount + ")" : "") })); }); }
    });
    go.addEventListener("click", async function () {
      var pl = plans.filter(function (x) { return x.id === planSel.value; })[0]; if (!pl) return say("Choose the plan first.", "bad");
      go.disabled = true; say("Working in Wix... this can take up to a minute.");
      var r = await fn("admin-edit-member", { action: "change_plan", key: m.key || m.email, plan_id: pl.id, plan_name: pl.name, plan_amount: pl.amount || 0, plan_unit: pl.unit || "", when: whenSel.value, pay: paySel.value, old_order_id: o ? o.id : "", first: String(m.name || "").trim().split(/\s+/)[0] || "", name: m.name || "" }, 120);
      var steps = (r.j && r.j.steps) || [];
      if (!r.ok && !steps.length) { go.disabled = false; return say(r.j.error || "Something went wrong.", "bad"); }
      clear(out); out.hidden = false; out.className = "msg " + (r.ok ? "ok" : "bad"); out.appendChild(h("b", { text: r.ok ? "Done. Here is what happened:" : "Something needs your attention:" }));
      steps.forEach(function (x) { out.appendChild(h("div", { style: "margin-top:6px" }, [h("b", { text: (x.ok ? "\u2713 " : "\u26A0 ") + x.name + ": " }), document.createTextNode(x.detail || "")])); });
      if (!r.ok && r.j.error && !steps.length) out.appendChild(h("div", { text: r.j.error }));
      if (r.ok && r.j.checkout_link) out.appendChild(h("div", { style: "margin-top:10px" }, [h("a", { class: "btn pri", href: r.j.checkout_link, target: "_blank", rel: "noopener", text: "Open the Wix checkout" })]));
      go.hidden = true; changedMember = true;
      var fin = h("button", { class: "btn pri", text: "Close and refresh" }); fin.addEventListener("click", function () { doneEdit("Updated."); }); $("modal").querySelector(".row").appendChild(fin);
    });
  }
  function orderActions(m, o) {
    if (!can(["admin"]) || !o.id) return null;
    var b = [];
    function btn(t, op) { return h("button", { class: "btn sm" + (op === "cancel_now" ? " dng" : ""), type: "button", text: t, onclick: function () { orderDialog(m, o, op); } }); }
    if (o.status === "active" || o.status === "failed") {
      b.push(btn("Pause", "pause"));
      if (o.unit && !o.cancelling) b.push(btn("Stop at end of period", "cancel_end"));
      b.push(btn("Cancel now", "cancel_now"));
      b.push(h("button", { class: "btn sm", type: "button", text: "Change plan", onclick: function () { planDialog(m, o); } }));
    } else if (o.status === "paused") { b.push(btn("Resume", "resume")); b.push(btn("Cancel now", "cancel_now")); }
    return b.length ? h("div", { class: "li", style: "justify-content:flex-start;flex-wrap:wrap;gap:6px" }, b) : null;
  }
  async function memberProfile(m) {
    var host = h("div", null, [h("div", { class: "muted", text: "Loading..." })]);
    var foot = m.email ? [h("a", { class: "btn pri", href: "mailto:" + m.email, text: "Email" })] : [];
    if (m.user_id && can(["admin", "manager"])) foot.unshift(h("button", { class: "btn", onclick: function () { showHealth({ id: m.user_id, name: m.name, email: m.email }); }, text: "Health form (logged)" }));
    openDrawer(m.name || m.email, [host], foot);
    try {
      var p = await rpc("admin_member_profile", { p_email: m.key || m.email }); clear(host);
      var kvOf = function (pairs) { var kv = h("dl", { class: "kv" }); pairs.forEach(function (x) { kv.appendChild(h("dt", { text: x[0] })); kv.appendChild(h("dd", { text: x[1] == null || x[1] === "" ? "-" : x[1] })); }); return kv; };
      var c = p.contact || {}, ap = p.app;
      host.appendChild(h("div", { class: "sect" }, [h("div", { style: "display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px" }, [m.plan_type ? chip(TYPE_LABEL[m.plan_type], "acc") : chip("No plan", "plain"), chip(STATUS_LABEL[m.status] || m.status, STATUS_CHIP[m.status] || "plain"), m.lapsed ? chip("Not training", "warn") : null, m.cancelling ? chip("Cancelling", "warn") : null]),
        kvOf([["Email", m.email || "None (phone only)"], ["Phone", m.phone], ["Date of birth", m.birthdate ? fDate(m.birthdate) : "Not given yet"], ["Client since", m.joined ? fDate(m.joined) : "-"], ["Last booked", m.last_booking ? fDate(m.last_booking) : "-"], ["Labels in Wix", (c.labels || []).join(", ")]]),
        can(["admin", "manager"]) ? h("div", { style: "margin-top:12px" }, [h("button", { class: "btn sm", type: "button", text: "Edit details", onclick: function () { editDetailsDialog(m, p); } })]) : null]));
      if (p.manual) { var mm = p.manual, hl = mm.health || {}, cs = mm.consents || {};
        host.appendChild(h("div", { class: "sect" }, [h("h4", { text: "Signed up in person" }), kvOf([["Added by", hl.taken_by || cs.taken_by || "Staff"], ["On", mm.created_at ? fDateTime(mm.created_at) : "-"], ["Health form", "Taken in person" + (hl.consented_at ? " on " + fDate(hl.consented_at) : "")],
          ["Terms and privacy", cs.terms && cs.privacy ? "Accepted in person" : "-"], ["News and offers", cs.marketing ? "Agreed in person" : "No"], ["Emergency contact", [mm.emergency_name, mm.emergency_phone].filter(Boolean).join(", ")], ["Plan", mm.plan_name ? mm.plan_name + (mm.paid_how === "in_person" ? " (paid in person)" : mm.paid_how === "card_link" ? " (card via Wix checkout)" : " (payment still to come)") : "None yet"]])])); }
      var orderRows = [];
      p.orders.forEach(function (o) {
        orderRows.push(h("div", { class: "li" }, [h("div", { class: "tx" }, [h("b", { text: o.plan }), h("small", { text: (o.started ? "From " + fDate(o.started) : "") + (o.ends ? ", ends " + fDate(o.ends) : "") + (o.cancelling ? ", set to stop at the end of the period" : "") + (o.pay ? " · payment " + String(o.pay).toLowerCase() : "") })]), h("span", { class: "num", text: "£" + Number(o.amount || 0).toFixed(2) }), chip(STATUS_LABEL[o.status] || o.status, STATUS_CHIP[o.status] || "plain")]));
        var acts = orderActions(m, o); if (acts) orderRows.push(acts);
      });
      var hasLive = p.orders.some(function (o) { return o.status === "active" || o.status === "failed" || o.status === "paused"; });
      host.appendChild(h("div", { class: "sect" }, [h("h4", { text: "Membership and payments" }), orderRows.length ? h("div", { class: "list" }, orderRows) : h("div", { class: "muted", text: "No membership purchased." }),
        can(["admin"]) && !hasLive && (m.email || "") ? h("button", { class: "btn sm", style: "margin-top:10px", type: "button", text: "Start a plan", onclick: function () { planDialog(m, null); } }) : null]));
      host.appendChild(h("div", { class: "sect" }, [h("h4", { text: "App and emails" }), kvOf([["App account", ap ? "Yes, joined " + fDate(ap.created) : "No"], ["Bookings in the app", ap ? ap.bookings : "-"], ["Health form", ap ? (ap.health_form ? "Done" : "Missing") : "-"],
        ["News and offers", p.consent ? (p.consent.withdrawn ? "Unsubscribed " + fDate(p.consent.withdrawn) : p.consent.confirmed ? "Subscribed " + fDate(p.consent.confirmed) + (p.consent.source ? " (" + p.consent.source + ")" : "") : "Waiting to confirm") : "Not subscribed"], ["Wix newsletter status", (c.subscription || "-").replace(/_/g, " ").toLowerCase()]])]));
      if (p.bookings.length) host.appendChild(h("div", { class: "sect" }, [h("h4", { text: "Recent bookings" }), h("div", { class: "list" }, p.bookings.slice(0, 8).map(function (b) { return h("div", { class: "li" }, [h("div", { class: "tx" }, [h("b", { text: b.name }), h("small", { text: fDate(b.date) + " at " + String(b.time).slice(0, 5) })])]); }))]));
      if (p.forms.length) host.appendChild(h("div", { class: "sect" }, [h("h4", { text: "Forms they sent" }), h("div", { class: "list" }, p.forms.map(function (f) { return h("div", { class: "li" }, [h("div", { class: "tx" }, [h("b", { text: FORMS[f.form] || f.form }), h("small", { text: fDateTime(f.at) })]), chip(f.status || "new", "plain")]); }))]));
      if (p.emails.length) host.appendChild(h("div", { class: "sect" }, [h("h4", { text: "Emails sent to them" }), h("div", { class: "list" }, p.emails.slice(0, 8).map(function (e) { return h("div", { class: "li" }, [h("div", { class: "tx" }, [h("b", { text: e.template }), h("small", { text: fDateTime(e.at) })]), e.status === "sent" ? chip("Sent", "ok") : chip(e.status, "warn")]); }))]));
      var note = h("textarea", { class: "in", rows: "2", placeholder: "Add a private note (for example: called Tuesday, will return after holiday)", maxlength: "2000" }), nl = h("div", { class: "list", style: "margin-top:10px" });
      var drawNotes = function (ns) { clear(nl); ns.forEach(function (n) { nl.appendChild(h("div", { class: "li" }, [h("div", { class: "tx" }, [h("b", { text: n.note, style: "font-weight:500;white-space:pre-wrap" }), h("small", { text: n.by + " · " + fDateTime(n.at) })]),
        can(["admin", "manager"]) ? h("button", { class: "btn sm", onclick: async function () { try { await rpc("admin_member_note_delete", { p_id: n.id }); ns = ns.filter(function (x) { return x.id !== n.id; }); drawNotes(ns); } catch (e) { toast(e.message, true); } }, text: "Delete" }) : null])); }); if (!ns.length) nl.appendChild(h("div", { class: "muted", text: "No notes yet." })); };
      drawNotes(p.notes);
      host.appendChild(h("div", { class: "sect" }, [h("h4", { text: "Notes" }), note, h("button", { class: "btn sm", style: "margin-top:8px", onclick: async function () { try { await rpc("admin_member_note_add", { p_email: m.key || m.email, p_note: note.value }); var np = await rpc("admin_member_profile", { p_email: m.key || m.email }); note.value = ""; drawNotes(np.notes); } catch (e) { toast(e.message, true); } }, text: "Save note" }), nl]));
    } catch (e) { clear(host).appendChild(h("div", { class: "muted", text: e.message })); }
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
    root.appendChild(pageHead("Messages", "Everything sent through the website forms. Marking an enquiry Joined, Not now or Spam stops the follow-up emails to that person.",
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
      h("div", { class: "head" }, [h("b", { text: name }), h("span", { class: "muted", text: (FORMS[r.form_id] || (r.data && r.data.form_title) || r.form_id) + " · " + fDateTime(r.created_at) }), chip(STATUS[r.status] || r.status, r.status === "new" ? "bad" : r.status === "joined" ? "ok" : "plain")]),
      h("div", { class: "contact" }, links), dl, note, btns])]);
  }

  /* ---------- automatic emails: change the wording, switch on or off ---------- */
  var AUTO = null;
  async function loadAuto() {
    if (AUTO) return AUTO;
    var r = await fetch("auto-emails.json?v=20261113", { cache: "no-cache" });
    if (!r.ok) throw new Error("The list of automatic emails could not be loaded.");
    AUTO = await r.json(); return AUTO;
  }
  function emailName(id) { var t = id.replace(/-/g, " "); return t.charAt(0).toUpperCase() + t.slice(1); }
  var PH_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  // wording editor for one automatic email (a side panel). Only subject, preview line, heading, button text and paragraphs can change; the rest stays as built.
  function emailEditor(e, ov, globals, onChange) {
    ov = ov || {}; var b = ov.body || {}, F = {};
    var allowed = {}; e.needs.concat(globals).forEach(function (k) { allowed[k] = 1; });
    function field(id, label, val, max, tag, hint) {
      var el = h(tag || "input", { class: "in", id: id, maxlength: String(max) }); if (tag === "textarea") el.rows = 4; el.value = val || ""; F[id] = el;
      return h("div", { class: "field" }, [h("label", { for: id, text: label }), el, hint ? h("small", { class: "muted", text: hint }) : null]);
    }
    var paraVals = e.paras.map(function (d, i) { return b.paragraphs && typeof b.paragraphs[i] === "string" && b.paragraphs[i].trim() ? b.paragraphs[i] : d; });
    var blocks = [
      h("div", { class: "banner" }, [h("div", null, [h("b", { text: "When it is sent: " }), document.createTextNode(e.when + ". ")]), ]),
      field("eSubject", "Subject line", ov.subject || e.subject, 200, null, ""),
      field("ePre", "Preview line (the grey text after the subject)", b.pre || e.pre, 300, null, ""),
      field("eTitle", "Heading inside the email", b.title || e.title, 200, null, "")
    ];
    if (e.cta) blocks.push(field("eCta", "Button text", b.cta_label || e.cta, 80, null, "The button link cannot be changed here."));
    paraVals.forEach(function (v, i) { blocks.push(field("eP" + i, e.paras.length > 1 ? "Paragraph " + (i + 1) : "Paragraph", v, 1500, "textarea", i === 0 && /^Hi /.test(e.paras[0]) ? "This is the greeting line." : "")); });
    if (!e.paras.length) blocks.push(h("small", { class: "muted", text: "This email has no paragraphs you can change; everything else about it is built in." }));
    var ph = Object.keys(allowed).filter(function (k) { return e.needs.indexOf(k) > -1; });
    blocks.push(h("div", { class: "field" }, [h("label", { text: "You can put these in any text, exactly like this" }), h("small", { class: "muted", style: "word-break:break-word", text: ph.length ? ph.map(function (k) { return "{{" + k + "}}"; }).join("  ") : "No personal details are filled in for this email." }), h("small", { class: "muted", text: "They are replaced by the real details when the email is sent. Fixed details such as {{gym_email}}, {{gym_address}} and {{app_url}} also work. Anything else in double curly brackets is refused." })]));
    if (e.fixed.length) blocks.push(h("div", { class: "field" }, [h("label", { text: "Also in this email (fixed, cannot be changed here)" }), h("ul", { class: "muted", style: "margin:0;padding-left:18px;font-size:13px;display:grid;gap:4px" }, e.fixed.map(function (f) { return h("li", { text: f.k + ": " + f.t }); }))]));
    var out = h("div", { class: "msg", hidden: true });
    blocks.push(out);
    function say(t, cls) { out.hidden = false; out.className = "msg" + (cls ? " " + cls : ""); out.textContent = t; }
    function val(id) { return (F[id].value || "").trim(); }
    function problem() {
      var ids = ["eSubject", "ePre", "eTitle"].concat(e.cta ? ["eCta"] : []).concat(e.paras.map(function (_, i) { return "eP" + i; })), unknown = {};
      ids.forEach(function (id) { (val(id).match(PH_RE) || []).forEach(function (m) { var k = m.replace(/[{}\s]/g, ""); if (!allowed[k]) unknown[k] = 1; }); });
      var u = Object.keys(unknown); if (u.length) return "These do not exist for this email: " + u.map(function (k) { return "{{" + k + "}}"; }).join(", ") + ". Use only the ones listed above.";
      if (!val("eSubject")) return "The subject cannot be empty.";
      if (!val("eTitle")) return "The heading cannot be empty.";
      if (e.cta && !val("eCta")) return "The button text cannot be empty.";
      for (var i = 0; i < e.paras.length; i++) if (!val("eP" + i)) return "Every paragraph needs some text.";
      return "";
    }
    function diff(id, def) { var v = val(id); return v && v !== def ? v : ""; }
    async function save() {
      var bad = problem(); if (bad) { say(bad, "bad"); return false; }
      var paras = e.paras.map(function (_, i) { return val("eP" + i); }), pchanged = paras.some(function (x, i) { return x !== e.paras[i]; });
      var args = { p_template: e.id, p_subject: diff("eSubject", e.subject), p_pre: diff("ePre", e.pre), p_title: diff("eTitle", e.title), p_cta: e.cta ? diff("eCta", e.cta) : "", p_paras: pchanged ? paras : null };
      await rpc("admin_email_override_save", args);
      var body = {}; if (args.p_pre) body.pre = args.p_pre; if (args.p_title) body.title = args.p_title; if (args.p_cta) body.cta_label = args.p_cta; if (args.p_paras) body.paragraphs = args.p_paras;
      onChange({ template_id: e.id, subject: args.p_subject || null, body: Object.keys(body).length ? body : null, enabled: ov.enabled !== false });
      ov = { subject: args.p_subject || null, body: Object.keys(body).length ? body : null, enabled: ov.enabled !== false };
      return true;
    }
    var bSave = h("button", { class: "btn pri", type: "button", text: "Save wording" }), bTest = h("button", { class: "btn", type: "button", text: "Send me a test" }), bReset = h("button", { class: "btn dng", type: "button", text: "Back to the original" });
    function lock(x) { bSave.disabled = x; bTest.disabled = x; bReset.disabled = x; }
    bSave.addEventListener("click", async function () { lock(true); try { if (await save()) say("Saved. New emails use this wording straight away.", "ok"); } catch (er) { say(er.message, "bad"); } lock(false); });
    bTest.addEventListener("click", async function () {
      lock(true); say("Saving and sending a test to your own email...");
      try { if (!(await save())) { lock(false); return; } } catch (er) { lock(false); return say(er.message, "bad"); }
      var r = await fn("admin-email-test", { template: e.id, vars: e.sample }, 40); lock(false);
      if (!r.ok) return say(r.j.error || "Something went wrong.", "bad");
      say(r.j.note ? r.j.note : "Test sent to " + (r.j.sent_to || "your email") + ". It uses example names and dates, and its subject starts with [TEST].", r.j.note ? "bad" : "ok");
    });
    bReset.addEventListener("click", async function () {
      if (bReset.dataset.sure !== "1") { bReset.dataset.sure = "1"; bReset.textContent = "Yes, restore the original"; return say("This throws away your wording for this email. Press the red button again to confirm.", "bad"); }
      lock(true);
      try { await rpc("admin_email_override_reset", { p_template: e.id }); onChange({ template_id: e.id, subject: null, body: null, enabled: ov.enabled !== false }); toast("Original wording restored."); closeDrawer(); }
      catch (er) { lock(false); say(er.message, "bad"); }
    });
    openDrawer(emailName(e.id), blocks, [bReset, bTest, bSave]);
  }
  async function autoEmailsCard() {
    var data = await loadAuto(), ovs = await rpc("admin_email_overrides"), map = {};
    ovs.forEach(function (o) { map[o.template_id] = o; });
    var box = h("div"), open = {};
    function draw() {
      box.textContent = "";
      var edited = 0, off = 0; data.emails.forEach(function (e) { var o = map[e.id]; if (o && (o.subject || o.body)) edited++; if (o && o.enabled === false) off++; });
      box.appendChild(h("p", { class: "muted", style: "margin:0 0 12px", text: data.emails.length + " automatic emails. " + edited + " with your own wording, " + off + " switched off. A change applies to the next email sent; emails already sent are not changed." }));
      var groups = []; data.emails.forEach(function (e) { if (groups.indexOf(e.group) < 0) groups.push(e.group); });
      groups.forEach(function (g) {
        var items = data.emails.filter(function (e) { return e.group === g; });
        var d = h("details", { class: "grp" }); if (open[g]) d.open = true;
        d.addEventListener("toggle", function () { open[g] = d.open; });
        d.appendChild(h("summary", { text: g + " (" + items.length + ")" }));
        d.appendChild(h("div", { class: "list" }, items.map(function (e) {
          var o = map[e.id] || null, isOff = !!o && o.enabled === false, isEdited = !!o && !!(o.subject || o.body);
          var sw = h("button", { class: "btn sm", type: "button", text: isOff ? "Switch on" : "Switch off" });
          sw.addEventListener("click", async function () {
            if (!isOff && sw.dataset.sure !== "1") { sw.dataset.sure = "1"; sw.className = "btn sm dng"; sw.textContent = "Yes, stop sending"; setTimeout(function () { if (sw.isConnected) { sw.dataset.sure = ""; sw.className = "btn sm"; sw.textContent = "Switch off"; } }, 4000); return; }
            sw.disabled = true;
            try { await rpc("admin_email_set_enabled", { p_template: e.id, p_enabled: isOff }); var cur = map[e.id] || { template_id: e.id, subject: null, body: null }; cur.enabled = isOff; map[e.id] = cur; toast(isOff ? "Switched on." : "Switched off. Nobody will get this email until you switch it on."); draw(); }
            catch (er) { sw.disabled = false; toast(er.message, true); }
          });
          return h("div", { class: "li" }, [h("div", { class: "tx" }, [h("b", { text: emailName(e.id) }), h("small", { text: e.when })]),
            isOff ? chip("Switched off", "warn") : null, isEdited ? chip("Your wording", "info") : null, e.marketing ? chip("Needs consent", "plain") : null,
            h("button", { class: "btn sm", type: "button", text: "Edit wording", onclick: function () { emailEditor(e, map[e.id], data.globals, function (row) { map[e.id] = row; draw(); }); } }), sw]);
        })));
        box.appendChild(d);
      });
    }
    draw();
    return card("Automatic emails", "edit the wording or switch one off", [box, h("small", { class: "muted", style: "display:block;margin-top:10px", text: "Sign-in emails (password reset and similar) and campaigns are not in this list. Campaigns are written on the Marketing page." })]);
  }

  /* ---------- emails ---------- */
  async function vEmails() {
    var d = await rpc("admin_emails", { p_limit: 150 }), root = h("div");
    root.appendChild(pageHead("Emails", "Change the wording of the automatic emails, switch one off, and see what was sent and whether it was delivered."));
    var sent = 0, failed = 0; d.by_template_30d.forEach(function (t) { sent += t.sent; failed += t.failed; });
    root.appendChild(h("div", { class: "grid g3" }, [kpi("Sent in 30 days", sent), kpi("Failed in 30 days", failed, failed ? "see the list below" : "all delivered", failed > 0), kpi("Types of email used", d.by_template_30d.length)]));
    if (can(["admin"])) { try { root.appendChild(h("div", { style: "margin-top:16px" }, [await autoEmailsCard()])); } catch (er) { root.appendChild(errBox(er)); } }
    var byT = h("div", { class: "tbl-wrap" }, [h("table", { class: "t", style: "min-width:0" }, [h("thead", null, [h("tr", null, [h("th", { text: "Email" }), h("th", { class: "r", text: "Sent" }), h("th", { class: "r", text: "Failed" })])]),
      h("tbody", null, d.by_template_30d.map(function (t) { return h("tr", { style: "cursor:default" }, [h("td", { text: t.template }), h("td", { class: "num r", text: t.sent }), h("td", { class: "num r", text: t.failed })]); }))])]);
    var log = h("div", { class: "tbl-wrap" }, [h("table", { class: "t" }, [h("thead", null, [h("tr", null, ["When", "Email", "To", "Result"].map(function (x) { return h("th", { text: x }); }))]),
      h("tbody", null, d.recent.map(function (e) { return h("tr", { style: "cursor:default" }, [h("td", { class: "num", text: fDateTime(e.at) }), h("td", { text: e.template }), h("td", { text: e.to || "" }), h("td", null, [e.status === "sent" ? chip("Sent", "ok") : chip(e.status, "bad"), e.status !== "sent" && e.detail ? h("small", { class: "block muted", text: e.detail }) : null])]); }))])]);
    root.appendChild(h("div", { class: "grid g2", style: "margin-top:16px;align-items:start" }, [card("Last 30 days by email", "", [d.by_template_30d.length ? byT : empty("Nothing sent yet.")]), card("Latest sends", "most recent first", [d.recent.length ? log : empty("Nothing sent yet.")])]));
    return root;
  }

  /* ---------- email templates: your own library, used by every new email and campaign ---------- */
  var pendingTpl = null;
  function templateEditor(t, done) {
    var isNew = !t.id, F = {};
    var f = function (id, label, max, tag, ph) { var el = h(tag || "input", { class: "in", maxlength: String(max), placeholder: ph || "" }); if (tag === "textarea") el.rows = 8; el.value = t[id] || ""; F[id] = el; return h("div", { class: "field", style: "margin-top:10px" }, [h("label", { text: label }), el]); };
    var out = h("div", { class: "msg", hidden: true }), save = h("button", { class: "btn pri", text: "Save template" });
    save.addEventListener("click", async function () {
      save.disabled = true;
      try { await rpc("admin_template_save", { p_id: t.id || null, p_name: F.name.value, p_subject: F.subject.value, p_preheader: F.preheader.value, p_title: F.title.value, p_body: F.body.value, p_button: F.button.value, p_url: F.url.value }); closeDrawer(); done(); }
      catch (e) { save.disabled = false; out.hidden = false; out.className = "msg bad"; out.textContent = e.message; }
    });
    openDrawer(isNew ? "New template" : "Edit template", [h("div", { class: "sect" }, [h("p", { class: "muted", text: "Every email you send uses the same MY GYM look: red header, your heading, your message, a button and the footer with the unsubscribe link. A template just saves the words. Use [square brackets] for the parts to fill in each time." }),
      f("name", "Template name", 60, null, "For example: Summer timetable"), f("subject", "Subject line", 78), f("preheader", "Preview text (optional)", 120), f("title", "Heading inside the email", 60), f("body", "Message", 3000, "textarea"), f("button", "Button text", 40), f("url", "Button link (https://)", 300), out])],
      [h("button", { class: "btn", onclick: closeDrawer, text: "Cancel" }), save]);
  }
  async function vTemplates() {
    var list = await rpc("admin_templates_list"), root = h("div");
    root.appendChild(pageHead("Email templates", "Ready-made wording for emails and campaigns. Pick one when you write a new email, change it any time, or save your own.", [h("button", { class: "btn pri", onclick: function () { templateEditor({}, route); }, text: "New template" })]));
    var cards = h("div", { class: "grid g2" });
    list.forEach(function (t) {
      cards.appendChild(h("section", { class: "card" }, [h("div", { class: "hd" }, [h("h3", { text: t.name })]), h("div", { class: "bd" }, [h("div", { class: "muted", style: "font-size:12px", text: "Subject" }), h("div", { text: t.subject || "-" }), h("div", { class: "muted", style: "font-size:12px;margin-top:8px", text: "Message" }), h("div", { style: "white-space:pre-wrap;max-height:110px;overflow:hidden", text: t.body }),
        h("div", { style: "display:flex;gap:8px;margin-top:12px;flex-wrap:wrap" }, [h("button", { class: "btn sm pri", onclick: function () { pendingTpl = t; location.hash = "#/marketing"; }, text: "Send this" }), h("button", { class: "btn sm", onclick: function () { templateEditor(t, route); }, text: "Edit" }),
          h("button", { class: "btn sm", onclick: function () { templateEditor(Object.assign({}, t, { id: null, name: t.name + " (copy)" }), route); }, text: "Duplicate" }),
          h("button", { class: "btn sm dng", onclick: async function () { try { await rpc("admin_template_delete", { p_id: t.id }); toast("Deleted."); route(); } catch (e) { toast(e.message, true); } }, text: "Delete" })])])]));
    });
    root.appendChild(list.length ? cards : empty("No templates yet. Press New template."));
    root.appendChild(h("small", { class: "muted", style: "display:block;margin-top:14px", text: "The automatic emails (booking confirmations, receipts, reminders and so on) keep their own wording and share this same look. Their wording can be changed on request." }));
    return root;
  }
  /* ---------- campaigns: history, audience, scheduling, delivery results ---------- */
  var CAMP_TEMPLATES = [
    { n: "New class", subject: "A new class at MY GYM", title: "A new class is on the timetable", body: "We have added [class name] on [day] at [time].\n\nPlaces are limited, so book yours in the app before it fills up.", btn: "Book your place", url: "https://app.mygymlondon.co.uk" },
    { n: "Offer", subject: "A special offer for you", title: "Something for our members", body: "[Describe the offer in one or two sentences.]\n\nIt runs until [date]. Reply to this email or ask at the front desk if you have any questions.", btn: "See the offer", url: "https://www.mygymlondon.co.uk" },
    { n: "Gym news", subject: "News from MY GYM London", title: "What is new at the gym", body: "[Write your news here.]\n\nThank you for training with us.", btn: "Read more", url: "https://www.mygymlondon.co.uk" },
    { n: "Are you OK?", subject: "We have missed you at MY GYM", title: "Is everything OK?", body: "We have not seen you for a little while and wanted to check in.\n\nIf something is getting in the way, a busy week, an injury or just low motivation, reply to this email and we will help you find a way back. A short session is always better than none.", btn: "See this week's timetable", url: "https://app.mygymlondon.co.uk" },
    { n: "Bring a friend", subject: "Bring a friend to MY GYM", title: "Train with a friend", body: "Know someone who would love MY GYM? Refer a friend and when they buy a plan, we take 100% off the first billing cycle of your membership.\n\nEmail us your name and your friend's name to get started.", btn: "Email us", url: "https://www.mygymlondon.co.uk/refer-friends.html" }
  ];
  var SEGMENTS = [
    { id: "all", label: "Everyone on my email list" },
    { id: "active_clients", label: "Active clients (paying now)" },
    { id: "gym_classes", label: "Active: Gym + Classes members" },
    { id: "classes_only", label: "Active: Classes-only members" },
    { id: "lapsed", label: "Active but not training for 3 weeks" },
    { id: "paused_clients", label: "Paused clients" },
    { id: "former_clients", label: "Former clients (cancelled or ended)" },
    { id: "members", label: "People with an app account" },
    { id: "active30", label: "App members who booked in the last 30 days" },
    { id: "leads", label: "Website sign-ups without an app account" }
  ];
  // One-off service notices: no marketing consent needed, so the audiences are clients by status, app users, or addresses typed in.
  var NOTICE_SEGMENTS = [
    { id: "active_clients", label: "Active clients (paying now)" },
    { id: "inactive_clients", label: "Not active: paused, cancelled or ended clients" },
    { id: "paused_clients", label: "Paused clients only" },
    { id: "former_clients", label: "Former clients only (cancelled or ended)" },
    { id: "app_users", label: "Everyone with an app account" },
    { id: "custom", label: "Only the email addresses I type below" }
  ];
  var NOTICE_TEMPLATES = [
    { name: "Closure", subject: "MY GYM London is closed on [date]", preheader: "Please read before you travel to the gym", title: "We are closed on [date]", body: "MY GYM London will be closed on [date] because [reason]. We open again on [date].\n\nIf you are booked into a class on that day, we will contact you. Sorry for the inconvenience.", button: "See the timetable", url: "https://app.mygymlondon.co.uk" },
    { name: "Timetable change", subject: "A change to the timetable", preheader: "[Class] has moved", title: "Timetable change", body: "From [date], [class] moves from [old time] to [new time].\n\nIf the new time does not work for you, reply to this email and we will help.", button: "See the timetable", url: "https://app.mygymlondon.co.uk" },
    { name: "Opening hours", subject: "New opening hours at MY GYM London", preheader: "Effective from [date]", title: "Our opening hours are changing", body: "From [date], the gym will be open [new hours].\n\nThe classes on the timetable are not affected.", button: "See the timetable", url: "https://app.mygymlondon.co.uk" }
  ];
  function segLabel(id, kind) { var list = kind === "notice" ? NOTICE_SEGMENTS : SEGMENTS, s = list.filter(function (x) { return x.id === id; })[0]; return s ? s.label : id; }
  // "2026-11-14T09:00" typed as London wall-clock time -> the exact moment (ISO, UTC)
  function londonToIso(s) {
    var asUtc = Date.parse(s + ":00Z"); if (isNaN(asUtc)) return null;
    function off(ms) {
      var p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(ms)).reduce(function (a, x) { a[x.type] = x.value; return a; }, {});
      return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - ms;
    }
    var t = asUtc - off(asUtc); t = asUtc - off(t); return new Date(t).toISOString();
  }
  function statusChip(c) {
    if (c.status === "scheduled") return chip("Scheduled " + fDateTime(c.scheduled_for), "info");
    if (c.status === "sending") return chip("Sending", "warn");
    if (c.status === "sent") return chip(c.failed ? "Sent, " + c.failed + " failed" : "Sent", c.failed ? "warn" : "ok");
    return chip("Draft", "plain");
  }

  function campaignCard(cur, counts, done, close, tpls, ncounts) {
    function newForm() { return { id: null, kind: "marketing", extra_emails: "", subject: "", preheader: "", title: "", body: "", button: "", url: "", segment: "all", status: "draft" }; }
    var c = cur || newForm();
    var kind = c.kind === "notice" ? "notice" : "marketing";
    var editable = c.status === "draft";
    var F = {};
    function fld(id, label, ph, max, tag, hint, val) {
      var el = h(tag || "input", { class: "in", id: id, maxlength: String(max || 200), placeholder: ph || "" }); if (tag === "textarea") el.rows = 7; el.value = val || ""; if (!editable) el.disabled = true; F[id] = el;
      var cnt = h("small", { class: "muted", text: "" }); el._cnt = cnt;
      return h("div", { class: "field", style: "margin-top:12px" }, [h("div", { style: "display:flex;justify-content:space-between;gap:8px" }, [h("label", { for: id, text: label }), cnt]), el, hint ? h("small", { class: "muted", text: hint }) : null]);
    }
    var templates = editable ? h("div", { style: "display:flex;gap:8px;flex-wrap:wrap;margin-bottom:4px" }) : null;
    function drawTpls() {
      if (!templates) return; templates.textContent = "";
      (kind === "notice" ? NOTICE_TEMPLATES : []).concat(tpls || []).forEach(function (t) {
        templates.appendChild(h("button", { class: "btn sm", type: "button", text: t.name, onclick: function () { F.cSubject.value = t.subject; F.cPre.value = t.preheader || ""; F.cTitle.value = t.title; F.cBody.value = t.body; F.cBtn.value = t.button; F.cUrl.value = t.url; changed(); } }));
      });
      templates.appendChild(h("a", { class: "btn sm", href: "#/templates", text: "Manage templates" }));
    }
    var seg = h("select", { class: "sel", id: "cSeg" });
    function drawSeg(keep) {
      var list = kind === "notice" ? NOTICE_SEGMENTS : SEGMENTS, cn = kind === "notice" ? (ncounts || {}) : counts;
      seg.textContent = "";
      list.forEach(function (x) { seg.appendChild(h("option", { value: x.id, text: x.label + (x.id === "custom" ? "" : " (" + (cn[x.id] == null ? "?" : cn[x.id]) + ")") })); });
      seg.value = list.some(function (x) { return x.id === keep; }) ? keep : list[0].id;
    }
    drawSeg(c.segment); if (!editable) seg.disabled = true;
    var kindSel = h("select", { class: "sel", id: "cKind", disabled: !editable }, [h("option", { value: "marketing", text: "News or offer (marketing): only people who subscribed" }), h("option", { value: "notice", text: "Service notice: information people need (closure, timetable change)" })]);
    kindSel.value = kind;
    var extra = h("textarea", { class: "in", id: "cExtra", maxlength: "6000", placeholder: "name@example.com, another@example.com" }); extra.rows = 3; extra.value = c.extra_emails || ""; if (!editable) extra.disabled = true;
    var extraBox = h("div", { class: "field", style: "margin-top:12px" }, [h("label", { for: "cExtra", text: "Extra email addresses (optional)" }), extra, h("small", { class: "muted", text: "Separate with commas, spaces or new lines. Up to 300. They get this notice as well as the group above." })]);
    var svc = h("input", { type: "checkbox", id: "cSvc", disabled: !editable });
    var svcBox = h("label", { style: "display:flex;gap:8px;margin-top:12px;align-items:flex-start;font-size:13.5px" }, [svc, h("span", { text: "I confirm this is service information people need, not an offer or promotion." })]);
    var noticeNote = h("div", { class: "banner", style: "margin-top:12px" }, [h("div", null, [h("b", { text: "Service notice. " }), document.createTextNode("It goes out even to people who unsubscribed from marketing, and it has no unsubscribe link. Use it only for information people need: a closure, a timetable change, news about their account. Anything promotional must be a marketing email instead. People who marked an email as spam are always left out.")])]);
    var when = h("input", { class: "in", id: "cWhen", type: "datetime-local", disabled: !editable });
    var whenHint = h("small", { class: "muted", text: "London time." });
    var mode = h("select", { class: "sel", id: "cMode", disabled: !editable }, [h("option", { value: "now", text: "Send as soon as I press send" }), h("option", { value: "later", text: "Schedule for a later time" })]);
    var segHint = h("small", { class: "muted", text: "" });
    var form = h("div", null, [
      h("div", { class: "field" }, [h("label", { for: "cKind", text: "What kind of email" }), kindSel]),
      editable ? h("div", { class: "field", style: "margin-top:12px" }, [h("label", { text: "Start from a template (you can change everything)" }), templates]) : null,
      h("div", { class: "field", style: "margin-top:12px" }, [h("label", { for: "cSeg", text: "Who gets it" }), seg, segHint]),
      extraBox,
      fld("cSubject", "Subject line", "What people see first in their inbox", 78, null, "Short and specific works best. Up to 78 characters.", c.subject),
      fld("cPre", "Preview text (optional)", "The grey line after the subject in the inbox", 120, null, "", c.preheader),
      fld("cTitle", "Heading inside the email", "", 60, null, "", c.title),
      fld("cBody", "Message", "Write the message. Leave a blank line between paragraphs.", 3000, "textarea", "", c.body),
      fld("cBtn", "Button text", "For example: Book your place", 40, null, "", c.button),
      fld("cUrl", "Button link", "https://", 300, null, "Must start with https://", c.url),
      noticeNote, editable ? svcBox : null,
      editable ? h("div", { class: "grid g2", style: "margin-top:12px" }, [h("div", { class: "field" }, [h("label", { for: "cMode", text: "When" }), mode]), h("div", { class: "field", id: "cWhenBox", hidden: true }, [h("label", { for: "cWhen", text: "Send at" }), when, whenHint])]) : null
    ]);
    drawTpls();
    /* live preview of the inbox line and the opened email */
    var pvSubject = h("b"), pvPre = h("span", { class: "muted" }), pvTitle = h("h2", { style: "margin:0 0 10px;font-size:20px" }), pvBody = h("div"), pvBtn = h("span", { style: "display:inline-block;margin-top:14px;padding:11px 18px;border-radius:8px;background:#e03939;color:#fff;font-weight:700" });
    var pvFoot = h("div", { style: "padding:12px 18px;border-top:1px solid #eee;font-size:11.5px;color:#777" });
    var preview = h("div", null, [
      h("div", { class: "muted", style: "font-size:12px;margin-bottom:6px", text: "In the inbox" }),
      h("div", { style: "border:1px solid var(--line);border-radius:8px;padding:10px 12px;background:var(--panel);margin-bottom:14px" }, [h("div", { style: "font-size:12px;color:var(--mut)", text: "MY GYM London" }), h("div", null, [pvSubject, document.createTextNode("  "), pvPre])]),
      h("div", { class: "muted", style: "font-size:12px;margin-bottom:6px", text: "Opened email" }),
      h("div", { style: "border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#fff;color:#222" }, [
        h("div", { style: "background:#111;color:#fff;padding:14px 18px;font-weight:800;letter-spacing:.04em", text: "MY GYM LONDON" }),
        h("div", { style: "padding:20px 18px" }, [pvTitle, pvBody, pvBtn]),
        pvFoot
      ])
    ]);
    var checks = h("ul", { style: "list-style:none;margin:0;padding:0;display:grid;gap:6px;font-size:13.5px" });
    var out = h("div", { class: "msg", hidden: true, style: "margin-top:12px" });
    var bSave = h("button", { class: "btn", type: "button", text: "Save draft" }), bTest = h("button", { class: "btn", type: "button", text: "Send me a test" }), bGo = h("button", { class: "btn pri off", type: "button", text: "" });
    var saved = false;
    var bClose = h("button", { class: "btn sm", type: "button", text: "Close", onclick: function () { if (saved) done(); else close(); } });
    var testedFor = "", armed = false, busy = false, confirming = false, savedId = c.id;
    function v(id) { return (F[id].value || "").trim(); }
    function sig() { return [kind, v("cSubject"), v("cPre"), v("cTitle"), v("cBody"), v("cBtn"), v("cUrl")].join("\u0001"); }
    function later() { return mode.value === "later"; }
    function whenIso() { return later() && when.value ? londonToIso(when.value) : null; }
    var noticeN = 0, noticeKey = "", noticeTimer = null;
    function n() { if (kind === "notice") return noticeN; var k = counts[seg.value]; return k == null ? 0 : k; }
    function plural(k) { return k + (kind === "notice" ? " recipient" : " subscriber") + (k === 1 ? "" : "s"); }
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    function extraTokens() { return extra.value.toLowerCase().split(/[\s,;]+/).filter(Boolean); }
    // the exact number of people a notice reaches (groups and typed addresses overlap), asked from the database
    function refreshNotice() {
      if (kind !== "notice") return;
      var key = seg.value + "\u0001" + extra.value.trim();
      if (key === noticeKey) return;
      noticeKey = key; noticeN = 0; clearTimeout(noticeTimer);
      noticeTimer = setTimeout(async function () {
        var k0 = key, r = 0;
        try { r = await rpc("admin_notice_count", { p_segment: seg.value, p_extra: extra.value }); } catch (e) { r = 0; }
        if (k0 === noticeKey) { noticeN = r || 0; changed(); }
      }, 250);
    }
    var ph = /\[[^\]]{2,}\]/;
    // a passed test is remembered in this browser for this campaign, for exactly this wording
    function hash(t) { var x = 5381; for (var i = 0; i < t.length; i++) x = ((x << 5) + x + t.charCodeAt(i)) | 0; return String(x); }
    function rememberTest() { try { if (savedId) localStorage.setItem("mygym_tested_" + savedId, hash(sig())); } catch (e) { /* not remembered, the page still works */ } }
    function recallTest() { try { if (savedId && localStorage.getItem("mygym_tested_" + savedId) === hash(sig())) testedFor = sig(); } catch (e) { /* nothing remembered */ } }
    function goLabel() { if (later()) { var w = whenIso(); return w ? "Schedule for " + fDateTime(w) : "Pick a send time"; } return "Send to " + plural(n()); }
    function review() {
      var s = v("cSubject"), t = v("cTitle"), b = v("cBody"), u = v("cUrl"), all = s + t + b + v("cBtn") + v("cPre"), w = whenIso();
      var list = [
        [s.length > 0 && s.length <= 78, "Subject line written (up to 78 characters)"],
        [t.length >= 2 && t.length <= 60, "Heading written (2 to 60 characters)"],
        [b.length >= 10, "Message written"],
        [v("cBtn").length > 0 && /^https:\/\/[^\s]+$/i.test(u), "Button text and a link starting with https://"],
        [!ph.test(all), "No [placeholder] text left to fill in"],
        [n() > 0, "Someone is in the audience (" + plural(n()) + ")"]
      ];
      if (kind === "notice") {
        var tk = extraTokens(), badTk = tk.filter(function (x) { return !EMAIL_RE.test(x); });
        list.push([badTk.length === 0 && tk.length <= 300, badTk.length ? "Fix this email address: " + badTk[0].slice(0, 40) : tk.length > 300 ? "Up to 300 extra addresses" : "Any typed email addresses look right"]);
        list.push([svc.checked, "Tick the box: this is service information, not an offer or promotion"]);
      }
      if (later()) list.push([!!w && Date.parse(w) > Date.now() + 150000, "Send time is at least a few minutes from now"]);
      list.push([testedFor !== "" && testedFor === sig(), "Test email sent and checked, for this exact wording"]);
      return list;
    }
    function blocker() { var l = review(); for (var i = 0; i < l.length; i++) if (!l[i][0]) return "still to do: " + l[i][1].charAt(0).toLowerCase() + l[i][1].slice(1) + "."; return ""; }
    function problem() { var l = review(); for (var i = 0; i < l.length - 1; i++) if (!l[i][0]) return "still to do: " + l[i][1].charAt(0).toLowerCase() + l[i][1].slice(1) + "."; return ""; }
    function changed() {
      confirming = false; $("cWhenBox") && ($("cWhenBox").hidden = !later());
      noticeNote.hidden = kind !== "notice"; extraBox.hidden = kind !== "notice"; svcBox.hidden = kind !== "notice";
      segHint.textContent = kind === "notice" ? "Goes to the group you choose, whether or not they are on your marketing list." : "Only people who confirmed they want news and offers are ever included.";
      pvFoot.textContent = kind === "notice" ? "This is a service email about your MY GYM London account or booking, so it is sent even if you have unsubscribed from marketing." : "You are getting this because you agreed to hear from MY GYM London. Every email has an unsubscribe link at the bottom.";
      refreshNotice();
      F.cSubject._cnt.textContent = v("cSubject").length + "/78"; F.cTitle._cnt.textContent = v("cTitle").length + "/60"; F.cPre._cnt.textContent = v("cPre").length + "/120"; F.cBody._cnt.textContent = v("cBody").length + "/3000";
      pvSubject.textContent = v("cSubject") || "Your subject line"; pvPre.textContent = v("cPre") ? "– " + v("cPre") : "";
      pvTitle.textContent = v("cTitle") || "Your heading"; pvBody.textContent = "";
      (v("cBody") || "Your message appears here.").split(/\n{2,}/).forEach(function (p) { pvBody.appendChild(h("p", { style: "margin:0 0 12px;line-height:1.5;white-space:pre-wrap", text: p })); });
      pvBtn.textContent = v("cBtn") || "Button"; pvBtn.style.display = v("cBtn") ? "inline-block" : "none";
      checks.textContent = ""; var l = review(), allOk = true;
      l.forEach(function (x) { if (!x[0]) allOk = false; checks.appendChild(h("li", { style: "display:flex;gap:8px;align-items:flex-start" }, [h("span", { style: "font-weight:800;color:" + (x[0] ? "var(--ok)" : "var(--mut)"), text: x[0] ? "✓" : "○" }), h("span", { text: x[1] })])); });
      armed = allOk; bGo.disabled = busy; bGo.className = "btn pri" + (armed ? "" : " off"); bGo.textContent = goLabel();
    }
    function say(t, cls) { out.hidden = false; out.className = "msg" + (cls ? " " + cls : ""); out.textContent = t; }
    function lock(b) { busy = b; bSave.disabled = b; bTest.disabled = b; bGo.disabled = b; }
    async function save(iso) {
      var r = await rpc("admin_campaign_save", { p_id: savedId, p_subject: v("cSubject"), p_preheader: v("cPre"), p_title: v("cTitle"), p_body: v("cBody"), p_button: v("cBtn"), p_url: v("cUrl"), p_segment: seg.value, p_scheduled_for: iso || null, p_kind: kind, p_extra: kind === "notice" ? extra.value : "" });
      savedId = r.id; saved = true; return r;
    }
    async function sendLoop(label) {
      var sent = 0, guard = 0, failed = 0, skipped = 0;
      while (guard++ < 500) {
        say((label || "Sending") + "... " + sent + " sent so far. Keep this page open.");
        var r = await fn("admin-campaign", { action: "send", campaign_id: savedId }, 130);
        if (!r.ok) { lock(false); changed(); say("Stopped after " + sent + " sent: " + (r.j.error || "something went wrong") + " Press Send again to carry on. Nobody gets it twice.", "bad"); return false; }
        sent += r.j.sent || 0; failed += r.j.failed || 0; skipped += r.j.skipped || 0;
        if (!r.j.remaining) break;
      }
      toast("Sent to " + sent + (failed ? ", " + failed + " failed" : "") + "."); done(); return true;
    }
    kindSel.addEventListener("change", function () { kind = kindSel.value === "notice" ? "notice" : "marketing"; svc.checked = false; noticeKey = ""; drawSeg(null); drawTpls(); });
    if (editable) {
      form.addEventListener("input", changed); form.addEventListener("change", changed);
      bSave.addEventListener("click", async function () { lock(true); try { await save(null); say("Draft saved.", "ok"); } catch (e) { say(e.message, "bad"); } lock(false); });
      bTest.addEventListener("click", async function () {
        var p = problem(); if (p && p.indexOf("test email") < 0) return say("Not yet: " + p, "bad");
        lock(true); say("Saving and sending a test to your own email...");
        try { await save(null); } catch (e) { lock(false); return say(e.message, "bad"); }
        var r = await fn("admin-campaign", { action: "test", campaign_id: savedId }, 40); lock(false);
        if (!r.ok) return say(r.j.error || "Something went wrong.", "bad");
        testedFor = sig(); rememberTest(); changed(); say("Test sent to " + (r.j.sent_to || "your email") + ". Open it, read it on your phone, click the button, then come back and press the red button.", "ok");
      });
      bGo.addEventListener("click", async function () {
        if (busy) return;
        if (!armed) return say("Not yet: " + blocker(), "bad");
        if (!confirming) { confirming = true; bGo.textContent = later() ? "Yes, schedule it" : "Yes, send to " + plural(n()) + " now"; say(later() ? "This will be emailed to " + plural(n()) + " at " + fDateTime(whenIso()) + ". You can unschedule it until then. Press the red button again to confirm." : "This emails " + plural(n()) + " and cannot be undone. Press the red button again to send. Change anything to cancel.", "bad"); return; }
        lock(true);
        try {
          if (later()) { await save(whenIso()); toast("Scheduled for " + fDateTime(whenIso()) + "."); done(); return; }
          await save(null);
        } catch (e) { lock(false); changed(); return say(e.message, "bad"); }
        await sendLoop("Sending");
      });
    }
    recallTest(); changed();
    var actions = [];
    var note = null, statsBox = null;
    if (editable) actions = [bSave, bTest, bGo, h("button", { class: "btn sm", type: "button", text: "Save as template", onclick: function () { templateEditor({ name: "", subject: v("cSubject"), preheader: v("cPre"), title: v("cTitle"), body: v("cBody"), button: v("cBtn"), url: v("cUrl") }, function () { toast("Saved to your templates."); }); } })].concat(savedId ? [h("button", { class: "btn sm dng", type: "button", text: "Delete draft", onclick: async function () { try { await rpc("admin_campaign_delete", { p_id: savedId }); toast("Deleted."); done(); } catch (e) { say(e.message, "bad"); } } })] : []);
    else if (c.status === "scheduled") {
      note = h("div", { class: "banner" }, [h("div", null, [h("b", { text: "Scheduled for " + fDateTime(c.scheduled_for) + ". " }), document.createTextNode("It goes to " + segLabel(c.segment, c.kind).toLowerCase() + (c.extra_emails ? " and the typed email addresses" : "") + ". Unschedule it to change anything.")])]);
      actions = [h("button", { class: "btn", type: "button", text: "Unschedule and edit", onclick: async function () { try { await rpc("admin_campaign_unschedule", { p_id: c.id }); toast("Back to a draft."); done(); } catch (e) { say(e.message, "bad"); } } })];
    } else {
      var st = c.stats || {}, pc = function (a) { return c.sent ? " (" + Math.round(100 * a / c.sent) + "%)" : ""; };
      note = h("div", { class: "banner" }, [h("div", null, [h("b", { text: c.status === "sending" ? "This campaign is sending. " : "Sent " + (c.finished_at ? fDateTime(c.finished_at) : "") + ". " }), document.createTextNode(c.status === "sending" ? "If you closed the page it carries on by itself within a minute or two." : "Sent to " + (c.audience != null ? c.audience : c.sent) + " people.")])]);
      statsBox = h("div", { class: "grid g3", style: "margin-top:12px" }, [kpi("Sent", c.sent, c.failed ? c.failed + " failed to send" : ""), kpi("Delivered", st.delivered || 0, pc(st.delivered || 0).trim()), kpi("Clicked a link", st.clicked || 0, pc(st.clicked || 0).trim()),
        kpi("Unsubscribed", st.unsubscribed || 0), kpi("Marked as spam", st.complained || 0, "", (st.complained || 0) > 0), kpi("Bounced", st.bounced || 0, "", (st.bounced || 0) > 0)]);
      actions = [h("button", { class: "btn", type: "button", text: "Duplicate as new draft", onclick: function () { close(); openComposerFn(Object.assign(newForm(), { subject: c.subject, preheader: c.preheader, title: c.title, body: c.body, button: c.button, url: c.url, segment: c.segment, kind: c.kind, extra_emails: c.extra_emails })); } })];
      if (c.status === "sending" || (c.status === "sent" && c.failed > 0)) { savedId = c.id; actions.unshift(h("button", { class: "btn pri", type: "button", text: c.status === "sending" ? "Continue sending" : "Retry the " + c.failed + " that failed", onclick: async function () { lock(true); await sendLoop("Sending"); lock(false); } })); }
    }
    var left = h("div", null, [note, statsBox, form, editable ? h("div", { style: "margin-top:16px" }, [h("div", { class: "muted", style: "font-size:12px;font-weight:600;margin-bottom:6px", text: "Before you send" }), checks]) : null, out,
      h("div", { style: "margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;align-items:center" }, actions.concat([bClose])),
      statsBox ? h("small", { class: "muted", style: "display:block;margin-top:10px", text: "Delivery numbers fill in as the email service reports them, usually within minutes. Opens are not counted: mail apps hide them, so the number would mislead." }) : null]);
    if (!editable) { bSave.hidden = true; bTest.hidden = true; bGo.hidden = true; }
    return h("div", { class: "grid g2", style: "align-items:start" }, [card(editable ? (cur ? "Edit campaign" : "New campaign") : "Campaign", "admin only", [left]), card("Preview", "how it will look", [preview])]);
  }
  var openComposerFn = function () {};

  /* ---------- marketing ---------- */
  async function wixSubsDialog() {
    var out = h("div", { class: "msg" , text: "Checking your Wix list..." }), tick = h("input", { type: "checkbox", id: "wsTick", disabled: true }), go = h("button", { class: "btn pri", disabled: true, text: "Bring them in" }), info = null;
    var say = function (t, cls) { out.className = "msg" + (cls ? " " + cls : ""); out.textContent = t; };
    openModal("Bring in your Wix subscribers", [h("p", { text: "These are the people who subscribed to MY GYM London emails in Wix. They are copied from Wix every 30 minutes." }), out,
      h("label", { style: "display:flex;gap:8px;margin-top:12px;align-items:flex-start;font-size:13.5px" }, [tick, h("span", { text: "I confirm these people subscribed to MY GYM London's emails in Wix and agreed to receive news and offers. Anyone who unsubscribed in Wix is blocked automatically." })])],
      [h("button", { class: "btn", onclick: closeModal, text: "Close" }), go]);
    try {
      info = await rpc("admin_import_wix_subscribers", { p_basis: "", p_dry: true });
      say(info.to_add + " people will be added to your email list. " + info.to_block + " who unsubscribed in Wix will be recorded as unsubscribed. " + info.already + " are already on your list.");
      tick.disabled = false; go.disabled = !info.to_add && !info.to_block;
    } catch (e) { return say(e.message, "bad"); }
    go.addEventListener("click", async function () {
      if (!tick.checked) return say("Tick the box to confirm first.", "bad");
      go.disabled = true; say("Importing...");
      try { var r = await rpc("admin_import_wix_subscribers", { p_basis: "Subscribed in Wix before the move to the new system. Staff confirmed they agreed to receive news and offers.", p_dry: false }); say("Done. Added " + r.added + " subscribers and blocked " + r.blocked + " who had unsubscribed.", "ok"); toast("Wix subscribers brought in."); }
      catch (e) { go.disabled = false; say(e.message, "bad"); }
    });
  }
  async function vMarketing() {
    var d = await rpc("admin_marketing"), root = h("div"), isAdmin = can(["admin"]), camps = [], counts = { all: d.confirmed }, ncounts = {};
    if (isAdmin) { try { var both = await Promise.all([rpc("admin_campaign_list"), rpc("admin_campaign_counts"), rpc("admin_notice_counts").catch(function () { return {}; })]); camps = both[0]; counts = both[1]; ncounts = both[2]; } catch (e) { root.appendChild(errBox(e)); } }
    var tpls = []; if (isAdmin) { try { tpls = await rpc("admin_templates_list"); } catch (e) { tpls = []; } }
    var host = h("div", { style: "margin-bottom:16px" });
    function openComposer(c) { clear(host); host.appendChild(campaignCard(c, counts, function () { route(); }, function () { clear(host); }, tpls, ncounts)); host.scrollIntoView({ behavior: "smooth", block: "start" }); }
    openComposerFn = openComposer;
    if (pendingTpl && isAdmin) { var pt = pendingTpl; pendingTpl = null; setTimeout(function () { openComposer(null); var set = function (id, v) { var e = $(id); if (e) { e.value = v || ""; e.dispatchEvent(new Event("input", { bubbles: true })); } }; set("cSubject", pt.subject); set("cPre", pt.preheader); set("cTitle", pt.title); set("cBody", pt.body); set("cBtn", pt.button); set("cUrl", pt.url); }, 0); }
    root.appendChild(pageHead("Marketing", "News and offers only go to people who agreed to hear from you. A one-off service notice (closure, timetable change) is a separate kind of email.", isAdmin ? [h("button", { class: "btn", onclick: function () { wixSubsDialog(); }, text: "Bring in Wix subscribers" }), h("button", { class: "btn pri", onclick: function () { openComposer(null); }, text: "New email" })] : null));
    root.appendChild(host);
    if (isAdmin) {
      var rows = camps.map(function (c) {
        var st = c.stats || {};
        return h("tr", { style: "cursor:pointer", onclick: function () { openComposer(c); } }, [
          h("td", null, [h("b", { text: c.subject || "(no subject yet)" }), c.kind === "notice" ? chip("Service notice", "plain") : null, h("div", { class: "muted", style: "font-size:12px", text: c.title })]),
          h("td", { text: segLabel(c.segment, c.kind) + (c.extra_emails ? " + typed addresses" : "") }), h("td", null, [statusChip(c)]),
          h("td", { class: "num", text: c.status === "sent" || c.status === "sending" ? c.sent + " sent · " + (st.delivered || 0) + " delivered · " + (st.clicked || 0) + " clicked" : "" }),
          h("td", { class: "num", text: fDate((c.finished_at || c.started_at || c.created_at).slice(0, 10)) })]);
      });
      root.appendChild(h("div", { style: "margin-bottom:16px" }, [card("Campaigns", camps.length ? "click one to open it" : "", [camps.length ?
        h("div", { class: "tbl-wrap" }, [h("table", { class: "t" }, [h("thead", null, [h("tr", null, ["Campaign", "Goes to", "Status", "Results", "Date"].map(function (x) { return h("th", { text: x }); }))]), h("tbody", null, rows)])]) :
        empty("No emails yet. Press New email to write your first one.")])]));
    } else root.appendChild(h("div", { class: "banner" }, [h("div", null, [h("b", { text: "Campaigns. " }), document.createTextNode("Only an admin can write and send a campaign.")])]));
    root.appendChild(h("div", { class: "grid g3" }, [kpi("Confirmed subscribers", d.confirmed, "can receive campaigns"), kpi("Waiting to confirm", d.pending, "they have not clicked the email yet"), kpi("Unsubscribed", d.withdrawn)]));
    var src = h("div", { class: "list" }); d.by_source.forEach(function (s) { src.appendChild(h("div", { class: "li" }, [h("div", { class: "tx" }, [h("b", { text: s.source })]), h("span", { class: "num", text: s.n })])); });
    if (!d.by_source.length) src.appendChild(empty("No subscribers yet."));
    var rec = h("div", { class: "tbl-wrap" }, [h("table", { class: "t" }, [h("thead", null, [h("tr", null, ["Email", "Where", "Asked", "Status"].map(function (x) { return h("th", { text: x }); }))]),
      h("tbody", null, d.recent.map(function (m) { return h("tr", { style: "cursor:default" }, [h("td", { text: m.email }), h("td", { text: m.source }), h("td", { class: "num", text: fDate(m.requested_at) }), h("td", null, [m.withdrawn_at ? chip("Unsubscribed", "warn") : m.confirmed_at ? chip("Confirmed", "ok") : chip("Waiting", "plain")])]); }))])]);
    root.appendChild(h("div", { class: "grid g2", style: "margin-top:16px;align-items:start" }, [card("Where subscribers came from", "", [src]), card("Latest sign-ups", "", [d.recent.length ? rec : empty("Nobody has signed up yet.")])]));
    return root;
  }

  /* ---------- plans and payments (Wix) ---------- */
  function areaChart(vals, labels) {
    var W = 560, H = 210, L = 44, B = 28, T = 14, mn = Math.min.apply(null, vals) * 0.9, mx = Math.max.apply(null, vals) * 1.05, ch = H - B - T, step = (W - L - 10) / (vals.length - 1);
    var pts = vals.map(function (v, i) { return [L + i * step, T + ch - ((v - mn) / (mx - mn)) * ch]; }), line = pts.map(function (p) { return p.join(","); }).join(" "), g = "";
    for (var i = 0; i <= 3; i++) { var y = T + ch - (ch * i) / 3, v = mn + ((mx - mn) * i) / 3; g += '<line x1="' + L + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="#efedec"/><text x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end">\u00A3' + (v / 1000).toFixed(1) + "k</text>"; }
    return '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Monthly revenue"><defs><linearGradient id="ag" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e03939" stop-opacity=".22"/><stop offset="1" stop-color="#e03939" stop-opacity="0"/></linearGradient></defs>' + g +
      '<polygon points="' + L + "," + (T + ch) + " " + line + " " + pts[pts.length - 1][0] + "," + (T + ch) + '" fill="url(#ag)"/><polyline points="' + line + '" fill="none" stroke="#e03939" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>' +
      pts.map(function (p, i) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4.5" fill="#fff" stroke="#e03939" stroke-width="2.4"><title>' + esc(labels[i] + ": \u00A3" + vals[i]) + '</title></circle><text x="' + p[0] + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(labels[i]) + "</text>"; }).join("") + "</svg>";
  }
  async function vPlans() {
    var root = h("div"), d = null;
    root.appendChild(pageHead("Plans and payments", "Memberships and income, copied from Wix every 30 minutes. Wix still takes the payments."));
    try { d = await rpc("admin_payments_summary"); } catch (e) { return errBox(e); }
    var gbp = function (n) { return "£" + Number(n || 0).toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); };
    root.appendChild(h("div", { class: "grid g4" }, [kpi("Monthly income", gbp(d.mrr), "from active memberships"), kpi("Active members", d.active, (d.by_type.gym_classes || 0) + " gym, " + (d.by_type.classes || 0) + " classes only"),
      kpi("Failed payments", d.failed, d.failed ? "chase these today" : "none", d.failed > 0), kpi("Paused", d.paused, d.cancelling + " set to cancel")]));
    root.appendChild(h("div", { class: "grid g2", style: "margin-top:16px" }, [kpi("Joined in the last 30 days", d.new_30d), kpi("Left in the last 30 days", d.left_30d, "cancelled or ended", d.left_30d > d.new_30d)]));
    var plans = h("div", { class: "tbl-wrap" }, [h("table", { class: "t", style: "min-width:0" }, [h("thead", null, [h("tr", null, [h("th", { text: "Plan" }), h("th", { class: "r", text: "Members" }), h("th", { class: "r", text: "Per month" })])]),
      h("tbody", null, d.by_plan.map(function (p) { return h("tr", { style: "cursor:default" }, [h("td", { text: p.n }), h("td", { class: "num r", text: p.v }), h("td", { class: "num r", text: gbp(p.mrr) })]); }))])]);
    var failed = d.failed_list.length ? h("div", { class: "list" }, d.failed_list.map(function (f) { return h("div", { class: "li" }, [h("div", { class: "tx" }, [h("b", { text: f.name }), h("small", { text: f.plan + (f.failed_since ? " · failing since " + fDate(f.failed_since) : "") })]), h("span", { class: "num", text: gbp(f.amount) }),
      h("a", { class: "btn sm", href: "mailto:" + f.email + "?subject=" + encodeURIComponent("Your MY GYM payment"), text: "Email" })]); })) : empty("No failed payments. Nice.");
    root.appendChild(h("div", { class: "grid g2", style: "margin-top:16px;align-items:start" }, [card("Active members by plan", "", [d.by_plan.length ? plans : empty("No active memberships yet.")]), card("Failed payments to chase", d.failed_list.length + " people", [failed])]));
    root.appendChild(h("small", { class: "muted", style: "display:block;margin-top:10px", text: "Last copied from Wix: " + (d.synced ? fDateTime(d.synced) : "not yet") + ". Monthly income adds up each active plan (yearly plans divided by 12) and leaves out personal training packs." }));
    return root;
  }

  /* ---------- day to day: check-in, waitlist, rota, tasks ---------- */
  var dtTab = "in", ciDate = null, ciClass = null, rotaFrom = null;
  function tabsBar(cur, items, setter) { return h("div", { class: "tabs" }, items.map(function (t) { return h("button", { class: cur === t[0] ? "on" : "", onclick: function () { setter(t[0]); route(); }, text: t[1] }); })); }
  function weekStart(d) { var x = new Date(d); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
  function fld(label, ctrl, grow) { return h("div", { class: "field", style: grow ? "flex:1;min-width:160px" : "" }, [h("label", { text: label }), ctrl]); }
  async function vDayToDay() {
    var root = h("div");
    root.appendChild(pageHead("Day to day", "Check people in, keep the waitlist, plan the coaches and keep on top of the to-do list."));
    var tabs = [["in", "Check-in"]]; if (can(["admin", "manager", "reception"])) tabs.push(["wait", "Waitlist"]); tabs.push(["rota", "Staff rota"], ["tasks", "Tasks"]);
    if (!tabs.some(function (t) { return t[0] === dtTab; })) dtTab = "in";
    root.appendChild(tabsBar(dtTab, tabs, function (v) { dtTab = v; }));
    root.appendChild(await ({ "in": tabCheckin, wait: tabWait, rota: tabRota, tasks: tabTasks })[dtTab]());
    return root;
  }
  async function tabCheckin() {
    var wrap = h("div"), att = await rpc("admin_attendance"), today = iso(new Date()); if (!ciDate) ciDate = today;
    var day = await rpc("admin_day", { p_date: ciDate }), list = day.filter(function (c) { return c.kind !== "gym"; });
    if (list.length && !list.some(function (c) { return c.id === ciClass; })) ciClass = list[0].id;
    var rate = att.days_used ? Math.round(100 * att.checked_30d / Math.max(1, att.past_30d)) : null;
    wrap.appendChild(fromHtml('<div class="grid g4" style="margin-bottom:16px">' + kpiX("Attendance rate", "check", rate == null ? "-" : rate, rate == null ? "" : "%", rate == null ? "starts counting once you check people in" : "of bookings turned up (30 days)", "flat") + kpiX("Checked in today", "users", att.checked_today, "", "people", "flat") + kpiX("Bookings, last 30 days", "clip", att.past_30d, "", "that have already happened", "flat") + kpiX("Days used", "cal", att.days_used, "", "days with check-ins (30 days)", "flat") + "</div>"));
    var pick = h("input", { class: "in", type: "date", value: ciDate, "aria-label": "Date", onchange: function (e) { ciDate = e.target.value; ciClass = null; route(); } });
    var sel = h("select", { class: "in sel", "aria-label": "Class", onchange: function (e) { ciClass = Number(e.target.value); route(); } }, list.map(function (c) { return h("option", { value: c.id, selected: c.id === ciClass, text: String(c.start).slice(0, 5) + " " + c.name }); }));
    var body = h("div");
    if (!list.length) body.appendChild(empty("No classes on this day."));
    else {
      var r = await rpc("admin_checkin_roster", { p_class: ciClass, p_date: ciDate }), c = list.filter(function (x) { return x.id === ciClass; })[0];
      var done = r.people.filter(function (p) { return p.checked; }).length;
      var all = h("button", { class: "btn sm", text: "Mark all present", onclick: function () { Promise.all(r.people.filter(function (p) { return !p.checked; }).map(function (p) { return rpc("admin_checkin_set", { p_booking: p.booking_id, p_on: true }); })).then(function () { toast("Done"); route(); }).catch(function (e) { toast(e.message, true); }); } });
      body.appendChild(h("div", { class: "toolbar" }, [h("b", { text: c.name + " · " + done + " of " + r.people.length + " checked in" }), h("span", { class: "grow" }), all]));
      var lst = h("div", { class: "list", style: "padding:0 18px 12px" });
      r.people.forEach(function (p) {
        lst.appendChild(h("div", { class: "li" }, [h("span", { class: "av s", text: initials(p.name) }), h("div", { class: "tx" }, [h("b", { text: p.name }), h("small", { text: (p.source === "wix" ? "Booked on the website" : "Booked in the app") + (p.health ? "" : " · no health form") })]),
          h("button", { class: "btn sm" + (p.checked ? " pri" : ""), text: p.checked ? "Present ✓" : "Check in", onclick: function () { rpc("admin_checkin_set", { p_booking: p.booking_id, p_on: !p.checked }).then(route).catch(function (e) { toast(e.message, true); }); } })]));
      });
      if (!r.people.length) lst.appendChild(empty("Nobody is booked through the app yet."));
      if (r.other_wix) lst.appendChild(h("p", { class: "muted", text: r.other_wix + " more booked on the website only (not listed by name here)." }));
      body.appendChild(lst);
    }
    wrap.appendChild(h("section", { class: "card" }, [h("div", { class: "toolbar" }, [pick, sel]), body])); return wrap;
  }
  async function tabWait() {
    var wrap = h("div"), tt = await rpc("admin_timetable"), rows = await rpc("admin_waitlist");
    var classes = tt.filter(function (c) { return c.active && c.kind !== "gym"; });
    var classSel = h("select", { class: "in sel", "aria-label": "Class" }, classes.map(function (c) { return h("option", { value: c.id, text: c.day.slice(0, 3) + " " + String(c.time).slice(0, 5) + " " + c.name }); }));
    var date = h("input", { class: "in", type: "date", value: iso(new Date()), "aria-label": "Date" }), name = h("input", { class: "in", placeholder: "Name", maxlength: "80", "aria-label": "Name" }), phone = h("input", { class: "in", placeholder: "Phone", maxlength: "25", "aria-label": "Phone" }), note = h("input", { class: "in", placeholder: "Note (optional)", maxlength: "200", "aria-label": "Note" });
    var add = h("button", { class: "btn pri", text: "Add to waitlist", onclick: function () {
      if (!name.value.trim()) return toast("Please type a name", true);
      rpc("admin_waitlist_add", { p_class: Number(classSel.value), p_date: date.value, p_name: name.value, p_phone: phone.value, p_note: note.value }).then(function () { toast("Added"); route(); }).catch(function (e) { toast(e.message, true); });
    } });
    wrap.appendChild(h("div", { class: "banner" }, [h("div", null, [h("b", { text: "Kept by hand. " }), document.createTextNode("When a class is full, write the person here and phone them if a space opens. The app does not run a waitlist yet, so nothing is booked automatically.")])]));
    wrap.appendChild(card("Add someone", "", [h("div", { class: "toolbar", style: "padding:0;border:0" }, [classSel, date, name, phone, note, add])]));
    var byKey = {}; rows.forEach(function (w) { var k = w.date + "|" + w.class_id; (byKey[k] = byKey[k] || []).push(w); });
    var keys = Object.keys(byKey), grid = h("div", { class: "grid g3", style: "margin-top:16px" });
    if (!keys.length) wrap.appendChild(h("div", { style: "margin-top:16px" }, [card("Waitlists", "", [empty("Nobody is waiting.")])]));
    keys.forEach(function (k) {
      var g = byKey[k], f = g[0], list = h("div", { class: "list" });
      g.forEach(function (w, i) { list.appendChild(h("div", { class: "li" }, [h("span", { class: "av s", text: String(i + 1) }), h("div", { class: "tx" }, [h("b", { text: w.name }), h("small", { text: [w.phone, w.email, w.note].filter(Boolean).join(" · ") || "No contact details" })]), h("button", { class: "btn sm", text: "Remove", onclick: function () { rpc("admin_waitlist_remove", { p_id: w.id }).then(route); } })])); });
      grid.appendChild(card(f.class, fDate(f.date) + " " + String(f.time).slice(0, 5), [h("div", { style: "display:flex;gap:8px;margin-bottom:6px" }, [chip(f.booked + "/" + f.capacity + " booked", f.booked >= f.capacity ? "warn" : "plain"), chip(g.length + " waiting", "plain")]), list]));
    });
    wrap.appendChild(grid); return wrap;
  }
  async function tabRota() {
    var wrap = h("div"), from = rotaFrom || weekStart(new Date()); rotaFrom = from;
    var data = await rpc("admin_rota", { p_from: iso(from) }), days = [];
    for (var i = 0; i < 7; i++) { var d = new Date(from); d.setDate(d.getDate() + i); days.push(d); }
    var people = Array.from(new Set(data.shifts.map(function (s) { return s.person; }).concat(data.month_hours.map(function (m) { return m.person; })))).sort();
    wrap.appendChild(fromHtml('<div class="grid g4" style="margin-bottom:16px">' + (data.month_hours.slice(0, 3).map(function (m) { return kpiX(m.person, "users", m.hours, "h", "hours this month", "flat"); }).join("")) + kpiX("All staff", "clock", data.month_hours.reduce(function (a, m) { return a + m.hours; }, 0).toFixed(1), "h", "this month, ready for payroll", "flat") + "</div>"));
    var head2 = h("tr", null, [h("th", { text: "Person" })].concat(days.map(function (d) { return h("th", { class: "r", text: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" }) }); })));
    var body = h("tbody");
    people.forEach(function (p) {
      body.appendChild(h("tr", { style: "cursor:default" }, [h("td", null, [h("b", { text: p })])].concat(days.map(function (d) {
        var ss = data.shifts.filter(function (s) { return s.person === p && s.date === iso(d); });
        return h("td", { class: "r" }, ss.map(function (s) { return h("div", { class: "num" }, [document.createTextNode(s.start + "–" + s.end + " "), can(["admin", "manager"]) ? h("button", { class: "btn sm ghost", title: "Remove", text: "×", onclick: function () { rpc("admin_shift_remove", { p_id: s.id }).then(route); } }) : null]); }));
      }))));
    });
    var nav = [h("button", { class: "btn sm", text: "‹ Previous week", onclick: function () { rotaFrom = new Date(from.getTime() - 7 * 864e5); route(); } }), h("button", { class: "btn sm", text: "This week", onclick: function () { rotaFrom = weekStart(new Date()); route(); } }), h("button", { class: "btn sm", text: "Next week ›", onclick: function () { rotaFrom = new Date(from.getTime() + 7 * 864e5); route(); } })];
    wrap.appendChild(card("Week of " + fDate(iso(from)), "", [h("div", { class: "toolbar", style: "padding:0 0 12px;border:0" }, nav), people.length ? h("div", { class: "tbl-wrap" }, [h("table", { class: "t", style: "min-width:640px" }, [h("thead", null, [head2]), body])]) : empty("No shifts this week.")]));
    if (can(["admin", "manager"])) {
      var person = h("input", { class: "in", placeholder: "Person or coach", maxlength: "60", "aria-label": "Person" }), dt = h("input", { class: "in", type: "date", value: iso(new Date()), "aria-label": "Date" }), st = h("input", { class: "in", type: "time", value: "09:00", "aria-label": "Start" }), en = h("input", { class: "in", type: "time", value: "13:00", "aria-label": "End" }), nt = h("input", { class: "in", placeholder: "Note (optional)", maxlength: "120", "aria-label": "Note" });
      wrap.appendChild(h("div", { style: "margin-top:16px" }, [card("Add a shift", "", [h("div", { class: "toolbar", style: "padding:0;border:0" }, [person, dt, st, en, nt, h("button", { class: "btn pri", text: "Add shift", onclick: function () {
        if (!person.value.trim()) return toast("Please type who", true);
        rpc("admin_shift_add", { p_person: person.value, p_date: dt.value, p_start: st.value, p_end: en.value, p_note: nt.value }).then(function () { toast("Shift added"); route(); }).catch(function (e) { toast(e.message, true); });
      } })])])]));
    }
    return wrap;
  }
  async function tabTasks() {
    var wrap = h("div"), tasks = await rpc("admin_tasks");
    var title = h("input", { class: "in", placeholder: "Add a task, for example: order new mats", maxlength: "200", style: "flex:1;min-width:200px", "aria-label": "Task" }), who = h("input", { class: "in", placeholder: "Who (optional)", maxlength: "60", "aria-label": "Who" }), due = h("input", { class: "in", type: "date", "aria-label": "Due date" });
    var add = h("button", { class: "btn pri", text: "Add", onclick: function () { rpc("admin_task_add", { p_title: title.value, p_assigned: who.value, p_due: due.value || null }).then(function () { route(); }).catch(function (e) { toast(e.message, true); }); } });
    var list = h("div", { class: "list" });
    tasks.forEach(function (t) {
      var late = t.due && !t.done && t.due < iso(new Date());
      list.appendChild(h("div", { class: "li" }, [h("button", { class: "btn sm" + (t.done ? " pri" : ""), text: t.done ? "✓" : "○", "aria-label": t.done ? "Mark not done" : "Mark done", onclick: function () { rpc("admin_task_toggle", { p_id: t.id, p_done: !t.done }).then(route); } }),
        h("div", { class: "tx" }, [h("b", { text: t.title, style: t.done ? "text-decoration:line-through;color:var(--mut)" : "" }), h("small", { text: [t.assigned, t.due ? "due " + fDate(t.due) : ""].filter(Boolean).join(" · ") })]), late ? chip("Overdue", "bad") : null, h("button", { class: "btn sm ghost", text: "Delete", onclick: function () { rpc("admin_task_remove", { p_id: t.id }).then(route); } })]));
    });
    if (!tasks.length) list.appendChild(empty("No tasks. Add the first one above."));
    wrap.appendChild(h("section", { class: "card" }, [h("div", { class: "toolbar" }, [title, who, due, add]), h("div", { class: "bd" }, [list])])); return wrap;
  }

  /* ---------- forms and pages ---------- */
  var FORM_INFO = {
    "contact": ["Contact", "Contact section on the FAQ page"], "pt-enquiry": ["Personal training enquiry", "Personal training quiz"], "trial-class": ["Free class", "Classes page"],
    "landing-offer": ["Offer", "Landing pages (not built yet)"], "corporate-enquiry": ["Corporate enquiry", "Not placed on a page yet"], "kids-registration": ["Kids Gym registration", "Kids Gym page"],
    "newsletter-signup": ["News and offers", "Footer of every page"], "pause-cancel-request": ["Pause or cancel request", "Member requests"], "feedback": ["Feedback", "After a class"], "refer-a-friend": ["Refer a friend", "Referral page"]
  };
  var SITE_PAGES = [["Home", "index.html"], ["Classes", "classes.html"], ["Plans and prices", "services.html"], ["Personal training", "personal-training.html"], ["Kids Gym", "kids-gym.html"], ["Book the gym", "book.html"], ["FAQ", "faq.html"], ["Refer a friend", "refer-friends.html"], ["Terms", "terms.html"], ["Privacy", "privacy.html"], ["Cookies", "cookies.html"]];
  /* ---------- build your own forms and landing pages ---------- */
  var BTYPES = [["text", "Short answer"], ["textarea", "Long answer"], ["select", "Choose one"], ["checkbox", "Tick box"], ["number", "Number"], ["date", "Date"], ["tel", "Phone"], ["email", "Email"]];
  function goBase() { return CFG.GO_BASE || "https://nevespedropt-prog.github.io/mygym-website-and-backoffice/go.html"; }
  function goLink(kind, slug) { return goBase() + "?" + (kind === "form" ? "f" : "p") + "=" + encodeURIComponent(slug); }
  function slugOf(t) { return String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30); }
  function linkRow(kind, slug) {
    var u = goLink(kind, slug);
    return h("div", { style: "display:flex;gap:6px;flex-wrap:wrap;margin-top:6px" }, [h("a", { class: "btn sm", href: u, target: "_blank", rel: "noopener", text: "Open" }),
      h("button", { class: "btn sm", onclick: function () { try { navigator.clipboard.writeText(u); toast("Link copied."); } catch (e) { toast(u); } }, text: "Copy link" })]);
  }
  function rowTools(list, i, redraw) {
    return h("span", { style: "display:inline-flex;gap:4px" }, [h("button", { class: "btn sm", type: "button", text: "\u2191", disabled: i === 0, onclick: function () { var t = list[i]; list[i] = list[i - 1]; list[i - 1] = t; redraw(); } }),
      h("button", { class: "btn sm", type: "button", text: "\u2193", disabled: i === list.length - 1, onclick: function () { var t = list[i]; list[i] = list[i + 1]; list[i + 1] = t; redraw(); } }),
      h("button", { class: "btn sm dng", type: "button", text: "Remove", onclick: function () { list.splice(i, 1); redraw(); } })]);
  }
  function formBuilder(f, done) {
    var isNew = !f, d = f || { slug: "", title: "", intro: "", fields: [], ask_phone: true, button: "Send", success: "Thank you. We have your message and will be in touch soon.", notify_staff: true, autoreply: true, active: true };
    var fields = (d.fields || []).map(function (x) { return Object.assign({}, x, { options: (x.options || []).slice() }); });
    var title = h("input", { class: "in", maxlength: "120", value: d.title, placeholder: "For example: Summer challenge sign-up" }), slug = h("input", { class: "in", maxlength: "35", value: d.slug, disabled: !isNew, placeholder: "summer-challenge" });
    title.addEventListener("input", function () { if (isNew && !slug.dataset.edited) slug.value = slugOf(title.value); }); slug.addEventListener("input", function () { slug.dataset.edited = "1"; });
    var intro = h("textarea", { class: "in", rows: "3", maxlength: "1000", placeholder: "A short line shown above the form" }); intro.value = d.intro;
    var button = h("input", { class: "in", maxlength: "40", value: d.button }), success = h("textarea", { class: "in", rows: "2", maxlength: "500" }); success.value = d.success;
    var cb = function (label, on) { var i = h("input", { type: "checkbox", checked: !!on }); return [i, h("label", { style: "display:flex;gap:8px;margin-top:8px;font-size:13.5px;align-items:flex-start" }, [i, h("span", { text: label })])]; };
    var phone = cb("Also ask for a phone number", d.ask_phone), notify = cb("Email the gym when someone sends it", d.notify_staff), reply = cb("Email the person a confirmation (uses your standard email look)", d.autoreply), active = cb("The form is switched on", d.active);
    var list = h("div"), out = h("div", { class: "msg", hidden: true });
    function redraw() {
      clear(list);
      fields.forEach(function (x, i) {
        var label = h("input", { class: "in", value: x.label || "", placeholder: "Your question", maxlength: "120" }), type = h("select", { class: "sel" }, BTYPES.map(function (t) { return h("option", { value: t[0], text: t[1], selected: t[0] === x.type }); }));
        var req = h("input", { type: "checkbox", checked: !!x.required }), opts = h("input", { class: "in", value: (x.options || []).join(", "), placeholder: "Options, separated by commas", hidden: x.type !== "select" });
        label.addEventListener("input", function () { x.label = label.value; }); req.addEventListener("change", function () { x.required = req.checked; }); opts.addEventListener("input", function () { x.options = opts.value.split(",").map(function (o) { return o.trim(); }).filter(Boolean); });
        type.addEventListener("change", function () { x.type = type.value; opts.hidden = x.type !== "select"; });
        list.appendChild(h("div", { class: "card", style: "padding:12px;margin-top:8px" }, [label, h("div", { style: "display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px" }, [type, h("label", { style: "display:flex;gap:6px;font-size:13px" }, [req, h("span", { text: "Required" })]), rowTools(fields, i, redraw)]), opts]));
      });
      if (!fields.length) list.appendChild(h("div", { class: "muted", text: "No extra questions yet. Name and email are always asked." }));
    }
    redraw();
    var save = h("button", { class: "btn pri", text: "Save form" });
    save.addEventListener("click", async function () {
      save.disabled = true;
      try {
        var cleanFields = fields.filter(function (x) { return (x.label || "").trim(); }).map(function (x, i) { return { id: x.id || ("q" + (i + 1) + "_" + Math.random().toString(36).slice(2, 6)), label: x.label.trim(), type: x.type || "text", required: !!x.required, options: x.type === "select" ? (x.options || []) : [] }; });
        await rpc("admin_form_save", { p_slug: slug.value, p_title: title.value, p_intro: intro.value, p_fields: cleanFields, p_ask_phone: phone[0].checked, p_button: button.value, p_success: success.value, p_notify: notify[0].checked, p_autoreply: reply[0].checked, p_active: active[0].checked });
        closeDrawer(); toast("Form saved."); done();
      } catch (e) { save.disabled = false; out.hidden = false; out.className = "msg bad"; out.textContent = e.message; }
    });
    var fld = function (l, el) { return h("div", { class: "field", style: "margin-top:10px" }, [h("label", { text: l }), el]); };
    openDrawer(isNew ? "New form" : "Edit form", [h("div", { class: "sect" }, [fld("Title", title), fld("Link name (used in the web address)", slug), fld("Short introduction", intro)]),
      h("div", { class: "sect" }, [h("h4", { text: "Questions" }), list, h("button", { class: "btn sm", type: "button", style: "margin-top:10px", text: "Add a question", onclick: function () { fields.push({ label: "", type: "text", required: false, options: [] }); redraw(); } })]),
      h("div", { class: "sect" }, [fld("Button text", button), fld("Message after sending", success)].concat(phone[1], notify[1], reply[1], active[1], [out]))], [h("button", { class: "btn", onclick: closeDrawer, text: "Cancel" }), save]);
  }
  function pageBuilder(pg, forms, done) {
    var isNew = !pg, d = pg || { slug: "", title: "", blocks: [{ type: "heading", level: "1", text: "" }], active: true };
    var blocks = (d.blocks || []).map(function (b) { return Object.assign({}, b); });
    var title = h("input", { class: "in", maxlength: "120", value: d.title, placeholder: "For example: January offer" }), slug = h("input", { class: "in", maxlength: "35", value: d.slug, disabled: !isNew, placeholder: "january-offer" });
    title.addEventListener("input", function () { if (isNew && !slug.dataset.edited) slug.value = slugOf(title.value); }); slug.addEventListener("input", function () { slug.dataset.edited = "1"; });
    var active = h("input", { type: "checkbox", checked: !!d.active }), list = h("div"), out = h("div", { class: "msg", hidden: true });
    var BT = [["heading", "Heading"], ["text", "Text"], ["image", "Image"], ["button", "Button"], ["list", "Bullet list"], ["form", "A form"], ["divider", "Divider line"]];
    function redraw() {
      clear(list);
      blocks.forEach(function (b, i) {
        var kind = h("select", { class: "sel" }, BT.map(function (t) { return h("option", { value: t[0], text: t[1], selected: t[0] === b.type }); })); kind.addEventListener("change", function () { b.type = kind.value; redraw(); });
        var inp = function (key, ph, tag, rows) { var e = h(tag || "input", { class: "in", placeholder: ph, style: "margin-top:8px" }); if (rows) e.rows = rows; e.value = b[key] || ""; e.addEventListener("input", function () { b[key] = e.value; }); return e; };
        var body = [];
        if (b.type === "heading") { var lv = h("select", { class: "sel", style: "margin-top:8px" }, [h("option", { value: "1", text: "Big", selected: b.level !== "2" }), h("option", { value: "2", text: "Medium", selected: b.level === "2" })]); lv.addEventListener("change", function () { b.level = lv.value; }); body = [inp("text", "Heading text"), lv]; }
        else if (b.type === "text") body = [inp("text", "Write your text. Leave a blank line between paragraphs.", "textarea", 4)];
        else if (b.type === "image") body = [inp("url", "Image address (https://...)"), inp("alt", "Short description of the picture")];
        else if (b.type === "button") body = [inp("label", "Button text"), inp("url", "Button link (https://...)")];
        else if (b.type === "list") body = [inp("items", "One bullet per line", "textarea", 4)];
        else if (b.type === "form") { var fs = h("select", { class: "sel", style: "margin-top:8px" }, [h("option", { value: "", text: "Choose a form" })].concat(forms.map(function (f) { return h("option", { value: f.slug, text: f.title, selected: f.slug === b.slug }); }))); fs.addEventListener("change", function () { b.slug = fs.value; }); body = [fs]; }
        list.appendChild(h("div", { class: "card", style: "padding:12px;margin-top:8px" }, [h("div", { style: "display:flex;gap:8px;align-items:center;flex-wrap:wrap" }, [kind, rowTools(blocks, i, redraw)])].concat(body)));
      });
    }
    redraw();
    var save = h("button", { class: "btn pri", text: "Save page" });
    save.addEventListener("click", async function () {
      save.disabled = true;
      try { await rpc("admin_page_save", { p_slug: slug.value, p_title: title.value, p_blocks: blocks, p_active: active.checked }); closeDrawer(); toast("Page saved."); done(); }
      catch (e) { save.disabled = false; out.hidden = false; out.className = "msg bad"; out.textContent = e.message; }
    });
    var fld = function (l, el) { return h("div", { class: "field", style: "margin-top:10px" }, [h("label", { text: l }), el]); };
    openDrawer(isNew ? "New landing page" : "Edit landing page", [h("div", { class: "sect" }, [fld("Page title", title), fld("Link name (used in the web address)", slug)]), h("div", { class: "sect" }, [h("h4", { text: "Page content, top to bottom" }), list,
      h("button", { class: "btn sm", type: "button", style: "margin-top:10px", text: "Add a block", onclick: function () { blocks.push({ type: "text", text: "" }); redraw(); } })]),
      h("div", { class: "sect" }, [h("label", { style: "display:flex;gap:8px;font-size:13.5px" }, [active, h("span", { text: "The page is switched on" })]), out])], [h("button", { class: "btn", onclick: closeDrawer, text: "Cancel" }), save]);
  }
  async function vForms() {
    var rows = await rpc("admin_forms_summary"), root = h("div"), by = {}; rows.forEach(function (r) { by[r.form_id] = r; });
    root.appendChild(pageHead("Forms and pages", "Every website form sends its answers to Enquiries. Here is where each form lives and how much it is used."));
    var body = h("tbody");
    Object.keys(FORM_INFO).forEach(function (id) {
      var s = by[id] || { total: 0, last_30d: 0, new: 0 };
      body.appendChild(h("tr", { style: "cursor:default" }, [h("td", null, [h("b", { text: FORM_INFO[id][0] }), h("small", { class: "block muted", text: FORM_INFO[id][1] })]), h("td", { class: "num r", text: s.total }), h("td", { class: "num r", text: s.last_30d }), h("td", null, [s.new ? chip(s.new + " new", "bad") : chip("None waiting", "plain")]),
        h("td", { class: "r" })]));
    });
    root.appendChild(h("section", { class: "card" }, [h("div", { class: "hd" }, [h("h3", { text: "Forms" })]), h("div", { class: "bd" }, [h("div", { class: "tbl-wrap" }, [h("table", { class: "t", style: "min-width:600px" }, [h("thead", null, [h("tr", null, [h("th", { text: "Form" }), h("th", { class: "r", text: "Total" }), h("th", { class: "r", text: "30 days" }), h("th", { text: "Status" }), h("th")])]), body])])])]));
    var pg = h("div", { class: "list" }); SITE_PAGES.forEach(function (p) { pg.appendChild(h("div", { class: "li" }, [h("div", { class: "tx" }, [h("b", { text: p[0] })]), h("a", { class: "btn sm", href: "https://www.mygymlondon.co.uk/" + p[1], target: "_blank", rel: "noopener", text: "View" })])); });
    var bd = { forms: [], pages: [] }; try { bd = await rpc("admin_builder_list"); } catch (e) { bd = { forms: [], pages: [] }; }
    var canBuild = can(["admin", "manager"]);
    var myForms = h("div", { class: "list" }); bd.forms.forEach(function (f) { myForms.appendChild(h("div", { class: "li", style: "align-items:flex-start" }, [h("div", { class: "tx" }, [h("b", { text: f.title }), h("small", { text: (f.active ? "On" : "Off") + " \u00B7 " + f.submissions + " answers" }), linkRow("form", f.slug)]), canBuild ? h("div", { style: "display:flex;gap:6px" }, [h("button", { class: "btn sm", onclick: function () { formBuilder(f, route); }, text: "Edit" }), h("button", { class: "btn sm dng", onclick: async function () { try { await rpc("admin_form_delete", { p_slug: f.slug }); toast("Deleted."); route(); } catch (e) { toast(e.message, true); } }, text: "Delete" })]) : null])); });
    if (!bd.forms.length) myForms.appendChild(empty("No forms of your own yet."));
    var myPages = h("div", { class: "list" }); bd.pages.forEach(function (pgd) { myPages.appendChild(h("div", { class: "li", style: "align-items:flex-start" }, [h("div", { class: "tx" }, [h("b", { text: pgd.title }), h("small", { text: pgd.active ? "On" : "Off" }), linkRow("page", pgd.slug)]), canBuild ? h("div", { style: "display:flex;gap:6px" }, [h("button", { class: "btn sm", onclick: function () { pageBuilder(pgd, bd.forms, route); }, text: "Edit" }), h("button", { class: "btn sm dng", onclick: async function () { try { await rpc("admin_page_delete", { p_slug: pgd.slug }); toast("Deleted."); route(); } catch (e) { toast(e.message, true); } }, text: "Delete" })]) : null])); });
    if (!bd.pages.length) myPages.appendChild(empty("No landing pages yet."));
    root.appendChild(h("div", { class: "grid g2", style: "margin-top:16px;align-items:start" }, [card("Your forms", "answers arrive in Messages", [myForms].concat(canBuild ? [h("button", { class: "btn pri", style: "margin-top:12px", onclick: function () { formBuilder(null, route); }, text: "New form" })] : [])), card("Your landing pages", "", [myPages].concat(canBuild ? [h("button", { class: "btn pri", style: "margin-top:12px", onclick: function () { pageBuilder(null, bd.forms, route); }, text: "New landing page" })] : []))]));
    root.appendChild(h("div", { style: "margin-top:16px" }, [card("Website pages", "", [pg])]));
    return root;
  }

  /* ---------- settings and health ---------- */
  var setTab = "health";
  var JOBN2 = { "sync-wix-bookings": "Wix booking sync", "sync-timetable": "Timetable sync", "class-reminder-emails": "Class reminder emails", "engagement-emails": "Engagement emails", "lead-and-referral-emails": "Lead follow-ups", "weekly-report": "Weekly report", "send-class-reminders": "Phone reminders", "weekly-purge-form-submissions": "Weekly form clean-up" };
  async function vSettingsHub() {
    var root = h("div"); root.appendChild(pageHead("Settings and health", "How the system is doing, who has access, and the business details."));
    var tabs = [["health", "System health"], ["business", "Business details"], ["security", "Security checklist"]]; if (can(["admin"])) tabs.splice(1, 0, ["team", "Team"]);
    if (!tabs.some(function (t) { return t[0] === setTab; })) setTab = "health";
    root.appendChild(tabsBar(setTab, tabs, function (v) { setTab = v; }));
    if (setTab === "health") root.appendChild(await tabHealth()); else if (setTab === "team") root.appendChild(await vSettings()); else if (setTab === "business") root.appendChild(tabBusiness()); else root.appendChild(tabSecurity());
    return root;
  }
  async function tabHealth() {
    var d = await rpc("admin_health"), wrap = h("div"), bad = d.jobs.filter(function (j) { return j.failed_7d > 0 || (j.status && j.status !== "succeeded"); }).length;
    wrap.appendChild(fromHtml('<div class="grid g4">' + kpiX("Automatic jobs", "pulse", d.jobs.length, "", bad ? bad + " need a look" : "all healthy", bad ? "dn" : "up", "", bad ? "alert" : "") + kpiX("Emails that failed", "mail", d.email_failed_7d, "", "last 7 days", d.email_failed_7d ? "dn" : "up", "", d.email_failed_7d ? "alert" : "") + kpiX("Members", "users", d.counts.members, "", "app accounts", "flat") + kpiX("Bookings stored", "clip", d.counts.bookings, "", d.counts.emails + " emails sent in total", "flat") + "</div>"));
    var rows = h("tbody", null, d.jobs.map(function (j) { var ok = j.status === "succeeded"; return h("tr", { style: "cursor:default" }, [h("td", null, [h("b", { text: JOBN2[j.job] || j.job }), h("small", { class: "block muted", text: j.job })]), h("td", { text: j.schedule }), h("td", null, [j.active ? (ok ? chip("OK", "ok") : chip(j.status || "No run yet", j.status ? "bad" : "plain")) : chip("Switched off", "warn")]), h("td", { class: "num", text: j.at ? fDateTime(j.at) : "-" }), h("td", { class: "num r", text: j.failed_7d })]); }));
    wrap.appendChild(h("div", { style: "margin-top:16px" }, [card("Automatic jobs", "run by the database on a schedule", [h("div", { class: "tbl-wrap" }, [h("table", { class: "t", style: "min-width:560px" }, [h("thead", null, [h("tr", null, ["Job", "Schedule", "Last result", "Last run", "Failed (7 days)"].map(function (x, i) { return h("th", { class: i === 4 ? "r" : "", text: x }); }))]), rows])])])]));
    var fl = d.flags.map(function (f) { return h("div", { class: "li" }, [h("div", { class: "tx" }, [h("b", { text: f.key === "wix_booking" ? "Wix booking sync" : f.key })]), chip(f.mode === "on" ? "On for everyone" : f.mode, f.mode === "on" ? "ok" : "warn")]); });
    var sy = d.sync.map(function (s) { return h("div", { class: "li" }, [h("div", { class: "tx" }, [h("b", { text: s.id })]), h("small", { class: "muted", text: s.last_run ? "ran " + ago(s.last_run) : "no run" })]); });
    wrap.appendChild(h("div", { class: "grid g2", style: "margin-top:16px;align-items:start" }, [card("Switches", "", [h("div", { class: "list" }, fl.length ? fl : [empty("None")])]), card("Sync history", "", [h("div", { class: "list" }, sy.length ? sy : [empty("None")])])]));
    return wrap;
  }
  function tabBusiness() {
    var kv = h("dl", { class: "kv" }); [["Business", "MyGym London (sole trader)"], ["Gym address", "Main Avenue, Bush Hill Park, Enfield, EN1 1DS"], ["Phone", "07459 020381"], ["Email", "info@mygymlondon.co.uk"], ["Opening hours", "Every day, 5am to midnight (last entry 11:30pm)"], ["App", "app.mygymlondon.co.uk"], ["Website", "www.mygymlondon.co.uk"], ["Checkout", "join.mygymlondon.co.uk (Wix)"], ["Instagram", "@mygym_london"], ["VAT", "Not VAT registered"]]
      .forEach(function (p) { kv.appendChild(h("dt", { text: p[0] })); kv.appendChild(h("dd", { text: p[1] })); });
    return card("Business details", "read only", [kv, h("p", { class: "muted", text: "These are shown for reference. To change them, tell Claude: they appear on the website, in emails and on the legal pages." })]);
  }
  function tabSecurity() {
    var items = [["Keep the Google Workspace mailboxes paid (they are billed through Wix)", "If the payment stops, the mailboxes would be cancelled."], ["Weekly report email: check it arrives on Mondays", "It starts with [ATTENTION] when a check fails."], ["Raise the email security (DMARC) setting around 19 November", "After reading the reports for about four weeks."], ["Add staff only with the role they need", "Reception sees members and enquiries. Coach sees the schedule and health forms. Health form views are logged."], ["Keep access to the Facebook login behind the Instagram feed", "The Instagram token renews itself; if it ever fails, sign in there to make a new one."]];
    return card("Security checklist", "kept here so it is not forgotten", [h("div", { class: "list" }, items.map(function (i) { return h("div", { class: "li" }, [h("span", { class: "ico warn", text: "!" }), h("div", { class: "tx" }, [h("b", { text: i[0] }), h("small", { text: i[1] })])]); }))]);
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
