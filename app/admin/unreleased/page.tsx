import Link from "next/link";
import { redirect } from "next/navigation";
import { UnreleasedVideoRoom } from "@/components/UnreleasedVideoRoom";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminUnreleasedPage() {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    redirect(
      gate.reason === "missing_secret"
        ? "/admin/login?need=setup"
        : "/admin/login?next=/admin/unreleased",
    );
  }

  return (
    <div className="study-room">
      <section className="panel">
        <p className="eyebrow">관리자실 · 7번 칸</p>
        <h1 className="section-title">미공개 영상실</h1>
        <p className="muted">
          만들기는 끝났지만 아직 유튜브에 안 올린 영상을 모아 두는 방이에요.
        </p>
      </section>
      <section className="panel">
        <UnreleasedVideoRoom />
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
