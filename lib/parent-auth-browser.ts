"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase-public";

/** 부모 로그인 전용. 사진·로고 올리기용 공용 클라와 따로 둠. */
export function createParentAuthBrowserClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
