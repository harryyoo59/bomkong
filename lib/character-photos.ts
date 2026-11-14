/** 봄이·콩이·둘이 함께 칸 아래 · 영상규칙용 사진 보관 (이 기기 브라우저에만 기억) */

export type CharacterShelf = "bomi" | "kongi" | "duo";

export type CharacterPhotoItem = {
  id: string;
  name: string;
  note: string;
  addedAt: string;
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

export function readCharacterPhotoStore(
  shelf: CharacterShelf,
): CharacterPhotoStore {
  if (typeof window === "undefined") return EMPTY_CHARACTER_PHOTO_STORE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS[shelf]);
    if (!raw) return EMPTY_CHARACTER_PHOTO_STORE;
    const parsed = JSON.parse(raw) as Partial<CharacterPhotoStore>;
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch {
    return EMPTY_CHARACTER_PHOTO_STORE;
  }
}

export function writeCharacterPhotoStore(
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
