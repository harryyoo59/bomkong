import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin-api";
import { putYoutubeUploadChunk } from "@/lib/youtube-resumable";
import { readUploadSessionToken } from "@/lib/youtube-upload-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_CHUNK = 4 * 1024 * 1024; // stay under common host body limits

export async function PUT(request: Request) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const uploadToken = request.headers.get("x-upload-token");
  const offsetRaw = request.headers.get("x-upload-offset");
  const session = readUploadSessionToken(uploadToken);
  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        error: "올리기 자리가 만료됐어요. 처음부터 다시 해 주세요.",
        code: "session_expired",
      },
      { status: 400 },
    );
  }

  const offset = Number(offsetRaw);
  if (!Number.isFinite(offset) || offset < 0 || offset >= session.totalSize) {
    return NextResponse.json(
      { ok: false, error: "파일 위치 값이 이상해요." },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await request.arrayBuffer());
  if (buf.length === 0) {
    return NextResponse.json(
      { ok: false, error: "빈 조각이에요." },
      { status: 400 },
    );
  }
  if (buf.length > MAX_CHUNK) {
    return NextResponse.json(
      { ok: false, error: "조각이 너무 커요." },
      { status: 400 },
    );
  }
  if (offset + buf.length > session.totalSize) {
    return NextResponse.json(
      { ok: false, error: "파일 길이가 맞지 않아요." },
      { status: 400 },
    );
  }

  try {
    const result = await putYoutubeUploadChunk({
      uploadUrl: session.uploadUrl,
      chunk: buf,
      offset,
      totalSize: session.totalSize,
      mimeType: session.mimeType,
    });

    if (!result.done) {
      return NextResponse.json({
        ok: true,
        done: false,
        nextOffset: result.nextOffset,
      });
    }

    return NextResponse.json({
      ok: true,
      done: true,
      videoId: result.videoId,
      watchUrl: result.watchUrl,
      shortsUrl: result.shortsUrl,
      title: session.title,
      privacyStatus: session.privacyStatus,
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "유튜브로 파일을 보내는 중 실패했어요.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
