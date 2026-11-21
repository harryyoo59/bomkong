"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  buildYoutubePlayQueueUrl,
  extractYoutubeVideoId,
  isWatchSubscribeGuide,
  openYoutubePlayQueue,
  sortWatchItemsForPlay,
  syncWatchMediaWithServer,
  watchSlotLabel,
  type WatchItem,
} from "@/lib/watch-media";
import {
  nextPlayableWatchItemAfter,
  writeWatchResume,
} from "@/lib/watch-resume";

export function WatchVaultPlayer({
  id,
}: {
  id: string;
  resumeSeconds?: number;
}) {
  const [item, setItem] = useState<WatchItem | null | undefined>(undefined);
  const [queueUrl, setQueueUrl] = useState<string | null>(null);
  const [nextItem, setNextItem] = useState<WatchItem | null>(null);
  const [wrapsToFirst, setWrapsToFirst] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const ordered = sortWatchItemsForPlay(await syncWatchMediaWithServer());
      if (cancelled) return;
      const found = ordered.find((it) => it.id === id) ?? null;
      setItem(found);
      if (!found) {
        setQueueUrl(null);
        setNextItem(null);
        setWrapsToFirst(false);
        return;
      }

      writeWatchResume(found.id);
      const next = nextPlayableWatchItemAfter(ordered, id);
      setNextItem(next);
      setWrapsToFirst(
        ordered.length > 1 &&
          Boolean(next) &&
          next?.id === ordered[0]?.id &&
          found.id !== ordered[0]?.id,
      );

      const url = buildYoutubePlayQueueUrl(ordered, found.id);
      setQueueUrl(url);
      // 안내·일반 편 모두 유튜브 이어보기 목록으로 열면
      // 20 → 정기 구독 안내 → 21 이 자동으로 이어짐
      if (url) {
        openYoutubePlayQueue(url);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (item === undefined) {
    return <p className="muted">영상을 불러오는 중이에요…</p>;
  }

  if (!item) {
    return (
      <section className="panel watch-empty-panel" aria-live="polite">
        <h1 className="section-title">이 영상은 없어요</h1>
        <p className="muted">
          영상보기 방에 없는 영상이에요. 목록으로 돌아가 주세요.
        </p>
        <Link className="btn btn-soft" href="/episodes">
          영상 목록으로
        </Link>
      </section>
    );
  }

  const guide = isWatchSubscribeGuide(item);
  const hasGuideYoutube = guide && Boolean(extractYoutubeVideoId(item.youtubeUrl));

  if (guide && !hasGuideYoutube) {
    return (
      <section
        className="watch-internal-fullscreen"
        aria-label={item.title}
        aria-live="polite"
      >
        <div className="watch-internal-fullscreen-empty">
          <p className="muted" role="status">
            아직 유튜브 주소가 없어요. 사장님이 관리자실에서 유튜브 주소를 넣어
            주시면 여기서 볼 수 있어요.
          </p>
        </div>
        <div className="watch-internal-fullscreen-bar">
          <p className="watch-internal-fullscreen-title">{item.title}</p>
          <div className="watch-internal-fullscreen-actions">
            <Link className="btn btn-soft" href="/episodes">
              목록으로
            </Link>
            {nextItem && nextItem.id !== item.id ? (
              <Link
                className="btn btn-primary"
                href={`/watch/${encodeURIComponent(nextItem.id)}`}
              >
                다음 · {watchSlotLabel(nextItem)}
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="panel watch-empty-panel" aria-live="polite">
        <p className="eyebrow">영상보기 · {watchSlotLabel(item)}</p>
        <h1 className="section-title ep-title">{item.title}</h1>
        {queueUrl ? (
          <>
            <p className="muted">
              유튜브로 열고 있어요. 「다음 동영상 자동재생」을 켜 두면 다음 편도
              이어서 나와요.
              {guide ? " 안내가 끝나면 21번으로 이어져요." : ""}
            </p>
            <p>
              <a
                className="btn btn-primary btn-wide"
                href={queueUrl}
                onClick={(e) => {
                  e.preventDefault();
                  writeWatchResume(item.id);
                  openYoutubePlayQueue(queueUrl);
                }}
              >
                유튜브에서 이어서 보기
              </a>
            </p>
          </>
        ) : (
          <>
            <p className="muted" role="status">
              유튜브 주소 없음
            </p>
            <p className="muted tiny">
              사장님이 관리자실 6번 영상보기 방에 유튜브 주소를 넣어 주시면
              여기서 열 수 있어요.
            </p>
          </>
        )}
      </section>

      <section className="panel">
        <h2 className="section-title">이어보기</h2>
        {nextItem && nextItem.id !== item.id ? (
          <p className="queue-note">
            {wrapsToFirst ? "끝나면 → 처음으로 · " : "끝나면 → "}
            {watchSlotLabel(nextItem)} · {nextItem.title}
          </p>
        ) : (
          <p className="muted">이 다음 영상이 아직 없어요.</p>
        )}
        <p>
          <Link className="btn btn-soft" href="/episodes">
            영상 목록으로
          </Link>
        </p>
      </section>
    </>
  );
}
