import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  ensureWatchPlaySlots,
  type WatchItem,
  type WatchLang,
} from "@/lib/watch-media";
import {
  fetchWatchItemsFromServer,
  replaceWatchItemsOnServer,
} from "@/lib/watch-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseItems(raw: unknown): WatchItem[] | null {
  if (!Array.isArray(raw)) return null;
  const out: WatchItem[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    if (typeof r.id !== "string" || typeof r.title !== "string") continue;
    const title = r.title.trim();
    if (!title) continue;
    const lang: WatchLang = r.lang === "en" ? "en" : "ko";
    const episodeNumber =
      typeof r.episodeNumber === "number" &&
      Number.isFinite(r.episodeNumber) &&
      r.episodeNumber >= 0
        ? Math.floor(r.episodeNumber)
        : typeof r.episodeNumber === "string"
          ? (() => {
              const n = Math.floor(Number(r.episodeNumber));
              return Number.isFinite(n) && n >= 0 ? n : -1;
            })()
          : -1;
    out.push({
      id: r.id,
      name: typeof r.name === "string" ? r.name : "",
      title,
      youtubeUrl: typeof r.youtubeUrl === "string" ? r.youtubeUrl.trim() : "",
      note: "",
      addedAt:
        typeof r.addedAt === "string" && r.addedAt
          ? r.addedAt
          : new Date().toISOString(),
      episodeNumber,
      lang,
    });
  }
  return ensureWatchPlaySlots(out);
}

export async function GET() {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    return NextResponse.json(
      { ok: false, error: "관리자로 로그인해 주세요." },
      { status: 401 },
    );
  }
  try {
    const items = await fetchWatchItemsFromServer();
    return NextResponse.json({ ok: true, items });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "영상 목록을 불러오지 못했어요.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    return NextResponse.json(
      { ok: false, error: "관리자로 로그인해 주세요." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "형식이 맞지 않아요." },
      { status: 400 },
    );
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const items = parseItems(record.items);
  if (!items) {
    return NextResponse.json(
      { ok: false, error: "영상 목록 형식이 맞지 않아요." },
      { status: 400 },
    );
  }

  try {
    const saved = await replaceWatchItemsOnServer(items);
    return NextResponse.json({ ok: true, items: saved });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "영상 목록을 저장하지 못했어요.",
      },
      { status: 500 },
    );
  }
}
