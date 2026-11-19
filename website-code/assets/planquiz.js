/* "Not sure which plan?" three-question helper on the Services page. Reads the plan cards on the page, so prices and buttons always match. */
(function () {
  var box = document.getElementById("planQuiz"); if (!box || box.getAttribute("data-ready")) return; box.setAttribute("data-ready", "1");
  var ans = {}, res = box.querySelector(".qres");
  function card(name) { var cs = document.querySelectorAll("#services .plan, .plans .plan"); for (var i = 0; i < cs.length; i++) { var h = cs[i].querySelector("h3"); if (h && h.textContent.trim() === name) return cs[i]; } return null; }
  function info(name) { var c = card(name); if (!c) return null; var a = c.querySelector("a.btn"), b = c.querySelector(".pp b"), s = c.querySelector(".pp span"); return { name: name, price: b ? b.textContent.trim() : "", per: s ? s.textContent.trim() : "", href: a ? a.getAttribute("href") : "#", cta: a ? a.textContent.trim() : "Find out more" }; }
  function num(t) { var m = /[\d.]+/.exec(t || ""); return m ? parseFloat(m[0]) : 0; }
  function pick() {
    var w = ans.what, f = ans.freq, y = ans.pay === "year", cls = info("PAYG Class"), gym = info("PAYG Gym"), cm = info("Exercise Class Only Membership"), gm = info("Gym Membership"), both = info("Gym & Exercise Class Membership");
    var bothY = info("Gym & Exercise Class Membership (Annual)"), clsY = info("Exercise Classes (Annual)"), sg = info("Small Group Personal Training");
    if (w === "coach") return { p: sg, why: "Personal training is booked with our coach. Start with a free session, then choose one to one or a small group." };
    if (w === "gym") {
      if (f === "few") return { p: gym, why: "Pay as you go suits you: about " + gym.price + " a visit, with no membership. The membership only pays off from about " + Math.ceil(num(gm.price) / num(gym.price)) + " visits a month." };
      return { p: gm, why: "Unlimited use of the gym for one monthly price, no contract. From about " + Math.ceil(num(gm.price) / num(gym.price)) + " visits a month it costs less than paying " + gym.price + " each time." };
    }
    if (w === "classes") {
      if (f === "few") return { p: cls, why: "Pay as you go suits you: " + cls.price + " a class, no membership. The membership pays off from about " + Math.ceil(num(cm.price) / num(cls.price)) + " classes a month. Pilates is priced separately." };
      return y && clsY ? { p: clsY, why: "Paying yearly saves money on the monthly price and covers every class." } : { p: cm, why: "Book any class, as often as you like. From about " + Math.ceil(num(cm.price) / num(cls.price)) + " classes a month it costs less than paying " + cls.price + " each time." };
    }
    if (f === "few") return { p: cls, why: "Pay as you go is the cheapest start: " + cls.price + " a class or " + gym.price + " a gym visit. You can upgrade any time." };
    return y && bothY ? { p: bothY, why: "Gym and every class, paid yearly: the best value we offer." } : { p: both, why: "The gym and every class for one price, only " + "£" + (num(both.price) - num(gm.price)) + " more than a single membership. Includes a free induction and health check." };
  }
  function show() {
    if (!(ans.what && ans.freq && ans.pay)) { res.className = "qres"; return; }
    var r = pick(); if (!r || !r.p) { res.className = "qres"; return; }
    res.textContent = "";
    var t = document.createElement("small"); t.textContent = "We suggest"; res.appendChild(t);
    var h = document.createElement("h3"); h.textContent = r.p.name + (r.p.price ? " · " + r.p.price + " " + r.p.per : ""); res.appendChild(h);
    var p = document.createElement("p"); p.textContent = r.why; res.appendChild(p);
    var a = document.createElement("a"); a.className = "btn"; a.href = r.p.href; a.textContent = r.p.cta; res.appendChild(a);
    res.className = "qres on";
  }
  box.addEventListener("click", function (e) {
    var b = e.target.closest(".qo"); if (!b) return; var g = b.closest(".qq").getAttribute("data-q"); ans[g] = b.getAttribute("data-v");
    var sib = b.closest(".qopts").querySelectorAll(".qo"); for (var i = 0; i < sib.length; i++) sib[i].setAttribute("aria-pressed", sib[i] === b ? "true" : "false");
    show();
  });
})();
