"use server";

import { requireAdminSession } from "@/lib/admin-auth";
import type { EmoticonItem, EmoticonShelf } from "@/lib/emoticons";
import {
  deleteEmoticonOnServer,
  fetchEmoticonsFromServer,
  upsertEmoticonOnServer,
} from "@/lib/emoticons-server";

function asShelf(value: FormDataEntryValue | null): EmoticonShelf | null {
  if (value === "bomi" || value === "kongi") return value;
  return null;
}

/**
 * 관리자실 이모티콘 보관: 한 장을 인터넷에 올려 다른 기기에서도 봄.
 * 원본 영상·다른 목록은 건드리지 않음. 빈 파일이면 거부.
 */
export async function publishOneEmoticonAction(
  formData: FormData,
): Promise<
  | { ok: true; item: EmoticonItem }
  | { ok: false; message: string }
> {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    return {
      ok: false,
      message:
        "관리자 문이 풀렸어요. 거실 문을 다섯 번 눌러 다시 들어간 뒤, 한 번 더 올려 주세요.",
    };
  }

  const shelf = asShelf(formData.get("shelf"));
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const note = String(formData.get("note") || "");
  const addedAt = String(formData.get("addedAt") || "").trim();
  const file = formData.get("file");

  if (!shelf || !id) {
    return { ok: false, message: "이모티콘 정보가 부족해요. 다시 해 주세요." };
  }
  if (!(file instanceof File) || file.size < 1) {
    return {
      ok: false,
      message:
        "올릴 그림 파일이 없어요. 이 기기 갤러리에 파일이 있는지 확인해 주세요.",
    };
  }

  try {
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength < 1) {
      return { ok: false, message: "그림 파일이 비어 있어요." };
    }
    const item = await upsertEmoticonOnServer({
      id,
      shelf,
      name: name || file.name || "emoticon",
      note,
      addedAt: addedAt || undefined,
      mimeType: file.type || "image/png",
      bytes,
    });
    return { ok: true, item };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "이모티콘을 인터넷에 올리지 못했어요. 다시 해 주세요.",
    };
  }
}

export async function listEmoticonsAction(
  shelf: EmoticonShelf,
): Promise<
  | { ok: true; items: EmoticonItem[]; count: number }
  | { ok: false; message: string }
> {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    return {
      ok: false,
      message: "관리자 문이 풀렸어요. 다시 들어간 뒤 확인해 주세요.",
    };
  }
  if (shelf !== "bomi" && shelf !== "kongi") {
    return { ok: false, message: "이모티콘 방을 찾지 못했어요." };
  }
  try {
    const items = await fetchEmoticonsFromServer(shelf);
    return { ok: true, items, count: items.length };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "인터넷 이모티콘 목록을 불러오지 못했어요.",
    };
  }
}

/** 사장님이 갤러리에서 「빼기」할 때만 한 장 제거. 전체 삭제는 없음. */
export async function removeEmoticonAction(
  shelf: EmoticonShelf,
  id: string,
  storagePath?: string | null,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    return {
      ok: false,
      message: "관리자 문이 풀렸어요. 다시 들어간 뒤 빼 주세요.",
    };
  }
  if (!id.trim()) {
    return { ok: false, message: "뺄 이모티콘을 찾지 못했어요." };
  }
  try {
    await deleteEmoticonOnServer(shelf, id.trim(), storagePath);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "인터넷에서 이모티콘을 빼지 못했어요.",
    };
  }
}
