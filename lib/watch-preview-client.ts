import { getMediaPreview } from "@/lib/media-preview-store";
import { getSupabaseBrowserClient, SUPABASE_URL } from "@/lib/supabase-public";
import {
  WATCH_PREVIEWS_BUCKET,
  watchPreviewPublicUrl,
  watchPreviewStoragePath,
  type WatchItem,
} from "@/lib/watch-media";

/**
 * 이 기기 미리보기(또는 방금 고른 파일)를 인터넷 보관함에 올리고 경로를 붙임.
 */
export async function publishWatchPreviewForItem(
  item: WatchItem,
  file?: Blob | null,
  fileName = "",
): Promise<WatchItem> {
  let blob: Blob | null = file && file.size > 0 ? file : null;
  let nameHint =
    fileName ||
    (file instanceof File ? file.name : "") ||
    item.name ||
    "";

  if (!blob) {
    const preview = await getMediaPreview(item.id);
    if (preview?.blob && preview.blob.size > 0) {
      blob = preview.blob;
      nameHint = nameHint || item.name || "preview.mp4";
    }
  }

  if (!blob || blob.size < 1) {
    return item;
  }

  const mimeType =
    blob.type || item.previewMimeType || "video/mp4";
  const storagePath = watchPreviewStoragePath(item.id, mimeType);
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.storage
    .from(WATCH_PREVIEWS_BUCKET)
    .upload(storagePath, blob, {
      contentType: mimeType,
      upsert: true,
    });
  if (error) {
    throw new Error(error.message || "미리보기를 인터넷에 올리지 못했어요.");
  }

  const ext = storagePath.includes(".")
    ? storagePath.slice(storagePath.lastIndexOf(".") + 1)
    : "mp4";

  return {
    ...item,
    name: item.name || nameHint || `preview.${ext}`,
    previewStoragePath: storagePath,
    previewMimeType: mimeType,
  };
}

export function watchItemPreviewRemoteUrl(item: WatchItem): string | null {
  const path = item.previewStoragePath?.trim();
  if (!path) return null;
  return watchPreviewPublicUrl(SUPABASE_URL, path);
}
