import { getStore } from "@netlify/blobs";
import { reply, sameOwner } from "../lib/auth.mjs";

// Published races for one timekeeper, newest first.
// GET /.netlify/functions/results?timekeeper=ID -> { races: [...] }
// Only races published by that timekeeper are returned.

export default async (req) => {
  const timekeeper = new URL(req.url).searchParams.get("timekeeper") || "";
  if (!timekeeper) return reply(400, { error: "Enter a timekeeper ID" });

  const store = getStore("published");
  const { blobs } = await store.list();
  const loaded = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
  const races = loaded
    .filter((r) => r && sameOwner(r.owner, timekeeper))
    .sort((a, b) => (b.startedAt || b.publishedAt || 0) - (a.startedAt || a.publishedAt || 0));

  return reply(200, { races });
};
