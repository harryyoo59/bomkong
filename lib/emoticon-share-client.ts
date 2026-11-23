"use client";

import {
  isGifEmoticon,
  isMotionEmoticon,
  type EmoticonItem,
} from "@/lib/emoticons";

function safeBaseName(fileName: string): string {
  const raw = (fileName || "emoticon").trim() || "emoticon";
  return raw.replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|]+/g, "_") || "emoticon";
}

function mimeAndExt(
  item: EmoticonItem,
  blob: Blob,
): { mime: string; ext: string } {
  const hint = (blob.type || item.mimeType || "").toLowerCase();
  if (hint.startsWith("video/")) {
    const sub = hint.split("/")[1]?.split(";")[0] || "mp4";
    const ext =
      sub === "quicktime" ? "mov" : sub === "x-m4v" ? "m4v" : sub || "mp4";
    return { mime: hint.split(";")[0] || "video/mp4", ext };
  }
  if (isGifEmoticon(item, blob) || hint === "image/gif") {
    return { mime: "image/gif", ext: "gif" };
  }
  const path = `${item.storagePath || ""} ${item.name || ""} ${item.publicUrl || ""}`.toLowerCase();
  if (/\.mp4(\?|$)/i.test(path)) return { mime: "video/mp4", ext: "mp4" };
  if (/\.webm(\?|$)/i.test(path)) return { mime: "video/webm", ext: "webm" };
  if (/\.mov(\?|$)/i.test(path)) return { mime: "video/quicktime", ext: "mov" };
  return { mime: "image/gif", ext: "gif" };
}

async function fetchEmoticonBlob(item: EmoticonItem): Promise<Blob> {
  const remote = item.publicUrl?.trim();
  if (!remote) {
    throw new Error("이모티콘이 없어요. 잠시 후 다시 해 주세요.");
  }
  const res = await fetch(remote, { cache: "force-cache" });
  if (!res.ok) {
    throw new Error("이모티콘을 읽지 못했어요.");
  }
  const blob = await res.blob();
  if (!blob.size) {
    throw new Error("이모티콘이 비어 있어요.");
  }
  return blob;
}

function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
}

export async function buildEmoticonShareFile(
  item: EmoticonItem,
  fileName: string,
  cached?: Blob | null,
): Promise<File> {
  const blob = cached && cached.size > 0 ? cached : await fetchEmoticonBlob(item);
  const { mime, ext } = mimeAndExt(item, blob);
  const body =
    blob.type === mime ? blob : new Blob([await blob.arrayBuffer()], { type: mime });
  const name = `${safeBaseName(fileName)}.${ext}`;
  return new File([body], name, { type: mime, lastModified: Date.now() });
}

function canShareFiles(file: File): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }
  const data = { files: [file] };
  if (typeof navigator.canShare === "function") {
    try {
      return navigator.canShare(data);
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * 움직이는 이모티콘(GIF·영상)만: 휴대폰 공유 창으로 파일 보내기.
 * 파일 공유가 안 되면 다운로드로 대신함.
 * 사용자 클릭 안에서 호출해야 함.
 */
export async function shareEmoticonFile(
  item: EmoticonItem,
  fileName: string,
  options?: { blobPromise?: Promise<Blob> | null },
): Promise<"shared" | "downloaded" | "cancelled"> {
  let cached: Blob | null = null;
  if (options?.blobPromise) {
    try {
      cached = await options.blobPromise;
    } catch {
      cached = null;
    }
  }

  const file = await buildEmoticonShareFile(item, fileName, cached);

  if (canShareFiles(file)) {
    try {
      await navigator.share({
        files: [file],
        title: fileName || "이모티콘",
      });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return "cancelled";
      }
      // share 실패 → 아래로 다운로드
    }
  }

  downloadFile(file);
  return "downloaded";
}

/** 움직이는 것만 미리 받아 두면, 공유 클릭 직후 창을 띄우기 쉬움 */
export function prefetchEmoticonBlobs(
  items: EmoticonItem[],
): Map<string, Promise<Blob>> {
  const map = new Map<string, Promise<Blob>>();
  for (const item of items) {
    if (!item.publicUrl?.trim()) continue;
    if (!isMotionEmoticon(item)) continue;
    map.set(
      item.id,
      fetchEmoticonBlob(item).catch((err) => {
        throw err;
      }),
    );
  }
  return map;
}
