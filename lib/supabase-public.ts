import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * 봄이콩이 공용 저장소 (읽기용 열쇠는 원래 공개용).
 * 호스팅 환경 값이 있으면 그걸 쓰고, 없으면 아래 기본값을 씀.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  process.env.SUPABASE_URL?.trim() ||
  "https://gjqekmpapsqozahabytt.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  process.env.SUPABASE_ANON_KEY?.trim() ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqcWVrbXBhcHNxb3phaGFieXR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ3MTYzMTYsImV4cCI6MjExMDI5MjMxNn0.nelrkXh332MeI526PVGxcIWdX5YgF_Zf93qxW-gslM8";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return browserClient;
}

export function createSupabaseServerClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
