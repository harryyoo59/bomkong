"use server";

import { requireAdminSession } from "@/lib/admin-auth";
import type { UnreleasedItem, UnreleasedLang } from "@/lib/unreleased-media";
import {
  deleteUnreleasedItemOnServer,
  fetchUnreleasedItemsFromServer,
  upsertUnreleasedItemOnServer,
} from "@/lib/unreleased-media-server";

function asLang(value: unknown): UnreleasedLang | null {
  if (value === "ko" || value === "en") return value;
  return null;
}

export async function listUnreleasedItemsAction(
  lang: UnreleasedLang,
): Promise<
  | { ok: true; items: UnreleasedItem[]; count: number }
  | { ok: false; message: string }
> {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    return {
      ok: false,
      message: "관리자 문이 풀렸어요. 다시 들어간 뒤 확인해 주세요.",
    };
  }
  const safeLang = asLang(lang);
  if (!safeLang) {
    return { ok: false, message: "미공개 방을 찾지 못했어요." };
  }
  try {
    const items = await fetchUnreleasedItemsFromServer(safeLang);
    return { ok: true, items, count: items.length };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "인터넷 미공개 목록을 불러오지 못했어요.",
    };
  }
}

/**
 * 메타데이터만 맞춤. 파일은 기기에서 인터넷 보관함에 올린 뒤 경로를 넘김.
 * 원본 영상보기(6번) 목록은 건드리지 않음.
 */
export async function publishUnreleasedItemMetaAction(input: {
  id: string;
  lang: UnreleasedLang;
  name: string;
  title: string;
  addedAt?: string;
  storagePath?: string | null;
  mimeType?: string;
}): Promise<
  | { ok: true; item: UnreleasedItem }
  | { ok: false; message: string }
> {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    return {
      ok: false,
      message:
        "관리자 문이 풀렸어요. 거실 문을 다섯 번 눌러 다시 들어간 뒤, 한 번 더 해 주세요.",
    };
  }

  const lang = asLang(input?.lang);
  const id = String(input?.id || "").trim();
  const title = String(input?.title || "").trim();
  if (!lang || !id || !title) {
    return { ok: false, message: "영상 정보가 부족해요. 다시 해 주세요." };
  }

  try {
    const item = await upsertUnreleasedItemOnServer({
      id,
      lang,
      name: String(input?.name || ""),
      title,
      addedAt: input?.addedAt,
      storagePath: input?.storagePath,
      mimeType: input?.mimeType,
    });
    return { ok: true, item };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "미공개 정보를 인터넷에 올리지 못했어요.",
    };
  }
}

/** 사장님이 「목록에서 빼기」할 때만 한 건 제거. */
export async function removeUnreleasedItemAction(
  lang: UnreleasedLang,
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
  const safeLang = asLang(lang);
  if (!safeLang || !id.trim()) {
    return { ok: false, message: "뺄 영상을 찾지 못했어요." };
  }
  try {
    await deleteUnreleasedItemOnServer(safeLang, id.trim(), storagePath);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "인터넷에서 미공개 항목을 빼지 못했어요.",
    };
  }
}
