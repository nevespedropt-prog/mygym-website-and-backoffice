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
