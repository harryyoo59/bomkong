import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoManageRoom } from "@/components/LogoManageRoom";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLogosPage() {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    redirect(
      gate.reason === "missing_secret"
        ? "/admin/login?need=setup"
        : "/admin/login?next=/admin/logos",
    );
  }

  return (
    <div className="study-room">
      <section className="panel">
        <p className="eyebrow">관리자실 · 4번 칸</p>
        <h1 className="section-title">로고 관리</h1>
        <p className="muted">
          공식 로고에 일련번호를 붙여 모아 두는 방이에요. 번호를 정하고,
          나중에 고쳐도 돼요.
        </p>
      </section>
      <section className="panel">
        <LogoManageRoom />
      </section>
      <div className="vault-nav-row">
        <Link className="btn btn-soft" href="/logos">
          손님용 로고 보기
        </Link>
        <Link className="btn btn-soft" href="/admin">
          관리자실로
        </Link>
      </div>
    </div>
  );
}
