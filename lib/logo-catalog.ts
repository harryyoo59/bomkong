/** 로고 관리 — 일련번호·목록. 이 기기 브라우저에만 기억 (서버 저장 전 자리) */

export type LogoItem = {
  id: string;
  /** Harry가 붙이는 일련번호 */
  serial: number;
  title: string;
  blurb: string;
  /** 파일 이름(또는 자산 경로 표시용) */
  name: string;
  note: string;
  addedAt: string;
  /** 사이트에 미리 넣어 둔 공식 로고 */
  builtIn: boolean;
  src?: string;
  width?: number;
  height?: number;
};

export type LogoCatalogStore = {
  items: LogoItem[];
};

const STORAGE_KEY = "bomkong_logo_catalog_v1";

export const SEED_LOGOS: LogoItem[] = [
  {
    id: "01-bomkong-glossy",
    serial: 1,
    title: "봄콩 광택 글씨",
    blurb: "광택(글로시) 워드마크예요.",
    name: "logo.png",
    note: "",
    addedAt: "2026-01-01T00:00:00.000Z",
    builtIn: true,
    src: "/assets/logos/01-bomkong-glossy/logo.png",
    width: 1120,
    height: 2240,
  },
  {
    id: "02-bomkong-embroidered",
    serial: 2,
    title: "봄콩 자수 패치",
    blurb: "자수 패치 느낌 워드마크예요.",
    name: "logo.png",
    note: "",
    addedAt: "2026-01-01T00:00:00.000Z",
    builtIn: true,
    src: "/assets/logos/02-bomkong-embroidered/logo.png",
    width: 1904,
    height: 1280,
  },
  {
    id: "03-rhythm-parts",
    serial: 3,
    title: "리듬 부품",
    blurb: "자수·번개·별 부품이에요.",
    name: "logo.png",
    note: "",
    addedAt: "2026-01-01T00:00:00.000Z",
    builtIn: true,
    src: "/assets/logos/03-rhythm-parts/logo.png",
    width: 1904,
    height: 1280,
  },
  {
    id: "04-bomkong-rhythm-patch",
    serial: 4,
    title: "봄콩+리듬 합친 자수",
    blurb: "봄콩과 리듬이 합쳐진 자수 패치예요.",
    name: "logo.png",
    note: "",
    addedAt: "2026-01-01T00:00:00.000Z",
    builtIn: true,
    src: "/assets/logos/04-bomkong-rhythm-patch/logo.png",
    width: 1536,
    height: 1024,
  },
];

export const EMPTY_STORE: LogoCatalogStore = {
  items: [...SEED_LOGOS],
};

function normalizeItem(raw: Partial<LogoItem>, fallback?: LogoItem): LogoItem | null {
  const id = typeof raw.id === "string" && raw.id ? raw.id : fallback?.id;
  if (!id) return null;

  const seed = SEED_LOGOS.find((s) => s.id === id) ?? fallback;
  const serialRaw = Number(raw.serial);
  const serial =
    Number.isFinite(serialRaw) && serialRaw > 0
      ? Math.floor(serialRaw)
      : seed?.serial ?? 1;

  const builtIn = Boolean(raw.builtIn ?? seed?.builtIn ?? false);

  return {
    id,
    serial,
    title:
      typeof raw.title === "string" && raw.title.trim()
        ? raw.title.trim()
        : seed?.title ?? "이름 없는 로고",
    blurb:
      typeof raw.blurb === "string"
        ? raw.blurb.trim()
        : seed?.blurb ?? "",
    name:
      typeof raw.name === "string" && raw.name.trim()
        ? raw.name.trim()
        : seed?.name ?? "logo.png",
    note: typeof raw.note === "string" ? raw.note.trim() : seed?.note ?? "",
    addedAt:
      typeof raw.addedAt === "string" && raw.addedAt
        ? raw.addedAt
        : seed?.addedAt ?? new Date().toISOString(),
    builtIn,
    src: builtIn ? seed?.src ?? raw.src : raw.src,
    width: builtIn ? seed?.width ?? raw.width : raw.width,
    height: builtIn ? seed?.height ?? raw.height : raw.height,
  };
}

function mergeWithSeed(parsed: Partial<LogoCatalogStore> | null): LogoCatalogStore {
  const rawItems = Array.isArray(parsed?.items) ? parsed.items : [];
  const byId = new Map<string, Partial<LogoItem>>();
  for (const item of rawItems) {
    if (item && typeof item === "object" && typeof item.id === "string") {
      byId.set(item.id, item);
    }
  }

  const items: LogoItem[] = [];
  const seen = new Set<string>();

  for (const seed of SEED_LOGOS) {
    const override = byId.get(seed.id);
    const next = normalizeItem(override ?? seed, seed);
    if (next) {
      items.push(next);
      seen.add(next.id);
    }
  }

  for (const [id, raw] of byId) {
    if (seen.has(id)) continue;
    const next = normalizeItem(raw);
    if (next) {
      items.push(next);
      seen.add(next.id);
    }
  }

  return { items: sortBySerial(items) };
}

export function sortBySerial(items: LogoItem[]): LogoItem[] {
  return [...items].sort((a, b) => {
    if (a.serial !== b.serial) return a.serial - b.serial;
    return a.title.localeCompare(b.title, "ko");
  });
}

export function readLogoCatalog(): LogoCatalogStore {
  if (typeof window === "undefined") return EMPTY_STORE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STORE;
    const parsed = JSON.parse(raw) as Partial<LogoCatalogStore>;
    return mergeWithSeed(parsed);
  } catch {
    return EMPTY_STORE;
  }
}

export function writeLogoCatalog(store: LogoCatalogStore): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ items: sortBySerial(store.items) }),
  );
}

export function makeLogoId(): string {
  return `logo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function suggestNextSerial(items: LogoItem[]): number {
  if (items.length === 0) return 1;
  return Math.max(...items.map((it) => it.serial)) + 1;
}

export function formatSerial(serial: number): string {
  return String(Math.floor(serial)).padStart(2, "0");
}
