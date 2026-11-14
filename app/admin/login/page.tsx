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
        <h1 className="section-title">문을 다섯 번 눌러 주세요</h1>
        <p className="muted">
          거실 「관리자실」 문을 다섯 번 누르면 들어가요. 손님 메뉴와 섞이지
          않아요.
        </p>

        {needSetup ? (
          <div className="status-box status-box-warn" role="status">
            <p className="status-title">아직 관리자 방이 서버에 준비되지 않았어요</p>
            <p className="muted tiny">
              인터넷에 올린 뒤, 호스팅 설정에 관리자 준비값을 넣어야 들어가요.
              저장소에는 그 값을 올리지 마세요.
            </p>
          </div>
        ) : null}

        <AdminLoginForm />

        <Link className="btn btn-soft btn-wide" href="/">
          거실로 돌아가기
        </Link>
      </section>
    </div>
  );
}
