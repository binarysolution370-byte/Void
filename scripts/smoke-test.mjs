/* eslint-disable no-console */

const BASE_URL = process.env.BASE_URL;

if (!BASE_URL) {
  console.error("Missing BASE_URL. Example: BASE_URL=https://your-app.vercel.app npm run smoke");
  process.exit(1);
}

const base = BASE_URL.replace(/\/+$/, "");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function parseJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

async function run() {
  const sessionId = `smoke-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const headers = {
    "content-type": "application/json",
    "x-session-id": sessionId
  };

  console.log(`[smoke] BASE_URL=${base}`);
  console.log(`[smoke] session=${sessionId}`);

  const createSecret = await fetch(`${base}/api/secrets`, {
    method: "POST",
    headers,
    body: JSON.stringify({ content: "smoke secret primary" })
  });
  const createSecretJson = await parseJson(createSecret);
  assert(createSecret.status === 201, `POST /api/secrets expected 201, got ${createSecret.status}`);
  assert(createSecretJson.id, "POST /api/secrets missing id");
  console.log("[smoke] create secret: ok");

  const createSecond = await fetch(`${base}/api/secrets`, {
    method: "POST",
    headers,
    body: JSON.stringify({ content: "smoke secret secondary" })
  });
  const createSecondJson = await parseJson(createSecond);
  assert(createSecond.status === 201, `POST /api/secrets(second) expected 201, got ${createSecond.status}`);
  assert(createSecondJson.id, "POST /api/secrets(second) missing id");
  console.log("[smoke] create second secret: ok");

  const pull = await fetch(`${base}/api/secrets/random`, { headers });
  const pullJson = await parseJson(pull);
  assert(pull.status === 200, `GET /api/secrets/random expected 200, got ${pull.status}`);
  assert(!pullJson.empty, "GET /api/secrets/random returned empty unexpectedly");
  assert(pullJson.id, "GET /api/secrets/random missing id");
  console.log("[smoke] pull secret: ok");

  const reply = await fetch(`${base}/api/secrets/${pullJson.id}/reply`, {
    method: "POST",
    headers,
    body: JSON.stringify({ content: "smoke reply" })
  });
  const replyJson = await parseJson(reply);
  assert(reply.status === 201, `POST /api/secrets/:id/reply expected 201, got ${reply.status}`);
  assert(replyJson.id, "POST /api/secrets/:id/reply missing id");
  console.log("[smoke] reply secret: ok");

  const release = await fetch(`${base}/api/secrets/${pullJson.id}/release`, {
    method: "POST",
    headers
  });
  const releaseJson = await parseJson(release);
  assert(release.status === 200, `POST /api/secrets/:id/release expected 200, got ${release.status}`);
  assert(releaseJson.ok === true, "POST /api/secrets/:id/release missing ok=true");
  console.log("[smoke] release secret: ok");

  const pullAgain = await fetch(`${base}/api/secrets/random`, { headers });
  const pullAgainJson = await parseJson(pullAgain);
  assert(pullAgain.status === 200, `GET /api/secrets/random(again) expected 200, got ${pullAgain.status}`);
  assert(pullAgainJson.id || pullAgainJson.empty, "GET /api/secrets/random(again) invalid payload");
  console.log("[smoke] pull again payload shape: ok");

  console.log("[smoke] success");
}

run().catch((error) => {
  console.error("[smoke] failed:", error.message);
  process.exit(1);
});
