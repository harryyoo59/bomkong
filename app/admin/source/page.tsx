import Link from "next/link";
import { redirect } from "next/navigation";
import { SourceVaultRoom } from "@/components/SourceVaultRoom";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminSourcePage() {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    redirect(
      gate.reason === "missing_secret"
        ? "/admin/login?need=setup"
        : "/admin/login?next=/admin/source",
    );
  }

  return (
    <div className="study-room">
      <section className="panel">
        <p className="eyebrow">관리자실 · 5번 칸</p>
        <h1 className="section-title">소스 보관실</h1>
        <p className="muted">
          앞으로 쿠키 영상에 쓸 사진·동영상을 모아 두는 방이에요.
        </p>
      </section>
      <section className="panel">
        <SourceVaultRoom />
      </section>
      <div className="vault-nav-row">
        <Link className="btn btn-soft" href="/admin/cookie">
          쿠키완료실로
        </Link>
        <Link className="btn btn-soft" href="/admin">
          관리자실로
        </Link>
      </div>
    </div>
  );
}
