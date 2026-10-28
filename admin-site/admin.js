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
