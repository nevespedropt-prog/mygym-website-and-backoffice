/* MyGym London website: "Ready to join?" membership suggestion, shown after a free class or free gym session.
   Reads the public plan list (same list as the app and the sales page). Window.MGLSuggest.render(sb, box, kind) where kind is "class" or "gym". */
(function () {
  "use strict";
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function money(a) { return "£" + Number(a).toFixed(a % 1 ? 2 : 0); }
  var PICK = {
    "class": ["Gym & Exercise Class Membership", "Exercise Class Only Membership"],
    "gym": ["Gym Membership", "Gym & Exercise Class Membership"]
  };
  function render(sb, box, kind) {
    if (!box) return Promise.resolve();
    while (box.firstChild) box.removeChild(box.firstChild);
    return sb.rpc("public_plans").then(function (r) {
      var plans = r.data || [], want = PICK[kind === "gym" ? "gym" : "class"], list = [];
      want.forEach(function (n) { plans.forEach(function (p) { if (p.name === n) list.push(p); }); });
      if (!list.length) return;
      var card = el("div", "card suggest");
      card.appendChild(el("h3", null, "Ready to join?"));
      card.appendChild(el("p", "sub", "Here is what we suggest after your free " + (kind === "gym" ? "gym session" : "class") + ". No joining fee, and monthly plans have no minimum term."));
      var grid = el("div", "suggest-grid"); card.appendChild(grid);
      list.forEach(function (p, i) {
        var c = el("div", "suggest-plan" + (i === 0 ? " best" : ""));
        if (i === 0) c.appendChild(el("span", "suggest-flag", "Best value"));
        c.appendChild(el("div", "suggest-name", p.name));
        var pp = el("div", "suggest-price"); pp.appendChild(el("b", null, money(p.price))); pp.appendChild(el("span", null, " " + p.per)); c.appendChild(pp);
        var ul = el("ul", null); (p.includes || []).slice(0, 3).forEach(function (x) { ul.appendChild(el("li", null, x)); }); c.appendChild(ul);
        var a = el("a", "btn" + (i === 0 ? "" : " ghost"), "Join"); a.href = "join.html?plan=" + encodeURIComponent(p.name); c.appendChild(a);
        grid.appendChild(c);
      });
      var more = el("p", "fine"); more.appendChild(document.createTextNode("Not sure? "));
      var a2 = el("a", null, "See all plans"); a2.href = "services.html"; more.appendChild(a2); more.appendChild(document.createTextNode(" or pay as you go for a single session."));
      card.appendChild(more); box.appendChild(card);
    }).catch(function () { /* the suggestion is a bonus: never block the page */ });
  }
  window.MGLSuggest = { render: render };
})();
