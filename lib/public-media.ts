/** 공개 영상실 — 유튜브에 공개한 뒤의 원본 + 제목 (이 기기 브라우저에만 기억) */

export type PublicItem = {
  id: string;
  /** 원본 파일 이름 (자리만 · 실제 파일 서버 저장 전) */
  name: string;
  /** 공개한 영상 제목 */
  title: string;
  /** 유튜브 주소 (선택) */
  youtubeUrl: string;
  note: string;
  addedAt: string;
  /** 이미 공개함 */
  youtubeStatus: "public";
  /** 미공개 영상실에서 옮긴 경우 원래 id */
  fromUnreleasedId?: string;
};

export type PublicMediaStore = {
  items: PublicItem[];
};

const STORAGE_KEY = "bomkong_public_video_v1";
/** 예전 「유튜브 올린 영상실」 키 — 있으면 한 번 읽어 공개 영상실로 이어 받음 */
const LEGACY_UPLOADED_KEY = "bomkong_uploaded_video_v1";

export const EMPTY_PUBLIC_STORE: PublicMediaStore = {
  items: [],
};

function normalizeItem(raw: Partial<PublicItem>): PublicItem | null {
  if (!raw || typeof raw.id !== "string" || typeof raw.name !== "string") {
    return null;
  }
  const title = typeof raw.title === "string" ? raw.title : "";
  if (!title) return null;
  return {
    id: raw.id,
    name: raw.name,
    title,
    youtubeUrl: typeof raw.youtubeUrl === "string" ? raw.youtubeUrl : "",
    note: typeof raw.note === "string" ? raw.note : "",
    addedAt:
      typeof raw.addedAt === "string" ? raw.addedAt : new Date().toISOString(),
    youtubeStatus: "public",
    fromUnreleasedId:
      typeof raw.fromUnreleasedId === "string"
        ? raw.fromUnreleasedId
        : undefined,
  };
}

function readRawStore(key: string): PublicMediaStore {
  if (typeof window === "undefined") return EMPTY_PUBLIC_STORE;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return EMPTY_PUBLIC_STORE;
    const parsed = JSON.parse(raw) as Partial<PublicMediaStore>;
    const items = Array.isArray(parsed.items)
      ? parsed.items
          .map((it) => normalizeItem(it as Partial<PublicItem>))
          .filter((it): it is PublicItem => Boolean(it))
      : [];
    return { items };
  } catch {
    return EMPTY_PUBLIC_STORE;
  }
}

export function readPublicMediaStore(): PublicMediaStore {
  if (typeof window === "undefined") return EMPTY_PUBLIC_STORE;
  const current = readRawStore(STORAGE_KEY);
  if (current.items.length > 0) return current;

  const legacy = readRawStore(LEGACY_UPLOADED_KEY);
  if (legacy.items.length === 0) return EMPTY_PUBLIC_STORE;

  writePublicMediaStore(legacy);
  try {
    window.localStorage.removeItem(LEGACY_UPLOADED_KEY);
  } catch {
    /* ignore */
  }
  return legacy;
}

export function writePublicMediaStore(store: PublicMediaStore): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function makePublicId(): string {
  return `pb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
