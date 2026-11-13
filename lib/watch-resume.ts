import {
  extractYoutubeVideoId,
  sortWatchItemsForPlay,
  type WatchItem,
} from "@/lib/watch-media";

/**
 * 거실 「영상보기」이어보기 자리 — 관리자 9번 목록 기준.
 * 유튜브를 연 영상을 이 기기 브라우저에만 기억해요.
 */
export const WATCH_RESUME_KEY = "bomkong_watch_resume_v1";

export type WatchResume = {
  /** 마지막으로 연 영상보기 방 항목 id */
  lastOpenedId: string;
  updatedAt: number;
};

export function readWatchResume(): WatchResume | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(WATCH_RESUME_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<WatchResume>;
    if (typeof data.lastOpenedId !== "string" || !data.lastOpenedId.trim()) {
      return null;
    }
    return {
      lastOpenedId: data.lastOpenedId,
      updatedAt:
        typeof data.updatedAt === "number" ? data.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function writeWatchResume(lastOpenedId: string): void {
  if (typeof window === "undefined") return;
  const id = lastOpenedId.trim();
  if (!id) return;
  const payload: WatchResume = {
    lastOpenedId: id,
    updatedAt: Date.now(),
  };
  try {
    window.localStorage.setItem(WATCH_RESUME_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode — 조용히 무시 */
  }
}

export function clearWatchResume(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(WATCH_RESUME_KEY);
  } catch {
    /* ignore */
  }
}

/** 목록에서 이어볼 자리(마지막으로 연 영상)의 재생 순서 번호. 없으면 0 */
export function findWatchResumeIndex(
  items: WatchItem[],
  lastOpenedId: string | null | undefined,
): number {
  if (!lastOpenedId || items.length === 0) return 0;
  const ordered = sortWatchItemsForPlay(items);
  const index = ordered.findIndex((it) => it.id === lastOpenedId);
  return index >= 0 ? index : 0;
}

/**
 * 이어보기용 순서: 마지막으로 연 영상부터 → 나머지 → 끝나면 첫 영상부터(한 바퀴).
 * 기본 재생 순서는 1-ko → 1-en → 2-ko → 2-en …
 */
export function orderWatchItemsForResume(
  items: WatchItem[],
  lastOpenedId: string | null | undefined,
): { item: WatchItem; playIndex: number; isResume: boolean }[] {
  const ordered = sortWatchItemsForPlay(items);
  if (ordered.length === 0) return [];
  const foundIndex =
    lastOpenedId && lastOpenedId.trim()
      ? ordered.findIndex((it) => it.id === lastOpenedId)
      : -1;
  const start = foundIndex >= 0 ? foundIndex : 0;
  const hasResume = foundIndex >= 0;
  const rotated: {
    item: WatchItem;
    playIndex: number;
    isResume: boolean;
  }[] = [];
  for (let offset = 0; offset < ordered.length; offset += 1) {
    const playIndex = (start + offset) % ordered.length;
    rotated.push({
      item: ordered[playIndex],
      playIndex,
      isResume: offset === 0 && hasResume,
    });
  }
  return rotated;
}

/**
 * 지금 영상 다음:
 * - 한국어면 같은 번호 영어(있으면)
 * - 영어 없거나 영어를 봤으면 다음 번호(있으면 그 번호의 한국어부터)
 * - 끝이면 첫 영상으로
 */
export function nextWatchItemAfter(
  items: WatchItem[],
  currentId: string,
): WatchItem | null {
  const ordered = sortWatchItemsForPlay(items);
  if (ordered.length === 0) return null;
  const index = ordered.findIndex((it) => it.id === currentId);
  if (index < 0) return ordered[0] ?? null;

  const current = ordered[index];
  if (current.lang === "ko") {
    const sameEn = ordered.find(
      (it) =>
        it.episodeNumber === current.episodeNumber && it.lang === "en",
    );
    if (sameEn) return sameEn;
  }

  const nextNumber = ordered.find(
    (it) => it.episodeNumber > current.episodeNumber,
  );
  if (nextNumber) return nextNumber;

  return ordered[0] ?? null;
}

/**
 * 유튜브 주소가 있는 다음 영상.
 * 주소 없는 칸은 건너뛰고, 한 바퀴 돌아 자기 자신만 남으면 null.
 */
export function nextPlayableWatchItemAfter(
  items: WatchItem[],
  currentId: string,
): WatchItem | null {
  const ordered = sortWatchItemsForPlay(items);
  if (ordered.length <= 1) return null;

  let cursor = currentId;
  for (let step = 0; step < ordered.length; step += 1) {
    const next = nextWatchItemAfter(ordered, cursor);
    if (!next || next.id === currentId) return null;
    if (extractYoutubeVideoId(next.youtubeUrl)) return next;
    cursor = next.id;
  }
  return null;
}
