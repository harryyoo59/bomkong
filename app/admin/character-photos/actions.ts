"use server";

import { requireAdminSession } from "@/lib/admin-auth";
import type {
  CharacterMediaKind,
  CharacterPhotoItem,
  CharacterShelf,
} from "@/lib/character-photos";
import { characterMediaKind } from "@/lib/character-photos";
import {
  deleteCharacterPhotoOnServer,
  fetchCharacterPhotosFromServer,
  upsertCharacterPhotoOnServer,
} from "@/lib/character-photos-server";

function asShelf(value: FormDataEntryValue | null): CharacterShelf | null {
  if (value === "bomi" || value === "kongi" || value === "duo") return value;
  return null;
}

function asMediaKind(
  value: FormDataEntryValue | null | undefined,
): CharacterMediaKind | null {
  if (value === "photo" || value === "video") return value;
  return null;
}

/**
 * 관리자실 사진·동영상 보관: 한 파일을 인터넷에 올려 다른 기기에서도 봄.
 * 원본 영상보기·다른 목록은 건드리지 않음. 빈 파일이면 거부.
 */
export async function publishOneCharacterPhotoAction(
  formData: FormData,
): Promise<
  | { ok: true; item: CharacterPhotoItem }
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
  const expectedKind = asMediaKind(formData.get("mediaKind")) || "photo";
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const note = String(formData.get("note") || "");
  const addedAt = String(formData.get("addedAt") || "").trim();
  const file = formData.get("file");

  if (!shelf || !id) {
    return { ok: false, message: "보관함 정보가 부족해요. 다시 해 주세요." };
  }
  if (!(file instanceof File) || file.size < 1) {
    return {
      ok: false,
      message:
        expectedKind === "video"
          ? "올릴 동영상 파일이 없어요. 이 기기 갤러리에 영상이 있는지 확인해 주세요."
          : "올릴 사진 파일이 없어요. 이 기기 갤러리에 사진이 있는지 확인해 주세요.",
    };
  }

  const mimeType =
    file.type ||
    (expectedKind === "video" ? "video/mp4" : "image/jpeg");
  const detected = characterMediaKind({
    mimeType,
    name: file.name,
    storagePath: file.name,
  });
  if (detected !== expectedKind) {
    return {
      ok: false,
      message:
        expectedKind === "video"
          ? "이 칸에는 동영상만 넣을 수 있어요."
          : "이 칸에는 사진만 넣을 수 있어요.",
    };
  }

  try {
    const bytes = await file.arrayBuffer();
    if (bytes.byteLength < 1) {
      return {
        ok: false,
        message:
          expectedKind === "video"
            ? "동영상 파일이 비어 있어요."
            : "사진 파일이 비어 있어요.",
      };
    }
    const item = await upsertCharacterPhotoOnServer({
      id,
      shelf,
      name: name || file.name || (expectedKind === "video" ? "video" : "photo"),
      note,
      addedAt: addedAt || undefined,
      mimeType,
      bytes,
    });
    return { ok: true, item };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "인터넷에 올리지 못했어요. 다시 해 주세요.",
    };
  }
}

export async function listCharacterPhotosAction(
  shelf: CharacterShelf,
  mediaKind: CharacterMediaKind = "photo",
): Promise<
  | { ok: true; items: CharacterPhotoItem[]; count: number }
  | { ok: false; message: string }
> {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    return {
      ok: false,
      message: "관리자 문이 풀렸어요. 다시 들어간 뒤 확인해 주세요.",
    };
  }
  if (shelf !== "bomi" && shelf !== "kongi" && shelf !== "duo") {
    return { ok: false, message: "보관함 방을 찾지 못했어요." };
  }
  try {
    const items = await fetchCharacterPhotosFromServer(shelf, mediaKind);
    return { ok: true, items, count: items.length };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "인터넷 보관함 목록을 불러오지 못했어요.",
    };
  }
}

/** 사장님이 갤러리에서 「빼기」할 때만 한 장 제거. 전체 삭제는 없음. */
export async function removeCharacterPhotoAction(
  shelf: CharacterShelf,
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
    return { ok: false, message: "뺄 항목을 찾지 못했어요." };
  }
  try {
    await deleteCharacterPhotoOnServer(shelf, id.trim(), storagePath);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "인터넷에서 빼지 못했어요.",
    };
  }
}
