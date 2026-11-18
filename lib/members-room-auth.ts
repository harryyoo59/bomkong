import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/** 관리자실 7번 회원현황 — 관리자 입장과 따로 쓰는 방 비밀글 */
export const MEMBERS_ROOM_COOKIE = "bomkong_members_room_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

function getSecret(): string | null {
  const secret = process.env.BOMKONG_MEMBERS_ROOM_SECRET?.trim();
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

export function getMembersRoomAuthConfig(): { configured: boolean } {
  return { configured: Boolean(getSecret()) };
}

export function verifyMembersRoomPassword(password: string): boolean {
  const secret = getSecret();
  if (!secret) return false;
  return safeEqual(password, secret);
}

export function createMembersRoomSessionToken(): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = `members.${exp}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function isValidMembersRoomSessionToken(
  token: string | undefined | null,
): boolean {
  const secret = getSecret();
  if (!secret || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [flag, expStr, sig] = parts;
  if (flag !== "members") return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const payload = `${flag}.${expStr}`;
  const expected = sign(payload, secret);
  return safeEqual(sig, expected);
}

export async function getMembersRoomAuthStatus(): Promise<
  | { ready: false; reason: "missing_secret" }
  | { ready: true; authenticated: boolean }
> {
  if (!getSecret()) {
    return { ready: false, reason: "missing_secret" };
  }
  const jar = await cookies();
  const token = jar.get(MEMBERS_ROOM_COOKIE)?.value;
  return {
    ready: true,
    authenticated: isValidMembersRoomSessionToken(token),
  };
}

export async function requireMembersRoomSession(): Promise<
  | { ok: true }
  | { ok: false; reason: "missing_secret" | "unauthenticated" }
> {
  const status = await getMembersRoomAuthStatus();
  if (!status.ready) return { ok: false, reason: "missing_secret" };
  if (!status.authenticated) return { ok: false, reason: "unauthenticated" };
  return { ok: true };
}
