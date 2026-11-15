import { NextResponse } from "next/server";
import { fetchWatchItemsFromServer } from "@/lib/watch-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
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
        items: [],
      },
      { status: 500 },
    );
  }
}
