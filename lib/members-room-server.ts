import { createSupabaseServerClient } from "@/lib/supabase-public";

export type MembersRoomRemoteStore = {
  notesBody: string;
  updatedAt: string;
  exists: boolean;
};

export async function fetchMembersNotesFromServer(): Promise<MembersRoomRemoteStore> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("members_room_store")
    .select("id,notes_body,updated_at")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "회원현황 메모를 불러오지 못했어요.");
  }

  if (!data) {
    return { notesBody: "", updatedAt: "", exists: false };
  }

  return {
    notesBody: typeof data.notes_body === "string" ? data.notes_body : "",
    updatedAt:
      typeof data.updated_at === "string" && data.updated_at
        ? data.updated_at
        : new Date().toISOString(),
    exists: true,
  };
}

export async function upsertMembersNotesOnServer(
  notesBody: string,
): Promise<MembersRoomRemoteStore> {
  const supabase = createSupabaseServerClient();
  const updatedAt = new Date().toISOString();
  const { error } = await supabase.from("members_room_store").upsert(
    {
      id: 1,
      notes_body: notesBody ?? "",
      updated_at: updatedAt,
    },
    { onConflict: "id" },
  );
  if (error) {
    throw new Error(error.message || "회원현황 메모를 저장하지 못했어요.");
  }
  return {
    notesBody: notesBody ?? "",
    updatedAt,
    exists: true,
  };
}
