// ============================================================
//  KISAN ALERT — configuration (SAFE TO COMMIT — placeholders only)
//
//  DO NOT put real keys here. Real keys go in config.local.js
//  (which is gitignored and loaded after this file). See
//  config.local.example.js for the template.
// ============================================================

window.KISAN_CONFIG = {
  // Vertex AI proxy URL (not a secret — just an endpoint). Powers live AI.
  VERTEX_PROXY_URL: "https://us-central1-kisan-alert-vk-2026.cloudfunctions.net/kisan-gemini",

  // AI Studio key — leave as placeholder here; real key goes in config.local.js only.
  GEMINI_API_KEY: "PASTE_YOUR_AI_STUDIO_KEY_HERE",
  GEMINI_MODEL: "gemini-2.0-flash",

  // Google Maps JS API key — real key goes in config.local.js only (never commit).
  GOOGLE_MAPS_API_KEY: "",

  // OPTIONAL — Firebase web config for Firestore. null = run in-memory.
  FIREBASE: null,
};
