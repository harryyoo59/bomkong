"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getMediaPreview } from "@/lib/media-preview-store";
import {
  buildYoutubePlayQueueUrl,
  extractYoutubeVideoId,
  hasPlayableYoutubeUrl,
  openYoutubePlayQueue,
  syncWatchMediaWithServer,
  watchSlotLabel,
  type WatchItem,
} from "@/lib/watch-media";
import {
  orderWatchItemsForResume,
  readWatchResume,
  writeWatchResume,
} from "@/lib/watch-resume";

type PreviewMedia =
  | { mode: "image"; url: string; local: boolean }
  | { mode: "empty" };

function WatchLobbyPreview({ item }: { item: WatchItem | null }) {
  const [media, setMedia] = useState<PreviewMedia>({ mode: "empty" });

  useEffect(() => {
    let cancelled = false;
    let localUrl: string | null = null;

    async function load() {
      if (!item) {
        if (!cancelled) setMedia({ mode: "empty" });
        return;
      }

      const ytId = extractYoutubeVideoId(item.youtubeUrl);
      if (ytId) {
        if (!cancelled) {
          setMedia({
            mode: "image",
            url: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
            local: false,
          });
        }
        return;
      }

      const preview = await getMediaPreview(item.id);
      if (cancelled) return;
      if (preview?.thumbBlob) {
        localUrl = URL.createObjectURL(preview.thumbBlob);
        setMedia({ mode: "image", url: localUrl, local: true });
        return;
      }
      if (preview?.blob && preview.kind === "photo") {
        localUrl = URL.createObjectURL(preview.blob);
        setMedia({ mode: "image", url: localUrl, local: true });
        return;
      }

      setMedia({ mode: "empty" });
    }

    void load();
    return () => {
      cancelled = true;
      if (localUrl) URL.revokeObjectURL(localUrl);
    };
  }, [item]);

  if (!item) {
    return (
      <aside className="watch-lobby-preview-pane" aria-label="영상 미리보기">
        <p className="tiny muted">목록에서 영상을 고르면 여기에 화면이 나와요.</p>
      </aside>
    );
  }

  const slot = watchSlotLabel(item);

  return (
    <aside className="watch-lobby-preview-pane" aria-label="영상 미리보기">
      <p className="tiny muted watch-lobby-preview-label">미리보기</p>
      <div className="watch-lobby-preview-frame">
        {media.mode === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="watch-lobby-preview-image"
            src={media.url}
            alt=""
            decoding="async"
          />
        ) : (
          <p className="muted tiny watch-lobby-preview-empty">
            아직 보여줄 화면이 없어요
          </p>
        )}
      </div>
      <p className="watch-lobby-preview-slot">{slot}</p>
      <p className="watch-lobby-preview-title" title={item.title}>
        {item.title}
      </p>
    </aside>
  );
}

export function WatchLobbyList() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const resumeRowRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await syncWatchMediaWithServer();
        if (!cancelled) setItems(list);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) {
          const saved = readWatchResume()?.lastOpenedId ?? null;
          setResumeId(saved);
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ordered = orderWatchItemsForResume(items, resumeId);

  useEffect(() => {
    if (!ready || ordered.length === 0) return;
    setSelectedId((prev) => {
      if (prev && ordered.some(({ item }) => item.id === prev)) return prev;
      if (resumeId && ordered.some(({ item }) => item.id === resumeId)) {
        return resumeId;
      }
      return ordered[0]?.item.id ?? null;
    });
  }, [ready, ordered, resumeId]);

  useEffect(() => {
    if (!ready || !resumeId || ordered.length === 0) return;
    resumeRowRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [ready, resumeId, ordered.length]);

  const selectedItem = useMemo(() => {
    if (!selectedId) return ordered[0]?.item ?? null;
    return ordered.find(({ item }) => item.id === selectedId)?.item ?? null;
  }, [ordered, selectedId]);

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
    setSelectedId(id);
  };

  return (
    <>
      <div className="watch-lobby-split">
        <div className="watch-lobby-list-pane">
          <ul className="ep-list" role="listbox" aria-label="영상 목록">
            {ordered.map(({ item, isResume }) => {
              const queueUrl = buildYoutubePlayQueueUrl(items, item.id);
              const canPlay = Boolean(
                queueUrl && hasPlayableYoutubeUrl(item.youtubeUrl),
              );
              const slot = watchSlotLabel(item);
              const isSelected = selectedItem?.id === item.id;
              return (
                <li
                  key={item.id}
                  className={`ep-row${isResume ? " is-resume" : ""}${
                    isSelected ? " is-selected" : ""
                  }`}
                  ref={isResume ? resumeRowRef : undefined}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => setSelectedId(item.id)}
                >
                  <div className="ep-meta">
                    <div className="ep-head">
                      <span className="ep-num">{slot}</span>
                      {isResume ? (
                        <span className="resume-mark" aria-label="이어볼 영상">
                          <span className="resume-signal" aria-hidden="true" />
                          <span className="badge badge-resume">이어볼 영상</span>
                        </span>
                      ) : (
                        <span className="badge badge-free">
                          {item.lang === "en" ? "영어" : "한국어"}
                        </span>
                      )}
                    </div>
                    <strong className="ep-title" title={item.title}>
                      {item.title}
                    </strong>
                    {!canPlay ? (
                      <p className="muted tiny" role="status">
                        유튜브 주소 없음
                      </p>
                    ) : null}
                  </div>
                  <div className="ep-actions">
                    {canPlay && queueUrl ? (
                      <a
                        className="btn btn-primary"
                        href={queueUrl}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          markOpened(item.id);
                          openYoutubePlayQueue(queueUrl);
                        }}
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
        </div>

        <WatchLobbyPreview item={selectedItem} />
      </div>
      <p className="muted tiny" role="note">
        유튜브에서 「다음 동영상 자동재생」을 켜 두면 다음 편도 이어서 나와요.
      </p>
    </>
  );
}
