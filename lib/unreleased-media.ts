/** 미공개 영상실 — 완성됐지만 아직 유튜브에 안 올린 영상 (이 기기 브라우저에만 기억) */

export type UnreleasedItem = {
  id: string;
  /** 파일 이름 (자리만 · 실제 파일 서버 저장 전) */
  name: string;
  /** 영상 제목 */
  title: string;
  note: string;
  addedAt: string;
  /** 아직 유튜브에 안 올림 */
  youtubeStatus: "not_uploaded";
};

export type UnreleasedMediaStore = {
  items: UnreleasedItem[];
};

const STORAGE_KEY = "bomkong_unreleased_video_v1";

export const EMPTY_UNRELEASED_STORE: UnreleasedMediaStore = {
  items: [],
};

export function readUnreleasedMediaStore(): UnreleasedMediaStore {
  if (typeof window === "undefined") return EMPTY_UNRELEASED_STORE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_UNRELEASED_STORE;
    const parsed = JSON.parse(raw) as Partial<UnreleasedMediaStore>;
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch {
    return EMPTY_UNRELEASED_STORE;
  }
}

export function writeUnreleasedMediaStore(store: UnreleasedMediaStore): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function makeUnreleasedId(): string {
  return `ur-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
