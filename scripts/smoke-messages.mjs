/* eslint-disable no-console */

const BASE_URL = process.env.BASE_URL;

if (!BASE_URL) {
  console.error("Missing BASE_URL. Example: BASE_URL=http://localhost:3003 npm run smoke:messages");
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
  const senderSession = `sender-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const receiverSession = `receiver-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const senderHeaders = { "content-type": "application/json", "x-session-id": senderSession };
  const receiverHeaders = { "content-type": "application/json", "x-session-id": receiverSession };

  console.log(`[messages] BASE_URL=${base}`);
  console.log(`[messages] sender=${senderSession}`);
  console.log(`[messages] receiver=${receiverSession}`);

  const uniqueText = `secret-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const create = await fetch(`${base}/api/secrets`, {
    method: "POST",
    headers: senderHeaders,
    body: JSON.stringify({ content: uniqueText })
  });
  const createJson = await parseJson(create);
  assert(create.status === 201, `create secret expected 201, got ${create.status}`);
  assert(createJson.id, "create secret missing id");
  console.log("[messages] create secret: ok");

  const duplicate = await fetch(`${base}/api/secrets`, {
    method: "POST",
    headers: senderHeaders,
    body: JSON.stringify({ content: uniqueText })
  });
  assert(duplicate.status === 409, `duplicate secret expected 409, got ${duplicate.status}`);
  console.log("[messages] duplicate rejection: ok");

  const tooLongSecret = "x".repeat(301);
  const longSecretResp = await fetch(`${base}/api/secrets`, {
    method: "POST",
    headers: senderHeaders,
    body: JSON.stringify({ content: tooLongSecret })
  });
  assert(longSecretResp.status === 400, `long secret expected 400, got ${longSecretResp.status}`);
  console.log("[messages] long secret validation: ok");

  const pulled = await fetch(`${base}/api/secrets/random`, {
    method: "GET",
    headers: receiverHeaders
  });
  const pulledJson = await parseJson(pulled);
  assert(pulled.status === 200, `pull expected 200, got ${pulled.status}`);
  assert(!pulledJson.empty, "pull returned empty unexpectedly");
  assert(pulledJson.id, "pull missing id");
  console.log("[messages] pull secret: ok");

  const reply = await fetch(`${base}/api/secrets/${pulledJson.id}/reply`, {
    method: "POST",
    headers: receiverHeaders,
    body: JSON.stringify({ content: "reply from smoke messages" })
  });
  const replyJson = await parseJson(reply);
  assert(reply.status === 201, `reply expected 201, got ${reply.status}`);
  assert(replyJson.id, "reply missing id");
  console.log("[messages] first reply: ok");

  const replyAgain = await fetch(`${base}/api/secrets/${pulledJson.id}/reply`, {
    method: "POST",
    headers: receiverHeaders,
    body: JSON.stringify({ content: "second reply should fail" })
  });
  assert(replyAgain.status === 409, `second reply expected 409, got ${replyAgain.status}`);
  console.log("[messages] second reply blocked: ok");

  const tooLongReply = await fetch(`${base}/api/secrets/${pulledJson.id}/reply`, {
    method: "POST",
    headers: receiverHeaders,
    body: JSON.stringify({ content: "r".repeat(201) })
  });
  assert(tooLongReply.status === 400, `long reply expected 400, got ${tooLongReply.status}`);
  console.log("[messages] long reply validation: ok");

  const release = await fetch(`${base}/api/secrets/${pulledJson.id}/release`, {
    method: "POST",
    headers: receiverHeaders
  });
  const releaseJson = await parseJson(release);
  assert(release.status === 200, `release expected 200, got ${release.status}`);
  assert(releaseJson.ok === true, "release missing ok=true");
  console.log("[messages] release: ok");

  const pullAfterRelease = await fetch(`${base}/api/secrets/random`, {
    method: "GET",
    headers: senderHeaders
  });
  const pullAfterReleaseJson = await parseJson(pullAfterRelease);
  assert(pullAfterRelease.status === 200, `pull after release expected 200, got ${pullAfterRelease.status}`);
  assert(pullAfterReleaseJson.id || pullAfterReleaseJson.empty, "invalid payload after release");
  console.log("[messages] pull after release payload: ok");

  console.log("[messages] success");
}

run().catch((error) => {
  console.error("[messages] failed:", error.message);
  process.exit(1);
});
