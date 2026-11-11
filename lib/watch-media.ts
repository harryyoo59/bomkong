/** 영상보기 보관실(관리자실 9번) — 거실 「영상보기」전용. 이 기기 브라우저에만 기억 */

export type WatchItem = {
  id: string;
  /** 파일 이름 (자리만 · 실제 파일 서버 저장 전) */
  name: string;
  /** 아이들이 보는 제목 */
  title: string;
  note: string;
  addedAt: string;
};

export type WatchMediaStore = {
  items: WatchItem[];
};

const STORAGE_KEY = "bomkong_watch_video_v1";

export const EMPTY_WATCH_STORE: WatchMediaStore = {
  items: [],
};

function normalizeItem(raw: Partial<WatchItem>): WatchItem | null {
  if (!raw || typeof raw.id !== "string" || typeof raw.name !== "string") {
    return null;
  }
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title) return null;
  return {
    id: raw.id,
    name: raw.name,
    title,
    note: typeof raw.note === "string" ? raw.note : "",
    addedAt:
      typeof raw.addedAt === "string" ? raw.addedAt : new Date().toISOString(),
  };
}

export function readWatchMediaStore(): WatchMediaStore {
  if (typeof window === "undefined") return EMPTY_WATCH_STORE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_WATCH_STORE;
    const parsed = JSON.parse(raw) as Partial<WatchMediaStore>;
    const items = Array.isArray(parsed.items)
      ? parsed.items
          .map((it) => normalizeItem(it as Partial<WatchItem>))
          .filter((it): it is WatchItem => Boolean(it))
      : [];
    return { items };
  } catch {
    return EMPTY_WATCH_STORE;
  }
}

export function writeWatchMediaStore(store: WatchMediaStore): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function makeWatchId(): string {
  return `wv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getWatchItemById(id: string): WatchItem | undefined {
  return readWatchMediaStore().items.find((it) => it.id === id);
}
