// ============================================================
//  Copy this file to  config.local.js  and put your REAL values here.
//  config.local.js is gitignored — it never gets pushed to GitHub.
//  It loads AFTER config.js and overrides the placeholder values.
// ============================================================

Object.assign(window.KISAN_CONFIG, {
  // RECOMMENDED — Vertex AI proxy (spends your GCP credits, no key in browser).
  // Deploy vertex-proxy/ (see vertex-proxy/DEPLOY.md), then paste its URL:
  VERTEX_PROXY_URL: "",   // e.g. "https://kisan-gemini-xxxxxxxx-uc.a.run.app"

  // OR — AI Studio key (only works if that key has prepaid quota):
  // GEMINI_API_KEY: "AQ.____ or AIza____",

  GOOGLE_MAPS_API_KEY: "",   // optional, browser key (AIza...)
});
