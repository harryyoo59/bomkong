"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function GuardianGate({
  open,
  title,
  children,
  onCancel,
  onConfirm,
  confirmLabel = "보호자 확인 · 계속",
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="guardian-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guardian-title"
    >
      <div className="guardian-card">
        <p className="eyebrow">보호자 확인</p>
        <h2 id="guardian-title" className="section-title">
          {title}
        </h2>
        <div className="guardian-body">{children}</div>
        <div className="guardian-actions">
          <button type="button" className="btn btn-soft" onClick={onCancel}>
            취소
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
