import {
  getYoutubeConfig,
  YOUTUBE_UPLOAD_SCOPE,
} from "@/lib/youtube-config";

export type YoutubeTokenResult = {
  accessToken: string;
  expiresIn?: number;
};

export type YoutubeCodeExchange = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string;
};

function requireClientCreds() {
  const cfg = getYoutubeConfig();
  if (!cfg.clientId || !cfg.clientSecret) {
    throw new Error("유튜브 연결 값이 아직 서버에 없어요.");
  }
  return cfg;
}

/** Build Google OAuth consent URL (offline refresh token). */
export function buildYoutubeConsentUrl(state: string): string {
  const cfg = requireClientCreds();
  if (!cfg.redirectUri) {
    throw new Error("돌아가는 주소(YOUTUBE_REDIRECT_URI)가 없어요.");
  }
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    scope: YOUTUBE_UPLOAD_SCOPE,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/** Exchange authorization code → tokens (one-time setup). */
export async function exchangeYoutubeAuthCode(
  code: string,
): Promise<YoutubeCodeExchange> {
  const cfg = requireClientCreds();
  if (!cfg.redirectUri) {
    throw new Error("돌아가는 주소(YOUTUBE_REDIRECT_URI)가 없어요.");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: cfg.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      typeof data.error_description === "string"
        ? data.error_description
        : "구글 로그인 교환에 실패했어요.";
    throw new Error(msg);
  }

  const accessToken = String(data.access_token ?? "");
  if (!accessToken) {
    throw new Error("접속 열쇠를 받지 못했어요.");
  }

  return {
    accessToken,
    refreshToken:
      typeof data.refresh_token === "string" ? data.refresh_token : undefined,
    expiresIn:
      typeof data.expires_in === "number" ? data.expires_in : undefined,
    scope: typeof data.scope === "string" ? data.scope : undefined,
  };
}

/** Refresh token → short-lived access token (server upload path). */
export async function getYoutubeAccessToken(): Promise<YoutubeTokenResult> {
  const cfg = requireClientCreds();
  if (!cfg.refreshToken) {
    throw new Error(
      "오래 쓰는 열쇠(YOUTUBE_REFRESH_TOKEN)가 아직 서버에 없어요.",
    );
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      refresh_token: cfg.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      typeof data.error_description === "string"
        ? data.error_description
        : "유튜브 접속 열쇠를 갱신하지 못했어요.";
    throw new Error(msg);
  }

  const accessToken = String(data.access_token ?? "");
  if (!accessToken) {
    throw new Error("유튜브 접속 열쇠가 비어 있어요.");
  }

  return {
    accessToken,
    expiresIn:
      typeof data.expires_in === "number" ? data.expires_in : undefined,
  };
}
