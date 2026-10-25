import { getStore } from "@netlify/blobs";
import { USERNAME_RULE, reply, hashPassword, checkPassword, createSession, userFromRequest } from "../lib/auth.mjs";

// Accounts for timekeepers.
// GET  /.netlify/functions/account                     -> { username } or { username: null }
// POST /.netlify/functions/account  { action: "signup", username, password }  -> { username, token }
// POST /.netlify/functions/account  { action: "login",  username, password }  -> { username, token }
// POST /.netlify/functions/account  { action: "logout" }  (with Authorization header) -> { ok: true }

export default async (req) => {
  const accounts = getStore("accounts");

  if (req.method === "GET") {
    return reply(200, { username: (await userFromRequest(req)) || null });
  }
  if (req.method !== "POST") return reply(405, { error: "Method not allowed" });

  let body;
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: "Body must be JSON" });
  }

  if (body.action === "logout") {
    const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
    if (token) await getStore("sessions").delete(token);
    return reply(200, { ok: true });
  }

  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  if (!USERNAME_RULE.test(username)) {
    return reply(400, { error: "Timekeeper ID must be 5 to 30 characters: letters, numbers, and _ $ . ! @ # -" });
  }
  const key = username.toLowerCase();

  if (body.action === "signup") {
    if (password.length < 6) return reply(400, { error: "Password must be at least 6 characters" });
    if (await accounts.get(key, { type: "json" })) return reply(409, { error: "That timekeeper ID is already taken" });

    const { salt, hash } = hashPassword(password);
    await accounts.setJSON(key, { username, salt, hash, createdAt: Date.now() });
    return reply(200, { username, token: await createSession(username) });
  }

  if (body.action === "login") {
    const account = await accounts.get(key, { type: "json" });
    if (!account || !checkPassword(password, account)) {
      return reply(401, { error: "Wrong timekeeper ID or password" });
    }
    return reply(200, { username: account.username, token: await createSession(account.username) });
  }

  return reply(400, { error: "Unknown action" });
};
