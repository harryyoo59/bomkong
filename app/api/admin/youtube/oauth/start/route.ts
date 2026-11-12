import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { requireAdminApi } from "@/lib/require-admin-api";
import { getYoutubeConfigStatus } from "@/lib/youtube-config";
import { buildYoutubeConsentUrl } from "@/lib/youtube-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function makeState(): string {
  const secret =
    process.env.BOMKONG_ADMIN_SECRET?.trim() ||
    process.env.YOUTUBE_CLIENT_SECRET?.trim() ||
    "bomkong-youtube-setup";
  const nonce = `${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
  const sig = createHmac("sha256", secret).update(nonce).digest("base64url");
  return `${nonce}.${sig}`;
}

export async function GET(request: Request) {
  const gate = await requireAdminApi();
  if (!gate.ok) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("next", "/admin/youtube-connect");
    return NextResponse.redirect(url);
  }

  const status = getYoutubeConfigStatus();
  if (!status.canStartOAuth) {
    return NextResponse.redirect(
      new URL("/admin/youtube-connect?need=env", request.url),
    );
  }

  try {
    const consent = buildYoutubeConsentUrl(makeState());
    return NextResponse.redirect(consent);
  } catch {
    return NextResponse.redirect(
      new URL("/admin/youtube-connect?need=env", request.url),
    );
  }
}
