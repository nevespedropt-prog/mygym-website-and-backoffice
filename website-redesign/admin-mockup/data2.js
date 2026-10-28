/* More sample data: analytics, marketing and day-to-day tools. Invented numbers and names. */
(() => {
  const D = window.DATA;
  const mon = D.months;
  D.growth = { months: mon, joined: [9, 11, 8, 14, 12, 16], lost: [4, 3, 5, 3, 4, 3], churn: "3.1%", tenure: "11.4 months", ltv: "£388", arpm: "£29" };
  D.cohorts = [{ l: "After 1 month", v: 94 }, { l: "After 3 months", v: 81 }, { l: "After 6 months", v: 68 }, { l: "After 12 months", v: 54 }];
  D.atRisk = D.members.filter((m) => m.status === "Active").slice(0, 7).map((m, i) => ({ id: m.id, days: 15 + i * 4, why: ["No visit in 2+ weeks", "Cancelled last 3 bookings", "Visits dropped by half", "No visit in 3+ weeks", "Failed last payment", "No visit in 2+ weeks", "Visits dropped by half"][i] }));
  D.sources = [{ n: "Instagram", v: 38, c: "#e03939" }, { n: "Google search", v: 31, c: "#2f6fd0" }, { n: "Direct", v: 19, c: "#1f8a70" }, { n: "Facebook", v: 7, c: "#c26b13" }, { n: "Other", v: 5, c: "#7a5bd6" }];
  D.visits = []; for (let i = 13; i >= 0; i--) D.visits.push({ d: D.addD(D.today, -i), n: 120 + ((i * 37) % 70) + (i < 5 ? 40 : 0) });
  D.funnel = [{ l: "Website visitors", v: 2140 }, { l: "Viewed memberships", v: 960 }, { l: "Sent an enquiry", v: 165 }, { l: "Booked a trial", v: 61 }, { l: "Became members", v: 28 }];
  D.topPages = [["/", "2,140", "Instagram, Google"], ["/timetable", "1,420", "Direct, Google"], ["/memberships", "960", "Instagram"], ["/january", "820", "Instagram"], ["/kids-gym", "310", "Google"]];

  D.campaigns = [
    { id: "c1", name: "January: new year, new you", to: "Everyone on the list", st: "Sent", sent: 854, open: "46%", click: "9.1%", when: "2 Jan" },
    { id: "c2", name: "Kids Gym: half-term sessions", to: "Kids Gym members", st: "Sent", sent: 38, open: "71%", click: "22%", when: "14 Feb" },
    { id: "c3", name: "We miss you: come back this week", to: "Lapsed members (30 days)", st: "Scheduled", sent: 62, open: "—", click: "—", when: "Mon 08:00" },
    { id: "c4", name: "Spring bootcamp announcement", to: "Gym + Classes", st: "Draft", sent: 0, open: "—", click: "—", when: "—" },
  ];
  D.leads = [
    { id: "l1", n: "Hannah Morris", src: "Landing page", note: "January offer", st: "new", age: "2 h" },
    { id: "l2", n: "Marcus Bell", src: "PT form", note: "Knee rehab", st: "new", age: "5 h" },
    { id: "l3", n: "Leon Fraser", src: "Landing page", note: "Corporate, 12 staff", st: "contacted", age: "1 d" },
    { id: "l4", n: "Dina Cole", src: "Instagram", note: "Asked about Kids Gym", st: "contacted", age: "2 d" },
    { id: "l5", n: "Ravi Menon", src: "Contact form", note: "Trial class Thu 18:30", st: "trial", age: "3 d" },
    { id: "l6", n: "Beth Lowry", src: "Google", note: "Trial class Sat 09:00", st: "trial", age: "4 d" },
    { id: "l7", n: "Cam Wright", src: "Instagram", note: "Joined Gym + Classes", st: "joined", age: "6 d" },
    { id: "l8", n: "Zoe Hart", src: "Landing page", note: "Joined Classes only", st: "joined", age: "1 w" },
    { id: "l9", n: "Ian Burke", src: "Contact form", note: "Too far to travel", st: "lost", age: "1 w" },
  ];
  D.leadCols = [["new", "New enquiry"], ["contacted", "Contacted"], ["trial", "Trial booked"], ["joined", "Joined"], ["lost", "Not now"]];
  D.offers = [
    { id: "o1", name: "January offer", code: "JAN26", what: "No joining fee + first month half price", uses: 31, rev: "£1,085", st: "Live", ends: "31 Jan" },
    { id: "o2", name: "Bring a friend", code: "FRIEND", what: "Both of you get a free week", uses: 14, rev: "£490", st: "Live", ends: "Ongoing" },
    { id: "o3", name: "Student rate", code: "STUDENT", what: "20% off Classes only", uses: 9, rev: "£225", st: "Live", ends: "Ongoing" },
    { id: "o4", name: "Black Friday", code: "BF26", what: "Annual plan, two extra months free", uses: 0, rev: "—", st: "Planned", ends: "27 Nov" },
  ];
  D.referral = { invites: 58, joined: 14, reward: "Free week each", conv: "24%" };
  D.reviews = { rating: "4.8", count: 126, asked: 74, left: 19, list: [
    { n: "Aisha K.", s: 5, t: "Friendly coaches and a proper community feel. Best gym I've joined.", d: "2 days ago" },
    { n: "Tom R.", s: 5, t: "The 7am class is brilliant. Booking in the app is so easy.", d: "1 week ago" },
    { n: "Priya S.", s: 4, t: "Great value. Would love a few more evening classes.", d: "2 weeks ago" } ] };
  D.links = [{ n: "Instagram bio link", c: 612, j: 18 }, { n: "January ad", c: 440, j: 11 }, { n: "Facebook post", c: 120, j: 2 }, { n: "Google profile", c: 305, j: 9 }];

  D.attend = { rate: "88%", noShow: "7%", walkins: 12 };
  D.waitlist = [
    { cid: 11, when: "Wed 18:00", name: "Boxing Fit", cap: 14, people: ["Sara Idris", "Mo Hassan", "Jade Price"] },
    { cid: 3, when: "Mon 18:00", name: "Circuit Training", cap: 14, people: ["Liam Doyle"] },
    { cid: 5, when: "Tue 07:00", name: "Sunrise HIIT", cap: 12, people: ["Nina Ford", "Chris Obi"] },
  ];
  D.coaches = [{ n: "Coach Dan", c: "g", hrs: [9, 7, 9, 7, 8, 8, 0], mon: 52, cls: "Morning Blast, Sunrise HIIT, Boxing Fit" }, { n: "Coach Mel", c: "b", hrs: [3, 3, 3, 3, 3, 0, 0], mon: 15, cls: "Over 50s, Cardio n Abs, Strength Basics" }, { n: "Coach Ali", c: "o", hrs: [2, 2, 2, 2, 0, 3, 0], mon: 18, cls: "Kids Class, Small Group PT, 1-2-1 PT" }];
  D.tasks = [
    { id: "t1", t: "Reply to Marcus Bell about knee rehab", due: "Today", who: "Pedro", done: false, tag: "Lead" },
    { id: "t2", t: "Order new kettlebells (16 kg)", due: "Tomorrow", who: "Coach Dan", done: false, tag: "Equipment" },
    { id: "t3", t: "Renew first-aid certificates (Dan, Mel)", due: "Fri", who: "Pedro", done: false, tag: "Compliance" },
    { id: "t4", t: "Post the Spring bootcamp on Instagram", due: "Next week", who: "Pedro", done: false, tag: "Marketing" },
    { id: "t5", t: "Review failed payments", due: "Mon", who: "Pedro", done: true, tag: "Billing" },
  ];
})();
