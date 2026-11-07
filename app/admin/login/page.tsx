import Link from "next/link";
import { AdminLoginForm } from "@/components/AdminLoginForm";
import { getAdminAuthConfig } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; need?: string }>;
}) {
  const params = await searchParams;
  const { configured } = getAdminAuthConfig();
  const needSetup = !configured || params.need === "setup";

  return (
    <div className="admin-gate">
      <section className="panel admin-gate-card">
        <p className="eyebrow">관리자실 문</p>
        <h1 className="section-title">들어가려면 확인이 필요해요</h1>
        <p className="muted">
          손님 메뉴와 섞이지 않는 공부방(관리자실)이에요. 서버에서만 열쇠를
          확인해요. 저장소·화면에 비밀번호를 넣지 않아요.
        </p>

        {needSetup ? (
          <div className="status-box status-box-warn" role="status">
            <p className="status-title">아직 열쇠 설정이 없어요</p>
            <p className="muted tiny">
              배포 환경(Vercel 등)에 <strong>BOMKONG_ADMIN_SECRET</strong>{" "}
              환경 변수를 넣은 뒤 다시 열어 주세요. 이 값은 저장소에 올리지
              마세요. 공개 우회 경로는 없습니다.
            </p>
          </div>
        ) : (
          <AdminLoginForm nextPath={params.next ?? "/admin"} />
        )}

        <Link className="btn btn-soft btn-wide" href="/">
          거실로 돌아가기
        </Link>
      </section>
    </div>
  );
}
