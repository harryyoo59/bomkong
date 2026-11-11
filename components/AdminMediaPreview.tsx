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
};

type PreviewState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "ready"; url: string; kind: PreviewKind };

export function AdminMediaPreview({ itemId, kindHint, label }: Props) {
  const dialogId = useId();
  const [state, setState] = useState<PreviewState>({ status: "loading" });
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ status: "loading" });
      const record = await getMediaPreview(itemId);
      if (cancelled) return;
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
      if (!record) {
        setState({ status: "missing" });
        return;
      }
      const url = URL.createObjectURL(record.blob);
      urlRef.current = url;
      setState({
        status: "ready",
        url,
        kind: record.kind || kindHint || "video",
      });
    }

    void load();

    return () => {
      cancelled = true;
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [itemId, kindHint]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

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
        title="미리보기 없음"
      >
        <span className="admin-media-preview-ph">미리보기 없음</span>
      </div>
    );
  }

  const { url, kind } = state;

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
          <img src={url} alt="" className="admin-media-preview-media" />
        ) : (
          <video
            className="admin-media-preview-media"
            src={url}
            muted
            playsInline
            preload="metadata"
            tabIndex={-1}
            onLoadedMetadata={(e) => {
              const el = e.currentTarget;
              try {
                if (el.duration && Number.isFinite(el.duration)) {
                  el.currentTime = Math.min(0.2, Math.max(0, el.duration / 4));
                }
              } catch {
                /* ignore seek failures */
              }
            }}
          />
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
              src={url}
              alt={title}
              className="admin-media-preview-dialog-media"
            />
          ) : (
            <video
              className="admin-media-preview-dialog-media"
              src={url}
              muted
              playsInline
              controls
              autoPlay
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
