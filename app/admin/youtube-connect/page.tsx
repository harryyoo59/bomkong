import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { getYoutubeConfigStatus } from "@/lib/youtube-config";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ need?: string }>;
};

export default async function YoutubeConnectPage({ searchParams }: PageProps) {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    redirect(
      gate.reason === "missing_secret"
        ? "/admin/login?need=setup"
        : "/admin/login?next=/admin/youtube-connect",
    );
  }

  const params = (await searchParams) || {};
  const status = getYoutubeConfigStatus();
  const needEnv = params.need === "env";

  return (
    <div className="study-room">
      <section className="panel">
        <p className="eyebrow">관리자실 · 유튜브</p>
        <h1 className="section-title">유튜브 숏츠 연결</h1>
        <p className="muted">
          봄이콩이 채널에 숏츠를 올리려면, 구글에서 한 번 허락을 받고 서버에
          비밀 값을 넣어야 해요. 비밀 값은 저장소에 넣지 마세요.
        </p>
      </section>
      <section className="panel">
        <div className="admin-wrap">
          <p className="tiny muted">대상 채널 · {status.channelHint}</p>

          {needEnv ? (
            <p className="form-msg">
              클라이언트 아이디·비밀·돌아가는 주소가 아직 부족해요. 아래 세 값을
              먼저 넣어 주세요.
            </p>
          ) : null}

          {status.configured ? (
            <p className="form-msg">
              연결 값이 서버에 있어요. 미공개 영상실에서 「유튜브 숏츠로
              올리기」를 쓸 수 있어요.
            </p>
          ) : (
            <p className="form-msg">
              아직 연결 전이에요.
              {status.missing.length
                ? ` 없는 값: ${status.missing.join(", ")}`
                : ""}
            </p>
          )}

          <ol className="admin-steps">
            <li>Google Cloud에서 새 프로젝트를 만들어요.</li>
            <li>「YouTube Data API v3」를 켜요.</li>
            <li>
              OAuth 동의 화면을 만들고, 테스트 사용자에 채널 주인 구글 계정을
              넣어요.
            </li>
            <li>
              OAuth 클라이언트(웹)를 만들고, 돌아가는 주소에
              <code className="inline-code">
                https://(사이트주소)/api/admin/youtube/oauth/callback
              </code>
              를 넣어요.
            </li>
            <li>
              호스팅(Vercel) 비밀 설정에 아래 이름을 넣어요.
              <ul>
                <li>
                  <code className="inline-code">YOUTUBE_CLIENT_ID</code>
                </li>
                <li>
                  <code className="inline-code">YOUTUBE_CLIENT_SECRET</code>
                </li>
                <li>
                  <code className="inline-code">YOUTUBE_REDIRECT_URI</code>{" "}
                  (위 돌아가는 주소와 같게)
                </li>
              </ul>
            </li>
            <li>
              아래 「구글에서 허락받기」를 눌러 채널 주인 계정으로 동의한 뒤,
              나온 오래 쓰는 열쇠를
              <code className="inline-code">YOUTUBE_REFRESH_TOKEN</code>
              으로 넣어요.
            </li>
          </ol>

          <div className="vault-action-row">
            {status.canStartOAuth ? (
              <a
                className="btn btn-primary"
                href="/api/admin/youtube/oauth/start"
              >
                구글에서 허락받기
              </a>
            ) : (
              <span className="btn btn-soft" aria-disabled="true">
                먼저 위 세 값을 서버에 넣어야 해요
              </span>
            )}
            <Link className="btn btn-soft" href="/admin/unreleased">
              미공개 영상실
            </Link>
            <Link className="btn btn-soft" href="/admin">
              관리자실
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
