"use client";

import {
  getMediaPreview,
  saveMediaPreview,
} from "@/lib/media-preview-store";
import type { EmoticonItem } from "@/lib/emoticons";

/** 붙여 넣기용 PNG로 맞춤 */
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
  const record = await getMediaPreview(item.id);
  if (record?.blob) return record.blob;
  const remote = item.publicUrl?.trim();
  if (!remote) {
    throw new Error("이모티콘이 없어요. 잠시 후 다시 해 주세요.");
  }
  const res = await fetch(remote);
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

async function preparePngBlob(item: EmoticonItem): Promise<Blob> {
  const blob = await resolvePhotoBlob(item);
  return blobToPng(blob);
}

async function downloadPngFallback(
  item: EmoticonItem,
  fileName: string,
): Promise<void> {
  const png = await preparePngBlob(item);
  const url = URL.createObjectURL(png);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.replace(/\.[^.]+$/, "") + ".png" || "emoticon.png";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
}

/**
 * 이모티콘을 복사해 카톡·메시지 창에 붙여 넣을 수 있게 함.
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

  const pngPromise = preparePngBlob(item);

  if (!canWriteImage) {
    return downloadPngFallback(item, fileName).then(() => {
      throw new Error(
        "이 기기에서는 복사가 안 돼서 그림 파일로 받아 두었어요. 그 파일을 카톡·메시지에 넣어 주세요.",
      );
    });
  }

  return navigator.clipboard
    .write([
      new ClipboardItem({
        "image/png": pngPromise,
      }),
    ])
    .catch(async () => {
      try {
        const png = await pngPromise;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": png }),
        ]);
      } catch {
        await downloadPngFallback(item, fileName);
        throw new Error(
          "복사가 안 돼서 그림 파일로 받아 두었어요. 그 파일을 카톡·메시지에 넣어 주세요.",
        );
      }
    });
}
