"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  createAdminSessionToken,
  getAdminAuthConfig,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export type LoginState = {
  error?: string;
};

export async function loginAdmin(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const { configured } = getAdminAuthConfig();
  if (!configured) {
    return {
      error:
        "관리자 열쇠가 아직 서버에 없어요. 배포 환경에 BOMKONG_ADMIN_SECRET을 넣은 뒤 다시 시도해 주세요.",
    };
  }

  const password = String(formData.get("password") ?? "");
  if (!verifyAdminPassword(password)) {
    return { error: "열쇠가 맞지 않아요." };
  }

  const token = createAdminSessionToken();
  if (!token) {
    return { error: "세션을 만들 수 없어요. 서버 설정을 확인해 주세요." };
  }

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  const next = String(formData.get("next") ?? "/admin");
  const safeNext = next.startsWith("/admin") ? next : "/admin";
  redirect(safeNext);
}

export async function logoutAdmin(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  redirect("/admin/login");
}
