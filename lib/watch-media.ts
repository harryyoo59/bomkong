/** 영상보기 보관실(관리자실 6번) — 거실 「영상보기」전용. 인터넷 저장 + 기기 임시 기억 */

export type WatchLang = "ko" | "en";

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
  /** 편 번호 (0, 1, 2…) — 나중에 넣은 편이 큰 번호 */
  episodeNumber: number;
  /** 같은 편의 한국어(ko) / 영어(en) */
  lang: WatchLang;
  /** 관리용 미리보기 인터넷 보관 경로 */
  previewStoragePath?: string;
  /** 관리용 미리보기 파일 종류 */
  previewMimeType?: string;
};

export const WATCH_PREVIEWS_BUCKET = "watch-previews";

export function watchPreviewStoragePath(
  id: string,
  mimeType: string,
): string {
  const safeId = id.replace(/[^a-zA-Z0-9._-]/g, "_");
  const mime = (mimeType || "").toLowerCase();
  let ext = "mp4";
  if (mime.includes("webm")) ext = "webm";
  else if (mime.includes("quicktime") || mime.includes("mov")) ext = "mov";
  else if (mime.includes("m4v")) ext = "m4v";
  return `${safeId}.${ext}`;
}

export function watchPreviewPublicUrl(
  supabaseUrl: string,
  storagePath: string,
): string {
  const base = supabaseUrl.replace(/\/$/, "");
  const path = storagePath.replace(/^\//, "");
  return `${base}/storage/v1/object/public/${WATCH_PREVIEWS_BUCKET}/${path}`;
}

export type WatchMediaStore = {
  items: WatchItem[];
};

const STORAGE_KEY = "bomkong_watch_video_v1";
/** 덮어쓰기 사고 대비 백업 (비어 있지 않을 때만 갱신) */
const BACKUP_STORAGE_KEY = "bomkong_watch_video_backup_v1";

export const EMPTY_WATCH_STORE: WatchMediaStore = {
  items: [],
};

/** 화면·목록에 쓸 자리 이름 예: 1-ko, 2-en */
export function watchSlotLabel(
  item: Pick<WatchItem, "episodeNumber" | "lang">,
): string {
  return `${item.episodeNumber}-${item.lang}`;
}

export function compareWatchPlayOrder(a: WatchItem, b: WatchItem): number {
  if (a.episodeNumber !== b.episodeNumber) {
    return a.episodeNumber - b.episodeNumber;
  }
  if (a.lang === b.lang) return a.id.localeCompare(b.id);
  return a.lang === "ko" ? -1 : 1;
}

/** 재생·손님 목록 순서: 1-ko → 1-en → 2-ko → 2-en … */
export function sortWatchItemsForPlay(items: WatchItem[]): WatchItem[] {
  return [...items].sort(compareWatchPlayOrder);
}

/** 관리자 목록용: 번호 큰 것이 위, 1번은 맨 아래. 같은 번호는 한국어 → 영어 */
export function sortWatchItemsNumberDesc(items: WatchItem[]): WatchItem[] {
  return [...items].sort((a, b) => {
    if (a.episodeNumber !== b.episodeNumber) {
      return b.episodeNumber - a.episodeNumber;
    }
    if (a.lang === b.lang) return a.id.localeCompare(b.id);
    return a.lang === "ko" ? -1 : 1;
  });
}

/** 관리자 목록용: 나중에 넣은 것이 위로 (스크롤 줄이기) */
export function sortWatchItemsNewestFirst(items: WatchItem[]): WatchItem[] {
  return [...items].sort((a, b) => {
    const byTime = b.addedAt.localeCompare(a.addedAt);
    if (byTime !== 0) return byTime;
    return b.id.localeCompare(a.id);
  });
}

export function findWatchSlot(
  items: WatchItem[],
  episodeNumber: number,
  lang: WatchLang,
): WatchItem | undefined {
  return items.find(
    (it) => it.episodeNumber === episodeNumber && it.lang === lang,
  );
}

/** 새로 넣을 때 쓸 다음 편 번호(한국어 기준 최대+1). 비어 있으면 0 */
export function suggestNextEpisodeNumber(items: WatchItem[]): number {
  const max = items.reduce(
    (acc, it) => (it.episodeNumber > acc ? it.episodeNumber : acc),
    -1,
  );
  return max + 1;
}

/** 지정한 언어로 비어 있는 편 번호(구멍 채우기 → 없으면 새 번호) */
export function suggestNextEpisodeNumberForLang(
  items: WatchItem[],
  lang: WatchLang,
): number {
  const numbers = [
    ...new Set(items.map((it) => it.episodeNumber)),
  ].sort((a, b) => a - b);
  for (const n of numbers) {
    if (!findWatchSlot(items, n, lang)) return n;
  }
  return suggestNextEpisodeNumber(items);
}

/**
 * 다음에 넣을 자리 추천.
 * - 영어만 있는 편이 있으면 → 그 번호의 한국어 (영어 먼저 넣어도 짝을 맞춤)
 * - 한국어만 있는 편이 있으면 → 그 번호의 영어 (1-ko 다음엔 1-en)
 * - 없으면 → 새 번호의 한국어
 */
export function suggestNextWatchSlot(items: WatchItem[]): {
  episodeNumber: number;
  lang: WatchLang;
} {
  const ordered = sortWatchItemsForPlay(items);
  const numbers = [
    ...new Set(ordered.map((it) => it.episodeNumber)),
  ].sort((a, b) => a - b);

  for (const n of numbers) {
    const hasKo = Boolean(findWatchSlot(ordered, n, "ko"));
    const hasEn = Boolean(findWatchSlot(ordered, n, "en"));
    if (hasEn && !hasKo) {
      return { episodeNumber: n, lang: "ko" };
    }
  }

  for (const n of numbers) {
    const hasKo = Boolean(findWatchSlot(ordered, n, "ko"));
    const hasEn = Boolean(findWatchSlot(ordered, n, "en"));
    if (hasKo && !hasEn) {
      return { episodeNumber: n, lang: "en" };
    }
  }

  return {
    episodeNumber: suggestNextEpisodeNumber(ordered),
    lang: "ko",
  };
}

/** 방금 넣은 항목 다음에 무엇을 넣을지 (같은 편 짝 맞추기) */
export function suggestWatchSlotAfterAdd(
  items: WatchItem[],
  justAdded: Pick<WatchItem, "episodeNumber" | "lang">,
): { episodeNumber: number; lang: WatchLang } {
  if (
    justAdded.lang === "ko" &&
    !findWatchSlot(items, justAdded.episodeNumber, "en")
  ) {
    return { episodeNumber: justAdded.episodeNumber, lang: "en" };
  }
  if (
    justAdded.lang === "en" &&
    !findWatchSlot(items, justAdded.episodeNumber, "ko")
  ) {
    return { episodeNumber: justAdded.episodeNumber, lang: "ko" };
  }
  return suggestNextWatchSlot(items);
}

/**
 * 영어만 있는 편 바로 다음 번호에 한국어만 있으면 같은 편으로 맞춤.
 * (영어를 먼저 넣으면 예전에 1-en · 2-ko로 갈라지던 것 → 1-ko · 1-en)
 * 그러면 로비·재생은 항상 한국어 → 영어 순이 됨.
 */
export function repairSplitLanguagePairs(items: WatchItem[]): WatchItem[] {
  let next = items.map((it) => ({ ...it }));
  let changed = true;

  while (changed) {
    changed = false;
    const ordered = sortWatchItemsForPlay(next);
    const numbers = [
      ...new Set(ordered.map((it) => it.episodeNumber)),
    ].sort((a, b) => a - b);

    for (const n of numbers) {
      const hasKo = Boolean(findWatchSlot(next, n, "ko"));
      const hasEn = Boolean(findWatchSlot(next, n, "en"));
      if (!(hasEn && !hasKo)) continue;

      const orphanKoNum = numbers.find((m) => {
        if (m <= n) return false;
        return (
          Boolean(findWatchSlot(next, m, "ko")) &&
          !Boolean(findWatchSlot(next, m, "en"))
        );
      });
      // 바로 다음 번호만 자동으로 붙임 (멀리 떨어진 편은 건드리지 않음)
      if (orphanKoNum !== n + 1) continue;

      next = next.map((it) =>
        it.episodeNumber === orphanKoNum && it.lang === "ko"
          ? { ...it, episodeNumber: n }
          : it,
      );
      changed = true;
      break;
    }
  }

  return sortWatchItemsForPlay(next);
}

function looksLikeYoutubeVideoId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{6,}$/.test(id);
}

/** 유튜브 영상 아이디만 뽑음. 못 찾으면 null */
export function extractYoutubeVideoId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const withProto = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const u = new URL(withProto);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id && looksLikeYoutubeVideoId(id)) {
        return id;
      }
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com" ||
      host === "studio.youtube.com"
    ) {
      const v = u.searchParams.get("v");
      if (v && looksLikeYoutubeVideoId(v)) {
        return v;
      }
      // 시청·숏츠·스튜디오 편집 주소까지
      const pathMatch = u.pathname.match(
        /\/(?:shorts|embed|live|v|video)\/([a-zA-Z0-9_-]+)/,
      );
      if (pathMatch?.[1] && looksLikeYoutubeVideoId(pathMatch[1])) {
        return pathMatch[1];
      }
    }
  } catch {
    /* ignore */
  }

  return null;
}

/** 밖에서 「유튜브에서 보기」로 열 수 있는 주소인지 (채널만 있으면 안 됨) */
export function hasPlayableYoutubeUrl(raw: string): boolean {
  return Boolean(extractYoutubeVideoId(raw));
}

/**
 * 지금 영상부터 재생 순서대로 유튜브 아이디 목록.
 * 1-ko → 1-en → 2-ko … (주소 없는 칸은 건너뜀)
 */
export function collectPlayableYoutubeIdsFrom(
  items: WatchItem[],
  startId: string,
): string[] {
  const ordered = sortWatchItemsForPlay(items);
  const start = ordered.findIndex((it) => it.id === startId);
  if (start < 0) return [];

  const ids: string[] = [];
  for (let offset = 0; offset < ordered.length; offset += 1) {
    const it = ordered[(start + offset) % ordered.length];
    const videoId = extractYoutubeVideoId(it.youtubeUrl);
    if (videoId) ids.push(videoId);
  }
  return ids;
}

/**
 * 유튜브에서 지금 편부터 순서대로 이어서 보는 주소.
 * 조회수·큰 화면용으로 유튜브를 열 때 씀.
 * (유튜브 「다음 동영상 자동재생」이 켜져 있어야 다음 편이 이어짐)
 */
export function buildYoutubePlayQueueUrl(
  items: WatchItem[],
  startId: string,
): string | null {
  const ids = collectPlayableYoutubeIdsFrom(items, startId);
  if (ids.length === 0) return null;
  if (ids.length === 1) {
    return `https://www.youtube.com/watch?v=${ids[0]}`;
  }
  // 임시 재생 목록 → 같은 화면으로 열어야 목록이 유지됨
  return `https://www.youtube.com/watch_videos?video_ids=${ids.join(",")}`;
}

/** 유튜브 이어보기는 새 창이 아니라 같은 화면으로 열어야 다음 편이 붙음 */
export function openYoutubePlayQueue(url: string): void {
  if (typeof window === "undefined") return;
  window.location.assign(url);
}

/** 한국어·영어 채널 — 영상보기 방 언어에 따라 자동으로 넣음 */
export const YOUTUBE_CHANNEL_BY_LANG: Record<WatchLang, string> = {
  ko: "https://www.youtube.com/@%EB%B4%84%EC%9D%B4%EC%BD%A9%EC%9D%B4BomKong",
  en: "https://www.youtube.com/@bomkong-En",
};

export function youtubeChannelUrlForLang(lang: WatchLang): string {
  return YOUTUBE_CHANNEL_BY_LANG[lang];
}

/** 우리가 아는 채널 주소인지 (한글로 풀어 쓴 주소도 포함) */
export function isKnownYoutubeChannelUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (
    trimmed === YOUTUBE_CHANNEL_BY_LANG.ko ||
    trimmed === YOUTUBE_CHANNEL_BY_LANG.en
  ) {
    return true;
  }
  try {
    const decoded = decodeURIComponent(trimmed);
    return (
      decoded === "https://www.youtube.com/@봄이콩이BomKong" ||
      decoded === YOUTUBE_CHANNEL_BY_LANG.en
    );
  } catch {
    return false;
  }
}

/**
 * 비어 있거나 채널 주소만 있으면 언어에 맞는 채널로 맞춤.
 * 이미 특정 영상 주소가 있으면 그대로 둠.
 */
export function youtubeUrlForWatchLang(
  lang: WatchLang,
  currentUrl = "",
): string {
  const trimmed = currentUrl.trim();
  if (!trimmed || isKnownYoutubeChannelUrl(trimmed)) {
    return youtubeChannelUrlForLang(lang);
  }
  return trimmed;
}

/**
 * 붙여 넣은 주소·아이디를 「재생 가능한」 유튜브 시청 주소로 바꿈.
 * 채널 주소만 있으면 null (밖 목록과 같은 기준).
 */
export function resolveYoutubeWatchUrl(raw: string): string | null {
  const id = extractYoutubeVideoId(raw);
  if (!id) return null;
  return `https://www.youtube.com/watch?v=${id}`;
}

function parseLang(raw: unknown): WatchLang | null {
  if (raw === "ko" || raw === "en") return raw;
  return null;
}

/** 유효하면 0 이상 정수, 없으면 -1 (아직 번호 없음) */
function parseEpisodeNumber(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
    return Math.floor(raw);
  }
  if (typeof raw === "string" && raw.trim()) {
    const n = Number(raw.trim());
    if (Number.isFinite(n) && n >= 0) return Math.floor(n);
  }
  return -1;
}

function normalizeItem(raw: Partial<WatchItem> & Record<string, unknown>): WatchItem | null {
  if (!raw || typeof raw.id !== "string" || typeof raw.name !== "string") {
    return null;
  }
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title) return null;
  const lang = parseLang(raw.lang) ?? "ko";
  const previewStoragePathRaw =
    typeof raw.previewStoragePath === "string"
      ? raw.previewStoragePath.trim()
      : typeof raw.preview_storage_path === "string"
        ? raw.preview_storage_path.trim()
        : "";
  const previewMimeTypeRaw =
    typeof raw.previewMimeType === "string"
      ? raw.previewMimeType.trim()
      : typeof raw.preview_mime_type === "string"
        ? raw.preview_mime_type.trim()
        : "";
  return {
    id: raw.id,
    name: raw.name,
    title,
    youtubeUrl:
      typeof raw.youtubeUrl === "string" ? raw.youtubeUrl.trim() : "",
    note: typeof raw.note === "string" ? raw.note : "",
    addedAt:
      typeof raw.addedAt === "string" ? raw.addedAt : new Date().toISOString(),
    episodeNumber: parseEpisodeNumber(raw.episodeNumber),
    lang,
    ...(previewStoragePathRaw
      ? { previewStoragePath: previewStoragePathRaw }
      : {}),
    ...(previewMimeTypeRaw ? { previewMimeType: previewMimeTypeRaw } : {}),
  };
}

/**
 * 예전 목록(번호 없음 · 최근 것이 앞) → 먼저 넣은 것부터 0-ko, 1-ko…
 * 이미 번호가 있는 항목은 그대로 두고, 없는 것만 뒤에 번호를 붙임.
 */
export function ensureWatchPlaySlots(items: WatchItem[]): WatchItem[] {
  const stamped = items.map((it) => ({
    ...it,
    lang: it.lang === "en" ? ("en" as const) : ("ko" as const),
    episodeNumber:
      Number.isFinite(it.episodeNumber) && it.episodeNumber >= 0
        ? Math.floor(it.episodeNumber)
        : -1,
  }));

  const missing = stamped.filter((it) => it.episodeNumber < 0);
  if (missing.length === 0) {
    return repairSplitLanguagePairs(stamped);
  }

  if (missing.length === stamped.length) {
    const chronological = [...stamped].sort((a, b) => {
      const byTime = a.addedAt.localeCompare(b.addedAt);
      return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
    });
    return sortWatchItemsForPlay(
      chronological.map((it, index) => ({
        ...it,
        episodeNumber: index,
        lang: "ko" as const,
      })),
    );
  }

  let next =
    stamped.reduce(
      (acc, it) => (it.episodeNumber > acc ? it.episodeNumber : acc),
      -1,
    ) + 1;
  const assigned = new Map<string, number>();
  const missingChrono = [...missing].sort((a, b) => {
    const byTime = a.addedAt.localeCompare(b.addedAt);
    return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
  });
  for (const it of missingChrono) {
    assigned.set(it.id, next);
    next += 1;
  }

  return repairSplitLanguagePairs(
    stamped.map((it) =>
      it.episodeNumber >= 0
        ? it
        : {
            ...it,
            episodeNumber: assigned.get(it.id) ?? 0,
            lang: "ko" as const,
          },
    ),
  );
}

function slotsChanged(before: WatchItem[], after: WatchItem[]): boolean {
  if (before.length !== after.length) return true;
  const afterById = new Map(after.map((it) => [it.id, it]));
  for (const it of before) {
    const next = afterById.get(it.id);
    if (!next) return true;
    if (next.episodeNumber !== it.episodeNumber || next.lang !== it.lang) {
      return true;
    }
  }
  return false;
}

export function readWatchMediaStore(): WatchMediaStore {
  if (typeof window === "undefined") return EMPTY_WATCH_STORE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_WATCH_STORE;
    const parsed = JSON.parse(raw) as Partial<WatchMediaStore>;
    const items = Array.isArray(parsed.items)
      ? parsed.items
          .map((it) =>
            normalizeItem(it as Partial<WatchItem> & Record<string, unknown>),
          )
          .filter((it): it is WatchItem => Boolean(it))
      : [];
    const slotted = ensureWatchPlaySlots(items);
    const notesCleared = slotted.some((it) => Boolean(it.note));
    // 짧은 메모는 더 이상 쓰지 않음 · 예전 값도 비움
    const ensured = notesCleared
      ? slotted.map((it) => (it.note ? { ...it, note: "" } : it))
      : slotted;
    if (slotsChanged(items, ensured) || notesCleared) {
      writeWatchMediaStore({ items: ensured });
    }
    return { items: ensured };
  } catch {
    return EMPTY_WATCH_STORE;
  }
}

function readRawWatchItems(key: string): WatchItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<WatchMediaStore>;
    const items = Array.isArray(parsed.items)
      ? parsed.items
          .map((it) =>
            normalizeItem(it as Partial<WatchItem> & Record<string, unknown>),
          )
          .filter((it): it is WatchItem => Boolean(it))
      : [];
    return ensureWatchPlaySlots(items);
  } catch {
    return [];
  }
}

export function writeWatchMediaStore(
  store: WatchMediaStore,
  options?: { allowEmpty?: boolean },
): void {
  if (typeof window === "undefined") return;
  const ordered = sortWatchItemsForPlay(store.items);
  // 비어 있지 않은 목록만 백업 — 빈 값으로 백업을 지우지 않음
  if (ordered.length > 0) {
    try {
      window.localStorage.setItem(
        BACKUP_STORAGE_KEY,
        JSON.stringify({ items: ordered }),
      );
    } catch {
      /* quota — 본문 저장은 계속 */
    }
  } else if (!options?.allowEmpty) {
    // 빈 목록으로 덮어쓰지 않음 — 실수로 거실 목록이 사라지는 것을 막음
    const existing = readRawWatchItems(STORAGE_KEY);
    if (existing.length > 0) return;
    const backup = readRawWatchItems(BACKUP_STORAGE_KEY);
    if (backup.length > 0) return;
  }
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ items: ordered }),
  );
}

/** 백업에서 목록 살리기 (지금 목록이 비었을 때만) */
export function restoreWatchMediaFromBackup(): WatchItem[] {
  const current = readWatchMediaStore().items;
  if (current.length > 0) return sortWatchItemsForPlay(current);
  const backup = readRawWatchItems(BACKUP_STORAGE_KEY);
  if (backup.length === 0) return [];
  writeWatchMediaStore({ items: backup });
  return sortWatchItemsForPlay(backup);
}

export function makeWatchId(): string {
  return `wv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getWatchItemById(id: string): WatchItem | undefined {
  return readWatchMediaStore().items.find((it) => it.id === id);
}

type WatchApiResponse = {
  ok?: boolean;
  items?: WatchItem[];
  error?: string;
};

function parseApiItems(raw: unknown): WatchItem[] {
  if (!Array.isArray(raw)) return [];
  return ensureWatchPlaySlots(
    raw
      .map((it) =>
        normalizeItem(it as Partial<WatchItem> & Record<string, unknown>),
      )
      .filter((it): it is WatchItem => Boolean(it)),
  );
}

/** 인터넷 목록만 읽음. 기기 기억을 함부로 비우지 않음 */
export async function fetchWatchMediaFromServer(): Promise<WatchItem[]> {
  const res = await fetch("/api/watch", { cache: "no-store" });
  const data = (await res.json()) as WatchApiResponse;
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "영상 목록을 불러오지 못했어요.");
  }
  return sortWatchItemsForPlay(parseApiItems(data.items));
}

/** 인터넷 목록을 기준으로 기기에 맞춤 */
export async function pullWatchMediaFromServer(): Promise<WatchItem[]> {
  return syncWatchMediaWithServer();
}

/** 인터넷·기기 목록을 칸 단위로 합침. 같은 칸은 기기 쪽을 우선. 지우지 않음. */
export function mergeWatchCatalog(
  remote: WatchItem[],
  local: WatchItem[],
): WatchItem[] {
  const byId = new Map<string, WatchItem>();
  for (const it of remote) byId.set(it.id, it);
  for (const it of local) byId.set(it.id, it);
  return sortWatchItemsForPlay(ensureWatchPlaySlots([...byId.values()]));
}

/** 관리자: 목록을 인터넷에 올려 다른 사람도 보게 함. 빈 목록으로는 올리지 않음. */
export async function pushWatchMediaToServer(
  items: WatchItem[],
): Promise<WatchItem[]> {
  const ordered = sortWatchItemsForPlay(ensureWatchPlaySlots(items));
  if (ordered.length === 0) {
    throw new Error(
      "빈 목록은 인터넷에 올리지 않아요. 지우는 일은 사장님이 직접 시킬 때만 해요.",
    );
  }
  const res = await fetch("/api/admin/watch", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: ordered }),
  });
  const data = (await res.json()) as WatchApiResponse;
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "영상 목록을 인터넷에 올리지 못했어요.");
  }
  const saved = sortWatchItemsForPlay(parseApiItems(data.items ?? ordered));
  // 올린 뒤 빈 응답이면 기기 목록을 지우지 않음
  if (saved.length === 0) {
    throw new Error("인터넷에 올렸는데 목록이 비어 돌아왔어요. 다시 해 주세요.");
  }
  if (saved.length < ordered.length) {
    throw new Error(
      "인터넷에 일부만 저장됐어요. 기기 목록은 그대로 두고 다시 올려 주세요.",
    );
  }
  writeWatchMediaStore({ items: saved });
  return saved;
}

/**
 * 미리보기 파일(이 기기)에서 영상보기 칸을 다시 만듦.
 * 제목·유튜브는 비어 있을 수 있어, 나중에 고치면 됨.
 */
export async function rebuildWatchMediaFromPreviews(): Promise<WatchItem[]> {
  if (typeof window === "undefined") return [];
  const { listAllMediaPreviews } = await import("@/lib/media-preview-store");
  const previews = await listAllMediaPreviews();
  const watchPreviews = previews
    .filter((row) => row.id.startsWith("wv-") && row.kind === "video")
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  if (watchPreviews.length === 0) return [];

  const items: WatchItem[] = watchPreviews.map((row, index) => {
    const mime = (row.mimeType || "").toLowerCase();
    const ext = mime.includes("webm")
      ? "webm"
      : mime.includes("quicktime")
        ? "mov"
        : "mp4";
    return {
      id: row.id,
      name: `restored-${index + 1}.${ext}`,
      title: `복구한 영상 ${index + 1}`,
      youtubeUrl: "",
      note: "",
      addedAt: row.updatedAt || new Date().toISOString(),
      episodeNumber: index,
      lang: "ko" as const,
    };
  });
  const ordered = sortWatchItemsForPlay(ensureWatchPlaySlots(items));
  writeWatchMediaStore({ items: ordered });
  return ordered;
}

function watchListSignature(items: WatchItem[]): string {
  return sortWatchItemsForPlay(items)
    .map(
      (it) =>
        `${it.id}|${it.episodeNumber}|${it.lang}|${it.title}|${it.youtubeUrl}`,
    )
    .join("\n");
}

async function askConfirm(
  ask: ((message: string) => boolean | Promise<boolean>) | undefined,
  message: string,
): Promise<boolean> {
  if (!ask) return false;
  return Boolean(await ask(message));
}

/**
 * 손님·관리자 공통: 영상보기 목록은 인터넷이 기준.
 * - 모두가 같은 목록을 봄
 * - 관리자 기기에서만 있고 인터넷이 비면 → 자동으로 올려서 맞춤
 * - 빈 인터넷으로 기기 목록을 지우지 않음 (올릴 때만 맞춤)
 */
export async function syncWatchMediaWithServer(options?: {
  allowUploadLocal?: boolean;
  /** 미리보기 복구처럼 큰 변경만 확인 */
  confirmChange?: (message: string) => boolean | Promise<boolean>;
}): Promise<WatchItem[]> {
  const allowUploadLocal = options?.allowUploadLocal === true;
  const confirmChange = options?.confirmChange;
  let local = readWatchMediaStore().items;

  // 지금이 비었으면 백업만 조용히 살림
  if (local.length === 0) {
    local = restoreWatchMediaFromBackup();
  }

  // 미리보기로 목록 다시 만들기 = 큰 변경 → 확인 필수
  if (local.length === 0 && allowUploadLocal) {
    const ok = await askConfirm(
      confirmChange,
      "목록이 비어 있어요. 이 기기에 남은 미리보기 파일로 칸을 다시 만들까요? (제목은 「복구한 영상」으로 시작할 수 있어요)",
    );
    if (ok) {
      try {
        local = await rebuildWatchMediaFromPreviews();
      } catch {
        /* ignore */
      }
    }
  }

  let remote: WatchItem[] = [];
  try {
    remote = await fetchWatchMediaFromServer();
  } catch {
    // 인터넷을 못 보면 이 기기 목록만이라도 보여 줌
    return sortWatchItemsForPlay(local);
  }

  // 인터넷이 비고 기기에만 있으면 → 관리자는 자동으로 올려서 다른 기기도 맞춤
  if (local.length > 0 && remote.length === 0) {
    if (allowUploadLocal) {
      try {
        return await pushWatchMediaToServer(local);
      } catch {
        writeWatchMediaStore({ items: local });
        return sortWatchItemsForPlay(local);
      }
    }
    // 거실: 인터넷이 아직 비어도 이 기기 목록은 그대로 보여 줌
    return sortWatchItemsForPlay(local);
  }

  // 인터넷에만 있으면 → 받아 와서 맞춤
  if (remote.length > 0 && local.length === 0) {
    writeWatchMediaStore({ items: remote });
    return remote;
  }

  // 둘 다 있으면: 합쳐서 맞춤 (어느 쪽도 함부로 버리지 않음)
  if (remote.length > 0 && local.length > 0) {
    const same = watchListSignature(local) === watchListSignature(remote);
    if (same) {
      writeWatchMediaStore({ items: remote });
      return remote;
    }

    const merged = mergeWatchCatalog(remote, local);
    if (allowUploadLocal) {
      try {
        return await pushWatchMediaToServer(merged);
      } catch {
        writeWatchMediaStore({ items: local });
        return sortWatchItemsForPlay(local);
      }
    }

    // 손님: 화면은 합친 목록을 보되, 기기 기억은 지우지 않음
    return merged;
  }

  // 둘 다 비면 백업까지 다시 확인
  if (local.length === 0) {
    local = restoreWatchMediaFromBackup();
  }
  return sortWatchItemsForPlay(local);
}
