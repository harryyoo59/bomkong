"use server";

import { requireAdminSession } from "@/lib/admin-auth";
import { requireMembersRoomSession } from "@/lib/members-room-auth";
import {
  fetchMembersNotesFromServer,
  upsertMembersNotesOnServer,
  type MembersRoomRemoteStore,
} from "@/lib/members-room-server";

async function gateBoth(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return {
      ok: false,
      message: "관리자 문이 풀렸어요. 다시 들어간 뒤 해 주세요.",
    };
  }
  const room = await requireMembersRoomSession();
  if (!room.ok) {
    return {
      ok: false,
      message: "회원현황 비밀글 문이 풀렸어요. 다시 들어와 주세요.",
    };
  }
  return { ok: true };
}

export async function loadMembersNotesAction(): Promise<
  | { ok: true; store: MembersRoomRemoteStore }
  | { ok: false; message: string }
> {
  const gate = await gateBoth();
  if (!gate.ok) return gate;
  try {
    const store = await fetchMembersNotesFromServer();
    return { ok: true, store };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "회원현황 메모를 불러오지 못했어요.",
    };
  }
}

export async function publishMembersNotesAction(
  notesBody: string,
): Promise<
  | { ok: true; store: MembersRoomRemoteStore }
  | { ok: false; message: string }
> {
  const gate = await gateBoth();
  if (!gate.ok) return gate;
  try {
    const store = await upsertMembersNotesOnServer(
      typeof notesBody === "string" ? notesBody : "",
    );
    return { ok: true, store };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "회원현황 메모를 올리지 못했어요.",
    };
  }
}
