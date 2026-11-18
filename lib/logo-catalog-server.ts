import { createSupabaseServerClient, SUPABASE_URL } from "@/lib/supabase-public";
import {
  LOGO_FILES_BUCKET,
  logoFilePublicUrl,
  logoStoragePath,
  type LogoItem,
} from "@/lib/logo-catalog";

type LogoRow = {
  id: string;
  serial: number;
  title: string;
  blurb: string;
  name: string;
  note: string;
  added_at: string;
  built_in: boolean;
  storage_path: string | null;
  mime_type: string;
  width: number | null;
  height: number | null;
};

function rowToItem(row: LogoRow): LogoItem | null {
  if (!row?.id) return null;
  const storagePath =
    typeof row.storage_path === "string" && row.storage_path.trim()
      ? row.storage_path.trim()
      : undefined;
  const publicUrl = storagePath
    ? logoFilePublicUrl(SUPABASE_URL, storagePath)
    : undefined;
  return {
    id: row.id,
    serial:
      Number.isFinite(row.serial) && row.serial > 0
        ? Math.floor(row.serial)
        : 1,
    title: typeof row.title === "string" ? row.title : "",
    blurb: typeof row.blurb === "string" ? row.blurb : "",
    name: typeof row.name === "string" ? row.name : "",
    note: "",
    addedAt:
      typeof row.added_at === "string" && row.added_at
        ? row.added_at
        : new Date().toISOString(),
    builtIn: Boolean(row.built_in),
    src: publicUrl,
    width:
      typeof row.width === "number" && Number.isFinite(row.width)
        ? row.width
        : undefined,
    height:
      typeof row.height === "number" && Number.isFinite(row.height)
        ? row.height
        : undefined,
    publicUrl,
    storagePath,
  };
}

export { LOGO_FILES_BUCKET, logoStoragePath };

export async function fetchLogoItemsFromServer(): Promise<LogoItem[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("logo_items")
    .select(
      "id,serial,title,blurb,name,note,added_at,built_in,storage_path,mime_type,width,height",
    )
    .order("serial", { ascending: true });

  if (error) {
    throw new Error(error.message || "로고 목록을 불러오지 못했어요.");
  }

  return ((data as LogoRow[] | null) ?? [])
    .map(rowToItem)
    .filter((it): it is LogoItem => Boolean(it));
}

export async function upsertLogoItemOnServer(input: {
  id: string;
  serial: number;
  title: string;
  blurb?: string;
  name?: string;
  addedAt?: string;
  builtIn?: boolean;
  storagePath?: string | null;
  mimeType?: string;
  width?: number | null;
  height?: number | null;
}): Promise<LogoItem> {
  const supabase = createSupabaseServerClient();
  const title = input.title.trim();
  if (!title) throw new Error("로고 이름이 없어요.");
  const serial =
    Number.isFinite(input.serial) && input.serial > 0
      ? Math.floor(input.serial)
      : 1;
  const addedAt =
    input.addedAt && input.addedAt.trim()
      ? input.addedAt
      : new Date().toISOString();
  const storagePath = input.storagePath?.trim() || null;

  const { error } = await supabase.from("logo_items").upsert(
    {
      id: input.id,
      serial,
      title,
      blurb: input.blurb || "",
      name: input.name || "",
      note: "",
      added_at: addedAt,
      built_in: Boolean(input.builtIn),
      storage_path: storagePath,
      mime_type: input.mimeType || "image/png",
      width: input.width ?? null,
      height: input.height ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    throw new Error(error.message || "로고 정보를 저장하지 못했어요.");
  }

  const publicUrl = storagePath
    ? logoFilePublicUrl(SUPABASE_URL, storagePath)
    : undefined;

  return {
    id: input.id,
    serial,
    title,
    blurb: input.blurb || "",
    name: input.name || "",
    note: "",
    addedAt,
    builtIn: Boolean(input.builtIn),
    src: publicUrl,
    width: input.width ?? undefined,
    height: input.height ?? undefined,
    publicUrl,
    storagePath: storagePath || undefined,
  };
}

/** 한 건만 뺌. 전체 삭제는 하지 않음. */
export async function deleteLogoItemOnServer(
  id: string,
  storagePath?: string | null,
): Promise<void> {
  const supabase = createSupabaseServerClient();
  let path = storagePath?.trim() || "";
  if (!path) {
    const { data } = await supabase
      .from("logo_items")
      .select("storage_path")
      .eq("id", id)
      .maybeSingle();
    if (data && typeof data.storage_path === "string") {
      path = data.storage_path;
    }
  }

  const { error } = await supabase.from("logo_items").delete().eq("id", id);
  if (error) {
    throw new Error(error.message || "로고 정보를 빼지 못했어요.");
  }
  if (path) {
    await supabase.storage.from(LOGO_FILES_BUCKET).remove([path]);
  }
}
