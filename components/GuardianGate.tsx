"use client";

import type { ReactNode } from "react";

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
  if (!open) return null;

  return (
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
    </div>
  );
}
