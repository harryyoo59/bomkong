import Link from "next/link";
import { redirect } from "next/navigation";
import { PublicVideoRoom } from "@/components/PublicVideoRoom";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminPublicPage() {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    redirect(
      gate.reason === "missing_secret"
        ? "/admin/login?need=setup"
        : "/admin/login?next=/admin/public",
    );
  }

  return (
    <div className="study-room">
      <section className="panel">
        <p className="eyebrow">관리자실 · 8번 칸</p>
        <h1 className="section-title">공개 영상실</h1>
        <p className="muted">
          유튜브에 공개한 뒤의 원본과 제목을 모아 두는 방이에요.
        </p>
      </section>
      <section className="panel">
        <PublicVideoRoom />
      </section>
      <div className="vault-nav-row">
        <Link className="btn btn-soft" href="/admin/unreleased">
          미공개 영상실
        </Link>
        <Link className="btn btn-soft" href="/admin">
          관리자실
        </Link>
      </div>
    </div>
  );
}
