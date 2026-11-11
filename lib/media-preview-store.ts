/** 관리자 보관실 미리보기 — 이 기기 IndexedDB에 파일 본문만 잠깐 기억 */

export type PreviewKind = "video" | "photo";

export type PreviewRecord = {
  id: string;
  kind: PreviewKind;
  mimeType: string;
  blob: Blob;
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

export async function saveMediaPreview(
  id: string,
  file: File,
  kind?: PreviewKind,
): Promise<void> {
  const record: PreviewRecord = {
    id,
    kind: kind ?? detectPreviewKind(file),
    mimeType: file.type || "application/octet-stream",
    blob: file,
    updatedAt: new Date().toISOString(),
  };
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error("미리보기를 저장하지 못했어요."));
  });
  db.close();
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
