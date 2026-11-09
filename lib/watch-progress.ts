import type { PlayTrack } from "@/lib/types";

/** 아이 사이트용 — 시청 위치만. 이름·계정 없음. */
export const WATCH_PROGRESS_KEY = "bomkong-watch-progress-v1";

export type WatchProgress = {
  episodeId: string;
  track: PlayTrack;
  /** 초 단위 */
  position: number;
  updatedAt: number;
};

export function readWatchProgress(): WatchProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(WATCH_PROGRESS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<WatchProgress>;
    if (
      typeof data.episodeId !== "string" ||
      (data.track !== "ko" && data.track !== "en") ||
      typeof data.position !== "number" ||
      !Number.isFinite(data.position) ||
      data.position < 0
    ) {
      return null;
    }
    return {
      episodeId: data.episodeId,
      track: data.track,
      position: data.position,
      updatedAt:
        typeof data.updatedAt === "number" ? data.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function writeWatchProgress(
  progress: Omit<WatchProgress, "updatedAt">,
): void {
  if (typeof window === "undefined") return;
  const payload: WatchProgress = {
    episodeId: progress.episodeId,
    track: progress.track,
    position: Math.max(0, progress.position),
    updatedAt: Date.now(),
  };
  try {
    window.localStorage.setItem(WATCH_PROGRESS_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode — 조용히 무시 */
  }
}

export function clearWatchProgress(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(WATCH_PROGRESS_KEY);
  } catch {
    /* ignore */
  }
}

export function watchHref(progress: WatchProgress, resume: boolean): string {
  const base = `/watch/${progress.episodeId}?lang=${progress.track}`;
  if (!resume || progress.position < 1) return base;
  return `${base}&t=${Math.floor(progress.position)}`;
}
