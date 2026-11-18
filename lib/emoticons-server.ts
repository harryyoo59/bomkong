import { createSupabaseServerClient, SUPABASE_URL } from "@/lib/supabase-public";
import type { EmoticonItem, EmoticonShelf } from "@/lib/emoticons";

export const EMOTICON_FILES_BUCKET = "emoticon-files";

type EmoticonRow = {
  id: string;
  shelf: string;
  name: string;
  note: string;
  added_at: string;
  storage_path: string;
  mime_type: string;
};

function isShelf(value: string): value is EmoticonShelf {
  return value === "bomi" || value === "kongi";
}

export function emoticonPublicUrl(storagePath: string): string {
  const base = SUPABASE_URL.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${EMOTICON_FILES_BUCKET}/${storagePath}`;
}

function rowToItem(row: EmoticonRow): EmoticonItem | null {
  if (!row?.id || !isShelf(row.shelf)) return null;
  return {
    id: row.id,
    name: typeof row.name === "string" ? row.name : "",
    note: typeof row.note === "string" ? row.note : "",
    addedAt:
      typeof row.added_at === "string" && row.added_at
        ? row.added_at
        : new Date().toISOString(),
    publicUrl: emoticonPublicUrl(row.storage_path),
    storagePath: row.storage_path,
  };
}

export function emoticonStoragePath(
  shelf: EmoticonShelf,
  id: string,
  mimeType: string,
): string {
  const safeId = id.replace(/[^a-zA-Z0-9._-]/g, "_");
  let ext = "png";
  const mime = (mimeType || "").toLowerCase();
  if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";
  else if (mime.includes("webp")) ext = "webp";
  else if (mime.includes("gif")) ext = "gif";
  else if (mime.includes("avif")) ext = "avif";
  else if (mime.includes("heic")) ext = "heic";
  else if (mime.includes("png")) ext = "png";
  return `${shelf}/${safeId}.${ext}`;
}

export async function fetchEmoticonsFromServer(
  shelf: EmoticonShelf,
): Promise<EmoticonItem[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("emoticon_items")
    .select("id,shelf,name,note,added_at,storage_path,mime_type")
    .eq("shelf", shelf)
    .order("added_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "이모티콘 목록을 불러오지 못했어요.");
  }

  return ((data as EmoticonRow[] | null) ?? [])
    .map(rowToItem)
    .filter((it): it is EmoticonItem => Boolean(it));
}

export async function upsertEmoticonOnServer(input: {
  id: string;
  shelf: EmoticonShelf;
  name: string;
  note?: string;
  addedAt?: string;
  mimeType: string;
  bytes: ArrayBuffer | Uint8Array | Buffer;
}): Promise<EmoticonItem> {
  const supabase = createSupabaseServerClient();
  const mimeType = input.mimeType || "image/png";
  const storagePath = emoticonStoragePath(input.shelf, input.id, mimeType);
  const body =
    input.bytes instanceof Buffer
      ? input.bytes
      : Buffer.from(
          input.bytes instanceof ArrayBuffer
            ? new Uint8Array(input.bytes)
            : input.bytes,
        );

  const { error: uploadError } = await supabase.storage
    .from(EMOTICON_FILES_BUCKET)
    .upload(storagePath, body, {
      contentType: mimeType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(
      uploadError.message || "이모티콘을 인터넷에 올리지 못했어요.",
    );
  }

  const addedAt =
    input.addedAt && input.addedAt.trim()
      ? input.addedAt
      : new Date().toISOString();

  const { error: upsertError } = await supabase.from("emoticon_items").upsert(
    {
      id: input.id,
      shelf: input.shelf,
      name: input.name || "",
      note: input.note || "",
      added_at: addedAt,
      storage_path: storagePath,
      mime_type: mimeType,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (upsertError) {
    throw new Error(
      upsertError.message || "이모티콘 정보를 저장하지 못했어요.",
    );
  }

  return {
    id: input.id,
    name: input.name || "",
    note: input.note || "",
    addedAt,
    publicUrl: emoticonPublicUrl(storagePath),
    storagePath,
  };
}

/** 한 장만 뺌. 목록 전체 삭제는 하지 않음. */
export async function deleteEmoticonOnServer(
  shelf: EmoticonShelf,
  id: string,
  storagePath?: string | null,
): Promise<void> {
  const supabase = createSupabaseServerClient();

  let path = storagePath?.trim() || "";
  if (!path) {
    const { data } = await supabase
      .from("emoticon_items")
      .select("storage_path,shelf")
      .eq("id", id)
      .maybeSingle();
    if (data && data.shelf === shelf && typeof data.storage_path === "string") {
      path = data.storage_path;
    }
  }

  const { error } = await supabase
    .from("emoticon_items")
    .delete()
    .eq("id", id)
    .eq("shelf", shelf);

  if (error) {
    throw new Error(error.message || "이모티콘 정보를 빼지 못했어요.");
  }

  if (path) {
    await supabase.storage.from(EMOTICON_FILES_BUCKET).remove([path]);
  }
}
