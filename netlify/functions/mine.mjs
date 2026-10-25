import { getStore } from "@netlify/blobs";
import { reply, userFromRequest, sameOwner } from "../lib/auth.mjs";

// The logged-in timekeeper's own races, newest first.
// GET /.netlify/functions/mine (Authorization: Bearer token)
// -> { races: [ { id, name, eventCount, distance, distUnit, startedAt, stoppedAt, updatedAt, published } ] }

const eventsOf = (race) =>
  Array.isArray(race.events) && race.events.length ? race.events : [race];

export default async (req) => {
  const user = await userFromRequest(req);
  if (!user) return reply(401, { error: "Log in as a timekeeper first" });

  const races = getStore("races");
  const published = getStore("published");
  const { blobs } = await races.list();
  const { blobs: publishedBlobs } = await published.list();
  const publishedIds = new Set(publishedBlobs.map((b) => b.key));

  const loaded = await Promise.all(blobs.map(async (b) => ({ id: b.key, record: await races.get(b.key, { type: "json" }) })));
  const mine = loaded
    .filter((x) => x.record && sameOwner(x.record.owner, user))
    .map((x) => {
      const state = x.record.state || {};
      const events = eventsOf(state);
      const starts = events.map((e) => e.startedAt).filter(Boolean);
      const everyStopped = events.every((e) => e.stoppedAt);
      const stops = events.map((e) => e.stoppedAt).filter(Boolean);
      return {
        id: x.id,
        name: state.name || "Family race",
        eventCount: events.length,
        distance: events.length === 1 ? events[0].distance || null : null,
        distUnit: events.length === 1 ? events[0].distUnit || "mi" : "mi",
        startedAt: starts.length ? Math.min(...starts) : null,
        stoppedAt: everyStopped && stops.length ? Math.max(...stops) : null,
        updatedAt: x.record.updatedAt || 0,
        published: publishedIds.has(x.id),
      };
    })
    .sort((a, b) => (b.startedAt || b.updatedAt) - (a.startedAt || a.updatedAt));

  return reply(200, { races: mine });
};
