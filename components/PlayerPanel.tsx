"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  PLACEHOLDER_VIDEO,
  describeQueueItem,
  getNextInQueue,
  learnWord,
  shortQueueLabel,
  trackLabel,
} from "@/lib/episodes";
import type { Episode, PlayTrack } from "@/lib/types";

export function PlayerPanel({
  episode,
  track,
}: {
  episode: Episode;
  track: PlayTrack;
}) {
  const router = useRouter();
  const next = getNextInQueue(episode.id, track);
  const title = track === "ko" ? episode.titleKo : episode.titleEn;

  function goNext() {
    if (!next) return;
    router.push(`/watch/${next.episodeId}?lang=${next.track}`);
  }

  return (
    <section className="player-panel">
      <div className="lang-switch" role="group" aria-label="언어 고르기">
        {episode.hasKo ? (
          <Link
            href={`/watch/${episode.id}?lang=ko`}
            className={
              track === "ko" ? "lang-pill lang-pill-on" : "lang-pill"
            }
            aria-current={track === "ko" ? "true" : undefined}
          >
            한국어
          </Link>
        ) : null}
        {episode.hasEn ? (
          <Link
            href={`/watch/${episode.id}?lang=en`}
            className={
              track === "en" ? "lang-pill lang-pill-on" : "lang-pill"
            }
            aria-current={track === "en" ? "true" : undefined}
          >
            영어
          </Link>
        ) : (
          <span className="lang-pill lang-pill-wait" title="아직 없어요">
            영어 준비 중
          </span>
        )}
      </div>

      <div className="video-stage" aria-label="영상 자리">
        <div className="video-lang-tag" aria-live="polite">
          지금 · {trackLabel(track)}
        </div>
        <video
          className="video-el"
          controls
          playsInline
          src={PLACEHOLDER_VIDEO}
        >
          이 브라우저는 영상을 재생할 수 없어요.
        </video>
        <div className="video-caption">
          <span className="badge">{trackLabel(track)} 본편</span>
          <span className="tiny">자리표시 영상</span>
        </div>
      </div>

      <div className="player-copy panel-flush">
        <p className="eyebrow">
          {episode.number}편 · {trackLabel(track)}
        </p>
        <h1>{title}</h1>
        <p>
          오늘 단어: <strong>{learnWord(episode, track)}</strong>
        </p>
        <p className="muted">
          {track === "ko"
            ? "봄이가 영어 단어를 알려 주고, 콩이가 따라 해요."
            : "봄이가 한국어 단어를 알려 주고, 콩이가 따라 해요."}
        </p>
        <p className="cookie-note">
          {episode.cookieLabel} (한·영 공통, 번역 없음)
        </p>
      </div>

      <div className="queue-strip" aria-label="이어보기 순서">
        <div className="queue-step queue-step-now">
          <span className="queue-kicker">지금</span>
          <strong>
            {episode.number}편 {trackLabel(track)}
          </strong>
        </div>
        <span className="queue-arrow" aria-hidden>
          →
        </span>
        <div className="queue-step">
          <span className="queue-kicker">다음</span>
          <strong>{next ? shortQueueLabel(next) : "끝"}</strong>
        </div>
      </div>

      <div className="player-actions">
        {next ? (
          <button
            type="button"
            className="btn btn-primary btn-wide btn-next"
            onClick={goNext}
          >
            <span className="btn-next-kicker">다음</span>
            <span>{describeQueueItem(next)}</span>
          </button>
        ) : (
          <p className="muted center-text">
            마지막 편까지 다 봤어요. 목록에서 골라 보세요.
          </p>
        )}
        <Link className="btn btn-soft btn-wide" href="/episodes">
          편 목록으로
        </Link>
      </div>
    </section>
  );
}
