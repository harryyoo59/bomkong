import { createSupabaseServerClient } from "@/lib/supabase-public";

export type VideoRulesRemoteStore = {
  adminBody: string;
  aiBody: string;
  checklistBody: string;
  englishBody: string;
  cookieBody: string;
  updatedAt: string;
  exists: boolean;
};

type VideoRulesRow = {
  id: number;
  admin_body: string;
  ai_body: string;
  checklist_body?: string | null;
  english_body?: string | null;
  cookie_body?: string | null;
  updated_at: string;
};

export async function fetchVideoRulesFromServer(): Promise<VideoRulesRemoteStore> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("video_rules_store")
    .select(
      "id,admin_body,ai_body,checklist_body,english_body,cookie_body,updated_at",
    )
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
      checklistBody: "",
      englishBody: "",
      cookieBody: "",
      updatedAt: "",
      exists: false,
    };
  }

  return {
    adminBody: typeof row.admin_body === "string" ? row.admin_body : "",
    aiBody: typeof row.ai_body === "string" ? row.ai_body : "",
    checklistBody:
      typeof row.checklist_body === "string" ? row.checklist_body : "",
    englishBody:
      typeof row.english_body === "string" ? row.english_body : "",
    cookieBody: typeof row.cookie_body === "string" ? row.cookie_body : "",
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
  checklistBody: string;
  englishBody: string;
  cookieBody: string;
}): Promise<VideoRulesRemoteStore> {
  const supabase = createSupabaseServerClient();
  const updatedAt = new Date().toISOString();
  const { error } = await supabase.from("video_rules_store").upsert(
    {
      id: 1,
      admin_body: input.adminBody ?? "",
      ai_body: input.aiBody ?? "",
      checklist_body: input.checklistBody ?? "",
      english_body: input.englishBody ?? "",
      cookie_body: input.cookieBody ?? "",
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
    checklistBody: input.checklistBody ?? "",
    englishBody: input.englishBody ?? "",
    cookieBody: input.cookieBody ?? "",
    updatedAt,
    exists: true,
  };
}
