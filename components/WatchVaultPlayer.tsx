"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PLACEHOLDER_VIDEO } from "@/lib/episodes";
import { readWatchMediaStore, type WatchItem } from "@/lib/watch-media";
import { writeWatchProgress } from "@/lib/watch-progress";

export function WatchVaultPlayer({
  id,
  resumeSeconds = 0,
}: {
  id: string;
  resumeSeconds?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [item, setItem] = useState<WatchItem | null | undefined>(undefined);
  const [nextId, setNextId] = useState<string | null>(null);

  useEffect(() => {
    const store = readWatchMediaStore();
    const found = store.items.find((it) => it.id === id) ?? null;
    setItem(found);
    if (!found) {
      setNextId(null);
      return;
    }
    const index = store.items.findIndex((it) => it.id === id);
    const next = index >= 0 ? store.items[index + 1] : undefined;
    setNextId(next?.id ?? null);
  }, [id]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !item) return;

    const startAt = resumeSeconds;
    if (Number.isFinite(startAt) && startAt > 0) {
      const seek = () => {
        try {
          v.currentTime = Math.min(startAt, v.duration || startAt);
        } catch {
          /* ignore */
        }
      };
      if (v.readyState >= 1) seek();
      else v.addEventListener("loadedmetadata", seek, { once: true });
    }

    let lastSaved = 0;
    const save = () => {
      if (!Number.isFinite(v.currentTime) || v.currentTime < 0.5) return;
      const now = Date.now();
      if (now - lastSaved < 800) return;
      lastSaved = now;
      writeWatchProgress({
        episodeId: item.id,
        track: "ko",
        position: v.currentTime,
      });
    };

    v.addEventListener("timeupdate", save);
    v.addEventListener("pause", save);
    v.addEventListener("ended", save);
    return () => {
      v.removeEventListener("timeupdate", save);
      v.removeEventListener("pause", save);
      v.removeEventListener("ended", save);
      save();
    };
  }, [item, resumeSeconds]);

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

  return (
    <>
      <section className="player-panel">
        <div className="video-stage" aria-label="영상 자리">
          <div className="video-lang-tag" aria-live="polite">
            지금 · 영상보기
          </div>
          <video
            ref={videoRef}
            className="video-el"
            controls
            playsInline
            src={PLACEHOLDER_VIDEO}
          >
            이 브라우저는 영상을 재생할 수 없어요.
          </video>
          <div className="video-caption">
            <span className="badge">영상보기</span>
            <span className="tiny">{item.name}</span>
          </div>
        </div>

        <div className="player-copy panel-flush">
          <p className="eyebrow">영상보기 방</p>
          <h1>{item.title}</h1>
          {item.note ? <p className="muted">{item.note}</p> : null}
          <p className="muted tiny">
            이 목록은 관리자실 9번 영상보기 방에 넣은 것만 보여 줘요.
          </p>
        </div>
      </section>

      <section className="panel">
        <h2 className="section-title">이어보기</h2>
        {nextId ? (
          <p className="queue-note">
            끝나면 →{" "}
            <Link
              className="queue-link"
              href={`/watch/${encodeURIComponent(nextId)}`}
            >
              다음 영상
            </Link>
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
