"use client";

import { useId, useRef, useState } from "react";
import {
  saveMediaPreview,
  type PreviewKind,
} from "@/lib/media-preview-store";

type Props = {
  itemId: string;
  kindHint?: PreviewKind;
  accept?: string;
  onAttached?: () => void;
  /** 기기 저장 뒤 인터넷에도 올릴 때 (영상보기 등) */
  onAfterLocalSave?: (itemId: string, file: File) => void | Promise<void>;
  onMessage?: (text: string) => void;
};

/** 예전 항목·미리보기 없는 항목에 파일을 다시 넣어 썸네일 만들기 */
export function AdminPreviewAttach({
  itemId,
  kindHint,
  accept = "image/*,video/*",
  onAttached,
  onAfterLocalSave,
  onMessage,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onPick(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    setBusy(true);
    try {
      await saveMediaPreview(itemId, file, kindHint);
      if (onAfterLocalSave) {
        try {
          await onAfterLocalSave(itemId, file);
          onMessage?.(
            "미리보기를 넣었고, 인터넷에도 올려 두었어요. 다른 기기에서도 보여요.",
          );
        } catch {
          onMessage?.(
            "이 기기에는 넣었어요. 인터넷 올리기는 실패했어요. 잠시 후 다시 「미리보기 파일 넣기」를 해 주세요.",
          );
        }
      } else {
        onMessage?.("미리보기를 넣었어요. 옆에 작은 그림이 보여요.");
      }
      onAttached?.();
    } catch {
      onMessage?.(
        "미리보기를 저장하지 못했어요. 같은 기기·같은 브라우저에서 다시 해 주세요.",
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <span className="admin-preview-attach">
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={accept}
        className="admin-preview-attach-input"
        disabled={busy}
        onChange={(e) => void onPick(e.target.files)}
      />
      <label
        htmlFor={inputId}
        className={`btn btn-soft admin-preview-attach-label${busy ? " is-disabled" : ""}`}
      >
        {busy ? "넣는 중…" : "미리보기 파일 넣기"}
      </label>
    </span>
  );
}
