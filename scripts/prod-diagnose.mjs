/* eslint-disable no-console */

const BASE_URL = process.env.BASE_URL;

if (!BASE_URL) {
  console.error("Missing BASE_URL. Example: BASE_URL=https://your-site.netlify.app npm run diagnose:prod");
  process.exit(1);
}

const base = BASE_URL.replace(/\/+$/, "");

async function head(path) {
  const res = await fetch(`${base}${path}`, { method: "HEAD" });
  return res;
}

async function getText(path) {
  const res = await fetch(`${base}${path}`);
  const text = await res.text();
  return { res, text };
}

async function parseJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function run() {
  console.log(`[diagnose] BASE_URL=${base}`);

  const swHead = await head("/sw.js");
  console.log(`[diagnose] HEAD /sw.js -> ${swHead.status}`);
  console.log(`[diagnose] /sw.js content-type=${swHead.headers.get("content-type") || ""}`);
  console.log(`[diagnose] /sw.js cache-control=${swHead.headers.get("cache-control") || ""}`);
  assert(swHead.status === 200, "sw.js not reachable (expected 200).");

  const swGet = await getText("/sw.js");
  assert(swGet.res.status === 200, "sw.js GET failed.");
  assert(swGet.text.includes("addEventListener"), "sw.js content does not look like a service worker.");
  console.log("[diagnose] sw.js content: ok");

  const sessionId = `diag-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const headers = {
    "content-type": "application/json",
    "x-session-id": sessionId
  };

  const createSecret = await fetch(`${base}/api/secrets`, {
    method: "POST",
    headers,
    body: JSON.stringify({ content: "diagnose secret" })
  });
  const createJson = await parseJson(createSecret);
  console.log(`[diagnose] POST /api/secrets -> ${createSecret.status}`);
  assert(createSecret.status === 201, `POST /api/secrets expected 201, got ${createSecret.status}`);
  assert(createJson.id, "POST /api/secrets missing id");

  const pull = await fetch(`${base}/api/secrets/random`, { headers });
  const pullJson = await parseJson(pull);
  console.log(`[diagnose] GET /api/secrets/random -> ${pull.status}`);
  assert(pull.status === 200, `GET /api/secrets/random expected 200, got ${pull.status}`);
  assert(pullJson.id || pullJson.empty, "GET /api/secrets/random invalid payload");

  console.log("[diagnose] api routes: ok");
  console.log("[diagnose] success");
}

run().catch((error) => {
  console.error("[diagnose] failed:", error.message);
  process.exit(1);
});

