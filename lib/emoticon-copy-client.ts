"use client";

import {
  getMediaPreview,
  saveMediaPreview,
} from "@/lib/media-preview-store";
import { isGifEmoticon, type EmoticonItem } from "@/lib/emoticons";

/** 붙여 넣기용 PNG로 맞춤 (정지 그림만 — GIF는 쓰면 안 됨) */
async function blobToPng(blob: Blob): Promise<Blob> {
  if (blob.type === "image/png") return blob;
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("이모티콘을 읽지 못했어요."));
      el.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    if (canvas.width < 1 || canvas.height < 1) {
      throw new Error("이모티콘을 복사하지 못했어요.");
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("이모티콘을 복사하지 못했어요.");
    ctx.drawImage(img, 0, 0);
    const png = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/png");
    });
    if (!png) throw new Error("이모티콘을 복사하지 못했어요.");
    return png;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function resolvePhotoBlob(item: EmoticonItem): Promise<Blob> {
  // 기기 옛 미리보기보다 인터넷에 올린 최신 그림을 우선
  const remote = item.publicUrl?.trim();
  if (remote) {
    const res = await fetch(remote, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("이모티콘을 읽지 못했어요.");
    }
    const blob = await res.blob();
    if (!blob.size) {
      throw new Error("이모티콘이 비어 있어요.");
    }
    await saveMediaPreview(item.id, blob, "photo", item.name || "photo");
    return blob;
  }
  const record = await getMediaPreview(item.id);
  if (record?.blob) return record.blob;
  throw new Error("이모티콘이 없어요. 잠시 후 다시 해 주세요.");
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
}

async function downloadFallback(
  item: EmoticonItem,
  fileName: string,
  asGif: boolean,
): Promise<void> {
  const blob = await resolvePhotoBlob(item);
  if (asGif) {
    const gifBlob =
      blob.type === "image/gif"
        ? blob
        : new Blob([blob], { type: "image/gif" });
    downloadBlob(
      gifBlob,
      fileName.replace(/\.[^.]+$/, "") + ".gif" || "emoticon.gif",
    );
    return;
  }
  const png = await blobToPng(blob);
  downloadBlob(
    png,
    fileName.replace(/\.[^.]+$/, "") + ".png" || "emoticon.png",
  );
}

/**
 * 이모티콘을 복사해 카톡·메시지 창에 붙여 넣을 수 있게 함.
 * 움직이는 GIF는 그대로 GIF로 복사·받아 둠 (정지 그림으로 바꾸지 않음).
 * 복사가 안 되면 그림 파일로 받아 둠.
 */
export function copyEmoticonToClipboard(
  item: EmoticonItem,
  fileName: string,
): Promise<void> {
  const canWriteImage =
    typeof navigator !== "undefined" &&
    Boolean(navigator.clipboard?.write) &&
    typeof ClipboardItem !== "undefined" &&
    !/firefox/i.test(navigator.userAgent || "");

  const blobPromise = resolvePhotoBlob(item).then(async (blob) => {
    if (isGifEmoticon(item, blob)) {
      return blob.type === "image/gif"
        ? blob
        : new Blob([await blob.arrayBuffer()], { type: "image/gif" });
    }
    return blobToPng(blob);
  });

  const mimePromise = blobPromise.then((b) =>
    b.type === "image/gif" ? "image/gif" : "image/png",
  );

  if (!canWriteImage) {
    return mimePromise.then(async (mime) => {
      await downloadFallback(item, fileName, mime === "image/gif");
      throw new Error(
        "이 기기에서는 복사가 안 돼서 그림 파일로 받아 두었어요. 그 파일을 카톡·메시지에 넣어 주세요.",
      );
    });
  }

  return mimePromise
    .then((mime) =>
      navigator.clipboard.write([
        new ClipboardItem({
          [mime]: blobPromise,
        }),
      ]),
    )
    .catch(async () => {
      try {
        const blob = await blobPromise;
        const mime = blob.type === "image/gif" ? "image/gif" : "image/png";
        // 많은 브라우저는 클립보드에 GIF를 안 받음 → 파일로 받아 움직임 유지
        if (mime === "image/gif") {
          await downloadFallback(item, fileName, true);
          throw new Error(
            "이 기기에서는 움직이는 그림을 바로 복사하기 어려워 파일로 받아 두었어요. 그 파일을 넣어 주세요.",
          );
        }
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
      } catch (err) {
        if (err instanceof Error && err.message.includes("파일로")) throw err;
        const blob = await blobPromise;
        const asGif = blob.type === "image/gif" || isGifEmoticon(item, blob);
        await downloadFallback(item, fileName, asGif);
        throw new Error(
          "복사가 안 돼서 그림 파일로 받아 두었어요. 그 파일을 카톡·메시지에 넣어 주세요.",
        );
      }
    });
}
