/** 봄이·콩이·둘이 함께 칸 아래 · 영상규칙용 사진 보관 */

export type CharacterShelf = "bomi" | "kongi" | "duo";

export type CharacterPhotoItem = {
  id: string;
  name: string;
  note: string;
  addedAt: string;
  /** 인터넷에 올린 뒤 다른 기기에서 보는 주소 */
  publicUrl?: string;
  storagePath?: string;
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

function normalizeItem(raw: Partial<CharacterPhotoItem>): CharacterPhotoItem | null {
  if (!raw || typeof raw.id !== "string" || !raw.id.trim()) return null;
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

export function makeCharacterPhotoId(shelf: CharacterShelf): string {
  return `${shelf}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function characterPhotoRoomKey(
  shelf: CharacterShelf,
): "bomi-photos" | "kongi-photos" | "duo-photos" {
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
    });
  }
  return Array.from(map.values()).sort((a, b) => {
    const at = Date.parse(a.addedAt) || 0;
    const bt = Date.parse(b.addedAt) || 0;
    return bt - at;
  });
}
