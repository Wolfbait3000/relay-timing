import { getStore } from "@netlify/blobs";
import { reply, userFromRequest, sameOwner } from "../lib/auth.mjs";

// Races belong to the timekeeper account that created them.
// Race record:      races[id]     = { owner, state, updatedAt }
// Published record: published[id] = { id, owner, name, startedAt, publishedAt, finished, dnf }
//
// GET  ?id=ID                          -> { state, owner }             (anyone with the link)
// POST { action: "create", state }     -> { id }                       (timekeeper login)
// PUT  { id, state }                   -> { ok: true }                 (owner only)
// POST { action: "publish", id }       -> { ok: true }                 (owner only, race must be stopped)
// POST { action: "delete", id }        -> { ok: true }                 (owner only)

const MAX_STATE_CHARS = 100000;

const newId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 8);

// Public results copy: finishers in place order, then racers who did not finish
function buildResults(id, owner, race) {
  const racers = Array.isArray(race.racers) ? race.racers : [];
  const times = race.finishes || {};
  const finished = racers
    .filter((r) => times[r.id] != null)
    .map((r) => ({ bib: r.bib, name: r.name, ms: times[r.id] }))
    .sort((a, b) => a.ms - b.ms)
    .map((r, i) => ({ place: i + 1, ...r }));
  const dnf = racers
    .filter((r) => times[r.id] == null)
    .map((r) => ({ bib: r.bib, name: r.name }));
  return {
    id, owner, name: race.name || "Family race", startedAt: race.startedAt, publishedAt: Date.now(), finished, dnf,
    distance: race.distance || null, distUnit: race.distUnit || "mi", showPace: !!race.showPace, paceUnit: race.paceUnit || "min/mi",
  };
}

const validState = (state) =>
  state && typeof state === "object" && JSON.stringify(state).length <= MAX_STATE_CHARS;

export default async (req) => {
  const races = getStore("races");
  const published = getStore("published");

  if (req.method === "GET") {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return reply(400, { error: "Missing race id" });
    const record = await races.get(id, { type: "json" });
    if (!record || !record.owner) return reply(404, { error: "Race not found" });
    return reply(200, { state: record.state, owner: record.owner });
  }

  if (req.method !== "POST" && req.method !== "PUT") {
    return reply(405, { error: "Method not allowed" });
  }

  const user = await userFromRequest(req);
  if (!user) return reply(401, { error: "Log in as a timekeeper first" });

  let body;
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: "Body must be JSON" });
  }

  if (req.method === "POST" && body.action === "create") {
    if (!validState(body.state)) return reply(400, { error: "Missing or too large race data" });
    let id = newId();
    while (await races.get(id, { type: "json" })) id = newId();
    await races.setJSON(id, { owner: user, state: body.state, updatedAt: Date.now() });
    return reply(200, { id });
  }

  const id = String(body.id || "");
  const record = id ? await races.get(id, { type: "json" }) : null;
  if (!record || !record.owner) return reply(404, { error: "Race not found" });
  if (!sameOwner(record.owner, user)) return reply(403, { error: "This race belongs to another timekeeper" });

  if (req.method === "PUT") {
    if (!validState(body.state)) return reply(400, { error: "Missing or too large race data" });
    await races.setJSON(id, { owner: record.owner, state: body.state, updatedAt: Date.now() });
    // Keep an already-published copy in step with edits
    if (body.state.stoppedAt && (await published.get(id, { type: "json" }))) {
      await published.setJSON(id, buildResults(id, record.owner, body.state));
    }
    return reply(200, { ok: true });
  }

  if (body.action === "publish") {
    if (!record.state.stoppedAt) return reply(409, { error: "Stop the race before publishing" });
    await published.setJSON(id, buildResults(id, record.owner, record.state));
    return reply(200, { ok: true });
  }

  if (body.action === "delete") {
    await races.delete(id);
    await published.delete(id);
    return reply(200, { ok: true });
  }

  return reply(400, { error: "Unknown action" });
};
