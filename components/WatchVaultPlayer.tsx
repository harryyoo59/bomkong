"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  extractYoutubeVideoId,
  readWatchMediaStore,
  resolveYoutubeWatchUrl,
  sortWatchItemsForPlay,
  watchSlotLabel,
  type WatchItem,
} from "@/lib/watch-media";
import {
  nextPlayableWatchItemAfter,
  writeWatchResume,
} from "@/lib/watch-resume";

type YtPlayer = {
  destroy: () => void;
  playVideo?: () => void;
};

type YtNamespace = {
  Player: new (
    elementId: string,
    options: {
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: (event: { target: YtPlayer }) => void;
        onStateChange?: (event: { data: number; target: YtPlayer }) => void;
      };
    },
  ) => YtPlayer;
  PlayerState: { ENDED: number };
};

declare global {
  interface Window {
    YT?: YtNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYoutubeApi(): Promise<YtNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("no window"));
  }
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  return new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      try {
        previous?.();
      } catch {
        /* ignore */
      }
      if (window.YT?.Player) {
        resolve(window.YT);
      } else {
        reject(new Error("YouTube API missing"));
      }
    };

    if (!document.getElementById("yt-iframe-api")) {
      const tag = document.createElement("script");
      tag.id = "yt-iframe-api";
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      tag.onerror = () => reject(new Error("YouTube API load failed"));
      document.body.appendChild(tag);
    }

    // 이미 스크립트가 로드된 직후일 수 있음
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (window.YT?.Player) {
        window.clearInterval(timer);
        resolve(window.YT);
      } else if (Date.now() - started > 15000) {
        window.clearInterval(timer);
        reject(new Error("YouTube API timeout"));
      }
    }, 200);
  });
}

export function WatchVaultPlayer({
  id,
}: {
  id: string;
  resumeSeconds?: number;
}) {
  const router = useRouter();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YtPlayer | null>(null);
  const nextIdRef = useRef<string | null>(null);

  const [item, setItem] = useState<WatchItem | null | undefined>(undefined);
  const [nextItem, setNextItem] = useState<WatchItem | null>(null);
  const [wrapsToFirst, setWrapsToFirst] = useState(false);
  const [playerError, setPlayerError] = useState("");

  useEffect(() => {
    const store = readWatchMediaStore();
    const ordered = sortWatchItemsForPlay(store.items);
    const found = ordered.find((it) => it.id === id) ?? null;
    setItem(found);
    if (!found) {
      setNextItem(null);
      setWrapsToFirst(false);
      nextIdRef.current = null;
      return;
    }

    writeWatchResume(found.id);
    const next = nextPlayableWatchItemAfter(ordered, id);
    setNextItem(next);
    nextIdRef.current = next?.id ?? null;
    setWrapsToFirst(
      ordered.length > 1 &&
        Boolean(next) &&
        next?.id === ordered[0]?.id &&
        found.id !== ordered[0]?.id,
    );
  }, [id]);

  useEffect(() => {
    if (!item) return;
    const videoId = extractYoutubeVideoId(item.youtubeUrl);
    if (!videoId || !hostRef.current) return;

    let cancelled = false;
    const mountId = `yt-player-${item.id}`;
    hostRef.current.innerHTML = "";
    const mount = document.createElement("div");
    mount.id = mountId;
    hostRef.current.appendChild(mount);

    loadYoutubeApi()
      .then((YT) => {
        if (cancelled) return;
        playerRef.current?.destroy();
        playerRef.current = new YT.Player(mountId, {
          videoId,
          playerVars: {
            autoplay: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            origin:
              typeof window !== "undefined" ? window.location.origin : "",
          },
          events: {
            onReady: (event) => {
              try {
                event.target.playVideo?.();
              } catch {
                /* 자동재생이 막힐 수 있음 */
              }
            },
            onStateChange: (event) => {
              if (event.data !== YT.PlayerState.ENDED) return;
              const nextId = nextIdRef.current;
              if (!nextId || nextId === item.id) return;
              writeWatchResume(nextId);
              router.push(`/watch/${encodeURIComponent(nextId)}`);
            },
          },
        });
        setPlayerError("");
      })
      .catch(() => {
        if (!cancelled) {
          setPlayerError(
            "영상을 바로 틀지 못했어요. 아래 「유튜브에서 열기」를 눌러 주세요.",
          );
        }
      });

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, [item, router]);

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
  const videoId = extractYoutubeVideoId(item.youtubeUrl);

  return (
    <>
      <section className="panel watch-player-panel" aria-live="polite">
        <p className="eyebrow">영상보기 · {watchSlotLabel(item)}</p>
        <h1 className="section-title ep-title">{item.title}</h1>
        {item.note ? (
          <p className="muted tiny ep-note">{item.note}</p>
        ) : null}

        {videoId ? (
          <>
            <div className="yt-embed-wrap">
              <div ref={hostRef} className="yt-embed-host" />
            </div>
            {playerError ? (
              <p className="muted tiny" role="status">
                {playerError}
              </p>
            ) : (
              <p className="muted tiny">
                이 영상이 끝나면 다음 편이 자동으로 이어져요.
              </p>
            )}
          </>
        ) : (
          <>
            <p className="muted" role="status">
              유튜브 주소 없음
            </p>
            <p className="muted tiny">
              사장님이 관리자실 9번 영상보기 방에 유튜브 주소를 넣어 주시면
              여기서 볼 수 있어요.
            </p>
          </>
        )}

        {youtubeHref ? (
          <p>
            <a
              className="btn btn-soft"
              href={youtubeHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              유튜브에서 열기
            </a>
          </p>
        ) : null}
      </section>

      <section className="panel">
        <h2 className="section-title">이어보기</h2>
        {nextItem && nextItem.id !== item.id ? (
          <p className="queue-note">
            {wrapsToFirst ? "끝나면 → 처음으로 · " : "끝나면 → "}
            <Link
              className="queue-link"
              href={`/watch/${encodeURIComponent(nextItem.id)}`}
              onClick={() => writeWatchResume(nextItem.id)}
            >
              {watchSlotLabel(nextItem)} · {nextItem.title}
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
