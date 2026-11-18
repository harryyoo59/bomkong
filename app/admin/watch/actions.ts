"use server";

import { requireAdminSession } from "@/lib/admin-auth";
import {
  ensureWatchPlaySlots,
  sortWatchItemsForPlay,
  type WatchItem,
  type WatchLang,
} from "@/lib/watch-media";
import {
  fetchWatchItemsFromServer,
  replaceWatchItemsOnServer,
} from "@/lib/watch-server";

function sanitizeItems(raw: WatchItem[]): WatchItem[] {
  const out: WatchItem[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    if (typeof row.id !== "string" || typeof row.title !== "string") continue;
    const title = row.title.trim();
    if (!title) continue;
    const lang: WatchLang = row.lang === "en" ? "en" : "ko";
    const episodeNumber =
      Number.isFinite(row.episodeNumber) && row.episodeNumber >= 0
        ? Math.floor(row.episodeNumber)
        : -1;
    out.push({
      id: row.id,
      name: typeof row.name === "string" ? row.name : "",
      title,
      youtubeUrl:
        typeof row.youtubeUrl === "string" ? row.youtubeUrl.trim() : "",
      note: "",
      addedAt:
        typeof row.addedAt === "string" && row.addedAt
          ? row.addedAt
          : new Date().toISOString(),
      episodeNumber,
      lang,
    });
  }
  return sortWatchItemsForPlay(ensureWatchPlaySlots(out));
}

/**
 * 관리자실 6번: 이 기기 목록을 인터넷에 올려 다른 기기에서도 같게 봄.
 * 빈 목록으로는 절대 올리지 않음.
 */
export async function publishWatchCatalogAction(
  rawItems: WatchItem[],
): Promise<
  { ok: true; items: WatchItem[]; count: number } | { ok: false; message: string }
> {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    return {
      ok: false,
      message:
        "관리자 문이 풀렸어요. 거실 문을 다섯 번 눌러 다시 들어간 뒤, 한 번 더 올려 주세요.",
    };
  }

  const items = sanitizeItems(Array.isArray(rawItems) ? rawItems : []);
  if (items.length === 0) {
    return {
      ok: false,
      message:
        "올릴 영상이 없어요. 빈 목록은 인터넷에 올리지 않아요.",
    };
  }

  try {
    const saved = await replaceWatchItemsOnServer(items);
    if (saved.length === 0) {
      return {
        ok: false,
        message: "인터넷에 올렸는데 목록이 비어 돌아왔어요. 다시 해 주세요.",
      };
    }
    if (saved.length < items.length) {
      return {
        ok: false,
        message:
          "인터넷에 일부만 저장됐어요. 기기 목록은 그대로 두고 다시 올려 주세요.",
      };
    }

    // 한 번 더 읽어서 진짜 저장됐는지 확인
    const verified = await fetchWatchItemsFromServer();
    if (verified.length === 0) {
      return {
        ok: false,
        message:
          "저장 확인에 실패했어요. 인터넷 목록이 비어 있어요. 다시 올려 주세요.",
      };
    }

    return {
      ok: true,
      items: verified,
      count: verified.length,
    };
  } catch (err) {
    const raw =
      err instanceof Error ? err.message : "인터넷에 올리지 못했어요.";
    const lower = raw.toLowerCase();
    let message = raw;
    if (lower.includes("forbidden") || lower.includes("permission")) {
      message =
        "인터넷 저장 열쇠가 맞지 않아요. 사장님께 호스팅 설정을 확인해 달라고 해 주세요.";
    } else if (lower.includes("jwt") || lower.includes("api key")) {
      message = "인터넷 저장 연결 열쇠에 문제가 있어요. 다시 시도해 주세요.";
    }
    return { ok: false, message };
  }
}
