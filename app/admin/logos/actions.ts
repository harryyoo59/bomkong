"use server";

import { requireAdminSession } from "@/lib/admin-auth";
import type { LogoItem } from "@/lib/logo-catalog";
import {
  deleteLogoItemOnServer,
  fetchLogoItemsFromServer,
  upsertLogoItemOnServer,
} from "@/lib/logo-catalog-server";

export async function listLogoItemsAction(): Promise<
  | { ok: true; items: LogoItem[]; count: number }
  | { ok: false; message: string }
> {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    return {
      ok: false,
      message: "관리자 문이 풀렸어요. 다시 들어간 뒤 확인해 주세요.",
    };
  }
  try {
    const items = await fetchLogoItemsFromServer();
    return { ok: true, items, count: items.length };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "인터넷 로고 목록을 불러오지 못했어요.",
    };
  }
}

export async function publishLogoItemMetaAction(input: {
  id: string;
  serial: number;
  title: string;
  blurb?: string;
  name?: string;
  addedAt?: string;
  builtIn?: boolean;
  storagePath?: string | null;
  mimeType?: string;
  width?: number | null;
  height?: number | null;
}): Promise<
  | { ok: true; item: LogoItem }
  | { ok: false; message: string }
> {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    return {
      ok: false,
      message:
        "관리자 문이 풀렸어요. 다시 들어간 뒤 한 번 더 해 주세요.",
    };
  }
  const id = String(input?.id || "").trim();
  const title = String(input?.title || "").trim();
  if (!id || !title) {
    return { ok: false, message: "로고 정보가 부족해요." };
  }
  try {
    const item = await upsertLogoItemOnServer({
      id,
      serial: Number(input.serial) || 1,
      title,
      blurb: input.blurb,
      name: input.name,
      addedAt: input.addedAt,
      builtIn: input.builtIn,
      storagePath: input.storagePath,
      mimeType: input.mimeType,
      width: input.width,
      height: input.height,
    });
    return { ok: true, item };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "로고를 인터넷에 올리지 못했어요.",
    };
  }
}

export async function removeLogoItemAction(
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
    return { ok: false, message: "뺄 로고를 찾지 못했어요." };
  }
  try {
    await deleteLogoItemOnServer(id.trim(), storagePath);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "인터넷에서 로고를 빼지 못했어요.",
    };
  }
}
