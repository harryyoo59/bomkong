/** YouTube Data API — server-only env. Never invent real secrets. */

export type YoutubeConfig = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  redirectUri: string;
};

export type YoutubeConfigStatus = {
  configured: boolean;
  canStartOAuth: boolean;
  missing: string[];
  channelHint: string;
};

export const YOUTUBE_UPLOAD_SCOPE =
  "https://www.googleapis.com/auth/youtube.upload";

export const YOUTUBE_CHANNEL_HINT =
  "봄이콩이 / Siblings bomkong (https://www.youtube.com/@봄이콩이BomKong)";

export function getYoutubeConfig(): YoutubeConfig {
  return {
    clientId: process.env.YOUTUBE_CLIENT_ID?.trim() || "",
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET?.trim() || "",
    refreshToken: process.env.YOUTUBE_REFRESH_TOKEN?.trim() || "",
    redirectUri: process.env.YOUTUBE_REDIRECT_URI?.trim() || "",
  };
}

export function getYoutubeConfigStatus(): YoutubeConfigStatus {
  const cfg = getYoutubeConfig();
  const missing: string[] = [];
  if (!cfg.clientId) missing.push("YOUTUBE_CLIENT_ID");
  if (!cfg.clientSecret) missing.push("YOUTUBE_CLIENT_SECRET");
  if (!cfg.refreshToken) missing.push("YOUTUBE_REFRESH_TOKEN");

  return {
    configured: missing.length === 0,
    canStartOAuth: Boolean(cfg.clientId && cfg.clientSecret && cfg.redirectUri),
    missing,
    channelHint: YOUTUBE_CHANNEL_HINT,
  };
}

export function isYoutubeUploadReady(): boolean {
  return getYoutubeConfigStatus().configured;
}
