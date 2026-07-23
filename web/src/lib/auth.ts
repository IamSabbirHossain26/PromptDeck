import crypto from "node:crypto";
import { cookies } from "next/headers";

/**
 * Minimal stateless admin auth for the CRUD dashboard.
 *
 * Env:
 *   ADMIN_PASSWORD  the password you type at /admin/login
 *   ADMIN_SECRET    a long random string used to sign the session cookie
 *
 * The session cookie holds an HMAC of a fixed marker keyed by (password+secret),
 * so it can be verified statelessly and is invalidated if either value changes.
 */

const COOKIE_NAME = "pd_admin";

function expectedToken(): string | null {
  const pw = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SECRET;
  if (!pw || !secret) return null;
  return crypto
    .createHmac("sha256", secret)
    .update(`admin:${pw}`)
    .digest("hex");
}

export function isAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SECRET);
}

/** Verify a plaintext password against ADMIN_PASSWORD (constant-time). */
export function verifyPassword(password: string): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(pw);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function sessionToken(): string | null {
  return expectedToken();
}

export const ADMIN_COOKIE = COOKIE_NAME;

/** True if the current request carries a valid admin session cookie. */
export async function isAuthed(): Promise<boolean> {
  const expected = expectedToken();
  if (!expected) return false;
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
