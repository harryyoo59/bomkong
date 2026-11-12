import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminRoomHeader } from "@/components/AdminRoomHeader";
import { UnreleasedVideoRoom } from "@/components/UnreleasedVideoRoom";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminUnreleasedKoPage() {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    redirect(
      gate.reason === "missing_secret"
        ? "/admin/login?need=setup"
        : "/admin/login?next=/admin/unreleased/ko",
    );
  }

  return (
    <div className="study-room">
      <AdminRoomHeader roomKey="unreleased-ko" />
      <section className="panel">
        <UnreleasedVideoRoom lang="ko" />
      </section>
      <div className="vault-nav-row">
        <Link className="btn btn-soft" href="/admin/unreleased">
          미공개 영상실
        </Link>
        <Link className="btn btn-soft" href="/admin/unreleased/en">
          영어 버전으로
        </Link>
        <Link className="btn btn-soft" href="/admin/youtube-connect">
          유튜브 숏츠 연결
        </Link>
        <Link className="btn btn-soft" href="/admin/public">
          공개 영상실
        </Link>
        <Link className="btn btn-soft" href="/admin">
          관리자실
        </Link>
      </div>
    </div>
  );
}
