export type Visibility = "free" | "subscribers";

export type Episode = {
  id: string;
  number: number;
  titleKo: string;
  titleEn: string;
  wordEn: string;
  wordKo: string;
  hasKo: boolean;
  hasEn: boolean;
  cookieLabel: string;
  visibility: Visibility;
  summary?: string;
};

export type PlayTrack = "ko" | "en";

export type QueueItem = {
  episodeId: string;
  track: PlayTrack;
};
