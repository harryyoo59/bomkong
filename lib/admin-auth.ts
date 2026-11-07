import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "bomkong_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export type AdminAuthStatus =
  | { ready: false; reason: "missing_secret" }
  | { ready: true; authenticated: boolean };

function getSecret(): string | null {
  const secret = process.env.BOMKONG_ADMIN_SECRET?.trim();
  if (!secret) return null;
  return secret;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Server-only: env secret must be set outside the repo. Never invent passwords. */
export function getAdminAuthConfig(): { configured: boolean } {
  return { configured: Boolean(getSecret()) };
}

export function verifyAdminPassword(password: string): boolean {
  const secret = getSecret();
  if (!secret) return false;
  return safeEqual(password, secret);
}

export function createAdminSessionToken(): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = `ok.${exp}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function isValidAdminSessionToken(token: string | undefined | null): boolean {
  const secret = getSecret();
  if (!secret || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [flag, expStr, sig] = parts;
  if (flag !== "ok") return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const payload = `${flag}.${expStr}`;
  const expected = sign(payload, secret);
  return safeEqual(sig, expected);
}

export async function getAdminAuthStatus(): Promise<AdminAuthStatus> {
  if (!getSecret()) {
    return { ready: false, reason: "missing_secret" };
  }
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  return {
    ready: true,
    authenticated: isValidAdminSessionToken(token),
  };
}

export async function requireAdminSession(): Promise<
  | { ok: true }
  | { ok: false; reason: "missing_secret" | "unauthenticated" }
> {
  const status = await getAdminAuthStatus();
  if (!status.ready) return { ok: false, reason: "missing_secret" };
  if (!status.authenticated) return { ok: false, reason: "unauthenticated" };
  return { ok: true };
}
