/** 소스 보관실 · 쿠키완료실 — 이 기기 브라우저에만 기억 (서버 저장 전 자리) */

export type SourceKind = "photo" | "video";

export type SourceItem = {
  id: string;
  kind: SourceKind;
  name: string;
  note: string;
  addedAt: string;
};

export type CookieItem = {
  id: string;
  kind: SourceKind;
  name: string;
  /** 쿠키 영상에 쓴 제목 */
  videoTitle: string;
  movedAt: string;
  sourceId: string;
};

export type SourceMediaStore = {
  sources: SourceItem[];
  cookies: CookieItem[];
};

const STORAGE_KEY = "bomkong_source_cookie_v1";

export const EMPTY_STORE: SourceMediaStore = {
  sources: [],
  cookies: [],
};

export function kindLabel(kind: SourceKind): string {
  return kind === "photo" ? "사진" : "동영상";
}

export function detectKind(fileName: string, mimeType?: string): SourceKind {
  const mime = (mimeType || "").toLowerCase();
  if (mime.startsWith("image/")) return "photo";
  if (mime.startsWith("video/")) return "video";
  const lower = fileName.toLowerCase();
  if (/\.(png|jpe?g|gif|webp|heic|bmp|avif)$/i.test(lower)) return "photo";
  return "video";
}

export function readSourceMediaStore(): SourceMediaStore {
  if (typeof window === "undefined") return EMPTY_STORE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STORE;
    const parsed = JSON.parse(raw) as Partial<SourceMediaStore>;
    return {
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      cookies: Array.isArray(parsed.cookies) ? parsed.cookies : [],
    };
  } catch {
    return EMPTY_STORE;
  }
}

export function writeSourceMediaStore(store: SourceMediaStore): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
