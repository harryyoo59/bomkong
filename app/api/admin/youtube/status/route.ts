import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin-api";
import { getYoutubeConfigStatus } from "@/lib/youtube-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await requireAdminApi();
  if (!gate.ok) return gate.response;

  const status = getYoutubeConfigStatus();
  return NextResponse.json({
    ok: true,
    configured: status.configured,
    canStartOAuth: status.canStartOAuth,
    missing: status.missing,
    channelHint: status.channelHint,
    connectPath: "/admin/youtube-connect",
  });
}
