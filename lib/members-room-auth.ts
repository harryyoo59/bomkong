import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/** 관리자실 7번 회원현황 — 관리자 입장과 따로 쓰는 방 비밀글 */
export const MEMBERS_ROOM_COOKIE = "bomkong_members_room_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

/**
 * 호스팅 설정이 비어 있으면 사장님이 정한 기본 비밀글을 씀.
 * (서버에서만 읽고, 화면·저장소에 노출하지 않음)
 */
function getSecret(): string {
  return (
    process.env.BOMKONG_MEMBERS_ROOM_SECRET?.trim() ||
    "열매는 니들이 따먹어라"
  );
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
  return { configured: true };
}

export function verifyMembersRoomPassword(password: string): boolean {
  // 한글은 기기마다 글자 조합이 달라질 수 있어 맞춰 비교
  const typed = password.normalize("NFC").trim();
  const expected = getSecret().normalize("NFC").trim();
  return safeEqual(typed, expected);
}

export function createMembersRoomSessionToken(): string {
  const secret = getSecret();
  const exp = Date.now() + SESSION_TTL_MS;
  const payload = `members.${exp}`;
  return `${payload}.${sign(payload, secret)}`;
}

export function isValidMembersRoomSessionToken(
  token: string | undefined | null,
): boolean {
  if (!token) return false;
  const secret = getSecret();
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

export async function getMembersRoomAuthStatus(): Promise<{
  ready: true;
  authenticated: boolean;
}> {
  const jar = await cookies();
  const token = jar.get(MEMBERS_ROOM_COOKIE)?.value;
  return {
    ready: true,
    authenticated: isValidMembersRoomSessionToken(token),
  };
}

export async function requireMembersRoomSession(): Promise<
  | { ok: true }
  | { ok: false; reason: "unauthenticated" }
> {
  const status = await getMembersRoomAuthStatus();
  if (!status.authenticated) return { ok: false, reason: "unauthenticated" };
  return { ok: true };
}
