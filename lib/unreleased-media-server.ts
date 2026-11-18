import { createSupabaseServerClient, SUPABASE_URL } from "@/lib/supabase-public";
import {
  UNRELEASED_VIDEOS_BUCKET,
  unreleasedStoragePath,
  unreleasedVideoPublicUrl,
  type UnreleasedItem,
  type UnreleasedLang,
} from "@/lib/unreleased-media";

export { UNRELEASED_VIDEOS_BUCKET, unreleasedStoragePath };

type UnreleasedRow = {
  id: string;
  lang: string;
  name: string;
  title: string;
  note: string;
  added_at: string;
  storage_path: string | null;
  mime_type: string;
};

function isLang(value: string): value is UnreleasedLang {
  return value === "ko" || value === "en";
}

function publicUrlFor(storagePath: string): string {
  return unreleasedVideoPublicUrl(SUPABASE_URL, storagePath);
}

function rowToItem(row: UnreleasedRow): UnreleasedItem | null {
  if (!row?.id || !isLang(row.lang)) return null;
  const title = typeof row.title === "string" ? row.title.trim() : "";
  if (!title) return null;
  const storagePath =
    typeof row.storage_path === "string" && row.storage_path.trim()
      ? row.storage_path.trim()
      : undefined;
  return {
    id: row.id,
    name: typeof row.name === "string" ? row.name : "",
    title,
    note: "",
    addedAt:
      typeof row.added_at === "string" && row.added_at
        ? row.added_at
        : new Date().toISOString(),
    youtubeStatus: "not_uploaded",
    publicUrl: storagePath ? publicUrlFor(storagePath) : undefined,
    storagePath,
  };
}

export async function fetchUnreleasedItemsFromServer(
  lang: UnreleasedLang,
): Promise<UnreleasedItem[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("unreleased_items")
    .select("id,lang,name,title,note,added_at,storage_path,mime_type")
    .eq("lang", lang)
    .order("added_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "미공개 목록을 불러오지 못했어요.");
  }

  return ((data as UnreleasedRow[] | null) ?? [])
    .map(rowToItem)
    .filter((it): it is UnreleasedItem => Boolean(it));
}

export async function upsertUnreleasedItemOnServer(input: {
  id: string;
  lang: UnreleasedLang;
  name: string;
  title: string;
  addedAt?: string;
  storagePath?: string | null;
  mimeType?: string;
}): Promise<UnreleasedItem> {
  const supabase = createSupabaseServerClient();
  const title = input.title.trim();
  if (!title) {
    throw new Error("영상 제목이 없어요.");
  }
  const addedAt =
    input.addedAt && input.addedAt.trim()
      ? input.addedAt
      : new Date().toISOString();
  const storagePath = input.storagePath?.trim() || null;
  const mimeType = input.mimeType || "video/mp4";

  const { error } = await supabase.from("unreleased_items").upsert(
    {
      id: input.id,
      lang: input.lang,
      name: input.name || "",
      title,
      note: "",
      added_at: addedAt,
      storage_path: storagePath,
      mime_type: mimeType,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(error.message || "미공개 정보를 저장하지 못했어요.");
  }

  return {
    id: input.id,
    name: input.name || "",
    title,
    note: "",
    addedAt,
    youtubeStatus: "not_uploaded",
    publicUrl: storagePath ? publicUrlFor(storagePath) : undefined,
    storagePath: storagePath || undefined,
  };
}

/** 한 항목만 뺌. 목록 전체 삭제는 하지 않음. */
export async function deleteUnreleasedItemOnServer(
  lang: UnreleasedLang,
  id: string,
  storagePath?: string | null,
): Promise<void> {
  const supabase = createSupabaseServerClient();

  let path = storagePath?.trim() || "";
  if (!path) {
    const { data } = await supabase
      .from("unreleased_items")
      .select("storage_path,lang")
      .eq("id", id)
      .maybeSingle();
    if (data && data.lang === lang && typeof data.storage_path === "string") {
      path = data.storage_path;
    }
  }

  const { error } = await supabase
    .from("unreleased_items")
    .delete()
    .eq("id", id)
    .eq("lang", lang);

  if (error) {
    throw new Error(error.message || "미공개 정보를 빼지 못했어요.");
  }

  if (path) {
    await supabase.storage.from(UNRELEASED_VIDEOS_BUCKET).remove([path]);
  }
}
