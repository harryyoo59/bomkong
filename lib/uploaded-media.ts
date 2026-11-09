/** 유튜브 올린 영상실 — 이미 유튜브에 올린 원본 + 제목 (이 기기 브라우저에만 기억) */

export type UploadedItem = {
  id: string;
  /** 원본 파일 이름 (자리만 · 실제 파일 서버 저장 전) */
  name: string;
  /** 유튜브에 올린 제목 */
  title: string;
  /** 유튜브 주소 (선택) */
  youtubeUrl: string;
  note: string;
  addedAt: string;
  /** 이미 유튜브에 올림 */
  youtubeStatus: "uploaded";
};

export type UploadedMediaStore = {
  items: UploadedItem[];
};

const STORAGE_KEY = "bomkong_uploaded_video_v1";

export const EMPTY_UPLOADED_STORE: UploadedMediaStore = {
  items: [],
};

export function readUploadedMediaStore(): UploadedMediaStore {
  if (typeof window === "undefined") return EMPTY_UPLOADED_STORE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_UPLOADED_STORE;
    const parsed = JSON.parse(raw) as Partial<UploadedMediaStore>;
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch {
    return EMPTY_UPLOADED_STORE;
  }
}

export function writeUploadedMediaStore(store: UploadedMediaStore): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function makeUploadedId(): string {
  return `up-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
