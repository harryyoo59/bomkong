"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  MEMBERS_ROOM_COOKIE,
  createMembersRoomSessionToken,
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

  const password = String(formData.get("password") ?? "");
  if (!verifyMembersRoomPassword(password)) {
    return { ok: false, message: "비밀글이 맞지 않아요. 다시 적어 주세요." };
  }

  const token = createMembersRoomSessionToken();

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
