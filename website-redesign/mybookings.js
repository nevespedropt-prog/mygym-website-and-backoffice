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

  /* ---- My membership: plan, next payment, credits, and a request to pause, cancel or change (same functions as the app) ---- */
  function fmtD(d) { return d ? new Date(String(d).slice(0, 10) + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""; }
  function isoPlus(n) { var d = new Date(); d.setDate(d.getDate() + n); return iso(d); }
  function row(k, v) { var r = el("div", "mbrow"), i = el("div", "mbinfo"); i.appendChild(el("span", null, k)); i.appendChild(el("b", null, v)); r.appendChild(i); return r; }
  async function renderMem() {
    var box = $("mbMem"); if (!box) return; while (box.firstChild) box.removeChild(box.firstChild);
    var res = await sb.rpc("my_membership"), m = res.data;
    if (res.error || !m || (!m.plan && !m.request && !m.credits)) return;
    var card = el("div", "card loginf"); box.appendChild(card);
    card.appendChild(el("h3", null, "My membership"));
    var p = m.plan;
    if (p) {
      var per = { MONTH: "every month", WEEK: "every week", YEAR: "every year" }[p.unit] || "";
      card.appendChild(el("p", "sub", (p.status === "paused" ? "Paused. " : p.cancelling ? "Ending. " : "Active. ") + p.name + (p.amount ? " · £" + Number(p.amount).toFixed(p.amount % 1 ? 2 : 0) + " " + per : "")));
      if (p.started) card.appendChild(row("Started", fmtD(p.started)));
      if (p.next_payment && p.status === "active" && !p.cancelling) card.appendChild(row("Next payment", fmtD(p.next_payment)));
      if (p.ends && (p.cancelling || p.status !== "active")) card.appendChild(row(p.cancelling ? "Ends" : "Until", fmtD(p.ends)));
      card.appendChild(row("You can book", p.type === "gym_classes" ? "Classes and gym slots" : p.type === "classes" ? "Classes" : p.type === "gym" ? "Gym slots" : "See your plan"));
      if (p.payment_failed) card.appendChild(el("p", "mbmsg bad", "Your last payment did not go through. We try again 5 days after the failed attempt. To avoid your membership being suspended, update your card with the link below."));
      var upd = el("a", "btn ghost", "Update my card or see receipts"); upd.href = "https://www.mygymlondon.co.uk/my-subscriptions"; upd.target = "_blank"; upd.rel = "noopener"; card.appendChild(upd);
    }
    if (m.credits > 0) card.appendChild(el("p", "sub", "🎟️ " + m.credits + (m.credits === 1 ? " class credit" : " class credits") + " available. Ask us at the gym to use it."));
    var q = m.request;
    if (q && q.status === "received") {
      var lbl = { pause: "Pause", cancel: "Cancel", change: "Change plan" }[q.type];
      card.appendChild(el("p", "mbmsg ok", "Your request: " + lbl + " from " + fmtD(q.from_date) + ". Received. We reply within 2 working days and nothing changes until we confirm."));
      var w = el("button", "btn ghost", "Withdraw this request"); w.type = "button";
      w.addEventListener("click", async function () { w.disabled = true; await sb.rpc("withdraw_membership_request", { p_id: q.id }); renderMem(); });
      card.appendChild(w);
    } else if (p) {
      if (q && (q.status === "done" || q.status === "declined") && q.resolved_at && Date.now() - new Date(q.resolved_at).getTime() < 14 * 864e5)
        card.appendChild(el("p", "sub", q.status === "done" ? "Your last request (" + q.type + ") was confirmed on " + fmtD(q.resolved_at) + "." : "Your last request could not be done. We will be in touch."));
      var open = el("button", "btn ghost", "Pause, cancel or change my plan"); open.type = "button";
      var form = el("div", null); form.hidden = true;
      var sel = el("select", "wemail"); [["pause", "Pause my membership"], ["cancel", "Cancel my membership"], ["change", "Change my plan"]].forEach(function (o) { var x = el("option", null, o[1]); x.value = o[0]; sel.appendChild(x); });
      var date = el("input", "wemail"); date.type = "date"; date.min = isoPlus(0); date.max = isoPlus(90); date.value = p.next_payment || isoPlus(7);
      var why = el("select", "wemail"); ["", "Moving away", "Cost", "Injury or health", "Not enough time", "Not what I expected", "Other"].forEach(function (t) { var x = el("option", null, t || "Mind telling us why? (optional)"); x.value = t; why.appendChild(x); });
      var msg = el("textarea", "wemail"); msg.rows = 3; msg.maxLength = 600; msg.placeholder = "Anything else? (optional)";
      var err = el("p", "mbmsg bad", ""); err.hidden = true; var send = el("button", "btn", "Send request"); send.type = "button";
      [["What would you like to do?", sel], ["From which date?", date], ["", why], ["", msg]].forEach(function (f) { if (f[0]) form.appendChild(el("label", "lb", f[0])); form.appendChild(f[1]); });
      form.appendChild(el("p", "fine", "Monthly plans have no minimum term. To cancel, give us at least 1 week’s notice before your next billing date. A request sent after that takes effect after your next payment. Nothing changes until we confirm it by email."));
      form.appendChild(err); form.appendChild(send);
      open.addEventListener("click", function () { form.hidden = !form.hidden; });
      send.addEventListener("click", async function () {
        send.disabled = true; err.hidden = true;
        var r = await sb.rpc("request_membership_change", { p_type: sel.value, p_from: date.value, p_reason: why.value || null, p_message: msg.value || null });
        if (r.error) { err.textContent = r.error.message || "Could not send. Try again."; err.hidden = false; send.disabled = false; return; }
        renderMem();
      });
      card.appendChild(open); card.appendChild(form);
    }
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
  $("mbOut").addEventListener("click", async function () { await sb.auth.signOut(); say("", ""); load(); });
  load().catch(function () { $("mbLogin").hidden = false; });
})();
