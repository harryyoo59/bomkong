"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { GuardianGate } from "@/components/GuardianGate";
import { PLACEHOLDER_VIDEO } from "@/lib/episodes";
import { getWatchItemById } from "@/lib/watch-media";
import {
  clearWatchProgress,
  readWatchProgress,
  watchHref,
  type WatchProgress,
} from "@/lib/watch-progress";
import {
  LIVING_ROOM_BEATS,
  type LivingStoryTarget,
} from "@/lib/living-room-story";

export type LivingMenuId = "watch" | "subscribe" | "goods";

const MENUS: {
  id: LivingMenuId;
  label: string;
  href: string;
  needsGuardian: boolean;
}[] = [
  {
    id: "watch",
    label: "영상보기",
    href: "/episodes",
    needsGuardian: false,
  },
  {
    id: "subscribe",
    label: "구독하기",
    href: "/subscribe",
    needsGuardian: true,
  },
  {
    id: "goods",
    label: "상품구매",
    href: "/goods",
    needsGuardian: true,
  },
];

/** Wall frames left → right (액자 3개). Labels baked in video — no web text. */
const FRAME_MENUS: LivingMenuId[] = ["watch", "subscribe", "goods"];

const COMPANY_HOME = "https://chamzoneinteractive.vercel.app/";

function menuById(id: LivingMenuId) {
  return MENUS.find((m) => m.id === id)!;
}

function IconPlay({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M8.5 5.8v12.4L19 12 8.5 5.8z" />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 22a2.2 2.2 0 0 0 2.2-2.2h-4.4A2.2 2.2 0 0 0 12 22zm7-5.5V11a7 7 0 1 0-14 0v5.5L3 18.5V20h18v-1.5l-2-2z"
      />
    </svg>
  );
}

function IconBag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 7V6a5 5 0 0 1 10 0v1h3v14H4V7h3zm2 0h6V6a3 3 0 0 0-6 0v1z"
      />
    </svg>
  );
}

function IconComment({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm3 5v2h10V9H7zm0 4v2h7v-2H7z"
      />
    </svg>
  );
}

function IconFeedback({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M5 3h11l5 5v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm10 1.5V9h4.5L15 4.5zM7 12h10v2H7v-2zm0 4h8v2H7v-2z"
      />
    </svg>
  );
}

function IconYoutube({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M23 12.2s0-3.4-.4-5a2.9 2.9 0 0 0-2-2C18.8 4.7 12 4.7 12 4.7s-6.8 0-8.6.5a2.9 2.9 0 0 0-2 2c-.4 1.6-.4 5-.4 5s0 3.4.4 5a2.9 2.9 0 0 0 2 2c1.8.5 8.6.5 8.6.5s6.8 0 8.6-.5a2.9 2.9 0 0 0 2-2c.4-1.6.4-5 .4-5zM9.8 15.5v-7l6.2 3.5-6.2 3.5z"
      />
    </svg>
  );
}

function IconCompany({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2.6 3 7v2h18V7l-9-4.4zM5 11v9h4v-6h6v6h4v-9H5zm6 9v-4h2v4h-2z"
      />
    </svg>
  );
}

function TileIcon({
  tone,
  children,
  size = "lg",
}: {
  tone: "orange" | "blue" | "green" | "pink" | "amber" | "coral" | "violet";
  children: ReactNode;
  size?: "lg" | "sm";
}) {
  return (
    <span className={`menu-tile-icon menu-tile-icon-${tone} is-${size}`}>
      {children}
    </span>
  );
}

export function LivingRoomHome({
  firstWatchHref,
  youtubeChannelUrl = null,
}: {
  firstWatchHref: string | null;
  youtubeChannelUrl?: string | null;
}) {
  const router = useRouter();
  const roomVideoRef = useRef<HTMLVideoElement>(null);
  const tvVideoRef = useRef<HTMLVideoElement>(null);
  // 스토리 말은 「영상 재생」 누른 뒤에 이어짐 (폰이 자동 말을 막아서)
  const [playing, setPlaying] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [guardianFor, setGuardianFor] = useState<LivingMenuId | null>(null);
  const [progress, setProgress] = useState<WatchProgress | null>(null);
  const [promptVisible, setPromptVisible] = useState(false);
  const [beatIndex, setBeatIndex] = useState(0);
  const captionId = useId();
  const youtubeUrl = youtubeChannelUrl?.trim() || null;
  const beat = LIVING_ROOM_BEATS[beatIndex] ?? LIVING_ROOM_BEATS[0];
  const storyTarget: LivingStoryTarget = beat.target;
  const beatCount = LIVING_ROOM_BEATS.length;
  const speakTokenRef = useRef(0);
  const storyAudioRef = useRef<HTMLAudioElement | null>(null);

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
    if (!saved) {
      setProgress(null);
      setPromptVisible(false);
      return;
    }
    // 이어보기는 영상보기 방(9번)에 있는 것만. 예전 샘플·다른 방 기록은 무시.
    const inWatchRoom = Boolean(getWatchItemById(saved.episodeId));
    if (!inWatchRoom) {
      clearWatchProgress();
      setProgress(null);
      setPromptVisible(false);
      return;
    }
    setProgress(saved);
    setPromptVisible(saved.position >= 1);
  }, []);

  useEffect(() => {
    const v = roomVideoRef.current;
    if (!v) return;
    // 짧은 영상 소리는 한 문장만 반복해서 끔. 스토리 말로 안내.
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
    v.volume = 0;
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

  const stopStoryVoiceNow = useCallback(() => {
    speakTokenRef.current += 1;
    const a = storyAudioRef.current;
    if (a) {
      a.onended = null;
      a.onerror = null;
      a.pause();
      a.removeAttribute("src");
      try {
        a.load();
      } catch {
        /* ignore */
      }
      storyAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // 버튼 누른 직후(사용자 제스처)에서 재생해야 폰에서 소리가 남
  const playStoryFrom = useCallback(
    (startIndex: number) => {
      const token = ++speakTokenRef.current;
      const playOne = (index: number) => {
        if (speakTokenRef.current !== token) return;
        const nextBeat = LIVING_ROOM_BEATS[index] ?? LIVING_ROOM_BEATS[0];
        setBeatIndex(index);

        const advance = () => {
          if (speakTokenRef.current !== token) return;
          playOne((index + 1) % beatCount);
        };

        const speakFallback = () => {
          if (speakTokenRef.current !== token) return;
          if (!("speechSynthesis" in window)) {
            setTimeout(advance, 700);
            return;
          }
          const utter = new SpeechSynthesisUtterance(nextBeat.speak);
          utter.lang = "ko-KR";
          // 최후 수단: 아이처럼 밝게
          utter.pitch = nextBeat.speaker === "kongi" ? 1.25 : 1.7;
          utter.rate = nextBeat.speaker === "kongi" ? 1.02 : 1.1;
          utter.onend = () => {
            if (speakTokenRef.current !== token) return;
            setTimeout(advance, 220);
          };
          utter.onerror = () => {
            if (speakTokenRef.current !== token) return;
            setTimeout(advance, 700);
          };
          window.speechSynthesis.speak(utter);
        };

        const prev = storyAudioRef.current;
        if (prev) {
          prev.onended = null;
          prev.onerror = null;
          prev.pause();
        }

        const audio = new Audio(nextBeat.audioSrc);
        audio.preload = "auto";
        storyAudioRef.current = audio;
        audio.onended = () => {
          if (speakTokenRef.current !== token) return;
          setTimeout(advance, 220);
        };
        audio.onerror = () => speakFallback();
        void audio.play().catch(() => speakFallback());
      };

      playOne(startIndex);
    },
    [beatCount],
  );

  useEffect(() => {
    if (!playing || reduceMotion || guardianFor) {
      stopStoryVoiceNow();
    }
  }, [playing, reduceMotion, guardianFor, stopStoryVoiceNow]);

  const storyClass = (target: LivingStoryTarget) =>
    storyTarget === target ? " is-story-lit" : "";

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
    const watchItem = getWatchItemById(progress.episodeId);
    if (watchItem) {
      // 사이트 안에서 이어서 보고, 끝나면 다음 편으로 자동 연결
      router.push(`/watch/${encodeURIComponent(watchItem.id)}`);
      return;
    }
    router.push(watchHref(progress, true));
  };

  const onFresh = () => {
    clearWatchProgress();
    setProgress(null);
    setPromptVisible(false);
    router.push(firstWatchHref || "/episodes");
  };

  const togglePlay = () => {
    const v = roomVideoRef.current;
    if (reduceMotion) {
      setReduceMotion(false);
      if (v) {
        v.muted = true;
        v.defaultMuted = true;
        v.volume = 0;
        void v.play().catch(() => setPlaying(false));
      }
      setPlaying(true);
      // 재생 버튼 누른 직후라서 폰에서도 아이 목소리가 바로 남
      playStoryFrom(0);
      return;
    }
    if (playing) {
      if (v) v.pause();
      setPlaying(false);
      stopStoryVoiceNow();
      return;
    }
    if (v) {
      v.muted = true;
      v.defaultMuted = true;
      v.volume = 0;
      void v.play().catch(() => setPlaying(false));
    }
    setPlaying(true);
    playStoryFrom(0);
  };

  const leaveSite = () => {
    stopStoryVoiceNow();
    // 핸드폰 바탕화면(홈)으로 나가기 — 흰 화면(about:blank)은 쓰지 않음
    try {
      window.close();
    } catch {
      /* 브라우저가 막을 수 있음 */
    }

    const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
    if (/Android/i.test(ua)) {
      window.location.replace(
        "intent://#Intent;action=android.intent.action.MAIN;category=android.intent.category.HOME;end",
      );
      return;
    }

    // 아이폰 등: 탭을 못 닫으면 이전 화면으로 (흰 화면 대신)
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    try {
      window.open("", "_self");
      window.close();
    } catch {
      /* ignore */
    }
  };

  const showPosterOnly = reduceMotion || !playing;
  const watchItem = progress ? getWatchItemById(progress.episodeId) : undefined;
  const resumeLabel = watchItem ? watchItem.title : null;

  return (
    <div className="living-root">
      <div
        className={`living-stage${storyClass("room")}`}
        aria-labelledby={captionId}
      >
        <img
          className={`living-poster${showPosterOnly ? " is-visible" : ""}`}
          src="/living-room/living-room-labeled-frame.jpg"
          alt=""
          width={848}
          height={480}
          draggable={false}
        />
        <video
          ref={roomVideoRef}
          className={`living-video${showPosterOnly ? " is-hidden" : ""}`}
          src="/living-room/living-room-labeled-preview.mp4"
          poster="/living-room/living-room-labeled-frame.jpg"
          playsInline
          loop
          preload="metadata"
          aria-hidden={showPosterOnly}
        />

        <div className="living-ui" aria-label="거실 메뉴">
          <div
            className={`hotspot hotspot-tv${storyClass("tv")}`}
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

          <div
            className={`hotspot hotspot-frames${storyClass("frames")}`}
            aria-label="벽 액자 바로가기"
          >
            {FRAME_MENUS.map((id) => {
              const item = menuById(id);
              return (
                <button
                  key={id}
                  type="button"
                  className={`frame-slot frame-slot-${id}`}
                  onClick={() => goFrame(id)}
                  title={item.label}
                  aria-label={`액자 바로가기: ${item.label}`}
                >
                  <span className="visually-hidden">{item.label}</span>
                </button>
              );
            })}
          </div>

          <Link
            href="/comments"
            className={`hotspot hotspot-comment-desk${storyClass("comment")}`}
            aria-label="댓글쓰기"
            title="댓글쓰기"
          >
            <span className="visually-hidden">댓글쓰기</span>
          </Link>

          {/* 서랍장 앞 우편함 → 의견 보내기 */}
          <Link
            href="/comments#mailbox"
            className={`hotspot hotspot-mailbox${storyClass("mailbox")}`}
            aria-label="의견 보내기 우편함"
            title="의견 보내기"
          >
            <span className="visually-hidden">의견 보내기</span>
          </Link>

          {/* 소파 옆 수건 위 로고(영상에 구움) — 떠 있는 그림 없이 투명 클릭만 */}
          <a
            href={COMPANY_HOME}
            className={`hotspot hotspot-sofa-cz${storyClass("sofa")}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="참존 인터랙티브 회사 홈페이지 열기"
          >
            <span className="visually-hidden">회사 홈페이지로 가요</span>
          </a>

          {/* 문 전체 → 관리자실. 명패는 영상에 구움(웹 글씨 없음). */}
          <Link
            href="/admin/login"
            className={`hotspot hotspot-door${storyClass("door")}`}
            aria-label="관리자실 입장"
            title="관리자실"
          >
            <span className="visually-hidden">관리자실</span>
          </Link>
        </div>
      </div>

      <div className="living-chrome">
        <p id={captionId} className="living-caption visually-hidden">
          로비 안내 이야기
        </p>
        <div className="living-controls">
          <button
            type="button"
            className="btn btn-soft living-ctrl"
            onClick={togglePlay}
            aria-pressed={playing && !reduceMotion}
          >
            {showPosterOnly ? "영상 재생" : "일시 정지"}
          </button>
          <button
            type="button"
            className="btn btn-soft living-ctrl living-ctrl-exit"
            onClick={leaveSite}
          >
            나가기
          </button>
        </div>
      </div>

      <nav
        className={`living-menu-grid${storyClass("menu")}`}
        aria-label="봄이콩이 메뉴"
      >
        <button
          type="button"
          className="menu-tile menu-tile-watch"
          onClick={() => goFrame("watch")}
        >
          <TileIcon tone="orange">
            <IconPlay />
          </TileIcon>
          <span className="menu-tile-label">1. 영상보기</span>
        </button>

        <button
          type="button"
          className="menu-tile menu-tile-subscribe"
          onClick={() => goFrame("subscribe")}
        >
          <TileIcon tone="blue">
            <IconBell />
          </TileIcon>
          <span className="menu-tile-label">2. 구독하기</span>
        </button>

        <button
          type="button"
          className="menu-tile menu-tile-goods"
          onClick={() => goFrame("goods")}
        >
          <TileIcon tone="green">
            <IconBag />
          </TileIcon>
          <span className="menu-tile-label">3. 상품구매</span>
        </button>

        <div className="menu-tile menu-tile-cluster" role="group" aria-label="더 보기">
          <Link
            href="/comments"
            className="menu-mini menu-mini-comment"
            aria-label="댓글 쓰기"
          >
            <TileIcon tone="pink" size="sm">
              <IconComment />
            </TileIcon>
            <span className="menu-mini-label">댓글 쓰기</span>
          </Link>

          <Link
            href="/comments#mailbox"
            className="menu-mini menu-mini-feedback"
            aria-label="관리자에게 의견 보내기"
          >
            <TileIcon tone="amber" size="sm">
              <IconFeedback />
            </TileIcon>
            <span className="menu-mini-label">5. 관리자에게 의견 보내기</span>
          </Link>

          {youtubeUrl ? (
            <a
              className="menu-mini menu-mini-youtube"
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <TileIcon tone="coral" size="sm">
                <IconYoutube />
              </TileIcon>
              <span className="menu-mini-label">6. 유튜브 계정으로 들어가기</span>
            </a>
          ) : (
            <button
              type="button"
              className="menu-mini menu-mini-youtube is-pending"
              disabled
              aria-disabled="true"
              title="유튜브 주소는 아직 준비 중이에요"
            >
              <TileIcon tone="coral" size="sm">
                <IconYoutube />
              </TileIcon>
              <span className="menu-mini-label">6. 유튜브 · 준비 중</span>
            </button>
          )}

          <a
            className="menu-mini menu-mini-company"
            href={COMPANY_HOME}
            target="_blank"
            rel="noopener noreferrer"
          >
            <TileIcon tone="violet" size="sm">
              <IconCompany />
            </TileIcon>
            <span className="menu-mini-label">7. 제작회사 홈페이지 입장하기</span>
          </a>
        </div>
      </nav>

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
