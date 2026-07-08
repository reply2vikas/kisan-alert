# Email to organizers — late submission request

**To:** build-with-ai-india@googlegroups.com
**Cc:** support@hack2skill.com
**Subject:** Request to consider my submission — Challenge 4 (Kisan Alert) — Vikas Kumar

---

Dear Build with AI: Code for Communities Team,

I hope you're doing well. I'm writing regarding my submission for **Challenge 4 — Kisan Alert (Smart Water, Crop & Advisory System)**, which I completed and submitted, but a little after the midnight cut-off.

I want to be honest and not make excuses: I built this project solo and, in the final hours, ran into genuine technical issues — problems getting the AI API keys and quota working, deploying the Vertex AI backend on Google Cloud, and a system/update interruption on my machine — which pushed my final upload just past the deadline. I'm reaching out now, at the earliest I could, to request that you kindly consider accepting it. I completely understand if rules are rules, and I'm grateful either way for the learning and the opportunity.

Everything is finished and working. Details and links below.

**Submission details**
- **Participant:** Vikas Kumar (vikas.reply@gmail.com)
- **Challenge:** #4 — Kisan Alert (Smart Water, Crop & Advisory System)
- **Team:** Solo
- **Live demo (works for anyone):** https://reply2vikas.github.io/kisan-alert/
- **Demo video (90s):** https://youtu.be/3-IpT-83qEI
- **Full video (backup, Google Drive):** https://drive.google.com/file/d/1nIAtibhp-ZCGxXmKXcNkoNMii9RNLT7v/view?usp=sharing
- **GitHub repo (public):** https://github.com/reply2vikas/kisan-alert
- **Pitch deck (PDF):** attached to this email _(also: [add Google Drive link if you host it])_

**Explain your solution**
Kisan Alert gives any farmer expert crop help in seconds, in their own language — and turns each request into intelligence for their MP. The farmer picks a language, points their phone at a sick crop, and speaks their question. Photo and voice go together in one multimodal call to Gemini 2.5 on Vertex AI, grounded with satellite and weather data for that area. The app speaks back a structured advisory in the same language: what to do now, a low-cost fix under ₹200, a chemical option only if needed, prevention, and the nearest Krishi Vigyan Kendra — no reading or typing needed. Every anonymized query also drops a pin on a live MP dashboard; when reports cluster, the office gets an outbreak alert and can send help to that exact block before a crisis spreads.

**Technologies used**
Google Gemini 2.5, Vertex AI, Google Cloud Functions (serverless proxy — no API key in the browser), Firebase Hosting, Cloud Firestore, Google Maps JavaScript API, Google AI Studio; HTML/CSS/vanilla JavaScript (PWA), Web MediaRecorder & Speech APIs. Roadmap on the same Google stack: Google Earth Engine (live NDVI/soil), BigQuery (weather), Cloud Speech-to-Text & Text-to-Speech, Dialogflow (toll-free IVR).

Thank you so much for your time and for organising such a meaningful hackathon. I would be truly grateful for your consideration.

Warm regards,
Vikas Kumar
vikas.reply@gmail.com
