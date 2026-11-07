"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { GuardianGate } from "@/components/GuardianGate";

export type LivingMenuId = "watch" | "subscribe" | "goods";

const MENUS: {
  id: LivingMenuId;
  label: string;
  tvTitle: string;
  tvBlurb: string;
  href: string;
  needsGuardian: boolean;
}[] = [
  {
    id: "watch",
    label: "영상 재생",
    tvTitle: "영상 재생",
    tvBlurb: "편 목록에서 고르거나, 이어보기로 바로 볼 수 있어요.",
    href: "/episodes",
    needsGuardian: false,
  },
  {
    id: "subscribe",
    label: "구독 신청",
    tvTitle: "구독 신청",
    tvBlurb: "정기 구독 안내로 가요. 보호자 확인 후 진행해요.",
    href: "/subscribe",
    needsGuardian: true,
  },
  {
    id: "goods",
    label: "상품 구매",
    tvTitle: "상품 구매",
    tvBlurb: "캐릭터 상품을 봐요. 보호자 확인 후 진행해요.",
    href: "/goods",
    needsGuardian: true,
  },
];

function menuById(id: LivingMenuId) {
  return MENUS.find((m) => m.id === id)!;
}

export function LivingRoomHome({
  firstWatchHref,
}: {
  firstWatchHref: string | null;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selected, setSelected] = useState<LivingMenuId>("watch");
  const [frameIds, setFrameIds] = useState<LivingMenuId[]>([]);
  const [playing, setPlaying] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [guardianFor, setGuardianFor] = useState<LivingMenuId | null>(null);
  const captionId = useId();

  const current = menuById(selected);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      setReduceMotion(mq.matches);
      if (mq.matches) {
        setPlaying(false);
        videoRef.current?.pause();
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
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

  const selectMenu = useCallback((id: LivingMenuId) => {
    setSelected((prev) => {
      if (prev === id) return prev;
      setFrameIds((frames) => {
        const next = [prev, ...frames.filter((f) => f !== id && f !== prev)];
        return next.slice(0, 2);
      });
      return id;
    });
  }, []);

  const goSelected = () => {
    if (current.needsGuardian) {
      setGuardianFor(current.id);
      return;
    }
    if (current.id === "watch" && firstWatchHref) {
      router.push(firstWatchHref);
      return;
    }
    router.push(current.href);
  };

  const onTvKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const idx = MENUS.findIndex((m) => m.id === selected);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      selectMenu(MENUS[(idx + 1) % MENUS.length].id);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      selectMenu(MENUS[(idx - 1 + MENUS.length) % MENUS.length].id);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goSelected();
    }
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

  return (
    <div className="living-root">
      <div className="living-stage" aria-labelledby={captionId}>
        <img
          className={`living-poster${showPosterOnly ? " is-visible" : ""}`}
          src="/living-room/v4-frame-1s.jpg"
          alt=""
          width={848}
          height={480}
          draggable={false}
        />
        <video
          ref={videoRef}
          className={`living-video${showPosterOnly ? " is-hidden" : ""}`}
          src="/living-room/living-room-v4.mp4"
          poster="/living-room/v4-frame-1s.jpg"
          muted
          playsInline
          loop
          preload="metadata"
          aria-hidden={showPosterOnly}
        />

        {/* Web UI layer — menus NOT burned into video */}
        <div className="living-ui" aria-label="거실 메뉴">
          <div
            className="hotspot hotspot-tv"
            tabIndex={0}
            role="region"
            aria-label="큰 티비 메뉴"
            onKeyDown={onTvKeyDown}
          >
            <div className="tv-screen">
              <p className="tv-eyebrow">지금 고른 메뉴</p>
              <h1 className="tv-title">{current.tvTitle}</h1>
              <p className="tv-blurb">{current.tvBlurb}</p>
              <ul className="tv-menu" role="listbox" aria-label="티비 메뉴">
                {MENUS.map((item) => {
                  const active = item.id === selected;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        className={
                          active ? "tv-menu-btn is-active" : "tv-menu-btn"
                        }
                        onClick={() => selectMenu(item.id)}
                      >
                        <span className="tv-menu-label">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="tv-actions">
                {current.id === "watch" ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary tv-cta"
                      onClick={goSelected}
                    >
                      {firstWatchHref ? "이어보기" : "편 목록"}
                    </button>
                    <Link className="btn btn-soft tv-cta" href="/episodes">
                      편 목록
                    </Link>
                  </>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary tv-cta"
                    onClick={goSelected}
                  >
                    {current.label} 열기
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="hotspot hotspot-frames" aria-label="벽 액자 바로가기">
            {[0, 1].map((slot) => {
              const id = frameIds[slot];
              if (!id) {
                return (
                  <div
                    key={`empty-${slot}`}
                    className="frame-slot is-empty"
                    aria-hidden
                  />
                );
              }
              const item = menuById(id);
              return (
                <button
                  key={id}
                  type="button"
                  className="frame-slot"
                  onClick={() => selectMenu(id)}
                  aria-label={`액자 바로가기: ${item.label}`}
                >
                  <span className="frame-label">{item.label}</span>
                </button>
              );
            })}
          </div>

          <Link
            href="/admin"
            className="hotspot hotspot-door"
            aria-label="관리자실"
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
