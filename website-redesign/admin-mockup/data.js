/* Sample data for the design mock-up. Every name, email and number here is invented. */
window.DATA = (() => {
  let s = 20261025;
  const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const DAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const addD = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const dow = (d) => (d.getDay() + 6) % 7; // 0 = Monday

  const plans = [
    { id: "gc", name: "Gym + Classes", price: 35, per: "month", subs: 28, color: "#e03939", note: "Gym floor and all classes" },
    { id: "co", name: "Classes only", price: 25, per: "month", subs: 12, color: "#2f6fd0", note: "All classes, no gym floor" },
    { id: "ga", name: "Gym + Classes (annual)", price: 350, per: "year", subs: 6, color: "#1f8a70", note: "Two months free" },
    { id: "st", name: "BHP Staff Gym", price: 15, per: "month", subs: 5, color: "#c26b13", note: "School staff rate" },
    { id: "kg", name: "Kids Gym", price: 12, per: "month", subs: 4, color: "#7a5bd6", note: "Ages 6 to 11" },
  ];

  // weekly pattern: [day 0-6, time, name, coach, capacity, kind c|g|k, source]
  const pattern = [
    [0, "07:00", "Morning Blast", "Coach Dan", 12, "c", "wix"], [0, "09:30", "Over 50s Strength", "Coach Mel", 10, "c", "wix"], [0, "18:00", "Circuit Training", "Coach Dan", 14, "c", "wix"], [0, "19:00", "Small Group PT", "Coach Ali", 6, "c", "manual"],
    [1, "07:00", "Sunrise HIIT", "Coach Dan", 12, "c", "wix"], [1, "09:30", "Cardio n Abs", "Coach Mel", 12, "c", "wix"], [1, "16:30", "Kids Class", "Coach Ali", 10, "k", "wix"], [1, "18:30", "Boxing Fit", "Coach Dan", 14, "c", "wix"],
    [2, "07:00", "Morning Blast", "Coach Dan", 12, "c", "wix"], [2, "09:30", "Over 50s Circuit", "Coach Mel", 10, "c", "wix"], [2, "18:00", "Boxing Fit", "Coach Dan", 14, "c", "wix"], [2, "19:00", "1-2-1 PT slots", "Coach Ali", 4, "c", "manual"],
    [3, "07:00", "Sunrise HIIT", "Coach Dan", 12, "c", "wix"], [3, "16:30", "Kids Class", "Coach Ali", 10, "k", "wix"], [3, "18:30", "Strength Basics", "Coach Mel", 12, "c", "wix"],
    [4, "07:00", "Morning Blast", "Coach Dan", 12, "c", "wix"], [4, "09:30", "Over 50s Class", "Coach Mel", 10, "c", "wix"], [4, "17:30", "Friday Finisher", "Coach Dan", 14, "c", "wix"],
    [5, "09:00", "Weekend Warrior", "Coach Dan", 16, "c", "wix"], [5, "10:30", "Family Session", "Coach Ali", 16, "k", "wix"],
  ];
  const classes = pattern.map((p, i) => ({ id: i + 1, day: p[0], time: p[1], name: p[2], coach: p[3], cap: p[4], kind: p[5], source: p[6], active: true, dur: 45 }));
  classes.find((c) => c.name === "Friday Finisher").active = false; // example of a class switched off

  const first = ["Aisha", "Ben", "Chloe", "Dev", "Elena", "Femi", "Grace", "Hugo", "Isla", "Jamal", "Kira", "Leo", "Maya", "Noah", "Olivia", "Priya", "Quinn", "Ravi", "Sofia", "Tom", "Uma", "Victor", "Wendy", "Zane"];
  const last = ["Adams", "Brooks", "Carter", "Dawson", "Evans", "Foster", "Grant", "Hughes", "Ibrahim", "Jones", "Khan", "Lewis", "Morgan", "Nwosu", "Okafor", "Patel", "Reid", "Singh", "Taylor", "Walker"];
  const statuses = ["Active", "Active", "Active", "Active", "Active", "Active", "Active", "Paused", "Past due", "Trial"];
  const members = [];
  const used = {};
  while (members.length < 48) {
    const f = pick(first), l = pick(last), key = f + l;
    if (used[key]) continue; used[key] = 1;
    const plan = pick(plans.slice(0, 4).concat([plans[0], plans[0], plans[1], plans[4]]));
    const st = pick(statuses);
    members.push({
      id: "M" + (1000 + members.length), name: f + " " + l, email: (f + "." + l).toLowerCase() + "@example.com",
      phone: "07" + ri(100, 999) + " ••• " + ri(100, 999), plan: plan.id, status: st,
      joined: iso(addD(today, -ri(5, 700))), last: iso(addD(today, -ri(0, st === "Paused" ? 60 : 9))),
      bookings: ri(1, 140), health: pick(["Complete", "Complete", "Complete", "Due", "Missing"]), notes: [],
      av: pick(["", "g", "b", "o", "t"]),
    });
  }
  members.sort((a, b) => a.name.localeCompare(b.name));

  // bookings: 14 days back and 14 days ahead
  const bookings = [];
  let bid = 5000;
  for (let off = -14; off <= 14; off++) {
    const d = addD(today, off), dw = dow(d), ds = iso(d);
    classes.filter((c) => c.day === dw && c.active).forEach((c) => {
      const fill = c.kind === "k" ? ri(3, c.cap) : ri(Math.round(c.cap * .45), c.cap);
      const n = off > 7 ? Math.round(fill * .35) : off > 2 ? Math.round(fill * .7) : fill;
      c["f" + ds] = n;
      for (let k = 0; k < Math.min(n, 5); k++) {
        const m = pick(members);
        bookings.push({ id: "B" + (bid++), member: m.id, cls: c.id, date: ds, time: c.time, src: pick(["App", "App", "App", "Wix site", "Admin"]), at: iso(addD(d, -ri(0, 5))),
          status: off < 0 ? pick(["Attended", "Attended", "Attended", "Attended", "No-show", "Cancelled"]) : off === 0 && c.time < "10:00" ? "Attended" : "Confirmed" });
      }
    });
  }
  bookings.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const perDay = [];
  for (let off = -13; off <= 0; off++) {
    const ds = iso(addD(today, off));
    let n = 0; classes.filter((c) => c.day === dow(addD(today, off)) && c.active).forEach((c) => { n += c["f" + ds] || 0; });
    perDay.push({ d: addD(today, off), n });
  }

  const messages = [
    { id: 1, from: "Hannah Morris", email: "hannah.morris@example.com", src: "Landing page", subj: "Interested in the January membership offer", body: "Hi, I saw your January offer on Instagram. Is the Gym + Classes plan still available with no joining fee? I'm in Enfield and would love to try a class first.", at: "09:12", unread: true, tag: "Enquiry" },
    { id: 2, from: "Marcus Bell", email: "marcus.bell@example.com", src: "PT enquiry form", subj: "Personal training for knee rehab", body: "Hello, I had a knee operation in the summer and my physio has signed me off for light training. Do you have a coach who works with rehab clients? Evenings are best for me.", at: "08:40", unread: true, tag: "PT" },
    { id: 3, from: "Sara Idris", email: "sara.idris@example.com", src: "App message", subj: "Can I move my booking?", body: "I booked Boxing Fit on Wednesday but I have a work event. Can someone move me to Thursday's session instead?", at: "Yesterday", unread: true, tag: "Booking" },
    { id: 4, from: "Tom Ashby", email: "tom.ashby@example.com", src: "Contact form", subj: "Parking near the gym", body: "Is there parking close by for the 7am class? Thanks!", at: "Yesterday", unread: false, tag: "Question" },
    { id: 5, from: "Priya Shah", email: "priya.shah@example.com", src: "Contact form", subj: "Kids Gym age limit", body: "My daughter turns 12 next month. Can she keep coming to Kids Gym, or is there a teen option?", at: "Mon", unread: false, tag: "Question" },
    { id: 6, from: "Leon Fraser", email: "leon.fraser@example.com", src: "Landing page", subj: "Corporate wellness for 12 staff", body: "We are a small office near Enfield Town. We'd like a quote for a weekly group session for around 12 colleagues.", at: "Mon", unread: false, tag: "Enquiry" },
    { id: 7, from: "Grace Okoye", email: "grace.okoye@example.com", src: "App message", subj: "Receipt for my membership", body: "Could you resend my last receipt please? I need it for my employer.", at: "Sun", unread: false, tag: "Billing" },
  ];

  const payments = [];
  for (let i = 0; i < 16; i++) {
    const m = pick(members), p = plans.find((x) => x.id === m.plan);
    const st = i === 2 || i === 9 ? "Failed" : i === 6 ? "Refunded" : "Paid";
    payments.push({ id: "P" + (9000 + i), member: m.id, plan: p.id, amount: p.price, status: st, date: iso(addD(today, -Math.floor(i * 1.3))), method: pick(["Visa ••" + ri(1000, 9999), "Mastercard ••" + ri(1000, 9999), "Apple Pay"]) });
  }

  const revenue = [1322, 1386, 1431, 1490, 1516, 1578]; // last six months, sample (matches the plan table)
  const months = (() => { const out = []; for (let i = 5; i >= 0; i--) { const d = new Date(today.getFullYear(), today.getMonth() - i, 1); out.push(d.toLocaleDateString("en-GB", { month: "short" })); } return out; })();

  const activity = [
    { ic: "plus", cl: "ok", t: "New member joined", s: "Hannah M. on Gym + Classes", at: "12 min ago" },
    { ic: "clip", cl: "info", t: "Booking made in the app", s: "Boxing Fit · tomorrow 18:30", at: "34 min ago" },
    { ic: "x", cl: "warn", t: "Booking cancelled", s: "Sunrise HIIT · Thursday 07:00 (cancelled in Wix too)", at: "1 h ago" },
    { ic: "alert", cl: "bad", t: "Payment failed", s: "Monthly membership · card declined", at: "2 h ago" },
    { ic: "mail", cl: "acc", t: "New enquiry", s: "Landing page: January offer", at: "3 h ago" },
    { ic: "refresh", cl: "", t: "Wix sync finished", s: "25 website bookings checked, no changes", at: "5 min ago" },
  ];

  const health = [
    { name: "Supabase database", ok: true, note: "Responding · 15 MB used" },
    { name: "Wix connection", ok: true, note: "Bookings and plans readable" },
    { name: "Booking sync", ok: true, note: "Last run 3 min ago" },
    { name: "Timetable sync", ok: true, note: "Last run 34 min ago" },
    { name: "Email sending", ok: true, note: "0 failed this week" },
    { name: "Stripe payments", ok: false, note: "Not connected yet (planned)", soon: true },
  ];

  const emailTemplates = [
    { id: "e1", name: "Booking confirmation", when: "Right after a member books", on: true, sent: 312 },
    { id: "e2", name: "Class reminder", when: "2 hours before the class", on: true, sent: 1190 },
    { id: "e3", name: "Welcome email", when: "When a new member signs up", on: true, sent: 41 },
    { id: "e4", name: "Receipt", when: "After each payment", on: false, sent: 0, soon: true },
    { id: "e5", name: "Failed payment notice", when: "When a payment fails", on: false, sent: 0, soon: true },
    { id: "e6", name: "Lapsed member win-back", when: "30 days after a missed month", on: false, sent: 0, soon: true },
  ];

  const forms = [
    { id: "f1", name: "Contact form", where: "www · Contact page", subs: 63, rate: "11%", on: true },
    { id: "f2", name: "Personal training enquiry", where: "www · PT page", subs: 28, rate: "19%", on: true },
    { id: "f3", name: "January offer (landing page)", where: "www · /january", subs: 74, rate: "24%", on: true },
    { id: "f4", name: "Free trial class request", where: "Instagram link", subs: 0, rate: "—", on: false },
  ];

  const pages = [
    { id: "p1", name: "Home", url: "/", status: "Live", views: "2.1k" },
    { id: "p2", name: "Timetable", url: "/timetable", status: "Live", views: "1.4k" },
    { id: "p3", name: "Memberships", url: "/memberships", status: "Live", views: "960" },
    { id: "p4", name: "January offer", url: "/january", status: "Live", views: "820" },
    { id: "p5", name: "Kids Gym", url: "/kids-gym", status: "Draft", views: "—" },
  ];

  return { today, iso, addD, dow, DAY, plans, classes, members, bookings, perDay, messages, payments, revenue, months, activity, health, emailTemplates, forms, pages, totals: { contacts: 854, activeSubs: 55, allSubs: 227 } };
})();
