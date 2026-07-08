# 🌱 Kisan Alert — AI crop advisory for every farmer

**Build with AI: Code for Communities** · Challenge 4 (Smart Water, Crop & Advisory) · Solo build

> Point your phone at a sick crop and speak in your language. Kisan Alert hears you, looks at the leaf, checks satellite + weather context for your area, and **speaks back a fix in seconds** — no typing, no reading. Every question also drops an anonymized pin on the local **MP's disease-hotspot dashboard**, turning one farmer's problem into early-warning intelligence for the whole constituency.

- **🔗 Live demo:** https://reply2vikas.github.io/kisan-alert/
- **🎥 Demo video (90s):** https://youtu.be/3-IpT-83qEI
- **💻 Repo:** https://github.com/reply2vikas/kisan-alert

---

## The 60-second wow
1. Farmer picks a language (Hindi/Marathi/Tamil/…) and taps 📷 to snap a diseased leaf.
2. Taps 🎤 and speaks the problem in their own language.
3. Photo **and** voice go together in one multimodal call to **Gemini 2.5 on Vertex AI**, grounded with satellite NDVI + soil-moisture + weather context for that pincode.
4. The app shows a **"Do this now"** action plus three cards — 🌿 low-cost fix, 🧪 chemical (only if needed), 🛡️ prevention — **and speaks the answer aloud** in the same language.
5. Tap "Send to MP dashboard" → a live red pin lands in a cluster of similar reports, triggering an **outbreak alert** the MP can act on.

## Why it scores
- **AI / technical (25%)** — genuine multimodal Gemini: image + voice + structured JSON reasoning grounded in field data, served via Vertex AI.
- **Inclusivity / accessibility (15%)** — voice-in / voice-out, 9 Indic languages, zero-typing UI, large icon cards for low literacy, works offline after first load.
- **Impact & MP fitment** — the dashboard makes a sitting MP the hero: real-time constituency crop-health, deploy relief before a crisis spreads.
- **Deployment / scalability** — static front end + serverless Gemini calls; scales to lakhs of farmers for pennies.

## Google tech used
Google Gemini 2.5 · **Vertex AI** (serves the model) · **Cloud Functions** (serverless proxy — no API key in the browser) · Firebase Hosting · Cloud Firestore · Google Maps JS API (offline fallback included) · Google AI Studio. Roadmap: Cloud Speech-to-Text / Text-to-Speech, Google Earth Engine (live NDVI/soil), BigQuery weather, Dialogflow IVR for feature phones.

## How the AI is wired (two paths)
`app.js → callGemini()` supports either backend:
- **Vertex AI (recommended, used in the live demo):** set `VERTEX_PROXY_URL` to the deployed Cloud Function (see `vertex-proxy/DEPLOY.md`). The browser posts to the function; the function authenticates with its own service account and calls Vertex — **no key ships to the client**.
- **AI Studio key (fallback):** set `GEMINI_API_KEY` (needs prepaid quota). Sent via the `x-goog-api-key` header, with retry/backoff on 429.

If neither is set (or a call fails), the app gracefully shows a seeded golden advisory.

## Run it locally (2 minutes)
```bash
# 1. Copy the config template and add your endpoint/key (kept out of git):
cp config.local.example.js config.local.js
#    put your VERTEX_PROXY_URL (recommended) or GEMINI_API_KEY in it
# 2. Serve the folder (any static server works):
python3 -m http.server 8000
#    then open http://localhost:8000
```
> No backend handy? Click **"Load sample (demo backup)"** or open **`?demo=1`** — the full flow runs with a seeded advisory and zero dependencies.

### 🛟 Stage-proof demo mode
Open the app with **`?demo=1`** and it auto-replays a cached golden run — diagnosis, cards and spoken audio — with **no network, no API, no mic**. The demo physically cannot fail.

### How voice works
The farmer's voice is recorded with the browser's `MediaRecorder` and sent **straight into Gemini** alongside the photo in a **single call** — it hears the audio *and* sees the leaf at once. Where the browser records an audio format Gemini can't ingest (Chrome's webm), the app falls back to a text transcript so the call still succeeds. Advisory audio is spoken back via the browser (roadmap: Cloud Text-to-Speech).

## Deploy
- **Frontend (used here): GitHub Pages** — repo → Settings → Pages → branch `main` / root. Live at the URL above.
- **Backend: Cloud Function on Vertex AI** — see `vertex-proxy/DEPLOY.md`.
- Firebase Hosting also works (`firebase deploy --only hosting`) if you prefer.

## What's real vs. seeded (honest with judges)
| Live in the demo | Seeded / roadmap |
| --- | --- |
| Photo + voice → Gemini 2.5 (Vertex AI) → structured advisory | Google Earth Engine NDVI / soil moisture (pre-fetched JSON) |
| Spoken advisory in the farmer's language | Live BigQuery/IMD weather (pre-fetched) |
| MP dashboard, outbreak detection, live pin drop | Toll-free IVR for feature phones (Dialogflow) |
| Firestore persistence (when configured) | Government scheme database (sample entries) |

## Repo structure
```
kisan-alert/
├── index.html                # UI shell (farmer view + MP dashboard)
├── style.css                 # accessible, large-touch UI
├── app.js                    # Gemini pipeline, voice, TTS, dashboard, map
├── config.js                 # placeholders (safe to commit)
├── config.local.example.js   # copy -> config.local.js for real keys (gitignored)
├── data/
│   ├── sample_pincodes.json  # seeded satellite + weather context
│   └── sample_reports.json   # pre-seeded reports so the map looks alive
├── vertex-proxy/             # Cloud Function: browser -> Vertex AI (index.js, DEPLOY.md)
├── pitch-deck.html           # 12-slide deck (print to PDF)
├── firebase.json             # optional Firebase Hosting config
├── ARCHITECTURE.md           # architecture + data flow
└── README.md
```

## Safety / anti-hallucination
Gemini runs at low temperature (0.3) and is told to stay practical and short, to flag low confidence on unclear photos, and to **never invent pesticide dosages**. Every advisory points the farmer to the **nearest Krishi Vigyan Kendra**; severity and confidence are shown explicitly. Production would ground responses in official ICAR/state advisories via retrieval.

_Seeding data sources: data.gov.in (Agmarknet, Soil Health Card), NASA POWER, Google Earth Engine public catalogs (Sentinel-2 NDVI, GLDAS soil moisture)._

## License
MIT — see LICENSE.
