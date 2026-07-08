# Deploy the Vertex AI proxy (uses your GCP credits)

You need the `gcloud` CLI. Install: https://cloud.google.com/sdk/docs/install
(This is separate from Node — your Node v25 is not a problem here.)

## 1. Log in & pick your project (the one holding your credits)
```bash
gcloud auth login
gcloud projects list                 # find your PROJECT_ID
gcloud config set project YOUR_PROJECT_ID
```

## 2. Enable the APIs
```bash
gcloud services enable aiplatform.googleapis.com \
  cloudfunctions.googleapis.com run.googleapis.com \
  cloudbuild.googleapis.com
```
Make sure billing is linked to the project (your credits count as billing).

## 3. Deploy (run from inside the vertex-proxy/ folder)
```bash
cd vertex-proxy

gcloud functions deploy kisan-gemini \
  --gen2 --runtime=nodejs20 --region=us-central1 \
  --source=. --entry-point=handler \
  --trigger-http --allow-unauthenticated \
  --set-env-vars=LOCATION=us-central1,MODEL=gemini-2.0-flash
```
When it finishes it prints a **URL** like:
`https://kisan-gemini-xxxxxxxx-uc.a.run.app`  (or a cloudfunctions.net URL)

## 4. Point the app at it
In **config.local.js** add the URL (no Gemini key needed anymore):
```js
Object.assign(window.KISAN_CONFIG, {
  VERTEX_PROXY_URL: "https://kisan-gemini-xxxxxxxx-uc.a.run.app",
});
```
Hard-refresh the app (Cmd+Shift+R), upload a new photo, click **Get advice** → real diagnosis via Vertex, paid from your credits.

## Notes
- The function uses its own service account (no API key), so nothing secret ships to the browser.
- `--allow-unauthenticated` makes the URL callable from your web page. Fine for the demo; lock it down later if you keep it running.
- To use the proxy from your **public** Pages site too, put `VERTEX_PROXY_URL` in `config.js` (it's just a URL, not a secret) and push. If you'd rather keep the endpoint private, leave it in `config.local.js` and demo from localhost.
- Model/region: `gemini-2.0-flash` in `us-central1` is a safe default. Change via the env vars if needed.

## If the deploy fights you
Don't burn your deadline on it — your `?demo=1` link + recorded video are a complete, valid submission. Vertex is the upgrade, not the requirement.
