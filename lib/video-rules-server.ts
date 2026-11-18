import { createSupabaseServerClient } from "@/lib/supabase-public";

export type VideoRulesRemoteStore = {
  adminBody: string;
  aiBody: string;
  updatedAt: string;
  exists: boolean;
};

type VideoRulesRow = {
  id: number;
  admin_body: string;
  ai_body: string;
  updated_at: string;
};

export async function fetchVideoRulesFromServer(): Promise<VideoRulesRemoteStore> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("video_rules_store")
    .select("id,admin_body,ai_body,updated_at")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "영상 규칙을 불러오지 못했어요.");
  }

  const row = data as VideoRulesRow | null;
  if (!row) {
    return {
      adminBody: "",
      aiBody: "",
      updatedAt: "",
      exists: false,
    };
  }

  return {
    adminBody: typeof row.admin_body === "string" ? row.admin_body : "",
    aiBody: typeof row.ai_body === "string" ? row.ai_body : "",
    updatedAt:
      typeof row.updated_at === "string" && row.updated_at
        ? row.updated_at
        : new Date().toISOString(),
    exists: true,
  };
}

export async function upsertVideoRulesOnServer(input: {
  adminBody: string;
  aiBody: string;
}): Promise<VideoRulesRemoteStore> {
  const supabase = createSupabaseServerClient();
  const updatedAt = new Date().toISOString();
  const { error } = await supabase.from("video_rules_store").upsert(
    {
      id: 1,
      admin_body: input.adminBody ?? "",
      ai_body: input.aiBody ?? "",
      updated_at: updatedAt,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(error.message || "영상 규칙을 저장하지 못했어요.");
  }

  return {
    adminBody: input.adminBody ?? "",
    aiBody: input.aiBody ?? "",
    updatedAt,
    exists: true,
  };
}
