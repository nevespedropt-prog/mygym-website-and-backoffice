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
    if (sampleOn()) k.push(kpiX("Monthly revenue", "pound", "£" + SAMPLE.revenue[SAMPLE.revenue.length - 1].toLocaleString("en-GB"), "", "+4.0% vs last month", "up", spark(SAMPLE.revenue, "#e03939"), "", true));
    else k.push(kpiX("Monthly revenue", "pound", "-", "", "Connect Wix payments", "flat"));
    if (d.members_7d != null) { var pv = ins.members_prev_7d || 0; k.push(kpiX("New sign-ups this week", "plus", d.members_7d, "", (d.members_7d - pv >= 0 ? "+" : "") + (d.members_7d - pv) + " vs last week", d.members_7d > pv ? "up" : d.members_7d < pv ? "dn" : "flat")); }
    k.push(kpiX("Average class fill", "pulse", ins.avg_fill_14d == null ? "-" : ins.avg_fill_14d, ins.avg_fill_14d == null ? "" : "%", "last 14 days", "flat"));
    if (d.enquiries_new != null) k.push(kpiX("New enquiries", "inbox", d.enquiries_new, "", d.enquiries_new ? "Reply to keep response time low" : "All caught up", d.enquiries_new ? "dn" : "up", "", d.enquiries_new ? "alert" : ""));
    if (can(["admin", "manager"])) k.push(kpiX("Failed payments", "alert", sampleOn() ? SAMPLE.failed : "-", "", sampleOn() ? "Needs a follow-up" : "Connect Wix payments", sampleOn() ? "dn" : "flat", "", sampleOn() ? "alert" : "", sampleOn()));

    var nowHM = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
    var tc = dayClasses.filter(function (c) { return c.kind !== "gym"; });
    var tcHtml = tc.length ? tc.map(function (c) {
      var pc = c.capacity ? Math.round(c.booked / c.capacity * 100) : 0, st = String(c.start).slice(0, 5), done = dayLabel === "today" && st < nowHM, full = c.capacity && c.booked >= c.capacity;
      var chipH = done ? '<span class="chip plain">Done</span>' : full ? '<span class="chip warn">Full</span>' : '<span class="chip ok">Open</span>';
      return '<div class="li"><span class="time num">' + esc(st) + '</span><div class="tx"><b>' + esc(c.name) + "</b><small>" + esc(c.coach || "No coach set") + " · " + c.booked + "/" + c.capacity + ' booked</small><div class="bar ' + (pc >= 90 ? "warn" : "") + '" style="margin-top:6px"><i style="width:' + Math.min(100, pc) + '%"></i></div></div>' + chipH + "</div>";
    }).join("") : '<div class="empty">No classes today.</div>';

    var attn = [];
    if (can(["admin", "manager"]) && sampleOn()) attn.push('<div class="li"><span class="ico bad">' + icon("alert") + '</span><div class="tx"><b>' + SAMPLE.failed + " failed payments " + sampleTag() + "</b><small>Retry or contact the members</small></div></div>");
    if (d.enquiries_new) attn.push('<a class="li" href="#/enquiries"><span class="ico acc">' + icon("inbox") + '</span><div class="tx"><b>' + d.enquiries_new + " new enquir" + (d.enquiries_new === 1 ? "y" : "ies") + "</b><small>Newest: " + esc(((d.latest_enquiries || [])[0] || {}).name || "") + "</small></div></a>");
    (ins.tomorrow_busy || []).forEach(function (t) { attn.push('<div class="li"><span class="ico warn">' + icon("clock") + '</span><div class="tx"><b>' + esc(t.name) + " tomorrow is almost full</b><small>" + t.booked + " of " + t.capacity + " spaces taken</small></div></div>"); });
    if (ins.health_missing) attn.push('<div class="li"><span class="ico warn">' + icon("users") + '</span><div class="tx"><b>' + ins.health_missing + " member" + (ins.health_missing === 1 ? "" : "s") + " without a health form</b><small>They cannot book until it is done</small></div></div>");
    if (d.emails_7d_failed) attn.push('<a class="li" href="#/emails"><span class="ico bad">' + icon("mail") + '</span><div class="tx"><b>' + d.emails_7d_failed + " email" + (d.emails_7d_failed === 1 ? "" : "s") + " failed this week</b><small>Open the Emails page</small></div></a>");
    if (!attn.length) attn.push('<div class="empty">Nothing needs attention right now.</div>');
    var KIND = { booking: ["cal", "acc"], member: ["users", "ok"], enquiry: ["inbox", "acc"], email: ["mail", "bad"] };
    var act = (ins.activity || []).map(function (a) { var k2 = KIND[a.kind] || ["check", "ok"]; return '<div class="li"><span class="ico ' + k2[1] + '">' + icon(k2[0]) + '</span><div class="tx"><b>' + esc(a.title) + "</b><small>" + esc(a.sub || "") + '</small></div><small class="hide-s" style="color:var(--faint)">' + esc(ago(a.at)) + "</small></div>"; }).join("") || '<div class="empty">Nothing yet. Activity shows here as members book and sign up.</div>';
    var segs = SAMPLE.plans;
    var donutHtml = sampleOn() ? '<div class="donut-wrap">' + donut(segs) + '<div class="donut-leg">' + segs.map(function (s) { return '<div><i style="background:' + s.c + '"></i>' + esc(s.n) + '<span class="num">' + s.v + "</span></div>"; }).join("") + "</div></div>" : '<div class="empty">Connect Wix plans to see members by plan.</div>';
    var JOBN = { "sync-wix-bookings": "Wix booking sync", "sync-timetable": "Timetable sync", "class-reminder-emails": "Class reminder emails", "engagement-emails": "Engagement emails", "lead-and-referral-emails": "Lead follow-ups", "weekly-report": "Weekly report", "send-class-reminders": "Phone reminders" };
    var health = (ins.jobs || []).map(function (j) { var ok = j.status === "succeeded"; return '<div><b style="display:flex;align-items:center;gap:8px;font:650 14px sans-serif"><span class="chip ' + (ok ? "ok" : j.status ? "bad" : "plain") + '">' + (ok ? "OK" : esc(j.status || "No run")) + "</span>" + esc(JOBN[j.job] || j.job) + '</b><small style="color:var(--mut)">' + (j.at ? "last run " + esc(ago(j.at)) : "") + "</small></div>"; }).join("");

    root.appendChild(pageHead((hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening") + (first ? ", " + first : ""), new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ }) + " · here's how the gym is doing"));
    if (sampleOn() && can(["admin", "manager"])) root.appendChild(h("div", { class: "banner" }, [h("div", null, [h("b", { text: "Sample figures. " }), document.createTextNode("Items marked Sample (revenue, failed payments, members by plan) are placeholders until payments are connected. Everything else is real.")])]));
    root.appendChild(fromHtml('<div class="grid g4">' + k.join("") + "</div>"));
    root.appendChild(fromHtml('<div class="grid g-main" style="margin-top:16px"><div class="card"><div class="hd"><h3>Bookings, last 14 days</h3><span class="sub">' + spk.reduce(function (a, b) { return a + b; }, 0) + ' in total</span></div><div class="bd">' + barChart(last14, d.today) + '</div></div><div class="card"><div class="hd"><h3>' + (dayLabel === "today" ? "Today's" : dayLabel === "tomorrow" ? "Tomorrow's" : dayLabel + "'s") + ' classes</h3><span class="sub">' + tc.length + ' sessions</span></div><div class="bd"><div class="list">' + tcHtml + "</div></div></div></div>"));
    root.appendChild(fromHtml('<div class="grid g-eq" style="margin-top:16px"><div class="card"><div class="hd"><h3>When people train</h3><span class="sub">average class fill, last 4 weeks</span></div><div class="bd">' + heatHtml(ins.heat) + '</div></div><div class="card"><div class="hd"><h3>Members by plan ' + (sampleOn() ? sampleTag() : "") + '</h3></div><div class="bd">' + donutHtml + "</div></div></div>"));
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

  function ttEdit(c, ctx) {
    var isNew = !c, kind = c ? c.kind : (ttView === "gym" ? "gym" : "class"), isGym = kind === "gym", dayDefault = c ? c.day : (ttDay !== "all" ? ttDay : "Monday");
    var day = h("select", { class: "in sel", id: "ttDay" }, WD.map(function (d) { return h("option", { value: d, text: d, selected: d === dayDefault }); }));
    var time = h("input", { class: "in", id: "ttTime", type: "time", step: "300", min: "05:00", max: "23:59", required: true, value: c ? String(c.time).slice(0, 5) : "" });
    var name = isGym ? null : h("input", { class: "in", id: "ttName", maxlength: "60", required: true, placeholder: "For example HIIT", value: c ? c.name : "" });
    var coach = h("input", { class: "in", id: "ttCoach", maxlength: "60", placeholder: "Optional", value: c ? (c.coach || "") : "" });
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
      h("div", { class: "row2" }, [h("div", { class: "field" }, [h("label", { for: "ttCoach", text: "Coach" }), coach]), isGym ? null : h("div", { class: "field" }, [h("label", { for: "ttInfo", text: "Length" }), info, lens])]),
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
  function areaChart(vals, labels) {
    var W = 560, H = 210, L = 44, B = 28, T = 14, mn = Math.min.apply(null, vals) * 0.9, mx = Math.max.apply(null, vals) * 1.05, ch = H - B - T, step = (W - L - 10) / (vals.length - 1);
    var pts = vals.map(function (v, i) { return [L + i * step, T + ch - ((v - mn) / (mx - mn)) * ch]; }), line = pts.map(function (p) { return p.join(","); }).join(" "), g = "";
    for (var i = 0; i <= 3; i++) { var y = T + ch - (ch * i) / 3, v = mn + ((mx - mn) * i) / 3; g += '<line x1="' + L + '" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke="#efedec"/><text x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end">\u00A3' + (v / 1000).toFixed(1) + "k</text>"; }
    return '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Monthly revenue"><defs><linearGradient id="ag" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e03939" stop-opacity=".22"/><stop offset="1" stop-color="#e03939" stop-opacity="0"/></linearGradient></defs>' + g +
      '<polygon points="' + L + "," + (T + ch) + " " + line + " " + pts[pts.length - 1][0] + "," + (T + ch) + '" fill="url(#ag)"/><polyline points="' + line + '" fill="none" stroke="#e03939" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>' +
      pts.map(function (p, i) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4.5" fill="#fff" stroke="#e03939" stroke-width="2.4"><title>' + esc(labels[i] + ": \u00A3" + vals[i]) + '</title></circle><text x="' + p[0] + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(labels[i]) + "</text>"; }).join("") + "</svg>";
  }
  function vPlans() {
    var root = h("div");
    root.appendChild(pageHead("Plans and payments", "Memberships, payments and receipts."));
    if (!sampleOn()) {
      root.appendChild(h("div", { class: "soon" }, [h("h3", { text: "Not connected yet" }), h("p", { text: "Plans, payments and invoices are still handled in Wix (checkout at join.mygymlondon.co.uk). Until they move to this system, this page cannot show real figures." }), h("p", null, [h("a", { class: "btn", href: "https://manage.wix.com/", target: "_blank", rel: "noopener", text: "Open Wix dashboard" })])]));
      return root;
    }
    var price = { "Gym + Classes": 35, "Classes only": 26, "Gym only": 26, "Annual": 33, "PT bundles": 60 }, mrr = 0, subs = 0;
    SAMPLE.plans.forEach(function (p) { mrr += (price[p.n] || 0) * p.v; subs += p.v; });
    var months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
    root.appendChild(h("div", { class: "banner" }, [h("div", null, [h("b", { text: "Sample figures. " }), document.createTextNode("Plans, payments and invoices are still in Wix. These numbers are placeholders so you can see the finished page. They are replaced with real figures when payments are connected.")])]));
    root.appendChild(fromHtml('<div class="grid g4">' + kpiX("Monthly recurring revenue", "pound", "\u00A3" + mrr.toLocaleString("en-GB"), "", "+4.0% vs last month", "up", spark(SAMPLE.revenue, "#e03939"), "", true) + kpiX("Active members on a plan", "users", subs, "", "+3 this month", "up", "", "", true) +
      kpiX("Average per member", "card", "\u00A3" + (mrr / subs).toFixed(2), "", "per month", "flat", "", "", true) + kpiX("Failed payments", "alert", SAMPLE.failed, "", "Needs a follow-up", "dn", "", "alert", true) + "</div>"));
    var rows = SAMPLE.plans.map(function (p) { return '<tr style="cursor:default"><td><span class="dotc" style="background:' + p.c + '"></span> <b>' + esc(p.n) + '</b></td><td class="num">\u00A3' + (price[p.n] || 0) + '</td><td class="num r">' + p.v + '</td><td class="num r">\u00A3' + ((price[p.n] || 0) * p.v).toLocaleString("en-GB") + "</td></tr>"; }).join("");
    var fails = [["Sample member A", "\u00A335.00", "2 days ago", "Card declined"], ["Sample member B", "\u00A326.00", "4 days ago", "Insufficient funds"]].map(function (f) { return '<div class="li"><span class="ico bad">' + icon("alert") + '</span><div class="tx"><b>' + f[0] + "</b><small>" + f[3] + " \u00B7 " + f[2] + '</small></div><b class="num">' + f[1] + "</b></div>"; }).join("");
    root.appendChild(fromHtml('<div class="grid g2" style="margin-top:16px;align-items:start"><div class="card"><div class="hd"><h3>Revenue, last 7 months ' + sampleTag() + '</h3></div><div class="bd">' + areaChart(SAMPLE.revenue, months) + '</div></div><div class="card"><div class="hd"><h3>Failed payments ' + sampleTag() + '</h3><span class="sub">retried on day 5, paused on day 21</span></div><div class="bd"><div class="list">' + fails + "</div></div></div></div>"));
    root.appendChild(fromHtml('<div class="card" style="margin-top:16px"><div class="hd"><h3>Plans ' + sampleTag() + '</h3></div><div class="bd"><div class="tbl-wrap"><table class="t" style="min-width:0"><thead><tr><th>Plan</th><th>Price</th><th class="r">Members</th><th class="r">Per month</th></tr></thead><tbody>' + rows + "</tbody></table></div></div></div>"));
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
  async function vForms() {
    var rows = await rpc("admin_forms_summary"), root = h("div"), by = {}; rows.forEach(function (r) { by[r.form_id] = r; });
    root.appendChild(pageHead("Forms and pages", "Every website form sends its answers to Enquiries. Here is where each form lives and how much it is used."));
    var body = h("tbody");
    Object.keys(FORM_INFO).forEach(function (id) {
      var s = by[id] || { total: 0, last_30d: 0, new: 0 };
      body.appendChild(h("tr", { style: "cursor:default" }, [h("td", null, [h("b", { text: FORM_INFO[id][0] }), h("small", { class: "block muted", text: FORM_INFO[id][1] })]), h("td", { class: "num r", text: s.total }), h("td", { class: "num r", text: s.last_30d }), h("td", null, [s.new ? chip(s.new + " new", "bad") : chip("None waiting", "plain")]),
        h("td", { class: "r" }, [h("a", { class: "btn sm", href: "https://app.mygymlondon.co.uk/f/" + id + ".html", target: "_blank", rel: "noopener", text: "Open form" })])]));
    });
    root.appendChild(h("section", { class: "card" }, [h("div", { class: "hd" }, [h("h3", { text: "Forms" })]), h("div", { class: "bd" }, [h("div", { class: "tbl-wrap" }, [h("table", { class: "t", style: "min-width:600px" }, [h("thead", null, [h("tr", null, [h("th", { text: "Form" }), h("th", { class: "r", text: "Total" }), h("th", { class: "r", text: "30 days" }), h("th", { text: "Status" }), h("th")])]), body])])])]));
    var pg = h("div", { class: "list" }); SITE_PAGES.forEach(function (p) { pg.appendChild(h("div", { class: "li" }, [h("div", { class: "tx" }, [h("b", { text: p[0] })]), h("a", { class: "btn sm", href: "https://www.mygymlondon.co.uk/" + p[1], target: "_blank", rel: "noopener", text: "View" })])); });
    root.appendChild(h("div", { class: "grid g2", style: "margin-top:16px;align-items:start" }, [card("Website pages", "", [pg]), card("Landing pages", "", [h("div", { class: "soon" }, [h("p", { text: "No landing pages yet. When you build one (for example a January offer), it will be listed here with its sign-up count." })])])]));
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
