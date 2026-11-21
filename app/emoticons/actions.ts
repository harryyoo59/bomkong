"use server";

import type { EmoticonItem, EmoticonShelf } from "@/lib/emoticons";
import { fetchEmoticonsFromServer } from "@/lib/emoticons-server";

/** 손님용: 관리자실에 올린 이모티콘 목록 (로그인 없이 읽기) */
export async function listPublicEmoticonsAction(
  shelf: EmoticonShelf,
): Promise<
  | { ok: true; items: EmoticonItem[]; count: number }
  | { ok: false; message: string }
> {
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
          : "이모티콘 목록을 불러오지 못했어요.",
    };
  }
}
