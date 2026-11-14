/* MyGym London website: log in or create an account. Same accounts as the MyGym app (one email, one password). */
(function () {
  "use strict";
  var CFG = window.MGL_FORMS || {}, $ = function (i) { return document.getElementById(i); };
  if (!window.supabase || !$("lgForm")) return;
  var sb = window.supabase.createClient(CFG.supabaseUrl, CFG.anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
  var mode = "login", next = (new URLSearchParams(location.search).get("next") || "");
  if (!/^[a-z0-9-]+\.html$/.test(next)) next = "my-bookings.html";
  function say(t, kind) { var m = $("lgMsg"); m.textContent = t || ""; m.className = "mbmsg" + (kind ? " " + kind : ""); m.hidden = !t; }
  function paint() {
    var s = mode === "signup";
    $("lgTitle").textContent = s ? "Create your account" : "Log in";
    $("lgNameRow").hidden = !s; $("lgTermsRow").hidden = !s; $("lgGo").textContent = s ? "Create account" : "Log in";
    $("lgSwap").textContent = s ? "I already have an account" : "Create an account"; $("lgForgot").hidden = s;
    $("lgPass").autocomplete = s ? "new-password" : "current-password"; say("", "");
  }
  $("lgSwap").addEventListener("click", function () { mode = mode === "signup" ? "login" : "signup"; paint(); });
  $("lgForgot").addEventListener("click", async function () {
    var e = $("lgEmail").value.trim(); if (!e) return say("Type your email above first, then press Forgot password.", "bad");
    await sb.auth.resetPasswordForEmail(e, { redirectTo: "https://app.mygymlondon.co.uk" });
    say("If that email has an account, a reset link is on its way. Check your inbox and spam.", "ok");
  });
  async function signIn(email, pass) {
    var r = await sb.auth.signInWithPassword({ email: email, password: pass });
    if (r.error) return false; location.href = next; return true;
  }
  $("lgForm").addEventListener("submit", async function (ev) {
    ev.preventDefault(); say("", ""); var go = $("lgGo"); go.disabled = true;
    var email = $("lgEmail").value.trim(), pass = $("lgPass").value;
    try {
      if (mode === "login") { if (!(await signIn(email, pass))) say("Email or password not right. Use the same details as the MyGym app.", "bad"); }
      else {
        var name = $("lgName").value.trim();
        if (name.length < 2) { say("Please add your name.", "bad"); go.disabled = false; return; }
        if (pass.length < 8) { say("Choose a password of at least 8 characters.", "bad"); go.disabled = false; return; }
        if (!$("lgTerms").checked) { say("Please agree to the terms and the privacy notice.", "bad"); go.disabled = false; return; }
        var res = await fetch(CFG.supabaseUrl + "/functions/v1/member-signup", { method: "POST", headers: { "Content-Type": "application/json", apikey: CFG.anonKey }, body: JSON.stringify({ email: email, password: pass, name: name }) });
        var j = await res.json().catch(function () { return {}; });
        if (!res.ok) { say(j.error || "Could not create the account. Please try again.", "bad"); go.disabled = false; return; }
        if (!(await signIn(email, pass))) say("Your account is ready. Please log in.", "ok");
      }
    } catch (e) { say("No connection. Please check your internet and try again.", "bad"); }
    go.disabled = false;
  });
  sb.auth.getSession().then(function (r) { if (r.data.session) location.href = next; });
  paint();
})();
