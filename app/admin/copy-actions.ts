"use server";

import { requireAdminSession } from "@/lib/admin-auth";
import {
  normalizeAdminCopyStore,
  type AdminCopyStore,
} from "@/lib/admin-copy";
import {
  fetchAdminCopyFromServer,
  upsertAdminCopyOnServer,
  type AdminCopyRemoteStore,
} from "@/lib/admin-copy-server";

export async function loadAdminCopyAction(): Promise<
  | { ok: true; remote: AdminCopyRemoteStore }
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
    const remote = await fetchAdminCopyFromServer();
    return { ok: true, remote };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "관리자실 글씨를 불러오지 못했어요.",
    };
  }
}

export async function publishAdminCopyAction(
  raw: AdminCopyStore,
): Promise<
  | { ok: true; remote: AdminCopyRemoteStore }
  | { ok: false; message: string }
> {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    return {
      ok: false,
      message: "관리자 문이 풀렸어요. 다시 들어간 뒤 저장해 주세요.",
    };
  }
  try {
    const store = normalizeAdminCopyStore(raw);
    const remote = await upsertAdminCopyOnServer(store);
    return { ok: true, remote };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "관리자실 글씨를 올리지 못했어요.",
    };
  }
}
