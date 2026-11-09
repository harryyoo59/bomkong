import { NextResponse } from "next/server";
import {
  appendMailboxFeedback,
  looksLikeSpam,
  MAILBOX_LIMITS,
} from "@/lib/mailbox-feedback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const name = String(record.name ?? "").slice(0, MAILBOX_LIMITS.maxName);
  const message = String(record.message ?? "").slice(
    0,
    MAILBOX_LIMITS.maxMessage,
  );
  const honeypot = String(record.website ?? record.company ?? "");

  if (looksLikeSpam({ honeypot, message, name })) {
    // Pretend success so bots stop retrying
    return NextResponse.json({ ok: true });
  }

  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim() || "unknown";
  const userAgent = request.headers.get("user-agent") || undefined;

  const result = await appendMailboxFeedback({
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

  return NextResponse.json({ ok: true });
}
