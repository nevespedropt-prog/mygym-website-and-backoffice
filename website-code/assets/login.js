/* MyGym London website: log in or create an account. Same accounts as the MyGym app (one email, one password). */
(function () {
  "use strict";
  var CFG = window.MGL_FORMS || {}, $ = function (i) { return document.getElementById(i); };
  if (!window.supabase || !$("lgForm")) return;
  var sb = window.supabase.createClient(CFG.supabaseUrl, CFG.anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
  var mode = new URLSearchParams(location.search).get("mode") === "signup" ? "signup" : "login", next = (new URLSearchParams(location.search).get("next") || "");
  if (!/^[a-z0-9-]+\.html$/.test(next)) next = "my-bookings.html";
  function say(t, kind) { var m = $("lgMsg"); m.textContent = t || ""; m.className = "mbmsg" + (kind ? " " + kind : ""); m.hidden = !t; }
  function paint() {
    var s = mode === "signup";
    $("lgTitle").textContent = s ? "Create your account" : "Log in";
    $("lgNameRow").hidden = !s; $("lgTermsRow").hidden = !s; $("lgNewsRow").hidden = !s; $("lgGo").textContent = s ? "Create account" : "Log in";
    $("lgSwap").textContent = s ? "I already have an account" : "Create an account"; $("lgForgot").hidden = s;
    $("lgPass").autocomplete = s ? "new-password" : "current-password"; say("", "");
  }
  $("lgSwap").addEventListener("click", function () { mode = mode === "signup" ? "login" : "signup"; paint(); });
  $("lgForgot").addEventListener("click", async function () {
    var e = $("lgEmail").value.trim(); if (!e) return say("Type your email above first, then press Forgot password.", "bad");
    await sb.auth.resetPasswordForEmail(e, { redirectTo: "https://app.mygymlondon.co.uk" });
    say("If that email has an account, a reset link is on its way. Check your inbox and spam.", "ok");
  });
  var photoPick = window.MGLPhoto && $("lgPhotoRow") ? window.MGLPhoto.picker($("lgPhotoRow")) : null;
  async function signIn(email, pass, extra) {
    var r = await sb.auth.signInWithPassword({ email: email, password: pass });
    if (r.error) return false;
    if (extra && extra.photo && window.MGLPhoto) { try { await window.MGLPhoto.upload(sb, r.data.user.id, extra.photo); } catch (e) { /* they will be asked again on their account page */ } }
    if (extra && extra.phone) { try { await sb.from("profiles").update({ phone: extra.phone }).eq("id", r.data.user.id); } catch (e) { /* they can add it on their account page */ } }
    if (extra && extra.news) { try { await sb.rpc("set_my_marketing_consent", { p_on: true, p_source: "app-signup" }); } catch (e) { /* they can switch it on in Account, Privacy and data */ } }
    location.href = next; return true;
  }
  $("lgForm").addEventListener("submit", async function (ev) {
    ev.preventDefault(); say("", ""); var go = $("lgGo"); go.disabled = true;
    var email = $("lgEmail").value.trim(), pass = $("lgPass").value;
    try {
      if (mode === "login") { if (!(await signIn(email, pass))) say("Email or password not right. Use the same details as the MyGym app.", "bad"); }
      else {
        var first = $("lgFirst").value.trim(), last = $("lgLast").value.trim(), phone = $("lgPhone").value.trim(), name = first + " " + last;
        if (first.length < 1 || last.length < 1) { say("Please add your first and last name.", "bad"); go.disabled = false; return; }
        if (phone.replace(/\D/g, "").length < 7) { say("Please add a phone number we can reach you on.", "bad"); go.disabled = false; return; }
        if (pass.length < 8) { say("Choose a password of at least 8 characters.", "bad"); go.disabled = false; return; }
        if (!$("lgTerms").checked) { say("Please agree to the terms and the privacy notice.", "bad"); go.disabled = false; return; }
        var res = await fetch(CFG.supabaseUrl + "/functions/v1/member-signup", { method: "POST", headers: { "Content-Type": "application/json", apikey: CFG.anonKey }, body: JSON.stringify({ email: email, password: pass, name: name }) });
        var j = await res.json().catch(function () { return {}; });
        if (!res.ok) { say(j.error || "Could not create the account. Please try again.", "bad"); go.disabled = false; return; }
        if (!(await signIn(email, pass, { news: $("lgNews").checked, phone: phone, photo: photoPick ? photoPick.get() : null }))) say("Your account is ready. Please log in.", "ok");
      }
    } catch (e) { say("No connection. Please check your internet and try again.", "bad"); }
    go.disabled = false;
  });
  sb.auth.getSession().then(function (r) { if (r.data.session) location.href = next; });
  paint();
})();
