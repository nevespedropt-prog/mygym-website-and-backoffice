/* MyGym London website: "Join" sales page. Pick a plan, see the summary, then go to Wix's own secure payment page.
   Plans and prices come from the same public list as the app (public_plans). Payment stays on Wix: this page never handles card details.
   AT THE MOVE the payment link comes from assets/links-config.js (wix + memberships). */
(function () {
  "use strict";
  var CFG = window.MGL_FORMS || {}, L = window.MGL_LINKS || {}, root = document.getElementById("jPlans");
  if (!root || !window.supabase) return;
  var sb = window.supabase.createClient(CFG.supabaseUrl, CFG.anonKey, { auth: { persistSession: true, autoRefreshToken: true } });
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function money(a) { return "£" + Number(a).toFixed(a % 1 ? 2 : 0); }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  var plans = [], sel = null, sess = null;
  var want = new URLSearchParams(location.search).get("plan"); try { if (!want) want = sessionStorage.getItem("mgl_join_plan"); } catch (e) { /* private window */ }
  var PAY = (L.wix || "https://www.mygymlondon.co.uk") + (L.memberships || "/pricing-plans/memberships");

  function drawPlans() {
    clear(root);
    var groups = [["Monthly", function (p) { return /month|week/i.test(p.per); }], ["Yearly", function (p) { return /year/i.test(p.per); }]];
    groups.forEach(function (g) {
      var list = plans.filter(g[1]); if (!list.length) return;
      root.appendChild(el("h3", "jgroup", g[0]));
      list.forEach(function (p) {
        var c = el("button", "jplan" + (sel && sel.name === p.name ? " sel" : "")); c.type = "button"; c.setAttribute("role", "radio"); c.setAttribute("aria-checked", sel && sel.name === p.name ? "true" : "false"); c.setAttribute("data-plan", p.name);
        if (p.name === "Gym & Exercise Class Membership") c.appendChild(el("span", "jflag", "Best value"));
        c.appendChild(el("span", "jname", p.name));
        var pp = el("span", "jprice"); pp.appendChild(el("b", null, money(p.price))); pp.appendChild(el("small", null, " " + p.per)); c.appendChild(pp);
        var ul = el("ul", null); (p.includes || []).slice(0, 4).forEach(function (x) { ul.appendChild(el("li", null, x)); }); c.appendChild(ul);
        root.appendChild(c);
      });
    });
  }
  function drawSummary() {
    var box = document.getElementById("jSumBody"), cta = document.getElementById("jGo"), acct = document.getElementById("jAcct"); clear(box);
    if (!sel) { box.appendChild(el("p", "sub", "Choose a plan to see your summary.")); cta.hidden = true; }
    else {
      box.appendChild(el("div", "jsname", sel.name));
      var pp = el("div", "jsprice"); pp.appendChild(el("b", null, money(sel.price))); pp.appendChild(el("span", null, " " + sel.per)); box.appendChild(pp);
      var ul = el("ul", "jsinc"); (sel.includes || []).forEach(function (x) { ul.appendChild(el("li", null, x)); }); box.appendChild(ul);
      var yearly = /year/i.test(sel.per);
      box.appendChild(el("p", "fine", yearly ? "Yearly plans are paid in advance. You can ask for a refund within 1 month of paying. See our terms for the details." : "No joining fee. No minimum term: cancel with 1 week’s notice before your next billing date."));
      var steps = el("ol", "jsteps");
      [sess ? "You are signed in. Your plan will connect to your account." : "Log in or create your free account, so your plan connects to the app.", "Pay securely on the next page: choose “" + sel.name + "”. Wix takes the payment.", "Your plan appears on your account page and in the MyGym app."].forEach(function (t) { steps.appendChild(el("li", null, t)); });
      box.appendChild(steps);
      cta.hidden = false; cta.textContent = sess ? "Continue to secure payment" : "Log in to continue";
    }
    clear(acct);
    if (sess) acct.appendChild(document.createTextNode("Signed in as " + sess.user.email)); else { acct.appendChild(document.createTextNode("Not signed in. ")); var a = el("a", null, "Log in or create an account"); a.href = "login.html?next=join.html"; acct.appendChild(a); }
  }
  function select(name) { sel = plans.filter(function (p) { return p.name === name; })[0] || null; try { if (sel) sessionStorage.setItem("mgl_join_plan", sel.name); } catch (e) { /* private window */ } drawPlans(); drawSummary(); }
  root.addEventListener("click", function (e) { var b = e.target.closest("[data-plan]"); if (b) { select(b.getAttribute("data-plan")); if (window.matchMedia("(max-width:800px)").matches) document.getElementById("jSum").scrollIntoView({ behavior: "smooth", block: "start" }); } });
  document.getElementById("jGo").addEventListener("click", function () { if (!sel) return; if (!sess) { location.href = "login.html?next=join.html"; return; } location.href = PAY; });
  sb.auth.getSession().then(function (r) { sess = r.data.session; drawSummary(); });
  sb.rpc("public_plans").then(function (r) {
    plans = r.data || [];
    if (!plans.length) { clear(root); root.appendChild(el("p", "note", "We could not load the plans. Please see our Services page, or email info@mygymlondon.co.uk.")); return; }
    var pre = want && plans.filter(function (p) { return p.name === want; })[0];
    sel = pre || plans.filter(function (p) { return p.name === "Gym & Exercise Class Membership"; })[0] || plans[0]; drawPlans(); drawSummary();
  }).catch(function () { clear(root); root.appendChild(el("p", "note", "We could not load the plans. Please see our Services page.")); });
})();
