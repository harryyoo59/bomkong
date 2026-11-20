import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase-public";

export async function createParentAuthServerClient() {
  const jar = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return jar.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            jar.set(name, value, options);
          }
        } catch {
          /* Server Component 에서는 쓰기 실패할 수 있음 */
        }
      },
    },
  });
}

export async function getParentSession() {
  const supabase = await createParentAuthServerClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
}
