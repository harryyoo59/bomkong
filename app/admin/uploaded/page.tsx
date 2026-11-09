import Link from "next/link";
import { redirect } from "next/navigation";
import { UploadedVideoRoom } from "@/components/UploadedVideoRoom";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminUploadedPage() {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    redirect(
      gate.reason === "missing_secret"
        ? "/admin/login?need=setup"
        : "/admin/login?next=/admin/uploaded",
    );
  }

  return (
    <div className="study-room">
      <section className="panel">
        <p className="eyebrow">관리자실 · 8번 칸</p>
        <h1 className="section-title">유튜브 올린 영상실</h1>
        <p className="muted">
          이미 유튜브에 올린 영상의 원본과 제목을 모아 두는 방이에요.
        </p>
      </section>
      <section className="panel">
        <UploadedVideoRoom />
      </section>
      <div className="vault-nav-row">
        <Link className="btn btn-soft" href="/admin/unreleased">
          미공개 영상실로
        </Link>
        <Link className="btn btn-soft" href="/admin">
          관리자실로
        </Link>
      </div>
    </div>
  );
}
