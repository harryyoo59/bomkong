import type { WatchItem } from "@/lib/watch-media";

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

/** 목록에서 이어볼 자리(마지막으로 연 영상)의 원래 순서 번호. 없으면 0 */
export function findWatchResumeIndex(
  items: WatchItem[],
  lastOpenedId: string | null | undefined,
): number {
  if (!lastOpenedId || items.length === 0) return 0;
  const index = items.findIndex((it) => it.id === lastOpenedId);
  return index >= 0 ? index : 0;
}

/**
 * 이어보기용 순서: 마지막으로 연 영상부터 → 나머지 → 끝나면 첫 영상부터(한 바퀴).
 * 원래 방 순번(originalIndex)은 관리자 9번 목록 그대로.
 */
export function orderWatchItemsForResume(
  items: WatchItem[],
  lastOpenedId: string | null | undefined,
): { item: WatchItem; originalIndex: number; isResume: boolean }[] {
  if (items.length === 0) return [];
  const foundIndex =
    lastOpenedId && lastOpenedId.trim()
      ? items.findIndex((it) => it.id === lastOpenedId)
      : -1;
  const start = foundIndex >= 0 ? foundIndex : 0;
  const hasResume = foundIndex >= 0;
  const ordered: {
    item: WatchItem;
    originalIndex: number;
    isResume: boolean;
  }[] = [];
  for (let offset = 0; offset < items.length; offset += 1) {
    const originalIndex = (start + offset) % items.length;
    ordered.push({
      item: items[originalIndex],
      originalIndex,
      isResume: offset === 0 && hasResume,
    });
  }
  return ordered;
}

/** 지금 영상 다음(없으면 첫 영상). 목록이 비면 null */
export function nextWatchItemAfter(
  items: WatchItem[],
  currentId: string,
): WatchItem | null {
  if (items.length === 0) return null;
  const index = items.findIndex((it) => it.id === currentId);
  if (index < 0) return items[0] ?? null;
  return items[(index + 1) % items.length] ?? null;
}
