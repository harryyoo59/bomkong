"use client";

import { useEffect, useRef, useState } from "react";
import {
  readWatchMediaStore,
  resolveYoutubeWatchUrl,
  type WatchItem,
} from "@/lib/watch-media";
import {
  orderWatchItemsForResume,
  readWatchResume,
  writeWatchResume,
} from "@/lib/watch-resume";

export function WatchLobbyList() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const resumeRowRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    setItems(readWatchMediaStore().items);
    setResumeId(readWatchResume()?.lastOpenedId ?? null);
    setReady(true);
  }, []);

  const ordered = orderWatchItemsForResume(items, resumeId);

  useEffect(() => {
    if (!ready || !resumeId || ordered.length === 0) return;
    resumeRowRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [ready, resumeId, ordered.length]);

  if (!ready) {
    return <p className="muted">영상을 불러오는 중이에요…</p>;
  }

  if (items.length === 0) {
    return (
      <section className="panel watch-empty-panel" aria-live="polite">
        <h2 className="section-title">아직 볼 영상이 없어요</h2>
        <p className="muted">
          사장님이 영상보기 방에 넣어 주시면, 여기에 나와요.
        </p>
        <p className="muted tiny">다른 방에 있는 영상은 여기 안 보여요.</p>
      </section>
    );
  }

  const markOpened = (id: string) => {
    writeWatchResume(id);
    setResumeId(id);
  };

  return (
    <>
      {resumeId ? (
        <p className="muted tiny watch-resume-hint" role="status">
          지난번에 본 영상부터 이어서 나와요. 끝까지 가면 첫 영상부터 다시예요.
        </p>
      ) : null}
      <ul className="ep-list">
        {ordered.map(({ item, originalIndex, isResume }) => {
          const youtubeHref = resolveYoutubeWatchUrl(item.youtubeUrl);
          return (
            <li
              key={item.id}
              className={`ep-row${isResume ? " is-resume" : ""}`}
              ref={isResume ? resumeRowRef : undefined}
            >
              <div className="ep-meta">
                <div className="ep-head">
                  <span className="ep-num">{originalIndex + 1}번</span>
                  {isResume ? (
                    <span className="badge badge-resume">이어볼 영상</span>
                  ) : (
                    <span className="badge badge-free">영상보기</span>
                  )}
                </div>
                <strong>{item.title}</strong>
                {item.note ? <p className="muted tiny">{item.note}</p> : null}
                {!youtubeHref ? (
                  <p className="muted tiny" role="status">
                    유튜브 주소 없음
                  </p>
                ) : null}
              </div>
              <div className="ep-actions">
                {youtubeHref ? (
                  <a
                    className="btn btn-primary"
                    href={youtubeHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => markOpened(item.id)}
                  >
                    유튜브에서 보기
                  </a>
                ) : (
                  <span
                    className="btn btn-soft is-disabled"
                    aria-disabled="true"
                    title="유튜브 주소가 아직 없어요"
                  >
                    유튜브 주소 없음
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
