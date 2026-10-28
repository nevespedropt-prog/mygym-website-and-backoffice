/* MyGym London website: shows the latest Instagram posts in the "On the gram" strip.
   Reads /functions/v1/instagram-feed (our own copy of the posts, refreshed every 6 hours). If there is nothing or it fails, the strip keeps its own photos. */
(function () {
  "use strict";
  var CFG = window.MGL_FORMS || {}, grid = document.querySelector(".igrid");
  if (!grid || !CFG.supabaseUrl || !window.fetch) return;
  var tpl = grid.querySelector(".ipost");
  if (!tpl) return;
  fetch(CFG.supabaseUrl + "/functions/v1/instagram-feed", { headers: { apikey: CFG.anonKey } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      var posts = j && j.posts ? j.posts.filter(function (p) { return /^https:\/\/(www\.)?instagram\.com\//.test(p.permalink) && /^https:\/\//.test(p.image_url); }) : [];
      if (posts.length < 3) return;
      var items = posts.slice(0, 6).map(function (p) {
        var a = tpl.cloneNode(true), img = a.querySelector("img");
        a.href = p.permalink; a.target = "_blank"; a.rel = "noopener";
        img.src = p.image_url; img.alt = p.caption ? p.caption.slice(0, 110) : "Latest post from MyGym London on Instagram"; img.loading = "lazy"; img.referrerPolicy = "no-referrer";
        img.removeAttribute("srcset");
        return a;
      });
      while (grid.firstChild) grid.removeChild(grid.firstChild);
      items.forEach(function (a) { grid.appendChild(a); });
    })
    .catch(function () { /* keep the built-in photos */ });
})();
