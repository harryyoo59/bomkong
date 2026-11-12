import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin-api";
import { isYoutubeUploadReady } from "@/lib/youtube-config";
import { getYoutubeAccessToken } from "@/lib/youtube-oauth";
import { startYoutubeResumableUpload } from "@/lib/youtube-resumable";
import {
  isYoutubePrivacyStatus,
  mintUploadSessionToken,
} from "@/lib/youtube-upload-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 256 * 1024 * 1024; // 256MB safety cap for Shorts

export async function POST(request: Request) {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  if (!isYoutubeUploadReady()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "유튜브 연결 값이 아직 서버에 없어요. 연결 안내 화면을 먼저 봐 주세요.",
        code: "youtube_not_configured",
      },
      { status: 503 },
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

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, error: "형식이 맞지 않아요." },
      { status: 400 },
    );
  }

  const record = body as Record<string, unknown>;
  const title = String(record.title ?? "").trim();
  const privacyRaw = String(record.privacyStatus ?? "private").trim();
  const mimeType = String(record.mimeType ?? "video/mp4").trim() || "video/mp4";
  const totalSize = Number(record.totalSize);
  const note =
    typeof record.note === "string" ? record.note.trim().slice(0, 500) : "";

  if (!title) {
    return NextResponse.json(
      { ok: false, error: "영상 제목이 필요해요." },
      { status: 400 },
    );
  }
  if (!isYoutubePrivacyStatus(privacyRaw)) {
    return NextResponse.json(
      { ok: false, error: "공개 범위를 다시 골라 주세요." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(totalSize) || totalSize <= 0) {
    return NextResponse.json(
      { ok: false, error: "파일 크기를 알 수 없어요." },
      { status: 400 },
    );
  }
  if (totalSize > MAX_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        error: "파일이 너무 커요. 숏츠용으로 더 짧게·작게 해 주세요.",
      },
      { status: 400 },
    );
  }

  try {
    const { accessToken } = await getYoutubeAccessToken();
    const uploadUrl = await startYoutubeResumableUpload({
      accessToken,
      title,
      description: note,
      privacyStatus: privacyRaw,
      mimeType,
    });
    const uploadToken = mintUploadSessionToken({
      uploadUrl,
      title,
      privacyStatus: privacyRaw,
      mimeType,
      totalSize,
    });
    if (!uploadToken) {
      return NextResponse.json(
        {
          ok: false,
          error: "올리기 자리를 만들지 못했어요. 관리자 비밀글을 확인해 주세요.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      uploadToken,
      chunkBytes: 2 * 1024 * 1024, // 2MB chunks under typical host body limits
      totalSize,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "유튜브 올리기 준비에 실패했어요.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
