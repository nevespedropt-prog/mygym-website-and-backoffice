/* MY GYM London back end: design mock-up. Plain JS, sample data only, nothing is saved. */
(() => {
  "use strict";
  const D = window.DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- icons ---------- */
  const IC = {
    home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10", cal: "M3 5h18v16H3zM3 10h18M8 3v4M16 3v4", clip: "M9 3h6v3H9zM7 5H5v16h14V5h-2M9 12h6M9 16h4",
    users: "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-2a4 4 0 0 0-3-3.9M16 2.1a4 4 0 0 1 0 7.8",
    card: "M2 6h20v12H2zM2 10h20M6 15h4", inbox: "M22 12h-6l-2 3h-4l-2-3H2M5.5 5h13L22 12v7H2v-7z", file: "M14 3H6v18h12V7zM14 3v4h4M9 12h6M9 16h6",
    send: "M22 2L11 13M22 2l-7 20-4-9-9-4z", cog: "M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4", search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
    plus: "M12 5v14M5 12h14", x: "M18 6L6 18M6 6l12 12", check: "M20 6L9 17l-5-5", lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4", clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
    alert: "M12 3l10 18H2zM12 10v5M12 18h0", up: "M7 17L17 7M8 7h9v9", down: "M7 7l10 10M17 8v9H8", menu: "M3 6h18M3 12h18M3 18h18", dl: "M12 3v12M7 10l5 5 5-5M4 21h16",
    chev: "M9 6l6 6-6 6", ext: "M14 3h7v7M21 3l-9 9M19 14v7H3V5h7", mail: "M3 5h18v14H3zM3 7l9 7 9-7", bell: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0",
    refresh: "M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5", dumb: "M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11", zap: "M13 2L3 14h8l-1 8 10-12h-8z", pulse: "M22 12h-4l-3 9L9 3l-3 9H2",
    pound: "M18 7c0-2.2-2-4-4.5-4S9 4.8 9 7v4H6m3 0v6c0 1.7-1 3-3 3h12M6 14h8", edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z", link: "M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1",
  };
  const icon = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${IC[n] || ""}"/></svg>`;

  /* ---------- helpers ---------- */
  const mById = (id) => D.members.find((m) => m.id === id);
  const cById = (id) => D.classes.find((c) => c.id === id);
  const pById = (id) => D.plans.find((p) => p.id === id);
  const gbp = (n) => "£" + Math.round(n).toLocaleString("en-GB");
  const ini = (n) => n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const fmtD = (s) => new Date(s + "T12:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const fmtL = (s) => new Date(s + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const todayISO = D.iso(D.today);
  const nowHM = () => { const n = new Date(); return String(n.getHours()).padStart(2, "0") + ":" + String(n.getMinutes()).padStart(2, "0"); };
  const chip = (t, k = "") => `<span class="chip ${k}">${esc(t)}</span>`;
  const bStat = (s) => chip(s, { Confirmed: "info", Attended: "ok", "No-show": "warn", Cancelled: "bad" }[s] || "");
  const mStat = (s) => chip(s, { Active: "ok", Paused: "warn", "Past due": "bad", Trial: "info" }[s] || "");
  const hStat = (s) => chip(s, { Complete: "ok", Due: "warn", Missing: "bad" }[s] || "");
  const av = (name, cls = "", s = "") => `<span class="av ${s} ${cls}">${esc(ini(name))}</span>`;
  const attr = (o) => Object.entries(o).map(([k, v]) => `${k}="${esc(v)}"`).join(" ");

  const state = { route: "dashboard", bq: "", bClass: "", bSrc: "", bStatus: "", bWhen: "upcoming", bPage: 1, mq: "", mPlan: "", mStatus: "", mPage: 1, tt: "classes", msg: 1, msgFilter: "all", planTab: "overview", setTab: "health", anTab: "ret", mkTab: "camp", dtTab: "in", ciClass: 0, checked: {} };
  const PER = 10;

  /* ---------- charts ---------- */
  const spark = (pts, color) => {
    const w = 84, h = 30, mx = Math.max(...pts), mn = Math.min(...pts), r = mx - mn || 1;
    const p = pts.map((v, i) => `${(i / (pts.length - 1)) * w},${h - 3 - ((v - mn) / r) * (h - 8)}`).join(" ");
    return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" points="${p}"/></svg>`;
  };
  const barChart = (rows) => {
    const W = 640, H = 230, L = 32, B = 28, T = 10, mx = Math.ceil(Math.max(...rows.map((r) => r.n)) / 10) * 10 || 10;
    const bw = (W - L) / rows.length, ch = H - B - T;
    let g = "", b = "";
    for (let i = 0; i <= 4; i++) { const y = T + ch - (ch * i) / 4; g += `<line x1="${L}" x2="${W}" y1="${y}" y2="${y}" stroke="#efedec"/><text x="${L - 8}" y="${y + 4}" text-anchor="end">${Math.round((mx * i) / 4)}</text>`; }
    rows.forEach((r, i) => {
      const h = Math.max(3, (r.n / mx) * ch), x = L + i * bw + bw * 0.16, last = i === rows.length - 1;
      const lab = r.d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
      b += `<rect x="${x}" y="${T + ch - h}" width="${bw * 0.68}" height="${h}" rx="5" fill="${last ? "#e03939" : "#f1c0c0"}" data-tip="${esc(lab + ": " + r.n + " bookings")}" class="bar-r"/>`;
      if (i % 2 === 0 || last) b += `<text x="${x + bw * 0.34}" y="${H - 8}" text-anchor="middle">${r.d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</text>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Bookings per day, last 14 days">${g}${b}</svg>`;
  };
  const areaChart = (vals, labels) => {
    const W = 560, H = 210, L = 44, B = 28, T = 14, mn = Math.min(...vals) * 0.9, mx = Math.max(...vals) * 1.05, ch = H - B - T, step = (W - L - 10) / (vals.length - 1);
    const pts = vals.map((v, i) => [L + i * step, T + ch - ((v - mn) / (mx - mn)) * ch]);
    const line = pts.map((p) => p.join(",")).join(" ");
    let g = "";
    for (let i = 0; i <= 3; i++) { const y = T + ch - (ch * i) / 3, v = mn + ((mx - mn) * i) / 3; g += `<line x1="${L}" x2="${W}" y1="${y}" y2="${y}" stroke="#efedec"/><text x="${L - 8}" y="${y + 4}" text-anchor="end">£${(v / 1000).toFixed(1)}k</text>`; }
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Monthly recurring revenue"><defs><linearGradient id="ag" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e03939" stop-opacity=".22"/><stop offset="1" stop-color="#e03939" stop-opacity="0"/></linearGradient></defs>${g}
      <polygon points="${L},${T + ch} ${line} ${pts[pts.length - 1][0]},${T + ch}" fill="url(#ag)"/><polyline points="${line}" fill="none" stroke="#e03939" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>
      ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="4.5" fill="#fff" stroke="#e03939" stroke-width="2.4" data-tip="${esc(labels[i] + ": " + gbp(vals[i]))}"/><text x="${p[0]}" y="${H - 8}" text-anchor="middle">${esc(labels[i])}</text>`).join("")}</svg>`;
  };
  const donut = (segs) => {
    const tot = segs.reduce((a, s) => a + s.v, 0), R = 62, C = 2 * Math.PI * R;
    let off = 0;
    const arcs = segs.map((s) => { const len = (s.v / tot) * C, a = `<circle r="${R}" cx="80" cy="80" fill="none" stroke="${s.c}" stroke-width="22" stroke-dasharray="${len - 2} ${C - len + 2}" stroke-dashoffset="${-off}" transform="rotate(-90 80 80)" data-tip="${esc(s.n + ": " + s.v)}"/>`; off += len; return a; }).join("");
    return `<svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="Members by plan"><circle r="${R}" cx="80" cy="80" fill="none" stroke="#f0eeec" stroke-width="22"/>${arcs}<text x="80" y="82" text-anchor="middle" style="font:800 34px var(--disp);fill:#1b1b1f">${tot}</text><text x="80" y="100" text-anchor="middle" style="font:600 11px sans-serif;fill:#6b6a72">subscriptions</text></svg>`;
  };
  const heat = () => {
    const times = [...new Set(D.classes.map((c) => c.time))].sort();
    let html = `<div class="heat" style="grid-template-columns:48px repeat(6,1fr)"><span></span>${D.DAY.slice(0, 6).map((d) => `<span class="hl" style="justify-content:center">${d}</span>`).join("")}`;
    times.forEach((t) => {
      html += `<span class="hl">${t}</span>`;
      for (let d = 0; d < 6; d++) {
        const c = D.classes.find((x) => x.day === d && x.time === t && x.active);
        if (!c) { html += `<span class="hc" style="background:transparent;border:1px dashed #ece9e7"></span>`; continue; }
        let sum = 0, n = 0; for (const k in c) if (k[0] === "f" && k.length > 3) { sum += c[k]; n++; }
        const pc = Math.min(1, sum / Math.max(1, n) / c.cap);
        html += `<span class="hc" style="background:rgba(224,57,57,${(0.1 + pc * 0.85).toFixed(2)})" data-tip="${esc(c.name + " · " + D.DAY[d] + " " + t + " · " + Math.round(pc * 100) + "% full on average")}"></span>`;
      }
    });
    return html + "</div>";
  };

  /* ---------- computed numbers ---------- */
  const clsFor = (d) => D.classes.filter((c) => c.day === D.dow(d) && c.active).sort((a, b) => a.time.localeCompare(b.time));
  const todayCls = () => clsFor(D.today);
  const fillOn = (c, ds) => c["f" + ds] || 0;
  const mrr = () => D.plans.reduce((a, p) => a + (p.per === "year" ? p.price / 12 : p.price) * p.subs, 0);

  /* ---------- pages ---------- */
  const PAGES = {};
  const head = (t, p, acts = "") => `<div class="ph"><div><h1>${t}</h1><p>${p}</p></div><div class="acts">${acts}</div></div>`;
  const kpi = (lab, ic, val, unit, delta, dir, sp, cls = "") => `<div class="card kpi ${cls}"><div class="lab">${icon(ic)} ${lab}</div><div class="val num">${val}${unit ? `<small>${unit}</small>` : ""}</div><div class="dlt ${dir}">${dir === "up" ? icon("up") : dir === "dn" ? icon("down") : ""}${delta}</div>${sp || ""}</div>`;

  PAGES.dashboard = () => {
    const hr = new Date().getHours(), greet = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
    let off = 0; while (!clsFor(D.addD(D.today, off)).length && off < 7) off++;   // no classes today (e.g. Sunday): show the next day that has some
    const day = D.addD(D.today, off), dayISO = D.iso(day), lab = off === 0 ? "today" : off === 1 ? "tomorrow" : D.DAY[D.dow(day)];
    const tc = clsFor(day), booked = tc.reduce((a, c) => a + fillOn(c, dayISO), 0), cap = tc.reduce((a, c) => a + c.cap, 0);
    const lastW = tc.reduce((a, c) => a + fillOn(c, D.iso(D.addD(day, -7))), 0);
    const diff = booked - lastW, unread = D.messages.filter((m) => m.unread).length, failed = D.payments.filter((p) => p.status === "Failed").length;
    const avgFill = Math.round((D.perDay.reduce((a, r) => a + r.n, 0) / (D.perDay.length * (cap || 40))) * 100);
    const now = nowHM();
    const tcHtml = tc.length ? tc.map((c) => {
      const n = fillOn(c, dayISO), pc = Math.round((n / c.cap) * 100), done = off === 0 && c.time < now, live = off === 0 && c.time <= now && now < String(parseInt(c.time) + 1).padStart(2, "0") + c.time.slice(2);
      return `<div class="li" data-act="open-class" data-id="${c.id}" style="cursor:pointer"><span class="time num">${c.time}</span><div class="tx"><b>${esc(c.name)}</b><small>${esc(c.coach)} · ${n}/${c.cap} booked</small><div class="bar ${pc >= 90 ? "warn" : ""}" style="margin-top:6px"><i style="width:${pc}%"></i></div></div>${live ? chip("Now", "acc") : done ? chip("Done", "") : pc >= 100 ? chip("Full", "warn") : chip("Open", "ok")}</div>`;
    }).join("") : `<div class="empty">No classes today.</div>`;
    const attn = [
      failed ? `<div class="li" data-act="go" data-to="plans" style="cursor:pointer"><span class="ico bad">${icon("alert")}</span><div class="tx"><b>${failed} failed payments</b><small>Retry or contact the members</small></div>${chip("Review", "bad plain")}</div>` : "",
      `<div class="li" data-act="go" data-to="messages" style="cursor:pointer"><span class="ico acc">${icon("inbox")}</span><div class="tx"><b>${unread} unread messages</b><small>Newest: ${esc(D.messages[0].subj)}</small></div>${chip("Open", "acc plain")}</div>`,
      `<div class="li"><span class="ico warn">${icon("clock")}</span><div class="tx"><b>Boxing Fit tomorrow is almost full</b><small>13 of 14 spaces taken</small></div></div>`,
      `<div class="li"><span class="ico warn">${icon("users")}</span><div class="tx"><b>6 health forms are due or missing</b><small>Members can't book until updated</small></div></div>`,
    ].join("");
    const act = D.activity.map((a) => `<div class="li"><span class="ico ${a.cl}">${icon(a.ic)}</span><div class="tx"><b>${esc(a.t)}</b><small>${esc(a.s)}</small></div><small class="hide-s" style="color:var(--faint)">${esc(a.at)}</small></div>`).join("");
    const planSegs = D.plans.map((p) => ({ n: p.name, v: p.subs, c: p.color }));
    return head(`${greet}, Pedro`, new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + " · here's how the gym is doing",
      `<button class="btn" data-act="toast" data-msg="Report exported (sample)">${icon("dl")} Export report</button><button class="btn pri" data-act="new-booking">${icon("plus")} New booking</button>`) +
      `<div class="grid g4">
        ${kpi("Bookings " + lab, "clip", booked, `/ ${cap}`, `${diff >= 0 ? "+" : ""}${diff} vs last ${D.DAY[D.dow(day)]}`, diff > 0 ? "up" : diff < 0 ? "dn" : "flat", spark(D.perDay.map((r) => r.n), "#e03939"))}
        ${kpi("Spaces left " + lab, "dumb", Math.max(0, cap - booked), "", `${Math.round((booked / (cap || 1)) * 100)}% of ${lab}'s capacity booked`, "flat")}
        ${kpi("Active members", "users", D.totals.activeSubs, "", "+3 this month", "up", spark([44, 46, 47, 49, 52, 55], "#238a52"))}
        ${kpi("Monthly revenue", "pound", gbp(mrr()), "", "+4.1% vs last month", "up", spark(D.revenue, "#e03939"))}
        ${kpi("New sign-ups this week", "plus", 6, "", "+2 vs last week", "up")}
        ${kpi("Average class fill", "pulse", avgFill, "%", "last 14 days", "flat")}
        ${kpi("Unread messages", "inbox", unread, "", unread ? "Reply to keep response time low" : "All caught up", unread ? "dn" : "up", "", unread ? "alert" : "")}
        ${kpi("Failed payments", "alert", failed, "", failed ? "Needs a follow-up" : "None this month", failed ? "dn" : "up", "", failed ? "alert" : "")}
      </div>
      <div class="grid g-main" style="margin-top:16px">
        <div class="card"><div class="hd"><h3>Bookings, last 14 days</h3><span class="sub">${D.perDay.reduce((a, r) => a + r.n, 0)} in total</span></div><div class="bd">${barChart(D.perDay)}</div></div>
        <div class="card"><div class="hd"><h3>${lab === "today" ? "Today's" : lab === "tomorrow" ? "Tomorrow's" : D.DAY[D.dow(day)] + "'s"} classes</h3><span class="sub">${tc.length} sessions</span></div><div class="bd"><div class="list">${tcHtml}</div></div></div>
      </div>
      <div class="grid g-eq" style="margin-top:16px">
        <div class="card"><div class="hd"><h3>When people train</h3><span class="sub">average class fill</span></div><div class="bd">${heat()}</div></div>
        <div class="card"><div class="hd"><h3>Members by plan</h3></div><div class="bd"><div class="donut-wrap">${donut(planSegs)}<div class="donut-leg">${planSegs.map((s) => `<div><i style="background:${s.c}"></i>${esc(s.n)}<span class="num">${s.v}</span></div>`).join("")}</div></div></div></div>
      </div>
      <div class="grid g2" style="margin-top:16px">
        <div class="card"><div class="hd"><h3>Needs attention</h3></div><div class="bd"><div class="list">${attn}</div></div></div>
        <div class="card"><div class="hd"><h3>Recent activity</h3></div><div class="bd"><div class="list">${act}</div></div></div>
      </div>
      <div class="card" style="margin-top:16px"><div class="hd"><h3>System health</h3><span class="sub"><a href="#/settings" style="color:var(--accd);font-weight:650">Details</a></span></div><div class="bd stat-row">${D.health.map((h) => `<div><b style="display:flex;align-items:center;gap:8px;font:650 14px sans-serif">${chip(h.ok ? "OK" : "Planned", h.ok ? "ok" : "plain")} ${esc(h.name)}</b><small>${esc(h.note)}</small></div>`).join("")}</div></div>`;
  };

  const bookingRows = () => {
    const q = state.bq.toLowerCase();
    return D.bookings.filter((b) => {
      const m = mById(b.member), c = cById(b.cls);
      if (state.bWhen === "upcoming" && b.date < todayISO) return false;
      if (state.bWhen === "past" && b.date >= todayISO) return false;
      if (state.bClass && String(b.cls) !== state.bClass) return false;
      if (state.bSrc && b.src !== state.bSrc) return false;
      if (state.bStatus && b.status !== state.bStatus) return false;
      return !q || (m.name + " " + m.email + " " + c.name + " " + b.id).toLowerCase().includes(q);
    }).sort((a, b) => state.bWhen === "upcoming" ? (a.date + a.time).localeCompare(b.date + b.time) : (b.date + b.time).localeCompare(a.date + a.time));
  };
  const bookingTable = () => {
    const rows = bookingRows(), pages = Math.max(1, Math.ceil(rows.length / PER)), pg = Math.min(state.bPage, pages), slice = rows.slice((pg - 1) * PER, pg * PER);
    const body = slice.length ? slice.map((b) => { const m = mById(b.member), c = cById(b.cls); return `<tr data-act="open-booking" data-id="${b.id}"><td><div class="who">${av(m.name, "s", m.av)}<div><b>${esc(m.name)}</b><small>${esc(m.email)}</small></div></div></td><td><b>${esc(c.name)}</b><small style="display:block;color:var(--mut)">${esc(c.coach)}</small></td><td class="num">${fmtD(b.date)} · ${b.time}</td><td>${chip(b.src, "plain " + (b.src === "App" ? "acc" : b.src === "Admin" ? "" : "info"))}</td><td>${bStat(b.status)}</td><td class="num" style="color:var(--mut)">${fmtD(b.at)}</td><td class="r">${icon("chev")}</td></tr>`; }).join("") : `<tr><td colspan="7"><div class="empty">No bookings match these filters.</div></td></tr>`;
    return `<div class="tbl-wrap"><table class="t"><thead><tr><th>Member</th><th>Class</th><th>When</th><th>Source</th><th>Status</th><th>Booked</th><th></th></tr></thead><tbody>${body}</tbody></table></div>
      <div class="pager"><span>${rows.length ? `Showing ${(pg - 1) * PER + 1}–${Math.min(pg * PER, rows.length)} of ${rows.length}` : "0 results"}</span><span class="grow"></span><button class="btn sm" data-act="bpage" data-d="-1" ${pg <= 1 ? "disabled" : ""}>Previous</button><span>Page ${pg} of ${pages}</span><button class="btn sm" data-act="bpage" data-d="1" ${pg >= pages ? "disabled" : ""}>Next</button></div>`;
  };
  PAGES.bookings = () => {
    const opt = (v, l, cur) => `<option value="${esc(v)}" ${String(cur) === String(v) ? "selected" : ""}>${esc(l)}</option>`;
    const sums = D.bookings.filter((b) => b.date === todayISO);
    return head("Bookings", "Every booking from the app, the Wix site and the front desk, in one place.",
      `<button class="btn" data-act="toast" data-msg="CSV exported (sample)">${icon("dl")} Export CSV</button><button class="btn pri" data-act="new-booking">${icon("plus")} New booking</button>`) +
      `<div class="grid g4" style="margin-bottom:16px">${kpi("Today", "clip", sums.length, "", "bookings so far", "flat")}${kpi("Confirmed ahead", "check", D.bookings.filter((b) => b.date > todayISO && b.status === "Confirmed").length, "", "next 14 days", "flat")}${kpi("Cancelled this fortnight", "x", D.bookings.filter((b) => b.status === "Cancelled").length, "", "cancel up to 10 min before", "flat")}${kpi("No-shows", "alert", D.bookings.filter((b) => b.status === "No-show").length, "", "last 14 days", "flat")}</div>
      <div class="card"><div class="toolbar"><div class="seg" id="bwhen"><button data-act="bwhen" data-v="upcoming" class="${state.bWhen === "upcoming" ? "on" : ""}">Upcoming</button><button data-act="bwhen" data-v="past" class="${state.bWhen === "past" ? "on" : ""}">Past</button><button data-act="bwhen" data-v="all" class="${state.bWhen === "all" ? "on" : ""}">All</button></div>
      <label class="search"><span class="sr">Search bookings</span>${icon("search")}<input class="in" style="padding-left:40px;width:100%" data-f="bq" placeholder="Search member or class" value="${esc(state.bq)}"></label>
      <select class="sel" data-f="bClass" aria-label="Class">${opt("", "All classes", state.bClass)}${[...new Map(D.classes.map((c) => [c.name, c])).values()].map((c) => opt(c.id, c.name, state.bClass)).join("")}</select>
      <select class="sel" data-f="bSrc" aria-label="Source">${opt("", "All sources", state.bSrc)}${["App", "Wix site", "Admin"].map((s) => opt(s, s, state.bSrc)).join("")}</select>
      <select class="sel" data-f="bStatus" aria-label="Status">${opt("", "Any status", state.bStatus)}${["Confirmed", "Attended", "No-show", "Cancelled"].map((s) => opt(s, s, state.bStatus)).join("")}</select></div><div id="btable">${bookingTable()}</div></div>`;
  };

  const ttClasses = () => {
    const HOURS = []; for (let h = 6; h <= 20; h++) HOURS.push(h);
    const todayD = D.dow(D.today);
    let g = `<div class="wk"><div class="dh" style="border-right:0"></div>${D.DAY.map((d, i) => `<div class="dh ${i === todayD ? "today" : ""}">${d}${i === todayD ? " · today" : ""}</div>`).join("")}`;
    HOURS.forEach((h) => {
      g += `<div class="hr num">${String(h).padStart(2, "0")}:00</div>`;
      for (let d = 0; d < 7; d++) {
        const cs = D.classes.filter((c) => c.day === d && parseInt(c.time) === h);
        g += `<div class="cell">${cs.map((c) => { const m = parseInt(c.time.slice(3)), n = fillOn(c, D.iso(D.addD(D.today, ((d - todayD + 7) % 7)))), pc = Math.min(100, Math.round((n / c.cap) * 100));
          return `<button class="cls ${c.active ? c.kind : "off"}" style="top:${((m / 60) * 76 + 2).toFixed(0)}px;height:${((c.dur / 60) * 76 - 4).toFixed(0)}px;inset-inline:3px;bottom:auto" data-act="open-class" data-id="${c.id}" data-tip="${esc(c.name + " · " + c.time + " · " + (c.active ? n + "/" + c.cap + " booked" : "switched off"))}"><b>${esc(c.name)}</b><small>${c.time} · ${c.source === "wix" ? icon("lock").replace('class="i"', 'class="i" style="width:11px;height:11px"') : ""}${c.active ? n + "/" + c.cap : "off"}</small>${c.active ? `<span class="mini"><i style="width:${pc}%"></i></span>` : ""}</button>`; }).join("")}</div>`;
      }
    });
    return `<div class="tbl-wrap" style="max-height:720px">${g}</div>`;
  };
  const gymHours = () => {
    const rows = [["Monday", "05:00", "24:00"], ["Tuesday", "05:00", "24:00"], ["Wednesday", "05:00", "24:00"], ["Thursday", "05:00", "24:00"], ["Friday", "05:00", "24:00"], ["Saturday", "05:00", "24:00"], ["Sunday", "05:00", "24:00"]];
    return `<div class="card"><div class="hd"><h3>Open gym hours</h3><span class="sub">one-hour slots · 6 spaces each</span></div><div class="bd"><div class="list">${rows.map((r, i) => `<div class="li"><div class="tx"><b>${r[0]}</b><small>${r[1] ? `${r[1]} to ${r[2] === "24:00" ? "midnight" : r[2]} · ${parseInt(r[2]) - parseInt(r[1])} hourly slots` : "Closed"}</small></div>
      ${r[1] ? `<input class="in" style="width:92px" value="${r[1]}" aria-label="${r[0]} opens"><input class="in" style="width:92px" value="${r[2]}" aria-label="${r[0]} closes">` : ""}<button class="toggle" role="switch" aria-checked="${r[1] ? "true" : "false"}" data-act="toggle" aria-label="${r[0]} open"></button></div>`).join("")}</div>
      <p style="margin-top:12px;color:var(--mut);font-size:12.5px">Gym slots are only bookable by members on a plan that includes the gym floor.</p></div></div>`;
  };
  PAGES.timetable = () => head("Timetable", "Your weekly classes and open gym hours. Classes from the website are locked and kept in step automatically.",
    `<div class="seg"><button data-act="tt" data-v="classes" class="${state.tt === "classes" ? "on" : ""}">Classes</button><button data-act="tt" data-v="gym" class="${state.tt === "gym" ? "on" : ""}">Gym hours</button></div><button class="btn pri" data-act="new-class">${icon("plus")} Add class</button>`) +
    (state.tt === "classes" ? `<div class="legend" style="margin-bottom:12px"><span><i style="background:#f6cfcf"></i>Class</span><span><i style="background:#c8e8d4"></i>Kids and family</span><span><i style="background:#e3e1df"></i>Switched off</span><span>${icon("lock").replace('class="i"', 'class="i" style="width:12px;height:12px;vertical-align:-2px"')} synced from Wix</span></div><div class="card" style="overflow:hidden">${ttClasses()}</div>` : gymHours());

  const memberRows = () => {
    const q = state.mq.toLowerCase();
    return D.members.filter((m) => (!state.mPlan || m.plan === state.mPlan) && (!state.mStatus || m.status === state.mStatus) && (!q || (m.name + " " + m.email + " " + m.id).toLowerCase().includes(q)));
  };
  const memberTable = () => {
    const rows = memberRows(), pages = Math.max(1, Math.ceil(rows.length / PER)), pg = Math.min(state.mPage, pages), slice = rows.slice((pg - 1) * PER, pg * PER);
    const body = slice.length ? slice.map((m) => `<tr data-act="open-member" data-id="${m.id}"><td><div class="who">${av(m.name, "s", m.av)}<div><b>${esc(m.name)}</b><small>${esc(m.email)}</small></div></div></td><td>${chip(pById(m.plan).name, "plain")}</td><td>${mStat(m.status)}</td><td class="num" style="color:var(--mut)">${fmtL(m.joined)}</td><td class="num" style="color:var(--mut)">${fmtD(m.last)}</td><td class="num r">${m.bookings}</td><td>${hStat(m.health)}</td><td class="r">${icon("chev")}</td></tr>`).join("") : `<tr><td colspan="8"><div class="empty">No members match.</div></td></tr>`;
    return `<div class="tbl-wrap"><table class="t"><thead><tr><th>Member</th><th>Plan</th><th>Status</th><th>Joined</th><th>Last visit</th><th class="r">Bookings</th><th>Health form</th><th></th></tr></thead><tbody>${body}</tbody></table></div>
      <div class="pager"><span>${rows.length ? `Showing ${(pg - 1) * PER + 1}–${Math.min(pg * PER, rows.length)} of ${rows.length} sample members` : "0 results"}</span><span class="grow"></span><button class="btn sm" data-act="mpage" data-d="-1" ${pg <= 1 ? "disabled" : ""}>Previous</button><span>Page ${pg} of ${pages}</span><button class="btn sm" data-act="mpage" data-d="1" ${pg >= pages ? "disabled" : ""}>Next</button></div>`;
  };
  PAGES.members = () => {
    const opt = (v, l, cur) => `<option value="${esc(v)}" ${cur === v ? "selected" : ""}>${esc(l)}</option>`;
    return head("Members", "Everyone who has joined, with their plan, activity and notes.", `<button class="btn" data-act="toast" data-msg="Member list exported (sample)">${icon("dl")} Export</button><button class="btn pri" data-act="toast" data-msg="Add member form (next step)">${icon("plus")} Add member</button>`) +
      `<div class="grid g4" style="margin-bottom:16px">${kpi("All contacts", "users", D.totals.contacts, "", "people in your list", "flat")}${kpi("Customers", "check", D.totals.allSubs, "", "have ever subscribed", "flat")}${kpi("Active subscriptions", "pulse", D.totals.activeSubs, "", "paying now", "up")}${kpi("Past due", "alert", D.members.filter((m) => m.status === "Past due").length, "", "need a nudge", "dn")}</div>
      <div class="card"><div class="toolbar"><label class="search"><span class="sr">Search members</span>${icon("search")}<input class="in" style="padding-left:40px;width:100%" data-f="mq" placeholder="Search name or email" value="${esc(state.mq)}"></label>
      <select class="sel" data-f="mPlan" aria-label="Plan">${opt("", "All plans", state.mPlan)}${D.plans.map((p) => opt(p.id, p.name, state.mPlan)).join("")}</select>
      <select class="sel" data-f="mStatus" aria-label="Status">${opt("", "Any status", state.mStatus)}${["Active", "Paused", "Past due", "Trial"].map((s) => opt(s, s, state.mStatus)).join("")}</select></div><div id="mtable">${memberTable()}</div></div>`;
  };

  PAGES.plans = () => {
    const pay = D.payments.map((p) => { const m = mById(p.member); return `<tr data-act="open-payment" data-id="${p.id}"><td><div class="who">${av(m.name, "s", m.av)}<div><b>${esc(m.name)}</b><small>${esc(pById(p.plan).name)}</small></div></div></td><td class="num">${gbp(p.amount)}</td><td>${chip(p.status, { Paid: "ok", Failed: "bad", Refunded: "warn" }[p.status])}</td><td class="num" style="color:var(--mut)">${fmtD(p.date)}</td><td style="color:var(--mut)">${esc(p.method)}</td><td class="r">${p.status === "Failed" ? `<button class="btn sm" data-act="retry" data-id="${p.id}">Retry</button>` : icon("chev")}</td></tr>`; }).join("");
    return head("Plans & payments", "Your membership plans, who is on them, and the money coming in.", `<button class="btn pri" data-act="toast" data-msg="New plan form (next step)">${icon("plus")} New plan</button>`) +
      `<div class="banner">${icon("alert")}<div><b>Payments are not connected yet.</b> This is how this page will look once Stripe is connected. For now, payments still run through Wix, and every number below is sample data.</div></div>
      <div class="grid g4" style="margin-bottom:16px">${kpi("Monthly recurring", "pound", gbp(mrr()), "", "+4.1% vs last month", "up", spark(D.revenue, "#e03939"))}${kpi("Active subscriptions", "users", D.totals.activeSubs, "", "+3 this month", "up")}${kpi("Failed this month", "alert", D.payments.filter((p) => p.status === "Failed").length, "", "£70 at risk", "dn", "", "alert")}${kpi("Average per member", "card", gbp(mrr() / D.totals.activeSubs), "", "per month", "flat")}</div>
      <div class="cards-m">${D.plans.map((p) => `<div class="card plan"><div style="display:flex;align-items:center;gap:10px"><i style="width:10px;height:10px;border-radius:3px;background:${p.color}"></i><b style="font-size:15px">${esc(p.name)}</b><button class="btn sm ghost" style="margin-left:auto" data-act="open-plan" data-id="${p.id}">${icon("edit")} Edit</button></div><div class="pr num">${gbp(p.price)}<small> / ${p.per}</small></div><div style="color:var(--mut)">${esc(p.note)}</div><div class="sep"></div><div style="display:flex;justify-content:space-between"><span style="color:var(--mut)">Subscribers</span><b class="num">${p.subs}</b></div><div style="display:flex;justify-content:space-between"><span style="color:var(--mut)">Monthly value</span><b class="num">${gbp((p.per === "year" ? p.price / 12 : p.price) * p.subs)}</b></div></div>`).join("")}</div>
      <div class="grid g-eq" style="margin-top:16px"><div class="card"><div class="hd"><h3>Revenue, last 6 months</h3></div><div class="bd">${areaChart(D.revenue, D.months)}</div></div>
      <div class="card"><div class="hd"><h3>Recent payments</h3></div><div class="tbl-wrap"><table class="t" style="min-width:560px"><thead><tr><th>Member</th><th>Amount</th><th>Status</th><th>Date</th><th>Method</th><th></th></tr></thead><tbody>${pay}</tbody></table></div></div></div>`;
  };

  const msgList = () => {
    const f = state.msgFilter;
    return D.messages.filter((m) => f === "all" || (f === "unread" && m.unread) || (f === "enq" && ["Enquiry", "PT"].includes(m.tag))).map((m) => `<div class="mi ${m.unread ? "unr" : ""} ${state.msg === m.id ? "on" : ""}" data-act="open-msg" data-id="${m.id}">${av(m.from, "s", "")}<div class="tx"><b><span>${esc(m.from)}</span><em>${esc(m.at)}</em></b><p>${esc(m.subj)}</p><div style="margin-top:5px;display:flex;gap:6px">${chip(m.tag, "plain acc")}${chip(m.src, "plain")}</div></div></div>`).join("") || `<div class="empty">Nothing here.</div>`;
  };
  const msgView = () => {
    const m = D.messages.find((x) => x.id === state.msg) || D.messages[0];
    return `<div class="mh"><div style="display:flex;gap:12px;align-items:center">${av(m.from, "", "")}<div style="flex:1"><h3 style="font:800 22px var(--disp);letter-spacing:.03em;text-transform:uppercase">${esc(m.subj)}</h3><small style="color:var(--mut)">${esc(m.from)} · ${esc(m.email)} · via ${esc(m.src)}</small></div>${chip(m.tag, "acc plain")}</div></div>
      <div class="mb" id="thread"><div class="bubble"><small>${esc(m.from)} · ${esc(m.at)}</small>${esc(m.body)}</div>${(m.replies || []).map((r) => `<div class="bubble me"><small>You · just now</small>${esc(r)}</div>`).join("")}</div>
      <div class="reply"><textarea class="in" id="replytxt" placeholder="Write a reply to ${esc(m.from.split(" ")[0])}…" aria-label="Reply"></textarea><div style="display:flex;gap:10px;align-items:center"><button class="btn pri" data-act="send-reply">${icon("send")} Send reply</button><button class="btn" data-act="toast" data-msg="Saved reply templates (next step)">Templates</button><span style="margin-left:auto;color:var(--mut);font-size:12.5px">Sends from info@mygymlondon.co.uk</span></div></div>`;
  };
  PAGES.messages = () => head("Messages", "Everything sent to you from the app, the website forms and landing pages.", `<button class="btn" data-act="toast" data-msg="Opens your info@ Gmail (sample)">${icon("mail")} Open info@ Gmail</button>`) +
    `<div class="card"><div class="toolbar"><div class="seg"><button data-act="mfilter" data-v="all" class="${state.msgFilter === "all" ? "on" : ""}">All</button><button data-act="mfilter" data-v="unread" class="${state.msgFilter === "unread" ? "on" : ""}">Unread</button><button data-act="mfilter" data-v="enq" class="${state.msgFilter === "enq" ? "on" : ""}">Enquiries</button></div><span class="grow"></span><small style="color:var(--mut)">${D.messages.filter((m) => m.unread).length} unread</small></div>
    <div class="msgs"><div class="mlist" id="mlist">${msgList()}</div><div class="mview" id="mview">${msgView()}</div></div></div>`;

  PAGES.forms = () => head("Forms & pages", "Forms feed your Messages inbox. Landing pages are built here and published to your website.", `<button class="btn pri" data-act="toast" data-msg="Page builder (next step)">${icon("plus")} New landing page</button>`) +
    `<div class="grid g-eq"><div class="card"><div class="hd"><h3>Forms</h3><span class="sub">last 30 days</span></div><div class="bd"><div class="list">${D.forms.map((f) => `<div class="li"><span class="ico acc">${icon("file")}</span><div class="tx"><b>${esc(f.name)}</b><small>${esc(f.where)} · ${f.subs} submissions · ${esc(f.rate)} conversion</small></div><button class="toggle" role="switch" aria-checked="${f.on}" data-act="toggle" aria-label="${esc(f.name)} on"></button></div>`).join("")}</div></div></div>
    <div class="card"><div class="hd"><h3>Landing pages</h3></div><div class="tbl-wrap"><table class="t" style="min-width:440px"><thead><tr><th>Page</th><th>Address</th><th>Status</th><th class="r">Views</th></tr></thead><tbody>${D.pages.map((p) => `<tr data-act="toast" data-msg="Opens the page editor (next step)"><td><b>${esc(p.name)}</b></td><td style="color:var(--mut)">${esc(p.url)}</td><td>${chip(p.status, p.status === "Live" ? "ok" : "warn")}</td><td class="r num">${esc(p.views)}</td></tr>`).join("")}</tbody></table></div></div></div>
    <div class="card soon" style="margin-top:16px"><b style="font:800 20px var(--disp);letter-spacing:.05em;text-transform:uppercase;color:var(--txt)">Coming next</b><p style="margin-top:4px">Drag-and-drop landing pages, a form builder, and automatic follow-up emails to everyone who fills in a form.</p></div>`;

  PAGES.emails = () => head("Emails", "The automatic emails your gym sends, and when. Switch them on or off, and edit the wording.", `<button class="btn" data-act="toast" data-msg="Send a test to info@ (sample)">${icon("send")} Send a test</button>`) +
    `<div class="card"><div class="hd"><h3>Automatic emails</h3></div><div class="bd"><div class="list">${D.emailTemplates.map((e) => `<div class="li"><span class="ico ${e.on ? "ok" : ""}">${icon("mail")}</span><div class="tx"><b>${esc(e.name)} ${e.soon ? chip("Planned", "plain") : ""}</b><small>${esc(e.when)} · ${e.sent.toLocaleString("en-GB")} sent</small></div><button class="btn sm" data-act="open-email" data-id="${e.id}">${icon("edit")} Edit</button><button class="toggle" role="switch" aria-checked="${e.on}" data-act="toggle" aria-label="${esc(e.name)} on"></button></div>`).join("")}</div></div></div>
    <div class="card soon" style="margin-top:16px"><b style="font:800 20px var(--disp);letter-spacing:.05em;text-transform:uppercase;color:var(--txt)">Newsletters and campaigns</b><p style="margin-top:4px">Send an update to all members or just one plan, with unsubscribe handled for you. Coming after launch.</p></div>`;

  PAGES.settings = () => {
    const t = state.setTab;
    const tabs = `<div class="tabs"><button data-act="settab" data-v="health" class="${t === "health" ? "on" : ""}">System health</button><button data-act="settab" data-v="team" class="${t === "team" ? "on" : ""}">Team</button><button data-act="settab" data-v="security" class="${t === "security" ? "on" : ""}">Security</button></div>`;
    const body = t === "health" ? `<div class="grid g2">${D.health.map((h) => `<div class="card"><div class="bd" style="display:flex;align-items:center;gap:14px"><span class="ico ${h.ok ? "ok" : ""}">${icon(h.ok ? "check" : "clock")}</span><div style="flex:1"><b>${esc(h.name)}</b><div style="color:var(--mut);font-size:12.5px">${esc(h.note)}</div></div>${chip(h.ok ? "Healthy" : "Planned", h.ok ? "ok" : "plain")}</div></div>`).join("")}</div>
      <div class="card" style="margin-top:16px"><div class="hd"><h3>Weekly report</h3></div><div class="bd"><p style="color:var(--mut)">A plain health summary is emailed to info@ every Monday at 08:00. The first one went out on 20 October.</p></div></div>`
      : t === "team" ? `<div class="card"><div class="bd"><div class="list">${[["Pedro Neves", "Owner · full access", ""], ["Coach Dan", "Staff · bookings and timetable", "g"], ["Coach Mel", "Staff · bookings and timetable", "b"]].map((p, i) => `<div class="li">${av(p[0], "", p[2])}<div class="tx"><b>${p[0]}</b><small>${p[1]}</small></div>${i ? `<button class="btn sm" data-act="toast" data-msg="Edit permissions (sample)">Permissions</button>` : chip("Owner", "acc plain")}</div>`).join("")}</div><div style="margin-top:14px"><button class="btn" data-act="toast" data-msg="Invite sent (sample)">${icon("plus")} Invite a team member</button></div></div></div>`
      : `<div class="card"><div class="bd"><div class="list">${[["Sign-in with email and password", "On", true], ["Back end only visible to admin accounts", "On", true], ["Every change is recorded in an audit log", "Planned", false], ["Extra sign-in step (2-step)", "Off, your choice", false]].map((r) => `<div class="li"><span class="ico ${r[2] ? "ok" : ""}">${icon(r[2] ? "lock" : "clock")}</span><div class="tx"><b>${r[0]}</b></div>${chip(r[1], r[2] ? "ok" : "plain")}</div>`).join("")}</div></div></div>`;
    return head("Settings & health", "Is everything running, who can sign in, and how it is protected.") + tabs + body;
  };

  /* ---------- analytics, marketing, day-to-day ---------- */
  const tabsBar = (k, list) => `<div class="tabs">${list.map(([v, l]) => `<button data-act="tab" data-k="${k}" data-v="${v}" class="${state[k] === v ? "on" : ""}">${l}</button>`).join("")}</div>`;
  const groupBars = (labels, a, b) => {
    const W = 560, H = 210, L = 30, B = 28, T = 10, mx = Math.ceil(Math.max(...a, ...b) / 5) * 5, ch = H - B - T, gw = (W - L) / labels.length;
    let g = ""; for (let i = 0; i <= 4; i++) { const y = T + ch - (ch * i) / 4; g += `<line x1="${L}" x2="${W}" y1="${y}" y2="${y}" stroke="#efedec"/><text x="${L - 8}" y="${y + 4}" text-anchor="end">${Math.round((mx * i) / 4)}</text>`; }
    labels.forEach((l, i) => { const x = L + i * gw + gw * 0.16, w = gw * 0.32, ha = (a[i] / mx) * ch, hb = (b[i] / mx) * ch;
      g += `<rect x="${x}" y="${T + ch - ha}" width="${w}" height="${ha}" rx="4" fill="#238a52" data-tip="${esc(l + ": " + a[i] + " joined")}"/><rect x="${x + w + 3}" y="${T + ch - hb}" width="${w}" height="${hb}" rx="4" fill="#e03939" data-tip="${esc(l + ": " + b[i] + " left")}"/><text x="${x + w}" y="${H - 8}" text-anchor="middle">${esc(l)}</text>`; });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Members joined and left per month">${g}</svg>`;
  };
  const hbars = (rows, fmt = (v) => v + "%") => rows.map((r) => `<div style="display:flex;align-items:center;gap:12px;margin:10px 0"><span style="width:150px;flex-shrink:0">${esc(r.l)}</span><div class="bar ${r.cls || ""}" style="flex:1;height:10px"><i style="width:${r.p}%;${r.c ? "background:" + r.c : ""}"></i></div><b class="num" style="width:64px;text-align:right">${esc(fmt(r.v))}</b></div>`).join("");
  const classStats = () => D.classes.filter((c) => c.active).map((c) => { let s = 0, n = 0; for (const k in c) if (k[0] === "f" && k.length > 3) { s += c[k]; n++; } return { c, p: Math.round((s / Math.max(1, n) / c.cap) * 100) }; }).sort((a, b) => b.p - a.p);

  PAGES.analytics = () => {
    const t = state.anTab, G = D.growth;
    const tabs = tabsBar("anTab", [["ret", "Retention"], ["cls", "Class performance"], ["rev", "Revenue & growth"], ["web", "Website traffic"]]);
    let body = "";
    if (t === "ret") {
      body = `<div class="grid g4" style="margin-bottom:16px">${kpi("Monthly churn", "refresh", G.churn, "", "members lost per month", "flat")}${kpi("Average membership", "clock", "11.4", "months", "+0.8 vs last quarter", "up")}${kpi("Left this month", "x", G.lost[5], "", "1 fewer than last month", "up")}${kpi("At risk right now", "alert", D.atRisk.length, "", "haven't visited lately", "dn", "", "alert")}</div>
      <div class="grid g-eq"><div class="card"><div class="hd"><h3>Joined vs left</h3><div class="legend" style="margin-left:auto"><span><i style="background:#238a52"></i>Joined</span><span><i style="background:#e03939"></i>Left</span></div></div><div class="bd">${groupBars(G.months, G.joined, G.lost)}</div></div>
      <div class="card"><div class="hd"><h3>How long members stay</h3></div><div class="bd">${hbars(D.cohorts.map((x) => ({ l: x.l, p: x.v, v: x.v, cls: x.v < 60 ? "warn" : "ok" })))}<p style="color:var(--mut);font-size:12.5px;margin-top:10px">Share of new members still paying after this long.</p></div></div></div>
      <div class="card" style="margin-top:16px"><div class="hd"><h3>Members to look after</h3><span class="sub">catch them before they cancel</span></div><div class="bd"><div class="list">${D.atRisk.map((r) => { const m = mById(r.id); return `<div class="li" data-act="open-member" data-id="${m.id}" style="cursor:pointer">${av(m.name, "s", m.av)}<div class="tx"><b>${esc(m.name)}</b><small>${esc(r.why)} · last visit ${r.days} days ago</small></div><button class="btn sm" data-act="stop" data-msg="Friendly check-in email sent to ${esc(m.name.split(" ")[0])} (sample)">Send a check-in</button></div>`; }).join("")}</div></div></div>`;
    } else if (t === "cls") {
      const st = classStats(), best = st[0], low = st[st.length - 1], unused = Math.round(D.classes.filter((c) => c.active).reduce((a, c) => a + c.cap * (1 - (st.find((x) => x.c === c).p / 100)), 0));
      body = `<div class="grid g4" style="margin-bottom:16px">${kpi("Average class fill", "pulse", Math.round(st.reduce((a, x) => a + x.p, 0) / st.length), "%", "last 14 days", "up")}${kpi("Fullest class", "zap", best.p, "%", esc(best.c.name) + " · " + D.DAY[best.c.day] + " " + best.c.time, "flat")}${kpi("Quietest class", "dumb", low.p, "%", esc(low.c.name) + " · " + D.DAY[low.c.day] + " " + low.c.time, "dn")}${kpi("Empty spaces per week", "users", unused, "", "room to grow", "flat")}</div>
      <div class="grid g-eq"><div class="card"><div class="hd"><h3>Every class, fullest first</h3></div><div class="bd">${hbars(st.map((x) => ({ l: x.c.name + " · " + D.DAY[x.c.day] + " " + x.c.time, p: x.p, v: x.p, cls: x.p >= 85 ? "ok" : x.p < 50 ? "warn" : "" })))}</div></div>
      <div><div class="card"><div class="hd"><h3>What to do about it</h3></div><div class="bd"><div class="list"><div class="li"><span class="ico ok">${icon("zap")}</span><div class="tx"><b>${esc(best.c.name)} is nearly always full</b><small>Add a second session or switch on a waitlist</small></div></div><div class="li"><span class="ico warn">${icon("alert")}</span><div class="tx"><b>${esc(low.c.name)} on ${D.DAY[low.c.day]} is the quietest</b><small>Try a promotion, or move it to a busier time</small></div></div><div class="li"><span class="ico info">${icon("clock")}</span><div class="tx"><b>Mornings fill faster than evenings</b><small>7:00 classes average 82% vs 61% after 18:00</small></div></div></div></div></div>
      <div class="card" style="margin-top:16px"><div class="hd"><h3>When people train</h3></div><div class="bd">${heat()}</div></div></div></div>`;
    } else if (t === "rev") {
      const mix = D.plans.map((p) => ({ n: p.name, v: p.subs, c: p.color }));
      body = `<div class="banner">${icon("alert")}<div>Sample numbers. Once payments run through the back end, these come from real transactions.</div></div><div class="grid g4" style="margin-bottom:16px">${kpi("Monthly recurring", "pound", gbp(mrr()), "", "+4.1% vs last month", "up", spark(D.revenue, "#e03939"))}${kpi("New this month", "plus", "+£412", "", "16 new members", "up")}${kpi("Lost this month", "x", "-£96", "", "3 members", "up")}${kpi("Average per member", "card", G.arpm, "", "lifetime value about " + G.ltv, "flat")}</div>
      <div class="grid g-eq"><div class="card"><div class="hd"><h3>Revenue, last 6 months</h3></div><div class="bd">${areaChart(D.revenue, D.months)}</div></div><div class="card"><div class="hd"><h3>Where the money comes from</h3></div><div class="bd"><div class="donut-wrap">${donut(mix)}<div class="donut-leg">${D.plans.map((p) => `<div><i style="background:${p.color}"></i>${esc(p.name)}<span class="num">${gbp((p.per === "year" ? p.price / 12 : p.price) * p.subs)}</span></div>`).join("")}</div></div></div></div></div>`;
    } else {
      const vis = D.visits.reduce((a, v) => a + v.n, 0);
      body = `<div class="banner">${icon("alert")}<div>Website traffic needs one small privacy-friendly script on the new website (no cookies, so no banner is needed). Sample numbers shown.</div></div><div class="grid g4" style="margin-bottom:16px">${kpi("Visitors, 14 days", "users", vis.toLocaleString("en-GB"), "", "+12% vs previous 14 days", "up", spark(D.visits.map((v) => v.n), "#e03939"))}${kpi("Enquiry rate", "inbox", "7.7", "%", "of visitors send an enquiry", "up")}${kpi("Top source", "link", "Instagram", "", "38% of visitors", "flat")}${kpi("Joined from the site", "check", 28, "", "this fortnight", "up")}</div>
      <div class="grid g-eq"><div class="card"><div class="hd"><h3>Visitors per day</h3></div><div class="bd">${areaChart(D.visits.map((v) => v.n), D.visits.map((v, i) => (i % 3 === 0 ? v.d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "")))}</div></div>
      <div class="card"><div class="hd"><h3>Where visitors come from</h3></div><div class="bd"><div class="donut-wrap">${donut(D.sources.map((s) => ({ n: s.n, v: s.v, c: s.c })))}<div class="donut-leg">${D.sources.map((s) => `<div><i style="background:${s.c}"></i>${esc(s.n)}<span>${s.v}%</span></div>`).join("")}</div></div></div></div></div>
      <div class="grid g-eq" style="margin-top:16px"><div class="card"><div class="hd"><h3>From visitor to member</h3></div><div class="bd">${hbars(D.funnel.map((f, i) => ({ l: f.l, p: Math.round((f.v / D.funnel[0].v) * 100), v: f.v, c: i === D.funnel.length - 1 ? "#238a52" : "" })), (v) => v.toLocaleString("en-GB"))}</div></div>
      <div class="card"><div class="hd"><h3>Most visited pages</h3></div><div class="tbl-wrap"><table class="t" style="min-width:380px"><thead><tr><th>Page</th><th class="r">Visits</th><th>Mostly from</th></tr></thead><tbody>${D.topPages.map((p) => `<tr><td><b>${esc(p[0])}</b></td><td class="r num">${p[1]}</td><td style="color:var(--mut)">${esc(p[2])}</td></tr>`).join("")}</tbody></table></div></div></div>`;
    }
    return head("Analytics", "What is working, who might leave, and where to focus.", `<button class="btn" data-act="toast" data-msg="Analytics report exported (sample)">${icon("dl")} Export</button>`) + tabs + body;
  };

  PAGES.marketing = () => {
    const t = state.mkTab;
    const tabs = tabsBar("mkTab", [["camp", "Email campaigns"], ["pipe", "Enquiry pipeline"], ["offers", "Offers & referrals"], ["rev", "Reviews & social"]]);
    let body = "", acts = `<button class="btn pri" data-act="new-campaign">${icon("plus")} New campaign</button>`;
    if (t === "camp") {
      body = `<div class="grid g4" style="margin-bottom:16px">${kpi("Can be emailed", "mail", 812, "", "have said yes to marketing", "flat")}${kpi("Average open rate", "inbox", "52", "%", "industry average is about 38%", "up")}${kpi("Average click rate", "link", "11", "%", "+2 vs last quarter", "up")}${kpi("Unsubscribes", "x", "0.4", "%", "per campaign", "up")}</div>
      <div class="card"><div class="tbl-wrap"><table class="t"><thead><tr><th>Campaign</th><th>Sent to</th><th>Status</th><th class="r">Emails</th><th class="r">Opened</th><th class="r">Clicked</th><th>When</th></tr></thead><tbody>${D.campaigns.map((c) => `<tr data-act="open-campaign" data-id="${c.id}"><td><b>${esc(c.name)}</b></td><td style="color:var(--mut)">${esc(c.to)}</td><td>${chip(c.st, { Sent: "ok", Scheduled: "info", Draft: "warn" }[c.st])}</td><td class="r num">${c.sent || "—"}</td><td class="r num">${c.open}</td><td class="r num">${c.click}</td><td style="color:var(--mut)">${esc(c.when)}</td></tr>`).join("")}</tbody></table></div></div>
      <div class="banner" style="margin-top:16px">${icon("lock")}<div>Only members who agreed to marketing are emailed. Every email has a one-click unsubscribe, and the consent is stored with the date, as the law requires.</div></div>`;
    } else if (t === "pipe") {
      acts = `<button class="btn pri" data-act="toast" data-msg="Add enquiry form (next step)">${icon("plus")} Add enquiry</button>`;
      body = `<div class="grid g4" style="margin-bottom:16px">${kpi("Open enquiries", "inbox", D.leads.filter((l) => ["new", "contacted", "trial"].includes(l.st)).length, "", "being followed up", "flat")}${kpi("Trials booked", "cal", D.leads.filter((l) => l.st === "trial").length, "", "coming in", "up")}${kpi("Enquiry to member", "check", "17", "%", "last 30 days", "up")}${kpi("Average time to reply", "clock", "3.2", "h", "aim for under 4", "up")}</div>
      <div style="display:grid;grid-template-columns:repeat(5,minmax(210px,1fr));gap:12px;overflow:auto;padding-bottom:6px">${D.leadCols.map(([k, l]) => `<div class="card" style="background:var(--panel2)"><div class="hd"><h3 style="font-size:15px">${l}</h3><span class="pill soft" style="margin-left:auto">${D.leads.filter((x) => x.st === k).length}</span></div><div class="bd" style="display:flex;flex-direction:column;gap:10px">${D.leads.filter((x) => x.st === k).map((x) => `<div class="card" style="padding:12px 14px"><b>${esc(x.n)}</b><div style="color:var(--mut);font-size:12.5px;margin:2px 0 8px">${esc(x.note)}</div><div style="display:flex;gap:6px;align-items:center">${chip(x.src, "plain")}<small style="color:var(--faint);margin-left:auto">${x.age}</small></div>${k !== "joined" && k !== "lost" ? `<button class="btn sm" style="margin-top:10px;width:100%;justify-content:center" data-act="move-lead" data-id="${x.id}">Move to next step ${icon("chev")}</button>` : ""}</div>`).join("") || `<small style="color:var(--faint)">Nobody here.</small>`}</div></div>`).join("")}</div>`;
    } else if (t === "offers") {
      acts = `<button class="btn pri" data-act="toast" data-msg="New offer form (next step)">${icon("plus")} New offer</button>`;
      body = `<div class="cards-m">${D.offers.map((o) => `<div class="card plan"><div style="display:flex;align-items:center;gap:10px"><b style="font-size:15px">${esc(o.name)}</b><span style="margin-left:auto">${chip(o.st, o.st === "Live" ? "ok" : "warn")}</span></div><div style="color:var(--mut)">${esc(o.what)}</div><div><span class="chip acc plain" style="font-family:ui-monospace,monospace;letter-spacing:.06em">${esc(o.code)}</span></div><div class="sep"></div><div style="display:flex;justify-content:space-between"><span style="color:var(--mut)">Used</span><b class="num">${o.uses} times</b></div><div style="display:flex;justify-content:space-between"><span style="color:var(--mut)">Brought in</span><b class="num">${o.rev}</b></div><div style="display:flex;justify-content:space-between"><span style="color:var(--mut)">Ends</span><b>${o.ends}</b></div></div>`).join("")}</div>
      <div class="card" style="margin-top:16px"><div class="hd"><h3>Bring-a-friend referrals</h3></div><div class="bd stat-row"><div><b class="num">${D.referral.invites}</b><small>invites sent</small></div><div><b class="num">${D.referral.joined}</b><small>friends joined</small></div><div><b class="num">${D.referral.conv}</b><small>of invites turn into members</small></div><div><b>${D.referral.reward}</b><small>reward for both</small></div></div></div>`;
    } else {
      acts = `<button class="btn pri" data-act="toast" data-msg="Review requests sent to 24 recent members (sample)">${icon("send")} Ask recent members for a review</button>`;
      const R = D.reviews;
      body = `<div class="grid g4" style="margin-bottom:16px">${kpi("Google rating", "zap", R.rating, "/ 5", R.count + " reviews", "up")}${kpi("Review requests", "send", R.asked, "", "sent this month", "flat")}${kpi("Reviews left", "check", R.left, "", Math.round((R.left / R.asked) * 100) + "% of requests", "up")}${kpi("Link clicks", "link", D.links.reduce((a, l) => a + l.c, 0), "", "from Instagram, Facebook, Google", "up")}</div>
      <div class="grid g-eq"><div class="card"><div class="hd"><h3>Latest reviews</h3></div><div class="bd"><div class="list">${R.list.map((r) => `<div class="li" style="align-items:flex-start">${av(r.n, "s", "")}<div class="tx"><b>${esc(r.n)} <span style="color:#d8962b">${"★".repeat(r.s)}${"☆".repeat(5 - r.s)}</span></b><small style="color:var(--txt)">${esc(r.t)}</small><small>${esc(r.d)}</small></div><button class="btn sm" data-act="toast" data-msg="Reply drafted (sample)">Reply</button></div>`).join("")}</div></div></div>
      <div class="card"><div class="hd"><h3>Which links bring members</h3></div><div class="tbl-wrap"><table class="t" style="min-width:380px"><thead><tr><th>Link</th><th class="r">Clicks</th><th class="r">Joined</th><th class="r">Rate</th></tr></thead><tbody>${D.links.map((l) => `<tr><td><b>${esc(l.n)}</b></td><td class="r num">${l.c}</td><td class="r num">${l.j}</td><td class="r num">${((l.j / l.c) * 100).toFixed(1)}%</td></tr>`).join("")}</tbody></table></div></div></div>`;
    }
    return head("Marketing", "Fill your classes and win new members, with every step tracked.", acts) + tabs + body;
  };

  const dtDay = () => { let off = 0; while (!clsFor(D.addD(D.today, off)).length && off < 7) off++; return D.addD(D.today, off); };
  const qr = () => { let s = "", seed = 7; const f = (x, y) => (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13); for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; let on = seed % 100 < 46; if (f(x, y)) { const lx = x % 14 % 7, ly = y % 14 % 7; on = lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx > 1 && lx < 5 && ly > 1 && ly < 5); } if (on) s += `<rect x="${x}" y="${y}" width="1" height="1" fill="#1b1b1f"/>`; } return s; };
  PAGES.daytoday = () => {
    const t = state.dtTab;
    const tabs = tabsBar("dtTab", [["in", "Check-in"], ["wait", "Waitlist"], ["rota", "Staff rota"], ["tasks", "Tasks"]]);
    let body = "";
    if (t === "in") {
      const day = dtDay(), cs = clsFor(day), c = cs[Math.min(state.ciClass, cs.length - 1)], dayISO = D.iso(day), n = Math.min(fillOn(c, dayISO) || 8, 14), who = D.members.slice(3, 3 + n);
      const done = who.filter((m) => state.checked[c.id + m.id]).length;
      body = `<div class="grid g4" style="margin-bottom:16px">${kpi("Attendance rate", "check", D.attend.rate, "", "of bookings turn up", "up")}${kpi("No-shows", "x", D.attend.noShow, "", "down from 11%", "up")}${kpi("Walk-ins this week", "plus", D.attend.walkins, "", "without a booking", "flat")}${kpi("Checked in now", "users", done, "/ " + who.length, c.name + " · " + c.time, "flat")}</div>
      <div class="grid g-main"><div class="card"><div class="toolbar"><select class="sel" data-f="ciClass" aria-label="Class">${cs.map((x, i) => `<option value="${i}" ${i === state.ciClass ? "selected" : ""}>${fmtD(dayISO)} · ${x.time} ${esc(x.name)}</option>`).join("")}</select><span class="grow"></span><button class="btn sm" data-act="toast" data-msg="Everyone marked as attended (sample)">Mark all present</button></div><div class="bd"><div class="list">${who.map((m) => `<div class="li">${av(m.name, "s", m.av)}<div class="tx"><b>${esc(m.name)}</b><small>${esc(pById(m.plan).name)}</small></div><button class="btn sm ${state.checked[c.id + m.id] ? "pri" : ""}" data-act="checkin" data-id="${c.id + m.id}">${state.checked[c.id + m.id] ? icon("check") + " Here" : "Check in"}</button></div>`).join("")}</div></div></div>
      <div class="card"><div class="hd"><h3>Self check-in</h3></div><div class="bd" style="text-align:center"><svg width="170" height="170" viewBox="0 0 21 21" shape-rendering="crispEdges" style="margin:6px auto;display:block" role="img" aria-label="Sample QR code">${qr()}</svg><p style="color:var(--mut);margin-top:8px">Put this code at the front desk. Members scan it with their phone to check in, and only people booked for the class can.</p><button class="btn" style="margin-top:12px" data-act="toast" data-msg="QR poster downloaded (sample)">${icon("dl")} Download poster</button></div></div></div>`;
    } else if (t === "wait") {
      body = `<div class="grid g4" style="margin-bottom:16px">${kpi("On waitlists", "users", D.waitlist.reduce((a, w) => a + w.people.length, 0), "", "people waiting", "flat")}${kpi("Booked in automatically", "zap", 17, "", "this month from waitlists", "up")}${kpi("Classes with a waitlist", "cal", D.waitlist.length, "", "consider adding sessions", "flat")}${kpi("Average wait", "clock", "1.4", "days", "before a space opens", "flat")}</div>
      <div class="li card" style="padding:14px 18px;margin-bottom:16px"><div class="tx"><b>Automatically book the next person when someone cancels</b><small>They get an email straight away and can cancel up to 10 minutes before, like any booking.</small></div><button class="toggle" role="switch" aria-checked="true" data-act="toggle" aria-label="Auto-book from waitlist"></button></div>
      <div class="grid g3">${D.waitlist.map((w) => `<div class="card"><div class="hd"><h3>${esc(w.name)}</h3><span class="sub">${w.when}</span></div><div class="bd"><div style="display:flex;gap:8px;margin-bottom:6px">${chip("Full " + w.cap + "/" + w.cap, "warn")}${chip(w.people.length + " waiting", "plain")}</div><div class="list">${w.people.map((p, i) => `<div class="li">${av(p, "s", "")}<div class="tx"><b>${esc(p)}</b><small>#${i + 1} in line</small></div>${i === 0 ? `<button class="btn sm" data-act="toast" data-msg="${esc(p)} booked in (sample)">Book in now</button>` : ""}</div>`).join("")}</div></div></div>`).join("")}</div>`;
    } else if (t === "rota") {
      body = `<div class="grid g4" style="margin-bottom:16px">${D.coaches.map((c) => kpi(esc(c.n), "users", c.mon, "h", "hours this month", "flat")).join("")}${kpi("All coaches", "clock", D.coaches.reduce((a, c) => a + c.mon, 0), "h", "ready for payroll", "flat")}</div>
      <div class="card"><div class="hd"><h3>This week</h3><span class="sub"><button class="btn sm" data-act="toast" data-msg="Hours exported for payroll (sample)">${icon("dl")} Export hours</button></span></div><div class="tbl-wrap"><table class="t"><thead><tr><th>Coach</th>${D.DAY.map((d) => `<th class="r">${d}</th>`).join("")}<th>Leads</th></tr></thead><tbody>${D.coaches.map((c) => `<tr><td><div class="who">${av(c.n.replace("Coach ", ""), "s", c.c)}<b>${esc(c.n)}</b></div></td>${c.hrs.map((h) => `<td class="r num" style="${h ? "font-weight:700" : "color:var(--faint)"}">${h ? h + "h" : "—"}</td>`).join("")}<td style="color:var(--mut)">${esc(c.cls)}</td></tr>`).join("")}</tbody></table></div></div>`;
    } else {
      body = `<div class="card"><div class="toolbar"><input class="in" id="newtask" placeholder="Add a task, e.g. Order new mats" style="flex:1;min-width:200px"><select class="sel" id="taskwho"><option>Pedro</option><option>Coach Dan</option><option>Coach Mel</option><option>Coach Ali</option></select><button class="btn pri" data-act="task-add">${icon("plus")} Add</button></div><div class="bd"><div class="list">${D.tasks.map((x) => `<div class="li"><button class="toggle" role="switch" aria-checked="${x.done}" data-act="task-toggle" data-id="${x.id}" aria-label="Done"></button><div class="tx"><b style="${x.done ? "text-decoration:line-through;color:var(--faint)" : ""}">${esc(x.t)}</b><small>${esc(x.who)} · due ${esc(x.due)}</small></div>${chip(x.tag, "plain")}</div>`).join("")}</div></div></div>`;
    }
    return head("Day to day", "Check people in, run waitlists, plan the coaches, and keep on top of the to-do list.") + tabs + body;
  };

  /* ---------- drawer, modal, toast ---------- */
  const drawer = $("#drawer"), scrim = $("#scrim"), modal = $("#modal"), toastEl = $("#toast"), tipEl = $("#tip");
  let toastT;
  const toast = (m) => { toastEl.innerHTML = `${icon("check")}<span>${esc(m)}</span>`; toastEl.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("on"), 2600); };
  const openDrawer = (title, body, foot = "") => { drawer.innerHTML = `<div class="dh2"><h2>${title}</h2><button class="ibtn" data-act="close" aria-label="Close">${icon("x")}</button></div><div class="db">${body}</div>${foot ? `<div class="df">${foot}</div>` : ""}`; drawer.classList.add("on"); drawer.setAttribute("aria-hidden", "false"); scrim.classList.add("on"); drawer.querySelector(".ibtn")?.focus(); };
  const closeAll = () => { drawer.classList.remove("on"); drawer.setAttribute("aria-hidden", "true"); modal.classList.remove("on"); scrim.classList.remove("on"); };
  const openModal = (title, text, yes, onYes, danger = true) => { modal.innerHTML = `<h3>${title}</h3><p>${text}</p><div class="row"><button class="btn" data-act="close">Keep it</button><button class="btn ${danger ? "dng" : "pri"}" id="modalYes">${yes}</button></div>`; modal.classList.add("on"); scrim.classList.add("on"); $("#modalYes").onclick = () => { onYes(); closeAll(); }; $("#modalYes").focus(); };

  const bookingDrawer = (id) => {
    const b = D.bookings.find((x) => x.id === id), m = mById(b.member), c = cById(b.cls);
    openDrawer("Booking " + b.id, `<div class="who">${av(m.name, "", m.av)}<div><b style="font-size:16px">${esc(m.name)}</b><small>${esc(m.email)}</small></div></div>
      <dl class="kv"><dt>Class</dt><dd>${esc(c.name)} with ${esc(c.coach)}</dd><dt>When</dt><dd>${fmtD(b.date)} at ${b.time}</dd><dt>Status</dt><dd>${bStat(b.status)}</dd><dt>Source</dt><dd>${esc(b.src)}</dd><dt>Booked on</dt><dd>${fmtL(b.at)}</dd><dt>Plan</dt><dd>${esc(pById(m.plan).name)}</dd></dl>
      <div class="sect"><h4>Timeline</h4><div class="tl"><div class="ev"><b>Booked</b><br><small>${fmtL(b.at)} via ${esc(b.src)}</small></div><div class="ev"><b>Confirmation email sent</b><br><small>Within a minute</small></div>${b.status === "Cancelled" ? `<div class="ev"><b>Cancelled</b><br><small>Also cancelled in Wix</small></div>` : ""}</div></div>`,
      `${b.status === "Confirmed" ? `<button class="btn dng" data-act="cancel-booking" data-id="${b.id}">Cancel booking</button><button class="btn" data-act="toast" data-msg="Move booking (next step)">Move</button>` : ""}<button class="btn pri" data-act="open-member" data-id="${m.id}">Open member</button>`);
  };
  const memberDrawer = (id) => {
    const m = mById(id), p = pById(m.plan), bs = D.bookings.filter((b) => b.member === id).slice(0, 5);
    openDrawer(esc(m.name), `<div style="display:flex;gap:8px;flex-wrap:wrap">${mStat(m.status)}${chip(p.name, "plain")}${hStat(m.health)}</div>
      <dl class="kv"><dt>Email</dt><dd>${esc(m.email)}</dd><dt>Phone</dt><dd>${esc(m.phone)}</dd><dt>Member since</dt><dd>${fmtL(m.joined)}</dd><dt>Last visit</dt><dd>${fmtD(m.last)}</dd><dt>Bookings</dt><dd class="num">${m.bookings} in total</dd><dt>Plan price</dt><dd>${gbp(p.price)} / ${p.per}</dd></dl>
      <div class="sect"><h4>Recent bookings</h4><div class="list">${bs.length ? bs.map((b) => `<div class="li"><div class="tx"><b>${esc(cById(b.cls).name)}</b><small>${fmtD(b.date)} · ${b.time}</small></div>${bStat(b.status)}</div>`).join("") : `<div class="empty" style="padding:14px">No bookings yet.</div>`}</div></div>
      <div class="sect"><h4>Notes (only staff see these)</h4><div id="notes">${m.notes.map((n) => `<div class="bubble" style="margin-bottom:8px"><small>You · just now</small>${esc(n)}</div>`).join("")}</div><textarea class="in" id="notetxt" placeholder="Add a note, e.g. knee injury, prefers mornings…" style="width:100%"></textarea><button class="btn sm" style="margin-top:8px" data-act="add-note" data-id="${m.id}">Save note</button></div>`,
      `<button class="btn dng" data-act="toast" data-msg="Membership cancel (sample)">Cancel membership</button><button class="btn" data-act="toast" data-msg="${m.status === "Paused" ? "Membership resumed" : "Membership paused"} (sample)">${m.status === "Paused" ? "Resume" : "Pause"}</button><button class="btn pri" data-act="toast" data-msg="Email composer (next step)">${icon("mail")} Email</button>`);
  };
  const classDrawer = (id) => {
    const c = cById(id), lock = c.source === "wix", dis = lock ? "disabled" : "";
    openDrawer(esc(c.name), `<div style="display:flex;gap:8px;flex-wrap:wrap">${chip(D.DAY[c.day] + " " + c.time, "plain")}${chip(c.active ? "On sale" : "Switched off", c.active ? "ok" : "warn")}${lock ? chip("Synced from Wix", "info plain") : chip("Manual", "plain")}</div>
      ${lock ? `<div class="banner" style="margin:0">${icon("lock")}<div>Name, time and capacity come from the website and update every hour. To change them, edit the class in Wix, or <a href="#" data-act="detach" data-id="${c.id}" style="font-weight:700;text-decoration:underline">detach it from Wix</a> and manage it here.</div></div>` : ""}
      <div class="grid g2"><div class="field"><label>Class name</label><input class="in" value="${esc(c.name)}" ${dis}></div><div class="field"><label>Coach</label><input class="in" value="${esc(c.coach)}"></div><div class="field"><label>Day</label><select class="sel" ${dis}>${D.DAY.map((d, i) => `<option ${i === c.day ? "selected" : ""}>${d}</option>`).join("")}</select></div><div class="field"><label>Start time</label><input class="in" value="${c.time}" ${dis}></div><div class="field"><label>Spaces</label><input class="in" type="number" value="${c.cap}" ${dis}></div><div class="field"><label>Length (min)</label><input class="in" type="number" value="${c.dur}" ${dis}></div></div>
      <div class="li" style="border:1px solid var(--line);border-radius:12px;padding:12px 14px"><div class="tx"><b>On sale in the app</b><small>Switch off to hide it from members without deleting it</small></div><button class="toggle" role="switch" aria-checked="${c.active}" data-act="toggle-class" data-id="${c.id}" aria-label="On sale"></button></div>
      <div class="sect"><h4>This week</h4><div class="stat-row"><div><b class="num">${fillOn(c, D.iso(D.addD(D.today, (c.day - D.dow(D.today) + 7) % 7)))}/${c.cap}</b><small>booked</small></div><div><b class="num">${Math.max(0, c.cap - fillOn(c, D.iso(D.addD(D.today, (c.day - D.dow(D.today) + 7) % 7))))}</b><small>spaces left</small></div></div></div>`,
      `<button class="btn" data-act="close">Close</button><button class="btn pri" data-act="save-class">Save changes</button>`);
  };
  const newClassDrawer = () => openDrawer("Add a class", `<p style="color:var(--mut)">Classes you add here are managed in the back end. The hourly website sync never changes them.</p><div class="grid g2"><div class="field"><label>Class name</label><input class="in" placeholder="e.g. Yoga Flow"></div><div class="field"><label>Coach</label><input class="in" placeholder="Coach name"></div><div class="field"><label>Day</label><select class="sel">${D.DAY.map((d) => `<option>${d}</option>`).join("")}</select></div><div class="field"><label>Start time</label><input class="in" placeholder="18:00"></div><div class="field"><label>Spaces</label><input class="in" type="number" value="12"></div><div class="field"><label>Length (min)</label><input class="in" type="number" value="45"></div></div>`, `<button class="btn" data-act="close">Cancel</button><button class="btn pri" data-act="toast" data-msg="Class added (sample)">Add class</button>`);
  const newBookingDrawer = () => openDrawer("New booking", `<p style="color:var(--mut)">Book a member into a class from the front desk. It is also created in Wix so spaces stay correct.</p><div class="field"><label>Member</label><select class="sel">${D.members.slice(0, 12).map((m) => `<option>${esc(m.name)}</option>`).join("")}</select></div><div class="field"><label>Class</label><select class="sel">${D.classes.filter((c) => c.active).slice(0, 10).map((c) => `<option>${D.DAY[c.day]} ${c.time} · ${esc(c.name)}</option>`).join("")}</select></div><div class="field"><label>Date</label><input class="in" type="date" value="${todayISO}"></div>`, `<button class="btn" data-act="close">Cancel</button><button class="btn pri" data-act="toast" data-msg="Booking created (sample)">Create booking</button>`);
  const planDrawer = (id) => { const p = pById(id); openDrawer(esc(p.name), `<div class="grid g2"><div class="field"><label>Price (£)</label><input class="in" type="number" value="${p.price}"></div><div class="field"><label>Billed</label><select class="sel"><option ${p.per === "month" ? "selected" : ""}>month</option><option ${p.per === "year" ? "selected" : ""}>year</option></select></div></div><div class="field"><label>Description</label><input class="in" value="${esc(p.note)}"></div><div class="banner" style="margin:0">${icon("alert")}<div>Changing a price here will only affect new sign-ups. Existing members keep their price until you move them.</div></div>`, `<button class="btn" data-act="close">Cancel</button><button class="btn pri" data-act="toast" data-msg="Plan saved (sample)">Save plan</button>`); };
  const emailDrawer = (id) => { const e = D.emailTemplates.find((x) => x.id === id); openDrawer(esc(e.name), `<div class="field"><label>Subject</label><input class="in" value="${esc(e.name === "Booking confirmation" ? "You're booked in, {{first_name}}!" : e.name + " from MY GYM London")}"></div><div class="sect"><h4>Preview</h4><div class="card" style="overflow:hidden"><div style="background:#e03939;color:#fff;padding:16px 20px;font:800 22px var(--disp);letter-spacing:.08em;text-transform:uppercase">My Gym London</div><div style="padding:20px"><p><b>Hi Hannah,</b></p><p style="margin-top:8px;color:var(--mut)">You're booked in for <b style="color:var(--txt)">Boxing Fit</b> on Wednesday at 18:30. Cancel any time up to 10 minutes before.</p><p style="margin-top:14px"><span class="btn pri sm">Manage my booking</span></p></div></div></div>`, `<button class="btn" data-act="close">Close</button><button class="btn pri" data-act="toast" data-msg="Template saved (sample)">Save</button>`); };

  /* ---------- router & render ---------- */
  const NAV = [["Overview", [["dashboard", "Dashboard", "home"]]], ["Operations", [["bookings", "Bookings", "clip"], ["timetable", "Timetable", "cal"], ["members", "Members", "users"], ["daytoday", "Day to day", "check"]]], ["Growth", [["analytics", "Analytics", "pulse"], ["marketing", "Marketing", "zap"]]], ["Business", [["plans", "Plans & payments", "card"], ["messages", "Messages", "inbox"], ["forms", "Forms & pages", "file"], ["emails", "Emails", "send"]]], ["System", [["settings", "Settings & health", "cog"]]]];
  const renderNav = () => {
    const unread = D.messages.filter((m) => m.unread).length;
    $("#nav").innerHTML = NAV.map(([h, items]) => `<h6>${h}</h6>` + items.map(([id, l, ic]) => `<a href="#/${id}" class="${state.route === id ? "on" : ""}" ${state.route === id ? 'aria-current="page"' : ""}>${icon(ic)}<span>${l}</span>${id === "messages" && unread ? `<span class="pill">${unread}</span>` : ""}</a>`).join("")).join("");
  };
  const render = () => { renderNav(); $("#page").innerHTML = (PAGES[state.route] || PAGES.dashboard)(); };
  const route = () => { const r = (location.hash.replace(/^#\//, "") || "dashboard").split("?")[0]; state.route = PAGES[r] ? r : "dashboard"; render(); window.scrollTo(0, 0); $("#side").classList.remove("on"); closeAll(); document.title = "MY GYM · " + ({ daytoday: "Day to day", plans: "Plans & payments", forms: "Forms & pages", settings: "Settings & health" }[state.route] || state.route[0].toUpperCase() + state.route.slice(1)) + " (mock-up)"; };

  /* ---------- events ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-act]"); if (!t) { if (e.target === scrim) closeAll(); return; }
    const a = t.dataset.act, id = t.dataset.id;
    if (a === "close") return closeAll();
    if (a === "tab") { state[t.dataset.k] = t.dataset.v; return render(); }
    if (a === "stop") { e.stopPropagation(); return toast(t.dataset.msg); }
    if (a === "checkin") { state.checked[id] = !state.checked[id]; return render(); }
    if (a === "task-toggle") { const x = D.tasks.find((k) => k.id === id); x.done = !x.done; return render(); }
    if (a === "task-add") { const v = $("#newtask").value.trim(); if (!v) return toast("Type a task first"); D.tasks.unshift({ id: "t" + Date.now(), t: v, due: "This week", who: $("#taskwho").value, done: false, tag: "New" }); toast("Task added"); return render(); }
    if (a === "move-lead") { const order = D.leadCols.map((c) => c[0]), l = D.leads.find((k) => k.id === id), i = order.indexOf(l.st); l.st = order[Math.min(i + 1, 3)]; l.age = "now"; toast(l.n + " moved to " + D.leadCols.find((c) => c[0] === l.st)[1]); return render(); }
    if (a === "new-campaign") return openDrawer("New campaign", `<div class="field"><label>Name (only you see this)</label><input class="in" placeholder="e.g. Spring bootcamp"></div><div class="field"><label>Send to</label><select class="sel"><option>Everyone who agreed to marketing (812)</option><option>Gym + Classes members (34)</option><option>Kids Gym members (4)</option><option>Lapsed members, 30 days (62)</option></select></div><div class="field"><label>Subject</label><input class="in" placeholder="Your subject line"></div><div class="field"><label>Message</label><textarea class="in" rows="6" placeholder="Hi {{first_name}}, ..."></textarea></div><div class="field"><label>When</label><select class="sel"><option>Send now</option><option>Schedule for Monday 08:00</option></select></div>`, `<button class="btn" data-act="close">Cancel</button><button class="btn" data-act="toast" data-msg="Test email sent to info@ (sample)">Send a test</button><button class="btn pri" data-act="toast" data-msg="Campaign scheduled (sample)">Schedule</button>`);
    if (a === "open-campaign") { const c = D.campaigns.find((k) => k.id === id); return openDrawer(esc(c.name), `<div style="display:flex;gap:8px;flex-wrap:wrap">${chip(c.st, { Sent: "ok", Scheduled: "info", Draft: "warn" }[c.st])}${chip(c.to, "plain")}</div><div class="stat-row"><div><b class="num">${c.sent || "—"}</b><small>emails</small></div><div><b class="num">${c.open}</b><small>opened</small></div><div><b class="num">${c.click}</b><small>clicked</small></div></div><div class="sect"><h4>Preview</h4><div class="card" style="overflow:hidden"><div style="background:#e03939;color:#fff;padding:14px 18px;font:800 20px var(--disp);letter-spacing:.08em;text-transform:uppercase">My Gym London</div><div style="padding:18px"><p><b>Hi Hannah,</b></p><p style="margin-top:8px;color:var(--mut)">${esc(c.name)}. Book your place in the app in two taps.</p><p style="margin-top:12px"><span class="btn pri sm">Book now</span></p></div></div></div>`, `<button class="btn" data-act="close">Close</button><button class="btn pri" data-act="toast" data-msg="Campaign duplicated (sample)">Duplicate</button>`); }
    if (a === "toast") return toast(t.dataset.msg);
    if (a === "go") { location.hash = "#/" + t.dataset.to; return; }
    if (a === "open-booking") return bookingDrawer(id);
    if (a === "open-member") return memberDrawer(id);
    if (a === "open-class") return classDrawer(+id);
    if (a === "open-plan") return planDrawer(id);
    if (a === "open-email") return emailDrawer(id);
    if (a === "open-payment") { const p = D.payments.find((x) => x.id === id), m = mById(p.member); return openDrawer("Payment " + p.id, `<div class="who">${av(m.name, "", m.av)}<div><b style="font-size:16px">${esc(m.name)}</b><small>${esc(m.email)}</small></div></div><dl class="kv"><dt>Amount</dt><dd>${gbp(p.amount)}</dd><dt>Plan</dt><dd>${esc(pById(p.plan).name)}</dd><dt>Status</dt><dd>${chip(p.status, { Paid: "ok", Failed: "bad", Refunded: "warn" }[p.status])}</dd><dt>Date</dt><dd>${fmtL(p.date)}</dd><dt>Method</dt><dd>${esc(p.method)}</dd></dl>`, p.status === "Paid" ? `<button class="btn dng" data-act="toast" data-msg="Refund started (sample)">Refund</button>` : p.status === "Failed" ? `<button class="btn pri" data-act="retry" data-id="${p.id}">Retry payment</button>` : ""); }
    if (a === "retry") { toast("Retry requested (sample)"); return closeAll(); }
    if (a === "new-booking") return newBookingDrawer();
    if (a === "new-class") return newClassDrawer();
    if (a === "cancel-booking") return openModal("Cancel this booking?", "The member's space is freed and the booking is also cancelled in Wix. They get a cancellation email.", "Cancel booking", () => { const b = D.bookings.find((x) => x.id === id); b.status = "Cancelled"; toast("Booking cancelled and removed from Wix (sample)"); render(); });
    if (a === "bwhen") { state.bWhen = t.dataset.v; state.bPage = 1; return render(); }
    if (a === "bpage") { state.bPage += +t.dataset.d; return ($("#btable").innerHTML = bookingTable()); }
    if (a === "mpage") { state.mPage += +t.dataset.d; return ($("#mtable").innerHTML = memberTable()); }
    if (a === "tt") { state.tt = t.dataset.v; return render(); }
    if (a === "settab") { state.setTab = t.dataset.v; return render(); }
    if (a === "toggle") { const on = t.getAttribute("aria-checked") === "true"; t.setAttribute("aria-checked", String(!on)); return toast(on ? "Switched off (sample)" : "Switched on (sample)"); }
    if (a === "toggle-class") { const c = cById(+id), on = !c.active; c.active = on; t.setAttribute("aria-checked", String(on)); toast(on ? "Class is on sale again" : "Class hidden from members"); return render(); }
    if (a === "detach") { e.preventDefault(); const c = cById(+id); c.source = "manual"; toast("Detached from Wix: you now manage this class here"); classDrawer(c.id); return render(); }
    if (a === "save-class") { toast("Class saved (sample)"); return closeAll(); }
    if (a === "add-note") { const v = $("#notetxt").value.trim(); if (!v) return; mById(id).notes.push(v); $("#notes").insertAdjacentHTML("beforeend", `<div class="bubble" style="margin-bottom:8px"><small>You · just now</small>${esc(v)}</div>`); $("#notetxt").value = ""; return toast("Note saved"); }
    if (a === "open-msg") { state.msg = +id; const m = D.messages.find((x) => x.id === +id); m.unread = false; $("#mlist").innerHTML = msgList(); $("#mview").innerHTML = msgView(); return renderNav(); }
    if (a === "mfilter") { state.msgFilter = t.dataset.v; return render(); }
    if (a === "send-reply") { const v = $("#replytxt").value.trim(); if (!v) return toast("Type a reply first"); const m = D.messages.find((x) => x.id === state.msg); (m.replies = m.replies || []).push(v); $("#mview").innerHTML = msgView(); return toast("Reply sent from info@mygymlondon.co.uk (sample)"); }
  });
  document.addEventListener("input", (e) => {
    const f = e.target.dataset && e.target.dataset.f; if (!f) return;
    state[f] = f === "ciClass" ? +e.target.value : e.target.value;
    if (f === "ciClass") return render();
    if (f === "bq" || f === "bClass" || f === "bSrc" || f === "bStatus") { state.bPage = 1; $("#btable").innerHTML = bookingTable(); }
    if (f === "mq" || f === "mPlan" || f === "mStatus") { state.mPage = 1; $("#mtable").innerHTML = memberTable(); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
    if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); $("#gsearch").focus(); }
    if ((e.key === "Enter" || e.key === " ") && e.target.matches("tr[data-act]")) { e.preventDefault(); e.target.click(); }
  });
  $("#gsearch").addEventListener("keydown", (e) => { if (e.key === "Enter") { state.mq = e.target.value; state.mPage = 1; location.hash = "#/members"; render(); e.target.blur(); } });
  document.addEventListener("mousemove", (e) => { const t = e.target.closest("[data-tip]"); if (!t) return tipEl.classList.remove("on"); tipEl.textContent = t.dataset.tip; tipEl.classList.add("on"); tipEl.style.left = Math.min(e.clientX + 14, innerWidth - 250) + "px"; tipEl.style.top = e.clientY + 16 + "px"; });
  $("#burger").addEventListener("click", () => $("#side").classList.toggle("on"));
  $("#bell").addEventListener("click", () => toast("3 new: 2 messages and 1 failed payment"));
  $("#gmail").addEventListener("click", (e) => { e.preventDefault(); toast("Opens info@mygymlondon.co.uk in Gmail (sample)"); });
  $$("[data-i]").forEach((n) => { n.innerHTML = icon(n.dataset.i); });
  $("#burger").innerHTML = icon("menu"); $("#searchIcon").innerHTML = icon("search");
  window.addEventListener("hashchange", route);
  route();
})();
