import sampleEpisodes from "@/data/episodes.json";
import type { Episode, PlayTrack, QueueItem } from "@/lib/types";

/** 자리표시 본편 — 외부 링크 대신 로컬(아이 기기에서 바로 재생). */
export const PLACEHOLDER_VIDEO = "/videos/placeholder.mp4";

export function getEpisodes(): Episode[] {
  return [...(sampleEpisodes as Episode[])].sort(
    (a, b) => a.number - b.number,
  );
}

export function getEpisodeById(id: string): Episode | undefined {
  return getEpisodes().find((ep) => ep.id === id);
}

export function getEpisodeByNumber(number: number): Episode | undefined {
  return getEpisodes().find((ep) => ep.number === number);
}

/** 한 → 같은 편 영(없으면 다음 한) → 다음 한 … */
export function getNextInQueue(
  episodeId: string,
  track: PlayTrack,
): QueueItem | null {
  const current = getEpisodeById(episodeId);
  if (!current) return null;

  if (track === "ko") {
    if (current.hasEn) {
      return { episodeId: current.id, track: "en" };
    }
    return findNextKorean(current.number);
  }

  return findNextKorean(current.number);
}

function findNextKorean(afterNumber: number): QueueItem | null {
  const next = getEpisodes().find(
    (ep) => ep.number > afterNumber && ep.hasKo,
  );
  if (!next) return null;
  return { episodeId: next.id, track: "ko" };
}

export function trackLabel(track: PlayTrack): string {
  return track === "ko" ? "한국어" : "영어";
}

export function learnWord(episode: Episode, track: PlayTrack): string {
  return track === "ko"
    ? `${episode.wordEn} (${episode.wordKo})`
    : `${episode.wordKo} (${episode.wordEn})`;
}

export function canPlay(episode: Episode, track: PlayTrack): boolean {
  return track === "ko" ? episode.hasKo : episode.hasEn;
}

/** 다음 버튼·안내문에 쓸 쉬운 한글 한 줄 */
export function describeQueueItem(item: QueueItem): string {
  const ep = getEpisodeById(item.episodeId);
  if (!ep) return trackLabel(item.track);

  if (item.track === "en") {
    return `같은 편 영어 · ${ep.number}편`;
  }
  return `다음 한국어 · ${ep.number}편 「${ep.titleKo}」`;
}

export function shortQueueLabel(item: QueueItem): string {
  const ep = getEpisodeById(item.episodeId);
  if (!ep) return trackLabel(item.track);
  return item.track === "en"
    ? `${ep.number}편 영어`
    : `${ep.number}편 한국어`;
}
