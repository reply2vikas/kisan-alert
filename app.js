/* ============================================================
   KISAN ALERT — app logic
   Farmer flow:  photo + VOICE AUDIO (sent straight into Gemini)
                 + language  ->  Gemini (multimodal, one call)
                 ->  structured advisory  ->  spoken + icon cards
   MP flow:      every advisory drops an anonymized pin on the map
   ?demo=1  ->  golden replay mode; the demo cannot fail on stage.
   Runs fully client-side. No build step. Deploy to Firebase Hosting.
   ============================================================ */

const CFG = window.KISAN_CONFIG || {};
const DEMO_MODE = new URLSearchParams(location.search).get("demo") === "1";

const state = {
  photoBase64: null,
  photoMime: null,
  audioBase64: null,     // voice recording sent INTO Gemini
  audioMime: null,
  voiceText: "",         // transcript backup (used if audio format unsupported)
  pincodes: {},
  reports: [],
  lastAdvisory: null,
};

// Gemini accepts these audio containers. MediaRecorder gives 'ogg' on Firefox
// (supported) and 'webm' on Chrome (NOT supported) — so we only attach audio
// when the recorded mime is in this set, otherwise we fall back to transcript.
const GEMINI_AUDIO_OK = ["audio/ogg", "audio/wav", "audio/mp3", "audio/mpeg", "audio/aac", "audio/flac", "audio/aiff"];

/* ---------- tiny helpers ---------- */
const $ = (id) => document.getElementById(id);
const setStatus = (m) => { $("status").textContent = m || ""; };

/* ---------- load seeded data ---------- */
async function loadData() {
  try {
    const [pc, rp] = await Promise.all([
      fetch("data/sample_pincodes.json").then(r => r.json()),
      fetch("data/sample_reports.json").then(r => r.json()),
    ]);
    state.pincodes = pc.pincodes || {};
    state.reports = (rp.reports || []).slice();
  } catch (e) {
    console.warn("Seed load failed (running from file://?). Using inline fallback.", e);
    state.pincodes = { "413512": { district: "Latur, Maharashtra", lat:18.408, lng:76.564, ndvi:0.31, soil_moisture_pct:11, rainfall_7d_mm:0, temp_c:37, humidity_pct:44, primary_crop:"Soybean", nearest_krishi_kendra:"KVK Latur", local_scheme:"Jalyukt Shivar (water conservation)" } };
    state.reports = [];
  }
  const sel = $("pincode");
  sel.innerHTML = "";
  Object.entries(state.pincodes).forEach(([pin, d]) => {
    const o = document.createElement("option");
    o.value = pin; o.textContent = `${pin} — ${d.district}`;
    sel.appendChild(o);
  });
  renderDashboard();
  if (DEMO_MODE) runGoldenDemo();
}

/* ---------- tab switching ---------- */
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const v = btn.dataset.view;
    document.querySelectorAll(".view").forEach(x => x.classList.remove("active"));
    $("view-" + v).classList.add("active");
    if (v === "mp") renderDashboard();
  });
});

/* ---------- photo capture ---------- */
$("photo").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state.photoBase64 = reader.result.split(",")[1];
    state.photoMime = file.type || "image/jpeg";
    $("photoImg").src = reader.result;
    $("photoPreview").classList.remove("hidden");
  };
  reader.readAsDataURL(file);
});

/* ---------- voice input: record audio AND (best-effort) transcribe ---------- */
let mediaRecorder = null, chunks = [], recording = false, recog = null;

function pickAudioMime() {
  const prefs = ["audio/ogg;codecs=opus", "audio/ogg", "audio/webm;codecs=opus", "audio/webm"];
  for (const m of prefs) if (window.MediaRecorder && MediaRecorder.isTypeSupported(m)) return m;
  return "";
}
function initSpeech(loc) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const r = new SR();
  r.continuous = false; r.interimResults = false; r.lang = loc;
  r.onresult = (ev) => { state.voiceText = ev.results[0][0].transcript; $("query").value = state.voiceText; };
  r.onerror = () => {};
  return r;
}
async function startRecording(loc) {
  // audio for Gemini
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = pickAudioMime();
    mediaRecorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    chunks = [];
    mediaRecorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
      const baseMime = (mediaRecorder.mimeType || "").split(";")[0];
      const reader = new FileReader();
      reader.onload = () => { state.audioBase64 = reader.result.split(",")[1]; state.audioMime = baseMime; };
      reader.readAsDataURL(blob);
      stream.getTracks().forEach(t => t.stop());
    };
    mediaRecorder.start();
  } catch (e) {
    setStatus("Mic blocked — you can type your question instead.");
  }
  // transcript backup (Chrome)
  recog = initSpeech(loc);
  if (recog) try { recog.start(); } catch (_) {}
}
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
  if (recog) try { recog.stop(); } catch (_) {}
}
$("micBtn").addEventListener("click", async () => {
  const loc = $("lang").selectedOptions[0].dataset.loc || "hi-IN";
  if (!recording) {
    recording = true; state.audioBase64 = null; state.voiceText = "";
    $("micBtn").classList.add("recording"); setStatus("🎤 Listening… tap again to stop.");
    await startRecording(loc);
  } else {
    recording = false; $("micBtn").classList.remove("recording"); setStatus("Got it.");
    stopRecording();
  }
});

/* ---------- the Gemini call ---------- */
function buildContext(pin) {
  const c = state.pincodes[pin] || {};
  return {
    pincode: pin, district: c.district, season: "Kharif (monsoon)",
    ndvi: c.ndvi, soil_moisture_pct: c.soil_moisture_pct,
    rainfall_7d_mm: c.rainfall_7d_mm, temp_c: c.temp_c, humidity_pct: c.humidity_pct,
    main_crop: c.primary_crop, nearest_kvk: c.nearest_krishi_kendra, local_scheme: c.local_scheme,
  };
}
const SYSTEM_INSTRUCTION = `You are Kisan Alert, an agricultural extension officer for Indian smallholder farmers. Input: a crop photo, a farmer's voice question (any Indic language or English), and DISTRICT_CONTEXT JSON (location, season, weather, soil).
Reply ONLY with valid JSON, no markdown:
{"detected_language":"","crop":"","diagnosis":"","confidence":"high|medium|low","severity":"low|medium|high","immediate_action":"","low_cost_remedy":"","chemical_remedy_if_needed":"","prevention":"","map_label_en":"","speak_text":""}
Rules: every field except map_label_en in the farmer's own language. map_label_en is a short English label for a map (e.g. "Soybean — Yellow Mosaic Virus"). speak_text = warm, spoken-style, <80 words, actionable, no jargon; assumes a low-literacy listener. If the image is unclear or not a crop, say so honestly in speak_text and set confidence "low". Prefer remedies costing <₹200 and locally available. Never invent pesticide dosages; give label-rate guidance and point to the nearest KVK.`;

async function callGemini(lang, pin) {
  const ctx = buildContext(pin);
  const userQ = ($("query").value || state.voiceText || "").trim();
  const parts = [{
    text: `DISTRICT_CONTEXT: ${JSON.stringify(ctx)}\nFarmer's preferred language: ${lang}.\n` +
          (userQ ? `Farmer said (transcript): "${userQ}"\n` : "") +
          (state.audioBase64 ? "The farmer's voice question is attached as audio — listen to it.\n" : "") +
          (state.photoBase64 ? "A photo of the crop is attached — inspect it.\n" : "No photo provided; advise from the question + context.\n")
  }];
  if (state.photoBase64) parts.push({ inline_data: { mime_type: state.photoMime, data: state.photoBase64 } });
  if (state.audioBase64 && GEMINI_AUDIO_OK.includes(state.audioMime)) {
    parts.push({ inline_data: { mime_type: state.audioMime, data: state.audioBase64 } });
  }
  const body = JSON.stringify({
    system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [{ parts }],
    generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
  });

  // Path A — Vertex AI proxy (spends your GCP credits; no API key in the browser).
  if (CFG.VERTEX_PROXY_URL) {
    const res = await fetch(CFG.VERTEX_PROXY_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body });
    if (!res.ok) throw new Error("Vertex proxy " + res.status + ": " + (await res.text()).slice(0, 160));
    const data = await res.json();
    const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    return JSON.parse(txt);
  }

  // Path B — Google AI Studio (needs a Gemini API key WITH prepaid quota).
  const key = (CFG.GEMINI_API_KEY || "").trim();
  const looksFake = !key || key.includes("PASTE_YOUR") || key.includes("your-ai-studio-key") || !(key.startsWith("AIza") || key.startsWith("AQ.")) || key.length < 20;
  if (looksFake) throw new Error("No valid Gemini key or Vertex proxy set. Showing sample for now.");
  const model = CFG.GEMINI_MODEL || "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  let res;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, body });
    if (res.status !== 429 && res.status !== 503) break;
    if (attempt < 2) { setStatus("Rate limited — retrying in a moment…"); await new Promise(r => setTimeout(r, 1500 * (2 ** attempt) + Math.random() * 400)); }
  }
  if (!res.ok) {
    if (res.status === 429) throw new Error("Gemini quota/rate limit (429). Prepaid cap hit — use the Vertex proxy or demo mode. Showing sample.");
    throw new Error("Gemini API " + res.status + ": " + (await res.text()).slice(0, 160));
  }
  const data = await res.json();
  const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return JSON.parse(txt);
}

/* ---------- golden sample (offline demo backup + ?demo=1) ---------- */
function goldenAdvisory(lang) {
  if (lang === "English") return {
    detected_language: "English", crop: "Soybean", diagnosis: "Yellow Mosaic Virus", confidence: "high", severity: "high",
    immediate_action: "Remove and burn the worst infected plants today so it stops spreading.",
    low_cost_remedy: "Set yellow sticky traps to catch the whiteflies that carry the virus; spray neem oil in the evening.",
    chemical_remedy_if_needed: "If whiteflies are heavy, use a recommended insecticide at the label rate — confirm at your KVK.",
    prevention: "Next season sow resistant varieties and treat seed before sowing.",
    map_label_en: "Soybean — Yellow Mosaic Virus",
    speak_text: "Your soybean has yellow mosaic virus, and it is serious. Today, pull out and burn the worst plants. Put up yellow sticky traps and spray neem to stop the whiteflies. For heavy attack, ask KVK Latur about the right spray. Act within two days.",
  };
  return {
    detected_language: "Hindi", crop: "सोयाबीन", diagnosis: "पीला मोज़ेक वायरस", confidence: "high", severity: "high",
    immediate_action: "आज ही सबसे ज़्यादा संक्रमित पौधे निकालकर जला दें ताकि रोग न फैले।",
    low_cost_remedy: "पीले चिपचिपे ट्रैप लगाएँ जो सफेद मक्खी को पकड़ें; शाम को नीम का तेल छिड़कें।",
    chemical_remedy_if_needed: "सफेद मक्खी ज़्यादा हो तो सुझाई गई दवा लेबल-मात्रा में डालें — KVK से पुष्टि करें।",
    prevention: "अगली फसल में रोग-प्रतिरोधी किस्म बोएँ और बीज उपचार करें।",
    map_label_en: "Soybean — Yellow Mosaic Virus",
    speak_text: "आपकी सोयाबीन में पीला मोज़ेक वायरस है, जो गंभीर है। आज ही सबसे खराब पौधे निकालकर जला दें। पीले ट्रैप लगाएँ और नीम छिड़कें ताकि सफेद मक्खी रुके। ज़्यादा असर हो तो KVK लातूर से सही दवा पूछें। दो दिन में कदम उठाएँ।",
  };
}

/* ---------- render advisory ---------- */
function showAdvisory(a, pin) {
  state.lastAdvisory = { ...a, pin };
  const ctx = state.pincodes[pin] || {};
  const crop = a.crop ? a.crop + " · " : "";
  $("diagnosisTitle").textContent = crop + (a.diagnosis || "—");
  const conf = (a.confidence || "medium").toLowerCase();
  $("confidenceBadge").textContent = "confidence: " + conf;
  const sev = (a.severity || "medium").toLowerCase();
  const badge = $("severityBadge"); badge.textContent = sev; badge.className = "badge " + sev;
  $("immediateAction").textContent = a.immediate_action || "—";
  $("lowCost").textContent = a.low_cost_remedy || "—";
  $("chemical").textContent = a.chemical_remedy_if_needed || "—";
  $("prevention").textContent = a.prevention || "—";
  $("contextStrip").textContent = `🛰️ ${ctx.district || ""} · NDVI ${ctx.ndvi ?? "-"} · soil moisture ${ctx.soil_moisture_pct ?? "-"}% · rain 7d ${ctx.rainfall_7d_mm ?? "-"}mm`;
  $("schemeBox").textContent = ctx.local_scheme ? `🏛️ Local help: ${ctx.nearest_krishi_kendra || "KVK"} · scheme: ${ctx.local_scheme}` : "";
  $("fullText").textContent = a.speak_text || "";
  $("result").classList.remove("hidden");
  $("result").scrollIntoView({ behavior: "smooth" });
}

/* ---------- diagnose ---------- */
$("diagnoseBtn").addEventListener("click", async () => {
  const lang = $("lang").value, pin = $("pincode").value;
  if (DEMO_MODE) {  // demo mode never calls the API — cannot 429 on stage
    const g = goldenAdvisory(lang); showAdvisory(g, pin);
    setStatus("Demo mode — cached result (no API)."); autoSpeak(g, lang); return;
  }
  setStatus("Analyzing photo + voice with Gemini…");
  $("diagnoseBtn").disabled = true;
  try {
    const a = await callGemini(lang, pin);
    showAdvisory(a, pin); setStatus("Done. Tap 🔊 to hear it.");
    autoSpeak(a, lang);
  } catch (e) {
    console.error(e);
    setStatus("⚠️ " + e.message + "  (showing sample instead)");
    const g = goldenAdvisory(lang); showAdvisory(g, pin); autoSpeak(g, lang);
  } finally { $("diagnoseBtn").disabled = false; }
});

/* ---------- sample button ---------- */
$("sampleBtn").addEventListener("click", () => {
  const lang = $("lang").value, pin = $("pincode").value || Object.keys(state.pincodes)[0];
  const g = goldenAdvisory(lang); showAdvisory(g, pin);
  setStatus("Loaded golden sample (no API needed)."); autoSpeak(g, lang);
});

/* ---------- ?demo=1 : auto-run the whole stage moment ---------- */
function runGoldenDemo() {
  const lang = "Hindi";
  const pin = Object.keys(state.pincodes).find(p => (state.pincodes[p].district||"").includes("Latur")) || Object.keys(state.pincodes)[0];
  $("lang").value = lang; $("pincode").value = pin;
  setStatus("DEMO MODE — replaying a cached golden run (cannot fail).");
  const g = goldenAdvisory(lang); showAdvisory(g, pin); autoSpeak(g, lang);
}

/* ---------- text-to-speech ---------- */
function locFor(lang){ return ({Hindi:"hi-IN",English:"en-IN",Marathi:"mr-IN",Tamil:"ta-IN",Telugu:"te-IN",Bengali:"bn-IN",Punjabi:"pa-IN",Kannada:"kn-IN",Gujarati:"gu-IN"})[lang]||"hi-IN"; }
function speak(text, lang) {
  if (!("speechSynthesis" in window) || !text) return;
  const loc = locFor(lang);
  const u = new SpeechSynthesisUtterance(text); u.lang = loc; u.rate = 0.95;
  const v = speechSynthesis.getVoices().find(x => x.lang === loc); if (v) u.voice = v;
  speechSynthesis.cancel(); speechSynthesis.speak(u);
}
function autoSpeak(a, lang) { speak(a.speak_text, lang); }
$("speakBtn").addEventListener("click", () => { if (state.lastAdvisory) speak(state.lastAdvisory.speak_text, $("lang").value); });

/* ---------- send report to MP dashboard ---------- */
$("reportBtn").addEventListener("click", () => {
  const a = state.lastAdvisory; if (!a) return;
  const ctx = state.pincodes[a.pin] || {};
  const jitter = () => (Math.random() - 0.5) * 0.03;
  const rep = {
    id: "live-" + Date.now(),
    crop: ctx.primary_crop || a.crop || "Crop",
    issue: a.map_label_en || a.diagnosis || "Issue",
    severity: (a.severity || "medium").toLowerCase(),
    lat: (ctx.lat || 18.408) + jitter(), lng: (ctx.lng || 76.564) + jitter(),
    village: ctx.district || "—", ts: new Date().toISOString(), live: true,
  };
  state.reports.push(rep); saveToFirestore(rep);
  setStatus("📍 Report sent to your MP's dashboard.");
  document.querySelector('.tab[data-view="mp"]').click();
});

/* ---------- MP dashboard ---------- */
function renderDashboard() {
  const reports = state.reports;
  const total = reports.length;
  const high = reports.filter(r => r.severity === "high").length;
  const counts = {};
  reports.forEach(r => counts[r.issue] = (counts[r.issue] || 0) + 1);
  const top = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
  $("stats").innerHTML = `
    <div class="stat"><b>${total}</b><span>Total reports</span></div>
    <div class="stat"><b>${high}</b><span>High severity</span></div>
    <div class="stat"><b>${top ? top[1] : 0}</b><span>${top ? top[0] : "—"}</span></div>
    <div class="stat"><b>${Object.keys(counts).length}</b><span>Distinct issues</span></div>`;
  const banner = $("alertBanner");
  if (top && top[1] >= 4) {
    banner.classList.remove("hidden");
    banner.innerHTML = `⚠️ <b>Outbreak alert:</b> ${top[1]} reports of <b>${top[0]}</b> in this constituency in the last hours. Consider deploying a KVK team / relief funds to the affected block.`;
  } else banner.classList.add("hidden");
  drawMap(reports);
  const list = $("reportList"); list.innerHTML = "";
  reports.slice().reverse().slice(0, 12).forEach(r => {
    const el = document.createElement("div"); el.className = "report-item";
    el.innerHTML = `<div><div class="r-issue">${r.issue} ${r.live ? "🔴 live" : ""}</div>
      <div class="r-meta">${r.crop} · ${r.village}</div></div>
      <span class="badge ${r.severity}">${r.severity}</span>`;
    list.appendChild(el);
  });
}

/* ---------- map: Google Maps if key present, else offline SVG scatter ---------- */
function drawMap(reports) {
  const el = $("map");
  if (!reports || reports.length === 0) {
    el.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#5c6b5e;font-size:14px;text-align:center;padding:20px">No reports yet. Submit an advisory from the Farmer tab to drop the first pin.<br/><small>(Tip: serve the folder over http, not file://, so seeded reports load.)</small></div>`;
    return;
  }
  if (CFG.GOOGLE_MAPS_API_KEY && window.google && window.google.maps) return drawGoogleMap(reports);
  const pad = 24;
  const lats = reports.map(r => r.lat), lngs = reports.map(r => r.lng);
  const minLat = Math.min(...lats) - 0.02, maxLat = Math.max(...lats) + 0.02;
  const minLng = Math.min(...lngs) - 0.02, maxLng = Math.max(...lngs) + 0.02;
  const W = el.clientWidth || 640, H = 340;
  const x = (lng) => pad + (lng - minLng) / (maxLng - minLng || 1) * (W - 2*pad);
  const y = (lat) => H - pad - (lat - minLat) / (maxLat - minLat || 1) * (H - 2*pad);
  const color = { high: "#d32f2f", medium: "#f9a825", low: "#2e7d32" };
  const dots = reports.map(r =>
    `<circle cx="${x(r.lng).toFixed(1)}" cy="${y(r.lat).toFixed(1)}" r="${r.live ? 11 : 7}"
       fill="${color[r.severity] || '#777'}" fill-opacity="0.75" stroke="#fff" stroke-width="1.5">
       ${r.live ? '<animate attributeName="r" values="11;16;11" dur="1.3s" repeatCount="indefinite"/>' : ''}
     </circle>`).join("");
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" style="background:#eef3ea">
    <rect x="0" y="0" width="${W}" height="${H}" fill="#e8f0e4"/>
    <text x="12" y="24" font-size="12" fill="#5c6b5e">Constituency hotspot map · live farmer reports (severity-coded)</text>
    ${dots}
  </svg>`;
}
function drawGoogleMap(reports) {
  const el = $("map");
  const center = { lat: reports[0]?.lat || 18.408, lng: reports[0]?.lng || 76.564 };
  const map = new google.maps.Map(el, { center, zoom: 11, mapTypeId: "terrain" });
  const color = { high: "#d32f2f", medium: "#f9a825", low: "#2e7d32" };
  reports.forEach(r => new google.maps.Marker({
    position: { lat: r.lat, lng: r.lng }, map, title: `${r.issue} (${r.severity})`,
    icon: { path: google.maps.SymbolPath.CIRCLE, scale: r.live ? 9 : 6, fillColor: color[r.severity], fillOpacity: .8, strokeColor: "#fff", strokeWeight: 1.5 },
  }));
}

/* ---------- optional Firestore persistence ---------- */
let db = null;
async function initFirebase() {
  if (!CFG.FIREBASE) return;
  try {
    const app = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const fs = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const a = app.initializeApp(CFG.FIREBASE);
    db = { fs, ref: fs.getFirestore(a) };
    console.log("Firestore ready.");
  } catch (e) { console.warn("Firebase init skipped:", e); }
}
async function saveToFirestore(rep) {
  if (!db) return;
  try { await db.fs.addDoc(db.fs.collection(db.ref, "reports"), rep); }
  catch (e) { console.warn("Firestore write skipped:", e); }
}

/* ---------- boot ---------- */
window.__kisanRenderDashboard = renderDashboard; // let the Maps loader trigger a redraw
loadData();
initFirebase();
if ("speechSynthesis" in window) speechSynthesis.getVoices();
