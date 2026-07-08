// ============================================================
//  KISAN ALERT — configuration (SAFE TO COMMIT — placeholders only)
//
//  DO NOT put real keys here. Real keys go in config.local.js
//  (which is gitignored and loaded after this file). See
//  config.local.example.js for the template.
// ============================================================

window.KISAN_CONFIG = {
  // OPTION 1 — Vertex AI proxy URL (recommended: uses your GCP credits).
  // Deploy vertex-proxy/ (see vertex-proxy/DEPLOY.md), paste its URL here or
  // in config.local.js. When set, the app uses Vertex and ignores the key below.
  VERTEX_PROXY_URL: "https://us-central1-kisan-alert-vk-2026.cloudfunctions.net/kisan-gemini",

  // OPTION 2 — Google AI Studio key (needs prepaid quota).
  // Get one at https://aistudio.google.com/app/apikey (starts with AIza or AQ.)
  GEMINI_API_KEY: "PASTE_YOUR_AI_STUDIO_KEY_HERE",

  // Gemini model. gemini-2.0-flash is fast + multimodal (image+audio+text).
  GEMINI_MODEL: "gemini-2.0-flash",

  // OPTIONAL — Google Maps JS API key (browser keys start with "AIza").
  // Leave blank to use the built-in offline map fallback (always works).
  GOOGLE_MAPS_API_KEY: "",

  // OPTIONAL — Firebase web config for Firestore. null = run in-memory.
  FIREBASE: null,
};
