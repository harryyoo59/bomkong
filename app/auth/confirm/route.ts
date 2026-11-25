import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase-public";
import { safeNextPath } from "@/lib/parent-auth";

/**
 * 이메일 로그인 메일 안 링크(토큰)로 돌아온 뒤 부모 로그인 마무리.
 * 같은 폰·컴퓨터가 아니어도 들어올 수 있게 함.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(url.searchParams.get("next"));

  const fail = request.nextUrl.clone();
  fail.pathname = "/parent-login";
  fail.searchParams.set("error", "login");

  if (!token_hash || !type) {
    return NextResponse.redirect(fail);
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = next;
  redirectUrl.search = "";
  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { error } = await supabase.auth.verifyOtp({ type, token_hash });
  if (error) {
    return NextResponse.redirect(fail);
  }

  return response;
}
