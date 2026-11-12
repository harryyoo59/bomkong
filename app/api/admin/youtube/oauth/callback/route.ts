import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin-api";
import { exchangeYoutubeAuthCode } from "@/lib/youtube-oauth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function htmlPage(title: string, body: string): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 32px auto; padding: 0 16px; line-height: 1.5; color: #222; }
    code, textarea { display: block; width: 100%; box-sizing: border-box; padding: 12px; border-radius: 10px; border: 1px solid #ccc; background: #f7f7f7; font-size: 13px; word-break: break-all; }
    textarea { min-height: 120px; }
    a { color: #c45c26; }
    .warn { background: #fff4e5; border: 1px solid #f0c36d; padding: 12px; border-radius: 10px; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${body}
  <p><a href="/admin/youtube-connect">연결 안내로 돌아가기</a> · <a href="/admin/unreleased">미공개 영상실</a></p>
</body>
</html>`;
  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(request: Request) {
  const gate = await requireAdminApi();
  if (!gate.ok) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("next", "/admin/youtube-connect");
    return NextResponse.redirect(url);
  }

  const { searchParams } = new URL(request.url);
  const err = searchParams.get("error");
  if (err) {
    return htmlPage(
      "유튜브 연결 취소",
      `<p class="warn">구글 쪽에서 연결을 거절했어요 (${err}). 채널 주인 계정으로 다시 시도해 주세요.</p>`,
    );
  }

  const code = searchParams.get("code");
  if (!code) {
    return htmlPage(
      "유튜브 연결 실패",
      `<p class="warn">인증 코드가 없어요. 처음부터 다시 연결해 주세요.</p>`,
    );
  }

  try {
    const tokens = await exchangeYoutubeAuthCode(code);
    if (!tokens.refreshToken) {
      return htmlPage(
        "오래 쓰는 열쇠가 안 나왔어요",
        `<div class="warn">
          <p>구글이 오래 쓰는 열쇠를 주지 않았어요. 보통은 예전에 이미 허용한 경우예요.</p>
          <p>Google Cloud 콘솔 → 사용자 인증 정보에서 앱 연결을 지운 뒤, <strong>다시 동의</strong>로 한 번 더 해 주세요.</p>
        </div>`,
      );
    }

    const safe = tokens.refreshToken
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return htmlPage(
      "유튜브 연결 열쇠가 나왔어요",
      `<p>아래 값을 복사해서 호스팅(Vercel) 비밀 설정에 <code>YOUTUBE_REFRESH_TOKEN</code> 이름으로 넣어 주세요.</p>
       <p class="warn">이 화면은 <strong>한 번만</strong> 잘 저장하세요. 저장소·채팅에 붙여 넣지 마세요.</p>
       <label>YOUTUBE_REFRESH_TOKEN<textarea readonly>${safe}</textarea></label>
       <p>넣은 뒤 사이트를 다시 배포(또는 재시작)하면 미공개 영상실에서 숏츠 올리기를 쓸 수 있어요.</p>`,
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "연결에 실패했어요.";
    return htmlPage(
      "유튜브 연결 실패",
      `<p class="warn">${message.replace(/</g, "&lt;")}</p>`,
    );
  }
}
