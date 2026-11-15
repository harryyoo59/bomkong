import { createSupabaseServerClient } from "@/lib/supabase-public";
import {
  ensureWatchPlaySlots,
  sortWatchItemsForPlay,
  type WatchItem,
  type WatchLang,
} from "@/lib/watch-media";

/** 서버에서만 쓰는 쓰기 비밀 (DB watch_write_guard 와 같아야 함) */
export function getWatchWriteSecret(): string {
  return (
    process.env.BOMKONG_WATCH_WRITE_SECRET?.trim() ||
    "FSSsMF48iDAAVc0UW-DKuaq9oxw-_UEipj75wrx3o6g"
  );
}

type WatchRow = {
  id: string;
  name: string;
  title: string;
  youtube_url: string;
  note: string;
  added_at: string;
  episode_number: number;
  lang: string;
};

function rowToItem(row: WatchRow): WatchItem | null {
  if (!row?.id || !row.title?.trim()) return null;
  const lang: WatchLang = row.lang === "en" ? "en" : "ko";
  const episodeNumber =
    Number.isFinite(row.episode_number) && row.episode_number >= 1
      ? Math.floor(row.episode_number)
      : 0;
  return {
    id: row.id,
    name: typeof row.name === "string" ? row.name : "",
    title: row.title.trim(),
    youtubeUrl: typeof row.youtube_url === "string" ? row.youtube_url : "",
    note: typeof row.note === "string" ? row.note : "",
    addedAt:
      typeof row.added_at === "string" && row.added_at
        ? row.added_at
        : new Date().toISOString(),
    episodeNumber,
    lang,
  };
}

export async function fetchWatchItemsFromServer(): Promise<WatchItem[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("watch_items")
    .select(
      "id,name,title,youtube_url,note,added_at,episode_number,lang",
    )
    .order("episode_number", { ascending: true })
    .order("lang", { ascending: true });

  if (error) {
    throw new Error(error.message || "영상 목록을 불러오지 못했어요.");
  }

  const items = (data as WatchRow[] | null)
    ?.map(rowToItem)
    .filter((it): it is WatchItem => Boolean(it));

  return sortWatchItemsForPlay(ensureWatchPlaySlots(items ?? []));
}

export async function replaceWatchItemsOnServer(
  items: WatchItem[],
): Promise<WatchItem[]> {
  const supabase = createSupabaseServerClient();
  const payload = sortWatchItemsForPlay(ensureWatchPlaySlots(items)).map(
    (it) => ({
      id: it.id,
      name: it.name,
      title: it.title,
      youtubeUrl: it.youtubeUrl,
      note: "",
      addedAt: it.addedAt,
      episodeNumber: it.episodeNumber,
      lang: it.lang,
    }),
  );

  const { data, error } = await supabase.rpc("replace_watch_catalog", {
    p_items: payload,
    p_secret: getWatchWriteSecret(),
  });

  if (error) {
    throw new Error(error.message || "영상 목록을 저장하지 못했어요.");
  }

  if (Array.isArray(data)) {
    const mapped = (data as WatchRow[])
      .map(rowToItem)
      .filter((it): it is WatchItem => Boolean(it));
    return sortWatchItemsForPlay(ensureWatchPlaySlots(mapped));
  }

  return fetchWatchItemsFromServer();
}
