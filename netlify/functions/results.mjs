import { getStore } from "@netlify/blobs";

// Public list of published races, newest first.
// GET /.netlify/functions/results -> { races: [ { id, name, startedAt, publishedAt, finished, dnf } ] }
// Live races are never listed here; only races the timekeeper published.

export default async () => {
  const store = getStore("published");
  const { blobs } = await store.list();
  const loaded = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
  const races = loaded
    .filter(Boolean)
    .sort((a, b) => (b.startedAt || b.publishedAt || 0) - (a.startedAt || a.publishedAt || 0));

  return new Response(JSON.stringify({ races }), {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
};
