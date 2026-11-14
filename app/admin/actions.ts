"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  createAdminSessionToken,
  getAdminAuthConfig,
} from "@/lib/admin-auth";

/** 거실 문을 다섯 번 누르면 관리자 방으로 들어가요. 비밀글 입력은 없어요. */
export async function enterAdminByKnock(): Promise<void> {
  const { configured } = getAdminAuthConfig();
  if (!configured) {
    redirect("/admin/login?need=setup");
  }

  const token = createAdminSessionToken();
  if (!token) {
    redirect("/admin/login?need=setup");
  }

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect("/admin");
}

export async function logoutAdmin(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect("/");
}
