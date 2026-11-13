/** 영상보기 보관실(관리자실 9번) — 거실 「영상보기」전용. 이 기기 브라우저에만 기억 */

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
  /** 편 번호 (1, 2, 3…) — 나중에 넣은 편이 큰 번호 */
  episodeNumber: number;
  /** 같은 편의 한국어(ko) / 영어(en) */
  lang: WatchLang;
};

export type WatchMediaStore = {
  items: WatchItem[];
};

const STORAGE_KEY = "bomkong_watch_video_v1";

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

/** 새로 넣을 때 쓸 다음 편 번호(한국어 기준 최대+1) */
export function suggestNextEpisodeNumber(items: WatchItem[]): number {
  const max = items.reduce(
    (acc, it) => (it.episodeNumber > acc ? it.episodeNumber : acc),
    0,
  );
  return max + 1;
}

/**
 * 다음에 넣을 자리 추천.
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
    if (hasKo && !hasEn) {
      return { episodeNumber: n, lang: "en" };
    }
  }

  return {
    episodeNumber: suggestNextEpisodeNumber(ordered),
    lang: "ko",
  };
}

/** 방금 넣은 항목 다음에 무엇을 넣을지 (같은 편 영어 우선) */
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
  return suggestNextWatchSlot(items);
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
      if (id && /^[a-zA-Z0-9_-]{6,}$/.test(id)) {
        return id;
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
        return v;
      }
      const pathMatch = u.pathname.match(
        /\/(?:shorts|embed|live|v)\/([a-zA-Z0-9_-]+)/,
      );
      if (pathMatch?.[1] && /^[a-zA-Z0-9_-]{6,}$/.test(pathMatch[1])) {
        return pathMatch[1];
      }
    }
  } catch {
    /* ignore */
  }

  return null;
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

/** 붙여 넣은 주소·아이디를 유튜브 시청 주소로 바꿈. 못 바꾸면 null */
export function resolveYoutubeWatchUrl(raw: string): string | null {
  const id = extractYoutubeVideoId(raw);
  if (id) {
    return `https://www.youtube.com/watch?v=${id}`;
  }

  const trimmed = raw.trim();
  if (
    /^https?:\/\//i.test(trimmed) &&
    /youtu\.?be/i.test(trimmed)
  ) {
    return trimmed;
  }

  return null;
}

function parseLang(raw: unknown): WatchLang | null {
  if (raw === "ko" || raw === "en") return raw;
  return null;
}

function parseEpisodeNumber(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 1) {
    return Math.floor(raw);
  }
  if (typeof raw === "string" && raw.trim()) {
    const n = Number(raw.trim());
    if (Number.isFinite(n) && n >= 1) return Math.floor(n);
  }
  return 0;
}

function normalizeItem(raw: Partial<WatchItem> & Record<string, unknown>): WatchItem | null {
  if (!raw || typeof raw.id !== "string" || typeof raw.name !== "string") {
    return null;
  }
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title) return null;
  const lang = parseLang(raw.lang) ?? "ko";
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
  };
}

/**
 * 예전 목록(번호 없음 · 최근 것이 앞) → 먼저 넣은 것부터 1-ko, 2-ko…
 * 이미 번호가 있는 항목은 그대로 두고, 없는 것만 뒤에 번호를 붙임.
 */
export function ensureWatchPlaySlots(items: WatchItem[]): WatchItem[] {
  const stamped = items.map((it) => ({
    ...it,
    lang: it.lang === "en" ? ("en" as const) : ("ko" as const),
    episodeNumber:
      Number.isFinite(it.episodeNumber) && it.episodeNumber >= 1
        ? Math.floor(it.episodeNumber)
        : 0,
  }));

  const missing = stamped.filter((it) => it.episodeNumber < 1);
  if (missing.length === 0) {
    return sortWatchItemsForPlay(stamped);
  }

  if (missing.length === stamped.length) {
    const chronological = [...stamped].sort((a, b) => {
      const byTime = a.addedAt.localeCompare(b.addedAt);
      return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
    });
    return sortWatchItemsForPlay(
      chronological.map((it, index) => ({
        ...it,
        episodeNumber: index + 1,
        lang: "ko" as const,
      })),
    );
  }

  let next =
    stamped.reduce(
      (acc, it) => (it.episodeNumber > acc ? it.episodeNumber : acc),
      0,
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

  return sortWatchItemsForPlay(
    stamped.map((it) =>
      it.episodeNumber >= 1
        ? it
        : {
            ...it,
            episodeNumber: assigned.get(it.id) ?? 1,
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

export function writeWatchMediaStore(store: WatchMediaStore): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ items: sortWatchItemsForPlay(store.items) }),
  );
}

export function makeWatchId(): string {
  return `wv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getWatchItemById(id: string): WatchItem | undefined {
  return readWatchMediaStore().items.find((it) => it.id === id);
}
