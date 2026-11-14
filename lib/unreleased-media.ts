/** 미공개 영상실 — 완성됐지만 아직 유튜브에 안 올린 영상 (이 기기 브라우저에만 기억)
 *  한국어·영어 시장용 목록을 따로 둠
 */

export type UnreleasedLang = "ko" | "en";

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
    // 짧은 메모는 더 이상 쓰지 않음 · 예전 값도 비움
    note: "",
    addedAt:
      typeof raw.addedAt === "string" ? raw.addedAt : new Date().toISOString(),
    youtubeStatus: "not_uploaded",
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

  writeUnreleasedMediaStore("ko", legacy);
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
