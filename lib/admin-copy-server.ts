import { createSupabaseServerClient } from "@/lib/supabase-public";
import {
  normalizeAdminCopyStore,
  type AdminCopyStore,
} from "@/lib/admin-copy";

export type AdminCopyRemoteStore = {
  store: AdminCopyStore | null;
  updatedAt: string;
  exists: boolean;
};

export async function fetchAdminCopyFromServer(): Promise<AdminCopyRemoteStore> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("admin_copy_store")
    .select("id,payload,updated_at")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "관리자실 글씨를 불러오지 못했어요.");
  }

  if (!data) {
    return { store: null, updatedAt: "", exists: false };
  }

  const payload = data.payload;
  const empty =
    !payload ||
    (typeof payload === "object" &&
      !Array.isArray(payload) &&
      Object.keys(payload as object).length === 0);

  if (empty) {
    return {
      store: null,
      updatedAt:
        typeof data.updated_at === "string" ? data.updated_at : "",
      exists: true,
    };
  }

  return {
    store: normalizeAdminCopyStore(payload as Partial<AdminCopyStore>),
    updatedAt:
      typeof data.updated_at === "string" && data.updated_at
        ? data.updated_at
        : new Date().toISOString(),
    exists: true,
  };
}

export async function upsertAdminCopyOnServer(
  store: AdminCopyStore,
): Promise<AdminCopyRemoteStore> {
  const supabase = createSupabaseServerClient();
  const normalized = normalizeAdminCopyStore(store);
  const updatedAt = new Date().toISOString();
  const { error } = await supabase.from("admin_copy_store").upsert(
    {
      id: 1,
      payload: normalized,
      updated_at: updatedAt,
    },
    { onConflict: "id" },
  );
  if (error) {
    throw new Error(error.message || "관리자실 글씨를 저장하지 못했어요.");
  }
  return { store: normalized, updatedAt, exists: true };
}
