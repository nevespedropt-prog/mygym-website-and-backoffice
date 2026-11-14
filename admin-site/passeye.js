/* Adds a show / hide eye button inside every password box on the page */
(function () {
  var css = ".pe-wrap{position:relative;display:block}.pe-wrap>input{width:100%;box-sizing:border-box;padding-right:46px!important}.pe-eye{position:absolute;right:4px;top:50%;transform:translateY(-50%);width:40px;height:40px;display:flex;align-items:center;justify-content:center;background:none;border:0;padding:0;margin:0;color:#6b6b6b;cursor:pointer;border-radius:8px}.pe-eye:hover{color:#111}.pe-eye:focus-visible{outline:2px solid currentColor}.pe-eye svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.pe-eye .pe-off{display:none}.pe-eye.on .pe-on{display:none}.pe-eye.on .pe-off{display:block}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  var NS = "http://www.w3.org/2000/svg";
  function svg(cls, paths) {
    var s = document.createElementNS(NS, "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); s.setAttribute("class", cls);
    paths.forEach(function (d) { var p = document.createElementNS(NS, d[0]); for (var k in d[1]) p.setAttribute(k, d[1][k]); s.appendChild(p); });
    return s;
  }
  function add(inp) {
    if (inp.getAttribute("data-pe")) return; inp.setAttribute("data-pe", "1");
    var w = document.createElement("span"); w.className = "pe-wrap";
    inp.parentNode.insertBefore(w, inp); w.appendChild(inp);
    var b = document.createElement("button"); b.type = "button"; b.className = "pe-eye"; b.setAttribute("aria-label", "Show password"); b.setAttribute("aria-pressed", "false");
    b.appendChild(svg("pe-on", [["path", { d: "M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" }], ["circle", { cx: "12", cy: "12", r: "3" }]]));
    b.appendChild(svg("pe-off", [["path", { d: "M17.94 17.94A10.9 10.9 0 0 1 12 19c-7 0-11-7-11-7a19.8 19.8 0 0 1 5.06-5.94M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 7 11 7a19.9 19.9 0 0 1-3.17 4.19M14.12 14.12a3 3 0 1 1-4.24-4.24M1 1l22 22" }]]));
    b.addEventListener("click", function () {
      var show = inp.type === "password"; inp.type = show ? "text" : "password";
      b.classList.toggle("on", show); b.setAttribute("aria-pressed", show ? "true" : "false"); b.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
    w.appendChild(b);
  }
  function scan() { var l = document.querySelectorAll('input[type="password"]'); for (var i = 0; i < l.length; i++) add(l[i]); }
  scan();
  if (window.MutationObserver) new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
})();
