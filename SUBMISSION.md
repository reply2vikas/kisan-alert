# Submission copy — Kisan Alert

Paste these into the submission form. Pick the length each field needs.

## Tagline (one line)
**Kisan Alert — snap it, speak it, solve it: voice-and-photo AI crop advice in any Indian language, and a live disease map for the MP.**

## Elevator pitch (2 sentences)
Kisan Alert lets any farmer point a phone at a sick crop and ask a question out loud in their own language; Gemini sees the leaf, hears the voice, and speaks back an actionable fix in seconds — no reading, no typing. Every question is also anonymized into a live constituency disease map, so a Member of Parliament can spot outbreaks and target help before a local problem becomes a crisis.

## Short description (~120 words)
Most farm-advisory apps assume a literate farmer with a smartphone and patience for menus — excluding the people who need help most. Kisan Alert removes that barrier. A farmer taps the camera, holds the mic, and speaks in Hindi, Marathi, Tamil or six more Indic languages. The photo and the voice go into Google Gemini in a single multimodal call, grounded with satellite and weather context for that pincode, and the app speaks back a structured advisory: what to do now, a low-cost remedy, a chemical option only if needed, and prevention. Each advisory drops an anonymized pin on an MP dashboard that raises an outbreak alert when reports cluster — turning individual farmer help into constituency-scale early-warning intelligence. Built solo on Google Gemini + Firebase.

## What it does
- Voice + photo crop diagnosis in 9 Indian languages, spoken back aloud (zero literacy required).
- Grounds advice in per-pincode satellite (NDVI, soil moisture) + weather context.
- Safety-first advisories: confidence flag, honest "unclear photo" handling, never invents pesticide doses, routes to the nearest Krishi Vigyan Kendra.
- Live MP dashboard: anonymized report pins, hotspot clustering, automatic outbreak alerts.

## How I built it
Static PWA on Firebase Hosting (HTML/CSS/vanilla JS, no build step). The farmer's voice is captured with the browser's MediaRecorder and sent straight into Gemini alongside the crop photo in one `generateContent` call, with a strict-JSON system instruction; a transcript fallback covers browsers whose audio format Gemini can't ingest. Advisory is spoken via the browser's speech synthesis (roadmap: Cloud Text-to-Speech). Reports persist to Firestore and render on a Google Maps / offline-SVG constituency map. A `?demo=1` golden-replay mode guarantees the demo runs with no network.

## Technologies used
Google Gemini (multimodal, via Google AI Studio) · Google AI Studio · Firebase Hosting · Cloud Firestore · Google Maps JavaScript API · HTML / CSS / vanilla JavaScript · Web MediaRecorder & Speech APIs.
**Roadmap / mandatory-stack extensions:** Vertex AI, Cloud Speech-to-Text & Text-to-Speech, Google Earth Engine (live NDVI/soil), BigQuery public weather datasets, Dialogflow (toll-free IVR).

## Challenges I ran into
Keeping the demo un-killable on venue Wi-Fi (solved with a cached `?demo=1` golden mode + a recorded backup); handling browser audio formats Gemini won't accept (adaptive fallback to a transcript); and making AI advice safe for real farmers (low temperature, confidence flag, no invented pesticide doses, always point to a human KVK).

## What's next
Swap seeded field data for live Google Earth Engine + BigQuery feeds; add a Dialogflow toll-free IVR line so feature-phone farmers reach the same engine with no app and no internet; auto-match farmers to eligible government schemes; and move the API key behind Cloud Functions for production.

## Accessibility & inclusivity (call it out — it's 15% of scoring)
Voice-in / voice-out, 9 Indic languages, large-touch low-literacy UI with colour-coded icon cards, works offline after first load, elder-friendly high contrast, and a feature-phone IVR roadmap for farmers without smartphones.
