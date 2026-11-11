"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  readWatchMediaStore,
  resolveYoutubeWatchUrl,
  type WatchItem,
} from "@/lib/watch-media";

export function WatchVaultPlayer({
  id,
}: {
  id: string;
  resumeSeconds?: number;
}) {
  const [item, setItem] = useState<WatchItem | null | undefined>(undefined);
  const [nextItem, setNextItem] = useState<WatchItem | null>(null);

  useEffect(() => {
    const store = readWatchMediaStore();
    const found = store.items.find((it) => it.id === id) ?? null;
    setItem(found);
    if (!found) {
      setNextItem(null);
      return;
    }
    const index = store.items.findIndex((it) => it.id === id);
    const next = index >= 0 ? store.items[index + 1] : undefined;
    setNextItem(next ?? null);
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
        <p className="muted tiny">다른 방 영상은 여기서 안 보여요.</p>
        <Link className="btn btn-soft" href="/episodes">
          영상 목록으로
        </Link>
      </section>
    );
  }

  const youtubeHref = resolveYoutubeWatchUrl(item.youtubeUrl);
  const nextYoutubeHref = nextItem
    ? resolveYoutubeWatchUrl(nextItem.youtubeUrl)
    : null;

  return (
    <>
      <section className="panel watch-empty-panel" aria-live="polite">
        <p className="eyebrow">영상보기 방</p>
        <h1 className="section-title">{item.title}</h1>
        {item.note ? <p className="muted">{item.note}</p> : null}
        {youtubeHref ? (
          <>
            <p className="muted">
              유튜브에서 보면 조회수가 올라가요. 아래 버튼을 눌러 주세요.
            </p>
            <p>
              <a
                className="btn btn-primary btn-wide"
                href={youtubeHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                유튜브에서 보기
              </a>
            </p>
          </>
        ) : (
          <>
            <p className="muted" role="status">
              유튜브 주소 없음
            </p>
            <p className="muted tiny">
              사장님이 관리자실 9번 영상보기 방에 유튜브 주소를 넣어 주시면
              여기서 열 수 있어요.
            </p>
          </>
        )}
        <p className="muted tiny">
          이 목록은 관리자실 9번 영상보기 방에 넣은 것만 보여 줘요.
        </p>
      </section>

      <section className="panel">
        <h2 className="section-title">이어보기</h2>
        {nextItem ? (
          nextYoutubeHref ? (
            <p className="queue-note">
              끝나면 →{" "}
              <a
                className="queue-link"
                href={nextYoutubeHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                다음 영상 (유튜브)
              </a>
            </p>
          ) : (
            <p className="muted">
              다음 「{nextItem.title}」 · 유튜브 주소 없음
            </p>
          )
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
