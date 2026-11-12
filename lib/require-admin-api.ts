import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  isValidAdminSessionToken,
  getAdminAuthConfig,
} from "@/lib/admin-auth";

export async function requireAdminApi(): Promise<
  | { ok: true }
  | { ok: false; response: NextResponse }
> {
  if (!getAdminAuthConfig().configured) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error: "관리자 비밀글이 아직 서버에 없어요.",
          code: "admin_secret_missing",
        },
        { status: 503 },
      ),
    };
  }

  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!isValidAdminSessionToken(token)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error: "관리자로 다시 들어가 주세요.",
          code: "unauthenticated",
        },
        { status: 401 },
      ),
    };
  }

  return { ok: true };
}
