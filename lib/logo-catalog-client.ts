import { publishLogoItemMetaAction } from "@/app/admin/logos/actions";
import { getMediaPreview } from "@/lib/media-preview-store";
import { getSupabaseBrowserClient, SUPABASE_URL } from "@/lib/supabase-public";
import {
  LOGO_FILES_BUCKET,
  logoFilePublicUrl,
  logoStoragePath,
  type LogoItem,
} from "@/lib/logo-catalog";

/**
 * 로고 정보(+그림)를 인터넷에 맞춤. 실패해도 이 기기 원본은 그대로.
 */
export async function publishLogoItemWithFile(
  item: LogoItem,
): Promise<LogoItem> {
  let storagePath = item.storagePath?.trim() || "";
  let mimeType = "image/png";
  let publicUrl = item.publicUrl;

  if (!item.builtIn) {
    const preview = await getMediaPreview(item.id);
    if (preview?.blob && preview.blob.size > 0) {
      mimeType = preview.mimeType || preview.blob.type || "image/png";
      storagePath = logoStoragePath(item.id, mimeType);
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.storage
        .from(LOGO_FILES_BUCKET)
        .upload(storagePath, preview.blob, {
          contentType: mimeType,
          upsert: true,
        });
      if (error) {
        throw new Error(error.message || "로고 그림을 올리지 못했어요.");
      }
      publicUrl = logoFilePublicUrl(SUPABASE_URL, storagePath);
    }
  }

  const result = await publishLogoItemMetaAction({
    id: item.id,
    serial: item.serial,
    title: item.title,
    blurb: item.blurb,
    name: item.name,
    addedAt: item.addedAt,
    builtIn: item.builtIn,
    storagePath: item.builtIn ? null : storagePath || null,
    mimeType,
    width: item.width ?? null,
    height: item.height ?? null,
  });

  if (!result.ok) {
    throw new Error(result.message);
  }

  return {
    ...item,
    ...result.item,
    src: item.builtIn
      ? item.src
      : result.item.publicUrl || publicUrl || item.src,
    publicUrl: item.builtIn
      ? undefined
      : result.item.publicUrl || publicUrl,
    storagePath: item.builtIn
      ? undefined
      : result.item.storagePath || storagePath || undefined,
  };
}
