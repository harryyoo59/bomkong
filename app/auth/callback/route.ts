import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase-public";
import { safeNextPath } from "@/lib/parent-auth";

/**
 * 이메일 로그인 링크로 돌아온 뒤 부모 로그인 마무리.
 * (구글·애플은 당분간 안 씀. 나중에 같은 길로 이어질 수 있음.)
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = next;
  redirectUrl.search = "";

  if (!code) {
    redirectUrl.pathname = "/parent-login";
    redirectUrl.searchParams.set("error", "login");
    return NextResponse.redirect(redirectUrl);
  }

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

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const fail = request.nextUrl.clone();
    fail.pathname = "/parent-login";
    fail.searchParams.set("error", "login");
    return NextResponse.redirect(fail);
  }

  return response;
}
