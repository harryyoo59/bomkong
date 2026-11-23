"use client";

import { copyEmoticonToClipboard } from "@/lib/emoticon-copy-client";
import { isGifEmoticon, type EmoticonItem } from "@/lib/emoticons";

function safeBaseName(fileName: string): string {
  const raw = (fileName || "emoticon").trim() || "emoticon";
  return raw.replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|]+/g, "_") || "emoticon";
}

function mimeAndExt(
  item: EmoticonItem,
  blob: Blob,
): { mime: string; ext: string } {
  if (isGifEmoticon(item, blob) || blob.type === "image/gif") {
    return { mime: "image/gif", ext: "gif" };
  }
  const mime = (blob.type || item.mimeType || "image/png").toLowerCase();
  if (mime.includes("png")) return { mime: "image/png", ext: "png" };
  if (mime.includes("jpeg") || mime.includes("jpg")) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (mime.includes("webp")) return { mime: "image/webp", ext: "webp" };
  // 손님 공유·복사용: 알 수 없으면 PNG로 맞춤하지 않고 원본 타입 유지
  if (mime.startsWith("image/") && mime !== "image/") {
    const ext = mime.split("/")[1]?.split("+")[0] || "png";
    return { mime, ext };
  }
  return { mime: "image/png", ext: "png" };
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
  // canShare 없는 일부 기기: share만 있으면 파일 공유 시도
  return true;
}

/**
 * 손님용: 휴대폰 공유 창으로 이모티콘 파일 보내기.
 * PNG는 PNG, GIF는 움직이는 GIF 그대로.
 * 파일 공유가 안 되면 예전 복사(또는 받기)로 대신함.
 * 사용자 클릭 안에서 호출해야 함. blobPromise를 넘기면 미리 받아 둔 파일을 씀.
 */
export async function shareEmoticonFile(
  item: EmoticonItem,
  fileName: string,
  options?: { blobPromise?: Promise<Blob> | null },
): Promise<"shared" | "copied" | "cancelled"> {
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
      // 사용자가 공유 창을 닫음
      if (err instanceof DOMException && err.name === "AbortError") {
        return "cancelled";
      }
      // share 실패 시 아래 복사로 이어감
    }
  }

  await copyEmoticonToClipboard(item, fileName);
  return "copied";
}

/** 목록을 불러온 뒤 파일을 미리 받아 두면, 공유 버튼 클릭 직후 바로 창을 띄우기 쉬움 */
export function prefetchEmoticonBlobs(
  items: EmoticonItem[],
): Map<string, Promise<Blob>> {
  const map = new Map<string, Promise<Blob>>();
  for (const item of items) {
    if (!item.publicUrl?.trim()) continue;
    map.set(
      item.id,
      fetchEmoticonBlob(item).catch((err) => {
        throw err;
      }),
    );
  }
  return map;
}
