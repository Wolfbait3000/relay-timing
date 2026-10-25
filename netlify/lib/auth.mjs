import { getStore } from "@netlify/blobs";
import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

// Shared helpers for accounts and sign-in tokens.
// Accounts: store "accounts", key = lowercase username -> { username, salt, hash, createdAt }
// Sessions: store "sessions", key = token -> { username, expiresAt }

const ITERATIONS = 100000;
const SESSION_DAYS = 30;

export const USERNAME_RULE = /^[A-Za-z0-9_$.!@#-]{5,30}$/;

export const reply = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256").toString("hex");
  return { salt, hash };
}

export function checkPassword(password, account) {
  const actual = pbkdf2Sync(password, account.salt, ITERATIONS, 32, "sha256");
  const expected = Buffer.from(account.hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function createSession(username) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  await getStore("sessions").setJSON(token, { username, expiresAt });
  return token;
}

// Returns the username behind the "Authorization: Bearer <token>" header, or null
export async function userFromRequest(req) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  const session = await getStore("sessions").get(token, { type: "json" });
  if (!session || session.expiresAt < Date.now()) return null;
  return session.username;
}

export function sameOwner(a, b) {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}
