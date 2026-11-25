/** 부모(보호자) 로그인 — 아이 전용 계정은 없음 · 지금은 이메일만 */

export const PARENT_AUTH_CALLBACK_PATH = "/auth/callback";
export const PARENT_AUTH_CONFIRM_PATH = "/auth/confirm";

export function getSiteOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_VERCEL_URL?.trim();
  if (fromEnv) {
    if (fromEnv.startsWith("http")) return fromEnv.replace(/\/$/, "");
    return `https://${fromEnv.replace(/\/$/, "")}`;
  }
  return "https://www.bom-kong.com";
}

export function parentAuthCallbackUrl(nextPath = "/"): string {
  const origin = getSiteOrigin();
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  const url = new URL(PARENT_AUTH_CALLBACK_PATH, origin);
  url.searchParams.set("next", next);
  return url.toString();
}

/** 메일 템플릿(토큰 링크)용 — 다른 기기에서도 로그인 마무리 */
export function parentAuthConfirmUrl(nextPath = "/"): string {
  const origin = getSiteOrigin();
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  const url = new URL(PARENT_AUTH_CONFIRM_PATH, origin);
  url.searchParams.set("next", next);
  return url.toString();
}

export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}
