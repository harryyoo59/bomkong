import { getMediaPreview } from "@/lib/media-preview-store";
import { getSupabaseBrowserClient, SUPABASE_URL } from "@/lib/supabase-public";
import {
  WATCH_PREVIEWS_BUCKET,
  watchPreviewPublicUrl,
  watchPreviewStoragePath,
  type WatchItem,
} from "@/lib/watch-media";

/**
 * 이 기기 미리보기 파일을 인터넷 보관함에 올리고, 목록 칸에 경로를 붙임.
 * 실패해도 이 기기 미리보기는 그대로 둠.
 */
export async function publishWatchPreviewForItem(
  item: WatchItem,
): Promise<WatchItem> {
  const preview = await getMediaPreview(item.id);
  if (!preview?.blob || preview.blob.size < 1) {
    return item;
  }

  const mimeType =
    preview.mimeType || preview.blob.type || item.previewMimeType || "video/mp4";
  const storagePath = watchPreviewStoragePath(item.id, mimeType);
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.storage
    .from(WATCH_PREVIEWS_BUCKET)
    .upload(storagePath, preview.blob, {
      contentType: mimeType,
      upsert: true,
    });
  if (error) {
    throw new Error(error.message || "미리보기를 인터넷에 올리지 못했어요.");
  }

  return {
    ...item,
    name: item.name || `preview.${mimeType.includes("webm") ? "webm" : "mp4"}`,
    previewStoragePath: storagePath,
    previewMimeType: mimeType,
  };
}

export function watchItemPreviewRemoteUrl(item: WatchItem): string | null {
  const path = item.previewStoragePath?.trim();
  if (!path) return null;
  return watchPreviewPublicUrl(SUPABASE_URL, path);
}
