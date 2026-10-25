import { getStore } from "@netlify/blobs";

// Shared race storage. Each race is one saved record:
//   key = race id, value = { pin, state, updatedAt }
// GET  /.netlify/functions/race?id=ABC   -> { state }          (anyone with the link)
// POST /.netlify/functions/race          -> { id }             body: { action: "create", pin, state }
// PUT  /.netlify/functions/race          -> { ok: true }       body: { id, pin, state }  (timekeeper only)

const MAX_STATE_CHARS = 100000;

const reply = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const newId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 8);

export default async (req) => {
  const store = getStore("races");

  if (req.method === "GET") {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return reply(400, { error: "Missing race id" });
    const record = await store.get(id, { type: "json" });
    if (!record) return reply(404, { error: "Race not found" });
    return reply(200, { state: record.state });
  }

  if (req.method !== "POST" && req.method !== "PUT") {
    return reply(405, { error: "Method not allowed" });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: "Body must be JSON" });
  }

  const pin = String(body.pin || "");
  if (!body.state || typeof body.state !== "object") {
    return reply(400, { error: "Missing race data" });
  }
  if (JSON.stringify(body.state).length > MAX_STATE_CHARS) {
    return reply(413, { error: "Race data is too large" });
  }

  if (req.method === "POST") {
    if (body.action !== "create") return reply(400, { error: "Unknown action" });
    if (pin.length < 4) return reply(400, { error: "Timekeeper PIN must be at least 4 characters" });

    let id = newId();
    while (await store.get(id, { type: "json" })) id = newId();
    await store.setJSON(id, { pin, state: body.state, updatedAt: Date.now() });
    return reply(200, { id });
  }

  // PUT: update an existing race, only with the matching timekeeper PIN
  const id = String(body.id || "");
  if (!id) return reply(400, { error: "Missing race id" });
  const record = await store.get(id, { type: "json" });
  if (!record) return reply(404, { error: "Race not found" });
  if (record.pin !== pin) return reply(403, { error: "Wrong timekeeper PIN" });

  await store.setJSON(id, { pin: record.pin, state: body.state, updatedAt: Date.now() });
  return reply(200, { ok: true });
};
