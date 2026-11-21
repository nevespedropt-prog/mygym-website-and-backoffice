/* MyGym London website: the member's photo, so the team can recognise them at the gym.
   The picture is shrunk in the browser to a 600 pixel square, saved in a private storage bucket (one file per member) and only staff can look at it.
   Window.MGLPhoto: prepare(file), upload(sb, uid, blob), remove(sb, uid), signedUrl(sb, uid), card(sb, box, opts), picker(box, opts). */
(function () {
  "use strict";
  var BUCKET = "member-photos";
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  var CAMERA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg>';

  /* a square, centre-cropped JPEG of about 600 pixels (usually well under 200 KB) */
  function prepare(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type || "")) return reject(new Error("Please choose a picture."));
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        try {
          var s = Math.min(img.naturalWidth, img.naturalHeight), sx = (img.naturalWidth - s) / 2, sy = (img.naturalHeight - s) / 2, out = Math.min(600, s);
          var c = document.createElement("canvas"); c.width = c.height = out; c.getContext("2d").drawImage(img, sx, sy, s, s, 0, 0, out, out);
          URL.revokeObjectURL(url);
          c.toBlob(function (b) { if (b) resolve(b); else reject(new Error("We could not read that picture. Please try another.")); }, "image/jpeg", 0.82);
        } catch (e) { reject(new Error("We could not read that picture. Please try another.")); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("We could not read that picture. Please try another one (JPEG or PNG).")); };
      img.src = url;
    });
  }
  function path(uid) { return uid + "/photo.jpg"; }
  function upload(sb, uid, blob) {
    return sb.storage.from(BUCKET).upload(path(uid), blob, { upsert: true, contentType: "image/jpeg", cacheControl: "0" }).then(function (r) {
      if (r.error) throw new Error("We could not save your photo. Please try again.");
      return sb.rpc("my_photo_saved", { p_on: true });
    }).then(function (r) { if (r && r.error) throw new Error("We could not save your photo. Please try again."); });
  }
  function remove(sb, uid) {
    return sb.storage.from(BUCKET).remove([path(uid)]).then(function () { return sb.rpc("my_photo_saved", { p_on: false }); });
  }
  function signedUrl(sb, uid) {
    return sb.storage.from(BUCKET).createSignedUrl(path(uid), 600).then(function (r) { return r.data && r.data.signedUrl ? r.data.signedUrl : null; });
  }

  /* hidden file inputs: one opens the camera, one the gallery */
  function inputs(onFile) {
    var cam = el("input"), gal = el("input");
    [cam, gal].forEach(function (i) { i.type = "file"; i.accept = "image/*"; i.hidden = true; i.addEventListener("change", function () { var f = i.files && i.files[0]; i.value = ""; if (f) onFile(f); }); });
    cam.setAttribute("capture", "user");
    return { cam: cam, gal: gal };
  }
  function avatar(src) {
    var a = el("div", "pavatar" + (src ? " has" : ""));
    if (src) { var i = el("img"); i.alt = "Your photo"; i.src = src; a.appendChild(i); } else a.innerHTML = CAMERA;
    return a;
  }

  /* the card on the member's account page */
  function card(sb, box, opts) {
    opts = opts || {};
    while (box.firstChild) box.removeChild(box.firstChild);
    return sb.auth.getSession().then(function (r) {
      var sess = r.data.session; if (!sess) return;
      var uid = sess.user.id;
      return sb.from("profiles").select("photo_at").eq("id", uid).maybeSingle().then(function (pr) {
        var has = !!(pr.data && pr.data.photo_at);
        return (has ? signedUrl(sb, uid) : Promise.resolve(null)).then(function (url) { draw(url, has); });
      });
      function draw(url, has) {
        while (box.firstChild) box.removeChild(box.firstChild);
        var c = el("div", "card photocard" + (has ? " done" : ""));
        var left = avatar(has ? url : null), right = el("div", "pbody");
        right.appendChild(el("span", "pchip", has ? "Photo added" : "Please add your photo"));
        right.appendChild(el("h3", null, has ? "Looking good" : "Add your photo"));
        right.appendChild(el("p", "sub", has ? "Thank you. Our team can now recognise you when you come to the gym. You can change it any time." : "Ideally a clear photo of your face, so we know you are a real person and can recognise you when you come to the gym. We never reject a photo, and you can change it any time."));
        var msg = el("p", "mbmsg", ""); msg.hidden = true;
        var acts = el("div", "hubacts"), pick = inputs(function (f) {
          msg.hidden = true; var b = acts.querySelectorAll("button"); [].forEach.call(b, function (x) { x.disabled = true; });
          prepare(f).then(function (blob) { return upload(sb, uid, blob); }).then(function () { if (opts.onChange) opts.onChange(true); card(sb, box, opts); })
            .catch(function (e) { [].forEach.call(b, function (x) { x.disabled = false; }); msg.className = "mbmsg bad"; msg.textContent = e.message || "Something went wrong. Please try again."; msg.hidden = false; });
        });
        var b1 = el("button", "btn", has ? "Take a new photo" : "Take a photo"); b1.type = "button"; b1.addEventListener("click", function () { pick.cam.click(); });
        var b2 = el("button", "btn ghost", has ? "Choose another" : "Choose a photo"); b2.type = "button"; b2.addEventListener("click", function () { pick.gal.click(); });
        acts.appendChild(b1); acts.appendChild(b2);
        if (has) { var b3 = el("button", "lnk", "Remove photo"); b3.type = "button"; b3.addEventListener("click", function () { if (!window.confirm("Remove your photo?")) return; remove(sb, uid).then(function () { if (opts.onChange) opts.onChange(false); card(sb, box, opts); }); }); acts.appendChild(b3); }
        right.appendChild(acts); right.appendChild(msg);
        right.appendChild(el("p", "fine", "Only you and our coaches and management can see your photo. We do not use face recognition."));
        c.appendChild(left); c.appendChild(right); c.appendChild(pick.cam); c.appendChild(pick.gal); box.appendChild(c);
      }
    });
  }

  /* the optional picker on the sign-up form: keeps the prepared picture until the account exists, then the caller uploads it */
  function picker(box, opts) {
    opts = opts || {};
    while (box.firstChild) box.removeChild(box.firstChild);
    var state = { blob: null }, wrap = el("div", "ppicker"), av = avatar(null), body = el("div", "pbody");
    body.appendChild(el("b", null, "Add your photo"));
    body.appendChild(el("p", "fine", "Ideally a clear photo of your face, so we know you are a real person and can recognise you at the gym. You can change it any time."));
    var msg = el("p", "fine bad", ""); msg.hidden = true;
    var pick = inputs(function (f) {
      prepare(f).then(function (blob) { state.blob = blob; var u = URL.createObjectURL(blob); var n = avatar(u); wrap.replaceChild(n, av); av = n; btn1.textContent = "Take another"; msg.hidden = true; })
        .catch(function (e) { msg.textContent = e.message; msg.hidden = false; });
    });
    var row = el("div", "hubacts"), btn1 = el("button", "btn sm", "Take a photo"), btn2 = el("button", "btn sm ghost", "Choose one");
    btn1.type = btn2.type = "button"; btn1.addEventListener("click", function () { pick.cam.click(); }); btn2.addEventListener("click", function () { pick.gal.click(); });
    row.appendChild(btn1); row.appendChild(btn2); body.appendChild(row); body.appendChild(msg);
    wrap.appendChild(av); wrap.appendChild(body); wrap.appendChild(pick.cam); wrap.appendChild(pick.gal); box.appendChild(wrap);
    return { get: function () { return state.blob; } };
  }

  window.MGLPhoto = { prepare: prepare, upload: upload, remove: remove, signedUrl: signedUrl, card: card, picker: picker };
})();
