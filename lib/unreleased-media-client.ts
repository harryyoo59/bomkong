import { publishUnreleasedItemMetaAction } from "@/app/admin/unreleased/actions";
import { getMediaPreview } from "@/lib/media-preview-store";
import { getSupabaseBrowserClient, SUPABASE_URL } from "@/lib/supabase-public";
import {
  UNRELEASED_VIDEOS_BUCKET,
  unreleasedStoragePath,
  unreleasedVideoPublicUrl,
  type UnreleasedItem,
  type UnreleasedLang,
} from "@/lib/unreleased-media";

/**
 * 이 기기 미리보기 파일을 인터넷 보관함에 올리고, 목록 정보를 맞춤.
 * 실패해도 이 기기 원본은 그대로 둠.
 */
export async function publishUnreleasedItemWithFile(
  lang: UnreleasedLang,
  item: UnreleasedItem,
): Promise<UnreleasedItem> {
  const preview = await getMediaPreview(item.id);
  let storagePath = item.storagePath?.trim() || "";
  let mimeType = "video/mp4";
  let publicUrl = item.publicUrl;

  if (preview?.blob && preview.blob.size > 0) {
    mimeType = preview.mimeType || preview.blob.type || "video/mp4";
    storagePath = unreleasedStoragePath(lang, item.id, mimeType);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.storage
      .from(UNRELEASED_VIDEOS_BUCKET)
      .upload(storagePath, preview.blob, {
        contentType: mimeType,
        upsert: true,
      });
    if (error) {
      throw new Error(error.message || "영상을 인터넷에 올리지 못했어요.");
    }
    publicUrl = unreleasedVideoPublicUrl(SUPABASE_URL, storagePath);
  }

  const result = await publishUnreleasedItemMetaAction({
    id: item.id,
    lang,
    name: item.name,
    title: item.title,
    addedAt: item.addedAt,
    storagePath: storagePath || null,
    mimeType,
  });

  if (!result.ok) {
    throw new Error(result.message);
  }

  return {
    ...item,
    publicUrl: result.item.publicUrl || publicUrl,
    storagePath: result.item.storagePath || storagePath || undefined,
  };
}
