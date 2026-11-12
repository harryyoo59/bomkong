import { createHmac, timingSafeEqual } from "crypto";

export type YoutubePrivacyStatus = "private" | "unlisted" | "public";

export type YoutubeUploadSessionPayload = {
  uploadUrl: string;
  title: string;
  privacyStatus: YoutubePrivacyStatus;
  mimeType: string;
  totalSize: number;
  exp: number;
};

const SESSION_TTL_MS = 1000 * 60 * 90; // 90 minutes

function getSigningSecret(): string | null {
  const admin = process.env.BOMKONG_ADMIN_SECRET?.trim();
  if (admin) return admin;
  const yt = process.env.YOUTUBE_CLIENT_SECRET?.trim();
  return yt || null;
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

export function isYoutubePrivacyStatus(
  value: string,
): value is YoutubePrivacyStatus {
  return value === "private" || value === "unlisted" || value === "public";
}

/** Pack YouTube resumable Location URL into a short-lived signed token. */
export function mintUploadSessionToken(
  input: Omit<YoutubeUploadSessionPayload, "exp">,
): string | null {
  const secret = getSigningSecret();
  if (!secret) return null;
  const payload: YoutubeUploadSessionPayload = {
    ...input,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  return `${body}.${sign(body, secret)}`;
}

export function readUploadSessionToken(
  token: string | null | undefined,
): YoutubeUploadSessionPayload | null {
  const secret = getSigningSecret();
  if (!secret || !token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!safeEqual(sig, sign(body, secret))) return null;
  try {
    const json = Buffer.from(body, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as Partial<YoutubeUploadSessionPayload>;
    if (
      typeof parsed.uploadUrl !== "string" ||
      typeof parsed.title !== "string" ||
      typeof parsed.mimeType !== "string" ||
      typeof parsed.totalSize !== "number" ||
      typeof parsed.exp !== "number" ||
      !parsed.privacyStatus ||
      !isYoutubePrivacyStatus(parsed.privacyStatus)
    ) {
      return null;
    }
    if (Date.now() > parsed.exp) return null;
    if (!parsed.uploadUrl.startsWith("https://")) return null;
    return {
      uploadUrl: parsed.uploadUrl,
      title: parsed.title,
      privacyStatus: parsed.privacyStatus,
      mimeType: parsed.mimeType,
      totalSize: parsed.totalSize,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}
