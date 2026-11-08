import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { getAdminAuthConfig, getAdminAuthStatus } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; need?: string }>;
}) {
  const params = await searchParams;
  const status = await getAdminAuthStatus();
  if (status.ready && status.authenticated) {
    const next = params.next ?? "/admin";
    redirect(next.startsWith("/admin") ? next : "/admin");
  }

  const { configured } = getAdminAuthConfig();
  const needSetup = !configured || params.need === "setup";

  return (
    <div className="admin-gate">
      <section className="panel admin-gate-card">
        <p className="eyebrow">관리자 입장</p>
        <h1 className="section-title">비밀글을 입력해 주세요</h1>
        <p className="muted">
          거실 「관리자실」 문으로 들어오는 자리예요. 손님 메뉴와 섞이지
          않아요. 비밀글은 인터넷 서버에서만 확인하고, 화면·저장소에 비밀번호를
          적어 두지 않아요.
        </p>

        {needSetup ? (
          <div className="status-box status-box-warn" role="status">
            <p className="status-title">아직 비밀글이 서버에 없어요</p>
            <p className="muted tiny">
              인터넷에 올린 뒤, 호스팅 설정에 관리자 비밀값을 넣어야 들어가요.
              넣는 방법은 안내 문서에 쉬운 한글로 적어 두었어요. 저장소에는
              비밀값을 올리지 마세요. 비밀 없이 통과하는 길은 없어요.
            </p>
          </div>
        ) : null}

        <AdminLoginForm nextPath={params.next ?? "/admin"} />

        <Link className="btn btn-soft btn-wide" href="/">
          거실로 돌아가기
        </Link>
      </section>
    </div>
  );
}
