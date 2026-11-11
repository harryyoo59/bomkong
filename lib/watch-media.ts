/** 영상보기 보관실(관리자실 9번) — 거실 「영상보기」전용. 이 기기 브라우저에만 기억 */

export type WatchItem = {
  id: string;
  /** 파일 이름 (관리용 미리보기 · 자리만) */
  name: string;
  /** 아이들이 보는 제목 */
  title: string;
  /** 손님 클릭 시 열 유튜브 주소(또는 영상 아이디) */
  youtubeUrl: string;
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

/** 붙여 넣은 주소·아이디를 유튜브 시청 주소로 바꿈. 못 바꾸면 null */
export function resolveYoutubeWatchUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return `https://www.youtube.com/watch?v=${trimmed}`;
  }

  try {
    const withProto = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const u = new URL(withProto);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id && /^[a-zA-Z0-9_-]{6,}$/.test(id)) {
        return `https://www.youtube.com/watch?v=${id}`;
      }
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      const v = u.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{6,}$/.test(v)) {
        return `https://www.youtube.com/watch?v=${v}`;
      }
      const pathMatch = u.pathname.match(
        /\/(?:shorts|embed|live|v)\/([a-zA-Z0-9_-]+)/,
      );
      if (pathMatch?.[1]) {
        return `https://www.youtube.com/watch?v=${pathMatch[1]}`;
      }
    }
  } catch {
    /* 아래 예외 처리 */
  }

  if (
    /^https?:\/\//i.test(trimmed) &&
    /youtu\.?be/i.test(trimmed)
  ) {
    return trimmed;
  }

  return null;
}

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
    youtubeUrl:
      typeof raw.youtubeUrl === "string" ? raw.youtubeUrl.trim() : "",
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
