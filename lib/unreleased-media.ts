/** 미공개 영상실 — 완성됐지만 아직 유튜브에 안 올린 영상
 *  한국어·영어 시장용 목록을 따로 둠 · 인터넷 맞춤 + 이 기기 기억
 */

export type UnreleasedLang = "ko" | "en";

export type UnreleasedItem = {
  id: string;
  /** 파일 이름 */
  name: string;
  /** 영상 제목 */
  title: string;
  note: string;
  addedAt: string;
  /** 아직 유튜브에 안 올림 */
  youtubeStatus: "not_uploaded";
  /** 인터넷에 올린 뒤 다른 기기에서 보는 주소 */
  publicUrl?: string;
  storagePath?: string;
};

export type UnreleasedMediaStore = {
  items: UnreleasedItem[];
};

/** 예전 단일 키 — 있으면 한 번 읽어 한국어 목록으로 이어 받음 */
const LEGACY_STORAGE_KEY = "bomkong_unreleased_video_v1";

const STORAGE_KEYS: Record<UnreleasedLang, string> = {
  ko: "bomkong_unreleased_video_ko_v1",
  en: "bomkong_unreleased_video_en_v1",
};

export const UNRELEASED_LANG_LABELS: Record<UnreleasedLang, string> = {
  ko: "한국어",
  en: "영어",
};

export const EMPTY_UNRELEASED_STORE: UnreleasedMediaStore = {
  items: [],
};

function normalizeItem(raw: Partial<UnreleasedItem>): UnreleasedItem | null {
  if (!raw || typeof raw.id !== "string" || typeof raw.name !== "string") {
    return null;
  }
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title) return null;
  return {
    id: raw.id,
    name: raw.name,
    title,
    note: "",
    addedAt:
      typeof raw.addedAt === "string" ? raw.addedAt : new Date().toISOString(),
    youtubeStatus: "not_uploaded",
    publicUrl:
      typeof raw.publicUrl === "string" && raw.publicUrl.trim()
        ? raw.publicUrl.trim()
        : undefined,
    storagePath:
      typeof raw.storagePath === "string" && raw.storagePath.trim()
        ? raw.storagePath.trim()
        : undefined,
  };
}

function readRawStore(key: string): UnreleasedMediaStore {
  if (typeof window === "undefined") return EMPTY_UNRELEASED_STORE;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return EMPTY_UNRELEASED_STORE;
    const parsed = JSON.parse(raw) as Partial<UnreleasedMediaStore>;
    const rawItems = Array.isArray(parsed.items) ? parsed.items : [];
    const hadNotes = rawItems.some(
      (it) =>
        typeof (it as UnreleasedItem)?.note === "string" &&
        Boolean((it as UnreleasedItem).note.trim()),
    );
    const items = rawItems
      .map((it) => normalizeItem(it as Partial<UnreleasedItem>))
      .filter((it): it is UnreleasedItem => Boolean(it));
    const store = { items };
    if (hadNotes) {
      try {
        window.localStorage.setItem(key, JSON.stringify(store));
      } catch {
        /* ignore write-back failure */
      }
    }
    return store;
  } catch {
    return EMPTY_UNRELEASED_STORE;
  }
}

/** 예전 단일 목록 → 한국어 키로 한 번만 옮김 (데이터 보존) */
function migrateLegacyIntoKo(): UnreleasedMediaStore {
  if (typeof window === "undefined") return EMPTY_UNRELEASED_STORE;

  const koKey = STORAGE_KEYS.ko;
  const current = readRawStore(koKey);
  if (current.items.length > 0) return current;

  const legacy = readRawStore(LEGACY_STORAGE_KEY);
  if (legacy.items.length === 0) return EMPTY_UNRELEASED_STORE;

  writeUnreleasedMediaStoreAllowEmpty("ko", legacy);
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return legacy;
}

export function readUnreleasedMediaStore(
  lang: UnreleasedLang,
): UnreleasedMediaStore {
  if (typeof window === "undefined") return EMPTY_UNRELEASED_STORE;
  if (lang === "ko") return migrateLegacyIntoKo();
  return readRawStore(STORAGE_KEYS[lang]);
}

export function writeUnreleasedMediaStore(
  lang: UnreleasedLang,
  store: UnreleasedMediaStore,
): void {
  if (typeof window === "undefined") return;
  // 빈 목록으로 덮어쓰지 않음 — 실수로 사라지는 일 방지
  if (!store.items || store.items.length === 0) {
    const current = readUnreleasedMediaStore(lang);
    if (current.items.length > 0) return;
  }
  writeUnreleasedMediaStoreAllowEmpty(lang, store);
}

/** 사장님이 직접 비울 때만 빈 목록 저장 */
export function writeUnreleasedMediaStoreAllowEmpty(
  lang: UnreleasedLang,
  store: UnreleasedMediaStore,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS[lang], JSON.stringify(store));
  } catch (err) {
    const reason =
      err instanceof Error && /quota/i.test(err.message)
        ? "이 기기 저장 공간이 가득 찼어요. 목록을 조금 비운 뒤 다시 해 주세요."
        : "이 기기에 목록을 저장하지 못했어요. 시크릿(개인) 모드인지 확인해 주세요.";
    throw new Error(reason);
  }
}

export function makeUnreleasedId(): string {
  return `ur-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function unreleasedRoomPath(lang: UnreleasedLang): string {
  return `/admin/unreleased/${lang}`;
}

export const UNRELEASED_VIDEOS_BUCKET = "unreleased-videos";

export function unreleasedStoragePath(
  lang: UnreleasedLang,
  id: string,
  mimeType: string,
): string {
  const safeId = id.replace(/[^a-zA-Z0-9._-]/g, "_");
  const mime = (mimeType || "").toLowerCase();
  let ext = "mp4";
  if (mime.includes("webm")) ext = "webm";
  else if (mime.includes("quicktime") || mime.includes("mov")) ext = "mov";
  else if (mime.includes("m4v")) ext = "m4v";
  return `${lang}/${safeId}.${ext}`;
}

export function unreleasedVideoPublicUrl(
  supabaseUrl: string,
  storagePath: string,
): string {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${UNRELEASED_VIDEOS_BUCKET}/${storagePath}`;
}

/** 이 기기 + 인터넷 목록을 합침. 어느 쪽도 버리지 않음. */
export function mergeUnreleasedLists(
  local: UnreleasedItem[],
  remote: UnreleasedItem[],
): UnreleasedItem[] {
  const map = new Map<string, UnreleasedItem>();
  for (const row of local) {
    const item = normalizeItem(row);
    if (item) map.set(item.id, item);
  }
  for (const row of remote) {
    const item = normalizeItem(row);
    if (!item) continue;
    const prev = map.get(item.id);
    if (!prev) {
      map.set(item.id, item);
      continue;
    }
    map.set(item.id, {
      id: item.id,
      name: prev.name || item.name,
      title: prev.title || item.title,
      note: "",
      addedAt: prev.addedAt || item.addedAt,
      youtubeStatus: "not_uploaded",
      publicUrl: item.publicUrl || prev.publicUrl,
      storagePath: item.storagePath || prev.storagePath,
    });
  }
  return Array.from(map.values()).sort((a, b) => {
    const at = Date.parse(a.addedAt) || 0;
    const bt = Date.parse(b.addedAt) || 0;
    return bt - at;
  });
}
