/* ============================================================
   Kisan Alert — Vertex AI proxy (Cloud Function, gen2 / Node 20)
   Why: Vertex AI needs a service-account token, which a browser
   can't hold. This function authenticates with its own service
   account (Application Default Credentials — no key in code) and
   forwards the request to Vertex AI Gemini, spending your GCP
   credits. The browser calls THIS url instead of AI Studio.
   Note: Vertex requires a `role` on each content ("user"/"model"),
   which AI Studio doesn't — so we inject it if missing.
   ============================================================ */
const { GoogleAuth } = require("google-auth-library");

const auth = new GoogleAuth({ scopes: "https://www.googleapis.com/auth/cloud-platform" });
const LOCATION = process.env.LOCATION || "us-central1";
const MODEL = process.env.MODEL || "gemini-2.5-flash";

exports.handler = async (req, res) => {
  // CORS so the GitHub Pages / localhost site can call it.
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "POST only" }); return; }

  try {
    const project = process.env.PROJECT_ID || (await auth.getProjectId());
    const client = await auth.getClient();
    const token = (await client.getAccessToken()).token;

    // Normalize body: Vertex requires each content to have a role.
    let body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    if (Array.isArray(body.contents)) body.contents = body.contents.map(c => ({ ...c, role: c.role || "user" }));

    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${project}` +
                `/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e && e.message || e) });
  }
};
