import { NextResponse } from "next/server";
import {
  appendComment,
  COMMENT_LIMITS,
  listComments,
  looksLikeSpam,
  toPublicComment,
} from "@/lib/comments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await listComments();
  return NextResponse.json({
    ok: true,
    comments: rows.slice(0, 50).map(toPublicComment),
  });
}

export async function POST(request: Request) {
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
  const name = String(record.name ?? "").slice(0, COMMENT_LIMITS.maxName);
  const message = String(record.message ?? "").slice(
    0,
    COMMENT_LIMITS.maxMessage,
  );
  const honeypot = String(record.website ?? record.company ?? "");

  if (looksLikeSpam({ honeypot, message, name })) {
    return NextResponse.json({ ok: true });
  }

  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  const userAgent = request.headers.get("user-agent") || undefined;

  const result = await appendComment({
    name,
    message,
    ip,
    userAgent,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    comment: toPublicComment(result.item),
  });
}
