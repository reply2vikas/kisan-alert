# Publish + submit — step by step

## A. Keys (do this first)
Real keys must NEVER be committed (GitHub push protection will block them).
```bash
cp config.local.example.js config.local.js
# open config.local.js, paste your Gemini key from https://aistudio.google.com/app/apikey
```
`config.local.js` is gitignored — it stays on your machine. The committed `config.js` holds only placeholders.

Test locally:
```bash
python3 -m http.server 8000
# open http://localhost:8000   and   http://localhost:8000/?demo=1
```

## B. Push to GitHub (clean history)
If a key ever got committed, reset local history so it isn't in the push:
```bash
rm -rf .git
git init
git add .
git commit -m "Kisan Alert — multimodal AI crop advisory + MP dashboard"
git branch -M main
git remote add origin https://github.com/reply2vikas/kisan-alert.git
git push -u origin main --force
```
Sanity check before pushing: `grep -rn "AQ.Ab8RN6" . --exclude-dir=.git` returns nothing (or only config.local.js).

## C. Go live with GitHub Pages (fastest — no CLI, no Node issues)
1. Repo → **Settings → Pages**
2. Source: **Deploy from a branch** → Branch **main** → Folder **/(root)** → Save
3. Live in ~1 min at **https://reply2vikas.github.io/kisan-alert/**
   - Public link runs in demo mode: share **`/?demo=1`** for judges to click.
   - Live Gemini diagnosis runs from your laptop (with config.local.js) + your recorded video.

### Firebase Hosting (optional alternative)
Firebase CLI needs Node 20/22/24 — you have Node 25, hence the "unexpected error". If you want Firebase:
```bash
nvm install 22 && nvm use 22
npm install -g firebase-tools
# create a project at https://console.firebase.google.com first, then:
firebase use YOUR_PROJECT_ID
firebase deploy --only hosting
```

## D. Deck → PDF (submission format)
Open `pitch-deck.html` in Chrome → `Cmd/Ctrl+P` → Save as PDF → Landscape → Margins None → Background graphics ON.
Present live from the HTML with arrow keys; press **F** for fullscreen.

## E. Backup video (90s)
Screen-record one clean run: language → photo → voice → spoken advisory → "Send to MP dashboard" → pin drops → outbreak alert. This is your safety net if venue Wi-Fi dies.

## F. Submission checklist
- [ ] Public GitHub repo: https://github.com/reply2vikas/kisan-alert
- [ ] Live URL: https://reply2vikas.github.io/kisan-alert/?demo=1
- [ ] Pitch deck PDF (10–12 slides)
- [ ] Backup demo video link
- [ ] Description + tech (see SUBMISSION.md)
- [ ] Submit EARLY — don't gamble on an 11:58 PM upload.
