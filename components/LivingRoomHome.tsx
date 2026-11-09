"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { GuardianGate } from "@/components/GuardianGate";
import { PLACEHOLDER_VIDEO, getEpisodeById } from "@/lib/episodes";
import {
  clearWatchProgress,
  readWatchProgress,
  watchHref,
  type WatchProgress,
} from "@/lib/watch-progress";

export type LivingMenuId = "watch" | "subscribe" | "goods";

const MENUS: {
  id: LivingMenuId;
  label: string;
  href: string;
  needsGuardian: boolean;
  frameTone: string;
}[] = [
  {
    id: "watch",
    label: "영상 보기",
    href: "/episodes",
    needsGuardian: false,
    frameTone: "frame-tone-watch",
  },
  {
    id: "subscribe",
    label: "구독 신청",
    href: "/subscribe",
    needsGuardian: true,
    frameTone: "frame-tone-subscribe",
  },
  {
    id: "goods",
    label: "상품 구매",
    href: "/goods",
    needsGuardian: true,
    frameTone: "frame-tone-goods",
  },
];

/** Wall frames left → right (액자 3개). */
const FRAME_MENUS: LivingMenuId[] = ["watch", "subscribe", "goods"];

function menuById(id: LivingMenuId) {
  return MENUS.find((m) => m.id === id)!;
}

export function LivingRoomHome({
  firstWatchHref,
}: {
  firstWatchHref: string | null;
}) {
  const router = useRouter();
  const roomVideoRef = useRef<HTMLVideoElement>(null);
  const tvVideoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [guardianFor, setGuardianFor] = useState<LivingMenuId | null>(null);
  const [progress, setProgress] = useState<WatchProgress | null>(null);
  const [promptVisible, setPromptVisible] = useState(false);
  const captionId = useId();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setReduceMotion(mq.matches);
      if (mq.matches) {
        setPlaying(false);
        roomVideoRef.current?.pause();
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const saved = readWatchProgress();
    setProgress(saved);
    setPromptVisible(Boolean(saved && saved.position >= 1));
  }, []);

  useEffect(() => {
    const v = roomVideoRef.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    v.volume = 0;
    if (playing && !reduceMotion) {
      void v.play().catch(() => setPlaying(false));
    } else {
      v.pause();
    }
  }, [playing, reduceMotion]);

  useEffect(() => {
    const v = tvVideoRef.current;
    if (!v || reduceMotion) return;
    v.muted = true;
    v.defaultMuted = true;
    if (progress && progress.position > 0) {
      const seek = () => {
        try {
          v.currentTime = Math.min(progress.position, v.duration || progress.position);
        } catch {
          /* ignore seek errors before metadata */
        }
      };
      if (v.readyState >= 1) seek();
      else v.addEventListener("loadedmetadata", seek, { once: true });
    }
    void v.play().catch(() => {
      /* autoplay may fail — poster still ok */
    });
  }, [progress, reduceMotion]);

  const goFrame = useCallback(
    (id: LivingMenuId) => {
      const item = menuById(id);
      if (item.needsGuardian) {
        setGuardianFor(id);
        return;
      }
      if (id === "watch" && firstWatchHref && !progress) {
        router.push(firstWatchHref);
        return;
      }
      router.push(item.href);
    },
    [firstWatchHref, progress, router],
  );

  const onResume = () => {
    if (!progress) return;
    router.push(watchHref(progress, true));
  };

  const onFresh = () => {
    clearWatchProgress();
    setProgress(null);
    setPromptVisible(false);
    if (firstWatchHref) {
      router.push(firstWatchHref);
      return;
    }
    router.push("/episodes");
  };

  const togglePlay = () => {
    if (reduceMotion) {
      setReduceMotion(false);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  };

  const showPosterOnly = reduceMotion || !playing;
  const episode = progress ? getEpisodeById(progress.episodeId) : undefined;
  const resumeLabel = episode
    ? `${episode.number}편 · ${progress?.track === "en" ? "영어" : "한국어"}`
    : null;

  return (
    <div className="living-root">
      <div className="living-stage" aria-labelledby={captionId}>
        <img
          className={`living-poster${showPosterOnly ? " is-visible" : ""}`}
          src="/living-room/comment-desk-frame.jpg"
          alt=""
          width={848}
          height={480}
          draggable={false}
        />
        <video
          ref={roomVideoRef}
          className={`living-video${showPosterOnly ? " is-hidden" : ""}`}
          src="/living-room/comment-desk-preview.mp4"
          poster="/living-room/comment-desk-frame.jpg"
          muted
          playsInline
          loop
          preload="metadata"
          aria-hidden={showPosterOnly}
        />

        <div className="living-ui" aria-label="거실 메뉴">
          <div
            className="hotspot hotspot-tv"
            tabIndex={0}
            role="region"
            aria-label="큰 티비 화면"
          >
            <div className="tv-screen tv-screen-video">
              <video
                ref={tvVideoRef}
                className="tv-video-el"
                src={PLACEHOLDER_VIDEO}
                poster="/living-room/v4-frame-1s.jpg"
                muted
                playsInline
                loop
                autoPlay
                preload="auto"
                aria-label="봄이콩이 영상"
              />
              {promptVisible && progress ? (
                <div className="tv-resume" role="dialog" aria-label="이어보기 선택">
                  <p className="tv-resume-prompt">
                    이어볼까요, 새 영상을 볼까요?
                  </p>
                  {resumeLabel ? (
                    <p className="tv-resume-meta">{resumeLabel}</p>
                  ) : null}
                  <div className="tv-resume-actions">
                    <button
                      type="button"
                      className="btn btn-primary tv-cta"
                      onClick={onResume}
                    >
                      이어보기
                    </button>
                    <button
                      type="button"
                      className="btn btn-soft tv-cta"
                      onClick={onFresh}
                    >
                      새 영상
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="hotspot hotspot-frames" aria-label="벽 액자 바로가기">
            {FRAME_MENUS.map((id) => {
              const item = menuById(id);
              return (
                <button
                  key={id}
                  type="button"
                  className={`frame-slot ${item.frameTone}`}
                  onClick={() => goFrame(id)}
                  aria-label={`액자 바로가기: ${item.label}`}
                >
                  <span className="frame-label">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* 댓글 페이지가 아직 없어 이동 연결 없음 — 클릭 자리만 둠 */}
          <button
            type="button"
            className="hotspot hotspot-comment-desk"
            aria-label="댓글쓰기 (아직 연결 안 됨)"
          >
            <span className="visually-hidden">댓글쓰기</span>
          </button>

          <Link
            href="/admin/login"
            className="hotspot hotspot-door"
            aria-label="관리자실 입장"
          >
            <span className="door-label">관리자실</span>
          </Link>
        </div>
      </div>

      <div className="living-chrome">
        <p id={captionId} className="living-caption">
          콩아 리모컨 눌러봐 / 응 누나
          <span className="living-caption-note">
            {" "}
            · 번호 고르기는 화면 메뉴로만
          </span>
        </p>
        <div className="living-controls">
          <button
            type="button"
            className="btn btn-soft living-ctrl"
            onClick={togglePlay}
            aria-pressed={playing && !reduceMotion}
          >
            {showPosterOnly ? "영상 재생" : "일시정지 · 사진"}
          </button>
          <p className="tiny muted living-audio-note">
            소리는 기본 꺼짐 · 반복해도 크게 나지 않아요
          </p>
        </div>
      </div>

      <GuardianGate
        open={guardianFor !== null}
        title={
          guardianFor
            ? `${menuById(guardianFor).label} · 보호자 확인`
            : "보호자 확인"
        }
        onCancel={() => setGuardianFor(null)}
        onConfirm={() => {
          if (!guardianFor) return;
          const href = menuById(guardianFor).href;
          setGuardianFor(null);
          router.push(href);
        }}
      >
        <p>
          아이 혼자 구독·구매로 넘어가지 않도록, 보호자가 확인한 뒤에만
          이어가요.
        </p>
        {guardianFor === "goods" ? (
          <p className="muted tiny">
            상품 화면에서도 결제가 없으면 상태만 보여 주고, 가짜 결제 완료는
            없어요.
          </p>
        ) : (
          <p className="muted tiny">
            구독 결제는 아직 준비 중일 수 있어요. 안내 화면으로만 가요.
          </p>
        )}
      </GuardianGate>
    </div>
  );
}
