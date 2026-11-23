"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  getMediaPreview,
  type PreviewKind,
} from "@/lib/media-preview-store";

type Props = {
  itemId: string;
  /** 목록에 적힌 종류가 있으면 전달 (없어도 저장본으로 판단) */
  kindHint?: PreviewKind;
  label?: string;
  /** 미리보기를 다시 넣었을 때 숫자만 올려 다시 읽기 */
  refreshToken?: number;
  /** 이 기기에 파일이 없을 때 인터넷 사진 주소로 보여 줌 (사진은 지우지 않음) */
  remoteUrl?: string;
  /** true면 기기 옛 미리보기보다 인터넷 주소를 먼저 씀 (이모티콘 최신 그림) */
  preferRemote?: boolean;
};

type PreviewState =
  | { status: "loading" }
  | { status: "missing" }
  | {
      status: "ready";
      mediaUrl: string;
      thumbUrl: string | null;
      kind: PreviewKind;
    };

/**
 * 휴대폰에서 <video>는 재생 전 첫 장면이 검게 나오는 일이 많음.
 * 그래서 짧은 시간으로 옮긴 뒤 그림으로 뽑아 목록에 씀.
 */
async function captureVideoPosterUrl(src: string): Promise<string | null> {
  if (typeof document === "undefined") return null;
  const video = document.createElement("video");
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.preload = "auto";
  video.crossOrigin = "anonymous";

  const base = src.split("#")[0];
  video.src = `${base}#t=0.1`;

  try {
    await new Promise<void>((resolve, reject) => {
      const onReady = () => resolve();
      video.addEventListener("loadeddata", onReady, { once: true });
      video.addEventListener(
        "error",
        () => reject(new Error("영상을 읽지 못했어요.")),
        { once: true },
      );
      setTimeout(() => resolve(), 3500);
      try {
        void video.load();
      } catch {
        /* ignore */
      }
    });

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const seekTo =
      duration > 0.25
        ? Math.min(0.25, Math.max(0.05, duration * 0.08))
        : duration > 0
          ? Math.min(0.1, duration * 0.5)
          : 0.1;
    try {
      video.currentTime = seekTo;
      await new Promise<void>((resolve) => {
        video.addEventListener("seeked", () => resolve(), { once: true });
        setTimeout(() => resolve(), 1500);
      });
    } catch {
      /* seek 실패 시 현재 프레임 */
    }

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (w < 2 || h < 2) return null;

    const maxEdge = 480;
    const scale = Math.min(1, maxEdge / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.86);
    });
    if (!blob || blob.size < 32) return null;
    return URL.createObjectURL(blob);
  } catch {
    return null;
  } finally {
    video.removeAttribute("src");
    try {
      video.load();
    } catch {
      /* ignore */
    }
  }
}

/** 목록용: 첫 장면 그림이 생기면 사진처럼 보여 줌 (검은 video 칸 방지) */
function VideoListThumb({
  mediaUrl,
  existingThumbUrl,
}: {
  mediaUrl: string;
  existingThumbUrl: string | null;
}) {
  const [posterUrl, setPosterUrl] = useState<string | null>(existingThumbUrl);
  const generatedRef = useRef<string | null>(null);

  useEffect(() => {
    if (existingThumbUrl) {
      setPosterUrl(existingThumbUrl);
      return;
    }
    let cancelled = false;
    setPosterUrl(null);
    void (async () => {
      const next = await captureVideoPosterUrl(mediaUrl);
      if (cancelled) {
        if (next) URL.revokeObjectURL(next);
        return;
      }
      if (generatedRef.current) {
        URL.revokeObjectURL(generatedRef.current);
      }
      generatedRef.current = next;
      setPosterUrl(next);
    })();
    return () => {
      cancelled = true;
      if (generatedRef.current) {
        URL.revokeObjectURL(generatedRef.current);
        generatedRef.current = null;
      }
    };
  }, [mediaUrl, existingThumbUrl]);

  if (posterUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={posterUrl} alt="" className="admin-media-preview-media" />
    );
  }

  // 첫 장면 뽑는 동안: 짧은 시간 지점으로 메타데이터 미리보기 (실패해도 흰 칸)
  return (
    <video
      className="admin-media-preview-media admin-media-preview-video-fallback"
      src={`${mediaUrl.split("#")[0]}#t=0.1`}
      muted
      playsInline
      preload="metadata"
      tabIndex={-1}
      onLoadedMetadata={(e) => {
        const el = e.currentTarget;
        try {
          if (el.duration && Number.isFinite(el.duration)) {
            el.currentTime = Math.min(0.1, Math.max(0, el.duration * 0.05));
          } else {
            el.currentTime = 0.1;
          }
        } catch {
          /* ignore seek failures */
        }
      }}
    />
  );
}

export function AdminMediaPreview({
  itemId,
  kindHint,
  label,
  refreshToken = 0,
  remoteUrl,
  preferRemote = false,
}: Props) {
  const dialogId = useId();
  const [state, setState] = useState<PreviewState>({ status: "loading" });
  const [open, setOpen] = useState(false);
  const [dialogPoster, setDialogPoster] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mediaUrlRef = useRef<string | null>(null);
  const thumbUrlRef = useRef<string | null>(null);
  const dialogPosterRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ status: "loading" });
      if (mediaUrlRef.current) {
        URL.revokeObjectURL(mediaUrlRef.current);
        mediaUrlRef.current = null;
      }
      if (thumbUrlRef.current) {
        URL.revokeObjectURL(thumbUrlRef.current);
        thumbUrlRef.current = null;
      }

      const preferredRemote = preferRemote ? remoteUrl?.trim() : "";
      if (preferredRemote) {
        const kind = kindHint || "photo";
        // 동영상: 인터넷 본문은 쓰되, 이 기기에 첫 장면 그림이 있으면 목록에 씀
        if (kind === "video") {
          const record = await getMediaPreview(itemId);
          if (cancelled) return;
          if (record?.thumbBlob) {
            const thumbUrl = URL.createObjectURL(record.thumbBlob);
            thumbUrlRef.current = thumbUrl;
            setState({
              status: "ready",
              mediaUrl: preferredRemote,
              thumbUrl,
              kind: "video",
            });
            return;
          }
        }
        setState({
          status: "ready",
          mediaUrl: preferredRemote,
          thumbUrl: kind === "video" ? null : preferredRemote,
          kind,
        });
        return;
      }

      const record = await getMediaPreview(itemId);
      if (cancelled) return;
      if (!record) {
        const fallback = remoteUrl?.trim();
        if (fallback) {
          const kind = kindHint || "photo";
          setState({
            status: "ready",
            mediaUrl: fallback,
            thumbUrl: kind === "video" ? null : fallback,
            kind,
          });
          return;
        }
        setState({ status: "missing" });
        return;
      }
      const mediaUrl = URL.createObjectURL(record.blob);
      mediaUrlRef.current = mediaUrl;
      let thumbUrl: string | null = null;
      if (record.thumbBlob) {
        thumbUrl = URL.createObjectURL(record.thumbBlob);
        thumbUrlRef.current = thumbUrl;
      } else if (record.kind === "photo") {
        thumbUrl = mediaUrl;
      }
      setState({
        status: "ready",
        mediaUrl,
        thumbUrl,
        kind: record.kind || kindHint || "video",
      });
    }

    void load();

    return () => {
      cancelled = true;
      if (mediaUrlRef.current) {
        URL.revokeObjectURL(mediaUrlRef.current);
        mediaUrlRef.current = null;
      }
      if (thumbUrlRef.current && thumbUrlRef.current !== mediaUrlRef.current) {
        URL.revokeObjectURL(thumbUrlRef.current);
        thumbUrlRef.current = null;
      }
    };
  }, [itemId, kindHint, refreshToken, remoteUrl, preferRemote]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  // 크게 보기 창에서도 재생 전 첫 장면이 검지 않게 포스터 준비
  useEffect(() => {
    if (state.status !== "ready" || state.kind !== "video") {
      setDialogPoster(null);
      return;
    }
    if (state.thumbUrl) {
      setDialogPoster(state.thumbUrl);
      return;
    }
    let cancelled = false;
    let generated: string | null = null;
    void (async () => {
      const next = await captureVideoPosterUrl(state.mediaUrl);
      if (cancelled) {
        if (next) URL.revokeObjectURL(next);
        return;
      }
      generated = next;
      dialogPosterRef.current = next;
      setDialogPoster(next);
    })();
    return () => {
      cancelled = true;
      if (generated) {
        URL.revokeObjectURL(generated);
        if (dialogPosterRef.current === generated) {
          dialogPosterRef.current = null;
        }
      }
    };
  }, [state]);

  const title = label?.trim() || "미리보기";

  if (state.status === "loading") {
    return (
      <div className="admin-media-preview admin-media-preview-loading" aria-hidden>
        <span className="admin-media-preview-ph">…</span>
      </div>
    );
  }

  if (state.status === "missing") {
    return (
      <div
        className="admin-media-preview admin-media-preview-missing"
        title="미리보기 없음 · 예전에 이름만 넣었거나, 아직 파일을 안 넣은 항목이에요"
      >
        <span className="admin-media-preview-ph">
          미리보기 없음
          <br />
          파일 다시 넣기
        </span>
      </div>
    );
  }

  const { mediaUrl, thumbUrl, kind } = state;

  return (
    <>
      <button
        type="button"
        className="admin-media-preview admin-media-preview-btn"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-controls={dialogId}
        aria-label={`${title} 크게 보기`}
      >
        {kind === "photo" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl || mediaUrl}
            alt=""
            className="admin-media-preview-media"
          />
        ) : (
          <VideoListThumb mediaUrl={mediaUrl} existingThumbUrl={thumbUrl} />
        )}
        {kind === "video" ? (
          <span className="admin-media-preview-play" aria-hidden>
            ▶
          </span>
        ) : null}
      </button>

      <dialog
        id={dialogId}
        ref={dialogRef}
        className="admin-media-preview-dialog"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
      >
        <div className="admin-media-preview-dialog-inner">
          <p className="admin-media-preview-dialog-title">{title}</p>
          {kind === "photo" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl}
              alt={title}
              className="admin-media-preview-dialog-media"
            />
          ) : (
            <video
              className="admin-media-preview-dialog-media"
              src={`${mediaUrl.split("#")[0]}#t=0.1`}
              poster={dialogPoster || undefined}
              muted
              playsInline
              controls
              autoPlay
              preload="metadata"
            />
          )}
          <button
            type="button"
            className="btn btn-soft"
            onClick={() => setOpen(false)}
          >
            닫기
          </button>
        </div>
      </dialog>
    </>
  );
}
