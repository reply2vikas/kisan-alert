# 🌱 Kisan Alert — AI crop advisory for every farmer

**Build with AI: Code for Communities** · Challenge 4 (Smart Water, Crop & Advisory) · Solo build

> Point your phone at a sick crop and speak in your language. Kisan Alert hears you, looks at the leaf, checks satellite + weather for your area, and **speaks back a fix in seconds** — no typing, no reading. Every question also drops an anonymized pin on the local **MP's disease-hotspot dashboard**, turning one farmer's problem into early-warning intelligence for the whole constituency.

**🔗 Live demo:** _paste your Firebase Hosting URL here after deploy_
**🎥 Backup demo video:** _paste link (record a 60–90s screen capture)_

---

## The 60-second wow
1. Farmer picks language (Hindi/Marathi/Tamil/…) and taps 📷 to snap a diseased leaf.
2. Taps 🎤 and says *"Meri fasal kyun kharab ho rahi hai?"*
3. Gemini reads the photo **and** the voice, cross-checks seeded satellite NDVI + soil moisture + weather for that pincode, and returns a structured advisory.
4. The app shows three big icon cards — 💧 Water, 🐛 Pest, 🌾 Fertilizer — **and speaks the answer aloud** in the same language.
5. Tap "Send to MP dashboard" → a live red pin lands in a cluster of similar reports, triggering an **outbreak alert** the MP can act on.

## Why it scores
- **AI / technical (25%)** — genuine multimodal Gemini: image + voice + structured JSON reasoning grounded in field data.
- **Inclusivity / accessibility (15%)** — voice-in / voice-out, 9 Indic languages, zero-typing UI, large icon cards for low literacy, works offline after first load.
- **Impact & MP fitment** — the dashboard makes a sitting MP the hero: real-time constituency crop-health, deploy relief before a crisis spreads.
- **Deployment / scalability** — static front end on Firebase Hosting + serverless Gemini calls; scales to lakhs of farmers for pennies.

## Google tech used
Gemini (via Google AI Studio) · Firebase Hosting · Firestore (optional persistence) · Google Maps JS API (optional; offline fallback included). Roadmap: Cloud Speech-to-Text / Text-to-Speech, Google Earth Engine (live NDVI/soil), BigQuery weather, Dialogflow IVR for feature phones.

## Run it locally (2 minutes)
```bash
# 1. Get a free Gemini key: https://aistudio.google.com/app/apikey
# 2. Open config.js and paste it into GEMINI_API_KEY
# 3. Serve the folder (any static server works):
python3 -m http.server 8000
#    then open http://localhost:8000
```
> No key handy? Click **"Load sample (demo backup)"** — the full flow runs with a seeded advisory and zero dependencies. Always have this ready in case live Wi-Fi fails on stage.

### 🛟 Stage-proof demo mode
Open the app with **`?demo=1`** (e.g. `localhost:8000/?demo=1`) and it auto-replays a cached golden run — diagnosis, icon cards and spoken audio — with **no network, no API, no mic**. Keep this URL as your fallback: the demo physically cannot fail. Also record a 90-second screen capture the first time you get a clean live run.

### How voice works
The farmer's voice is recorded with the browser's `MediaRecorder` and sent **straight into Gemini** alongside the photo in a **single `generateContent` call** — Gemini hears the Hindi audio *and* sees the leaf at once (one API, one failure point). Where the browser records an audio format Gemini doesn't accept (Chrome's webm), the app automatically falls back to a text transcript so the call still succeeds. Advisory audio is spoken back via the browser (roadmap: Cloud Text-to-Speech hi-IN WaveNet).

## Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase use --add          # pick/create your project
firebase deploy --only hosting
```

## What's real vs. seeded (be honest with judges)
| Live in the demo | Seeded / mocked (roadmap to make live) |
| --- | --- |
| Photo + voice → Gemini multimodal → structured advisory | Google Earth Engine NDVI / soil moisture (pre-fetched JSON) |
| Text-to-speech playback in Indic language | Live BigQuery/IMD weather (pre-fetched) |
| MP dashboard, outbreak detection, live pin drop | Toll-free IVR for feature phones (Dialogflow) |
| Firestore persistence (when configured) | Government scheme database (3 sample schemes) |

## Repo structure
```
kisan-alert/
├── index.html            # UI shell (farmer view + MP dashboard)
├── style.css             # styling, large-touch accessible UI
├── app.js                # Gemini pipeline, voice, TTS, dashboard, map
├── config.js             # your API keys (Gemini / Maps / Firebase)
├── data/
│   ├── sample_pincodes.json   # seeded satellite + weather context
│   └── sample_reports.json    # pre-seeded reports so the map looks alive
├── firebase.json         # Firebase Hosting config
├── ARCHITECTURE.md       # architecture diagram + data flow
└── README.md
```

## Safety / anti-hallucination
Gemini runs at low temperature (0.3) and is instructed to stay practical and short. Every advisory points the farmer to the **nearest Krishi Vigyan Kendra** for confirmation, and severity is surfaced explicitly. Production would ground responses in official ICAR/state agri-advisories via retrieval.

_Data sources for seeding: data.gov.in (Agmarknet, Soil Health Card), NASA POWER, Google Earth Engine public catalogs (Sentinel-2 NDVI, GLDAS soil moisture)._

## License
MIT — see LICENSE.
