"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  MEMBERS_ROOM_COOKIE,
  createMembersRoomSessionToken,
  getMembersRoomAuthConfig,
  verifyMembersRoomPassword,
} from "@/lib/members-room-auth";

export async function enterMembersRoom(
  formData: FormData,
): Promise<{ ok: false; message: string } | void> {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    redirect(
      gate.reason === "missing_secret"
        ? "/admin/login?need=setup"
        : "/admin/login?next=/admin/members",
    );
  }

  const { configured } = getMembersRoomAuthConfig();
  if (!configured) {
    return {
      ok: false,
      message:
        "입장 비밀글을 아직 정해 두지 않았어요. 사장님께 먼저 정해 달라고 해 주세요.",
    };
  }

  const password = String(formData.get("password") ?? "");
  if (!verifyMembersRoomPassword(password)) {
    return { ok: false, message: "비밀글이 맞지 않아요. 다시 적어 주세요." };
  }

  const token = createMembersRoomSessionToken();
  if (!token) {
    return {
      ok: false,
      message: "입장을 준비하지 못했어요. 잠시 후 다시 해 주세요.",
    };
  }

  const jar = await cookies();
  jar.set(MEMBERS_ROOM_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect("/admin/members");
}

export async function leaveMembersRoom(): Promise<void> {
  const jar = await cookies();
  jar.delete(MEMBERS_ROOM_COOKIE);
  redirect("/admin");
}
