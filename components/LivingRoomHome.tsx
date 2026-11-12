"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { GuardianGate } from "@/components/GuardianGate";
import { PLACEHOLDER_VIDEO } from "@/lib/episodes";
import {
  getWatchItemById,
  resolveYoutubeWatchUrl,
} from "@/lib/watch-media";
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
  const [playing, setPlaying] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [guardianFor, setGuardianFor] = useState<LivingMenuId | null>(null);
  const [progress, setProgress] = useState<WatchProgress | null>(null);
  const [promptVisible, setPromptVisible] = useState(false);
  const [mailboxOpen, setMailboxOpen] = useState(false);
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackHoneypot, setFeedbackHoneypot] = useState("");
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const captionId = useId();
  const youtubeUrl = youtubeChannelUrl?.trim() || null;

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

  useEffect(() => {
    if (!mailboxOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mailboxOpen]);

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
    const youtubeHref = watchItem
      ? resolveYoutubeWatchUrl(watchItem.youtubeUrl)
      : null;
    if (youtubeHref) {
      window.open(youtubeHref, "_blank", "noopener,noreferrer");
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
    if (reduceMotion) {
      setReduceMotion(false);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  };

  const openMailbox = () => {
    setMailboxOpen(true);
    setFeedbackError(null);
    setFeedbackDone(false);
  };

  const closeMailbox = () => {
    if (feedbackBusy) return;
    setMailboxOpen(false);
    setFeedbackError(null);
  };

  const submitMailbox = async (event: FormEvent) => {
    event.preventDefault();
    if (feedbackBusy) return;
    setFeedbackBusy(true);
    setFeedbackError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: feedbackName,
          message: feedbackMessage,
          website: feedbackHoneypot,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setFeedbackError(data.error || "지금은 보낼 수 없어요.");
        return;
      }
      setFeedbackDone(true);
      setFeedbackName("");
      setFeedbackMessage("");
      setFeedbackHoneypot("");
    } catch {
      setFeedbackError("연결이 끊겼어요. 잠시 뒤 다시 해 주세요.");
    } finally {
      setFeedbackBusy(false);
    }
  };

  const showPosterOnly = reduceMotion || !playing;
  const watchItem = progress ? getWatchItemById(progress.episodeId) : undefined;
  const resumeLabel = watchItem ? watchItem.title : null;

  return (
    <div className="living-root">
      <div className="living-stage" aria-labelledby={captionId}>
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
            className="hotspot hotspot-comment-desk"
            aria-label="댓글쓰기"
            title="댓글쓰기"
          >
            <span className="visually-hidden">댓글쓰기</span>
          </Link>

          {/* 소파 등받이 직물 로고(영상에 구움) — 떠 있는 그림 없이 투명 클릭만 */}
          <a
            href={COMPANY_HOME}
            className="hotspot hotspot-sofa-cz"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="참존 인터랙티브 회사 홈페이지 열기"
          >
            <span className="visually-hidden">회사 홈페이지로 가요</span>
          </a>

          {/* 문 전체 → 관리자실. 명패는 영상에 구움(웹 글씨 없음). */}
          <Link
            href="/admin/login"
            className="hotspot hotspot-door"
            aria-label="관리자실 입장"
            title="관리자실"
          >
            <span className="visually-hidden">관리자실</span>
          </Link>

          {/* 우편함 — 문보다 위. 의견 보내기 */}
          <button
            type="button"
            className="hotspot hotspot-mailbox"
            onClick={openMailbox}
            aria-label="의견 보내기"
            title="의견 보내기"
          >
            <span className="visually-hidden">의견 보내기</span>
          </button>
        </div>
      </div>

      <div className="living-chrome">
        <p id={captionId} className="living-caption">
          콩아 리모컨 눌러봐 / 응 누나
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
        </div>
      </div>

      <nav className="living-menu-grid" aria-label="봄이콩이 메뉴">
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

          <button
            type="button"
            className="menu-mini menu-mini-feedback"
            onClick={openMailbox}
          >
            <TileIcon tone="amber" size="sm">
              <IconFeedback />
            </TileIcon>
            <span className="menu-mini-label">5. 관리자에게 의견 보내기</span>
          </button>

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

      {mailboxOpen ? (
        <div
          className="guardian-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mailbox-title"
        >
          <div className="guardian-card mailbox-card-form">
            <p className="eyebrow">의견 보내기</p>
            <h2 id="mailbox-title" className="section-title">
              빨간 우편함
            </h2>
            {feedbackDone ? (
              <div className="guardian-body">
                <p>잘 받았어요. 고마워요!</p>
                <div className="guardian-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={closeMailbox}
                  >
                    닫기
                  </button>
                </div>
              </div>
            ) : (
              <form className="guardian-body" onSubmit={submitMailbox}>
                <label className="form-row">
                  <span>이름 (선택)</span>
                  <input
                    type="text"
                    name="name"
                    autoComplete="nickname"
                    maxLength={80}
                    value={feedbackName}
                    onChange={(e) => setFeedbackName(e.target.value)}
                    placeholder="비워 둬도 돼요"
                  />
                </label>
                <label className="form-row">
                  <span>메시지 (필수)</span>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    maxLength={2000}
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="하고 싶은 말을 적어 주세요"
                  />
                </label>
                {/* Honeypot — hidden from people */}
                <label className="mailbox-honeypot" aria-hidden="true">
                  <span>회사 사이트</span>
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={feedbackHoneypot}
                    onChange={(e) => setFeedbackHoneypot(e.target.value)}
                  />
                </label>
                {feedbackError ? (
                  <p className="form-error" role="alert">
                    {feedbackError}
                  </p>
                ) : null}
                <div className="guardian-actions">
                  <button
                    type="button"
                    className="btn btn-soft"
                    onClick={closeMailbox}
                    disabled={feedbackBusy}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={feedbackBusy || feedbackMessage.trim().length < 2}
                  >
                    {feedbackBusy ? "보내는 중…" : "보내기"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
