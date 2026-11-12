/* MY GYM London back office: public settings only (the publishable key is meant to be public; row security protects the data). */
window.MYGYM_CONFIG = {
  SUPABASE_URL: "https://ldmksxyilykyfnqnuytv.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_gboSvVSFxQT0xDSEzbeYxw_E1OO3TRp",
  /* true: revenue, failed payments and members-by-plan show clearly marked SAMPLE numbers (payments are still in Wix).
     Set to false when payments are connected or whenever you want only real figures. */
  SAMPLE_FIGURES: false,
  /* where your own forms and landing pages open. After the website move, change this to https://www.mygymlondon.co.uk/go.html */
  GO_BASE: "https://nevespedropt-prog.github.io/mygym-website-and-backoffice/go.html"
};
