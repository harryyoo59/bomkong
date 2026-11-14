/** 관리자 보관실 미리보기 — 이 기기 IndexedDB에 파일 본문만 잠깐 기억 */

export type PreviewKind = "video" | "photo";

export type PreviewRecord = {
  id: string;
  kind: PreviewKind;
  mimeType: string;
  blob: Blob;
  /** 목록용 정지 그림(동영상 첫 장면). 없으면 blob만 씀 */
  thumbBlob?: Blob;
  updatedAt: string;
};

const DB_NAME = "bomkong_media_preview_v1";
const STORE_NAME = "previews";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("미리보기 저장소를 쓸 수 없어요."));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () =>
      reject(req.error ?? new Error("미리보기 저장소를 열지 못했어요."));
  });
}

function detectPreviewKind(file: File): PreviewKind {
  const mime = (file.type || "").toLowerCase();
  if (mime.startsWith("image/")) return "photo";
  if (mime.startsWith("video/")) return "video";
  if (/\.(png|jpe?g|gif|webp|heic|bmp|avif)$/i.test(file.name)) return "photo";
  return "video";
}

/** 폰 원본 사진은 용량이 커서, 보관용으로 줄여 둠 (두 장째부터 막히는 일 줄임) */
async function compressPhotoForStore(file: File): Promise<Blob> {
  if (typeof document === "undefined") return file;
  const mime = (file.type || "").toLowerCase();
  // SVG 등은 그대로
  if (mime.includes("svg")) return file;

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("사진을 읽지 못했어요."));
      el.src = url;
    });
    const maxEdge = 1600;
    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;
    if (srcW < 1 || srcH < 1) return file;

    const scale = Math.min(1, maxEdge / Math.max(srcW, srcH));
    const width = Math.max(1, Math.round(srcW * scale));
    const height = Math.max(1, Math.round(srcH * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const quality = 0.82;
    const outType =
      mime === "image/png" || mime === "image/webp" ? mime : "image/jpeg";
    const compressed = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), outType, quality);
    });
    if (!compressed) return file;
    // 줄인 게 더 크면 원본 유지
    if (compressed.size >= file.size && scale >= 0.999) return file;
    return compressed;
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** 동영상에서 목록용 작은 그림 만들기 (실패해도 본문 저장은 계속) */
async function makeVideoThumbBlob(file: File): Promise<Blob | undefined> {
  if (typeof document === "undefined") return undefined;
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = url;

    await new Promise<void>((resolve, reject) => {
      const onReady = () => resolve();
      video.addEventListener("loadeddata", onReady, { once: true });
      video.addEventListener(
        "error",
        () => reject(new Error("영상을 읽지 못했어요.")),
        { once: true },
      );
      // 일부 브라우저는 loadeddata가 늦게 와서 안전망
      setTimeout(() => resolve(), 2500);
    });

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const seekTo =
      duration > 0.4 ? Math.min(0.4, duration * 0.12) : Math.min(0.1, duration);
    if (seekTo > 0) {
      try {
        video.currentTime = seekTo;
        await new Promise<void>((resolve) => {
          video.addEventListener("seeked", () => resolve(), { once: true });
          setTimeout(() => resolve(), 1200);
        });
      } catch {
        /* seek 실패 시 현재 프레임 */
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = 192;
    canvas.height = 108;
    const ctx = canvas.getContext("2d");
    if (!ctx || video.videoWidth < 2) return undefined;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const thumb = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.82);
    });
    return thumb ?? undefined;
  } catch {
    return undefined;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function saveMediaPreview(
  id: string,
  file: Blob,
  kind?: PreviewKind,
  fileName = "file",
): Promise<void> {
  const asFile =
    file instanceof File
      ? file
      : new File([file], fileName, {
          type: file.type || "application/octet-stream",
        });
  const resolvedKind = kind ?? detectPreviewKind(asFile);
  let storeBlob: Blob = asFile;
  let thumbBlob: Blob | undefined;
  let mimeType = asFile.type || "application/octet-stream";

  if (resolvedKind === "photo") {
    storeBlob = await compressPhotoForStore(asFile);
    mimeType = storeBlob.type || mimeType;
    // 사진은 blob만 저장 (같은 파일을 thumb에 또 넣지 않음 → 용량·실패 줄임)
    thumbBlob = undefined;
  } else {
    thumbBlob = await makeVideoThumbBlob(asFile);
  }

  const record: PreviewRecord = {
    id,
    kind: resolvedKind,
    mimeType,
    blob: storeBlob,
    thumbBlob,
    updatedAt: new Date().toISOString(),
  };
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error ?? new Error("미리보기를 저장하지 못했어요."));
      tx.onabort = () =>
        reject(tx.error ?? new Error("미리보기 저장이 취소됐어요."));
    });
  } catch (err) {
    const name =
      err && typeof err === "object" && "name" in err
        ? String((err as { name?: string }).name)
        : "";
    if (name === "QuotaExceededError") {
      throw new Error(
        "이 기기에 사진 자리가 부족해요. 큰 사진을 빼거나, 이미 넣은 사진을 조금 지운 뒤 다시 해 주세요.",
      );
    }
    throw err instanceof Error
      ? err
      : new Error("미리보기를 저장하지 못했어요.");
  } finally {
    db.close();
  }
}

export async function getMediaPreview(
  id: string,
): Promise<PreviewRecord | null> {
  try {
    const db = await openDb();
    const record = await new Promise<PreviewRecord | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => {
        const value = req.result as PreviewRecord | undefined;
        resolve(value?.blob ? value : null);
      };
      req.onerror = () =>
        reject(req.error ?? new Error("미리보기를 읽지 못했어요."));
    });
    db.close();
    return record;
  } catch {
    return null;
  }
}

export async function deleteMediaPreview(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error ?? new Error("미리보기를 지우지 못했어요."));
    });
    db.close();
  } catch {
    /* ignore missing store */
  }
}

/** 방을 옮길 때 새 id로 미리보기 복사 */
export async function copyMediaPreview(
  fromId: string,
  toId: string,
): Promise<boolean> {
  const existing = await getMediaPreview(fromId);
  if (!existing) return false;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({
      ...existing,
      id: toId,
      updatedAt: new Date().toISOString(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error("미리보기를 복사하지 못했어요."));
  });
  db.close();
  return true;
}

/** 복사 후 예전 id 삭제 */
export async function moveMediaPreview(
  fromId: string,
  toId: string,
): Promise<boolean> {
  const ok = await copyMediaPreview(fromId, toId);
  if (ok) await deleteMediaPreview(fromId);
  return ok;
}
