/** 봄이·콩이·둘이 함께 칸 아래 · 영상규칙용 사진·동영상 보관 */

export type CharacterShelf = "bomi" | "kongi" | "duo";

/** 같은 캐릭터 안에서 사진 칸 / 동영상 칸 */
export type CharacterMediaKind = "photo" | "video";

export type CharacterPhotoItem = {
  id: string;
  name: string;
  note: string;
  addedAt: string;
  /** 인터넷에 올린 뒤 다른 기기에서 보는 주소 */
  publicUrl?: string;
  storagePath?: string;
  /** image/* 또는 video/* — 없으면 예전 데이터라 사진으로 봄 */
  mimeType?: string;
};

export type CharacterPhotoStore = {
  items: CharacterPhotoItem[];
};

const STORAGE_KEYS: Record<CharacterShelf, string> = {
  bomi: "bomkong_character_photos_bomi_v1",
  kongi: "bomkong_character_photos_kongi_v1",
  duo: "bomkong_character_photos_duo_v1",
};

export const EMPTY_CHARACTER_PHOTO_STORE: CharacterPhotoStore = {
  items: [],
};

export function characterShelfLabel(shelf: CharacterShelf): string {
  if (shelf === "bomi") return "봄이";
  if (shelf === "kongi") return "콩이";
  return "봄이·콩이";
}

export function characterMediaKindLabel(kind: CharacterMediaKind): string {
  return kind === "video" ? "동영상" : "사진";
}

/** mime 또는 예전 데이터(없음)로 사진/동영상 구분 */
export function characterMediaKind(
  item: Pick<CharacterPhotoItem, "mimeType" | "name" | "storagePath">,
): CharacterMediaKind {
  const mime = (item.mimeType || "").trim().toLowerCase();
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("image/")) return "photo";
  const path = `${item.storagePath || ""} ${item.name || ""}`.toLowerCase();
  if (/\.(mp4|mov|m4v|webm|avi|mkv)(\?|$)/i.test(path)) return "video";
  return "photo";
}

export function filterCharacterItemsByMediaKind(
  items: CharacterPhotoItem[],
  kind: CharacterMediaKind,
): CharacterPhotoItem[] {
  return items.filter((it) => characterMediaKind(it) === kind);
}

function normalizeItem(raw: Partial<CharacterPhotoItem>): CharacterPhotoItem | null {
  if (!raw || typeof raw.id !== "string" || !raw.id.trim()) return null;
  const mimeType =
    typeof raw.mimeType === "string" && raw.mimeType.trim()
      ? raw.mimeType.trim()
      : undefined;
  return {
    id: raw.id.trim(),
    name: typeof raw.name === "string" ? raw.name : "",
    note: typeof raw.note === "string" ? raw.note : "",
    addedAt:
      typeof raw.addedAt === "string" && raw.addedAt
        ? raw.addedAt
        : new Date().toISOString(),
    publicUrl:
      typeof raw.publicUrl === "string" && raw.publicUrl.trim()
        ? raw.publicUrl.trim()
        : undefined,
    storagePath:
      typeof raw.storagePath === "string" && raw.storagePath.trim()
        ? raw.storagePath.trim()
        : undefined,
    mimeType,
  };
}

export function readCharacterPhotoStore(
  shelf: CharacterShelf,
): CharacterPhotoStore {
  if (typeof window === "undefined") return EMPTY_CHARACTER_PHOTO_STORE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS[shelf]);
    if (!raw) return EMPTY_CHARACTER_PHOTO_STORE;
    const parsed = JSON.parse(raw) as Partial<CharacterPhotoStore>;
    const items = Array.isArray(parsed.items)
      ? parsed.items
          .map((row) => normalizeItem(row as Partial<CharacterPhotoItem>))
          .filter((it): it is CharacterPhotoItem => Boolean(it))
      : [];
    return { items };
  } catch {
    return EMPTY_CHARACTER_PHOTO_STORE;
  }
}

export function writeCharacterPhotoStore(
  shelf: CharacterShelf,
  store: CharacterPhotoStore,
): void {
  if (typeof window === "undefined") return;
  // 빈 목록으로 덮어쓰지 않음 — 실수로 갤러리가 사라지는 일 방지
  if (!store.items || store.items.length === 0) {
    const current = readCharacterPhotoStore(shelf);
    if (current.items.length > 0) return;
  }
  window.localStorage.setItem(STORAGE_KEYS[shelf], JSON.stringify(store));
}

/** 사장님이 직접 비울 때만 빈 목록 저장 */
export function writeCharacterPhotoStoreAllowEmpty(
  shelf: CharacterShelf,
  store: CharacterPhotoStore,
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS[shelf], JSON.stringify(store));
}

/**
 * 사진 칸·동영상 칸이 같은 보관함을 나눠 쓸 때,
 * 지금 칸 목록만 바꾸고 다른 칸 항목은 그대로 둠.
 */
export function replaceCharacterItemsForMediaKind(
  shelf: CharacterShelf,
  mediaKind: CharacterMediaKind,
  nextKindItems: CharacterPhotoItem[],
  allowEmptyKind = false,
): CharacterPhotoItem[] {
  const current = readCharacterPhotoStore(shelf).items;
  const others = filterCharacterItemsByMediaKind(
    current,
    mediaKind === "photo" ? "video" : "photo",
  );
  const kindItems = nextKindItems
    .map((row) => normalizeItem(row))
    .filter((it): it is CharacterPhotoItem => Boolean(it))
    .map((it) => ({
      ...it,
      mimeType:
        it.mimeType ||
        (mediaKind === "video" ? "video/mp4" : "image/jpeg"),
    }));
  const combined = [...kindItems, ...others].sort((a, b) => {
    const at = Date.parse(a.addedAt) || 0;
    const bt = Date.parse(b.addedAt) || 0;
    return bt - at;
  });
  if (allowEmptyKind || combined.length > 0) {
    writeCharacterPhotoStoreAllowEmpty(shelf, { items: combined });
  } else {
    writeCharacterPhotoStore(shelf, { items: combined });
  }
  return combined;
}

export function makeCharacterPhotoId(shelf: CharacterShelf): string {
  return `${shelf}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function characterPhotoRoomKey(
  shelf: CharacterShelf,
  mediaKind: CharacterMediaKind = "photo",
):
  | "bomi-photos"
  | "kongi-photos"
  | "duo-photos"
  | "bomi-videos"
  | "kongi-videos"
  | "duo-videos" {
  if (mediaKind === "video") {
    if (shelf === "bomi") return "bomi-videos";
    if (shelf === "kongi") return "kongi-videos";
    return "duo-videos";
  }
  if (shelf === "bomi") return "bomi-photos";
  if (shelf === "kongi") return "kongi-photos";
  return "duo-photos";
}

export function characterIntroPath(shelf: CharacterShelf): string {
  if (shelf === "bomi") return "/characters/bomi";
  if (shelf === "kongi") return "/characters/kongi";
  return "/characters/duo";
}

/**
 * 이 기기 + 인터넷 목록을 합침.
 * 같은 id면 이름·주소는 가능한 한 채우고, 어느 쪽도 버리지 않음.
 */
export function mergeCharacterPhotoLists(
  local: CharacterPhotoItem[],
  remote: CharacterPhotoItem[],
): CharacterPhotoItem[] {
  const map = new Map<string, CharacterPhotoItem>();
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
      note: prev.note || item.note,
      addedAt: prev.addedAt || item.addedAt,
      publicUrl: item.publicUrl || prev.publicUrl,
      storagePath: item.storagePath || prev.storagePath,
      mimeType: item.mimeType || prev.mimeType,
    });
  }
  return Array.from(map.values()).sort((a, b) => {
    const at = Date.parse(a.addedAt) || 0;
    const bt = Date.parse(b.addedAt) || 0;
    return bt - at;
  });
}
