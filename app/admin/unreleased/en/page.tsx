import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminRoomHeader } from "@/components/AdminRoomHeader";
import { UnreleasedVideoRoom } from "@/components/UnreleasedVideoRoom";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminUnreleasedEnPage() {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    redirect(
      gate.reason === "missing_secret"
        ? "/admin/login?need=setup"
        : "/admin/login?next=/admin/unreleased/en",
    );
  }

  return (
    <div className="study-room">
      <AdminRoomHeader roomKey="unreleased-en" />
      <section className="panel">
        <UnreleasedVideoRoom lang="en" />
      </section>
      <div className="vault-nav-row">
        <Link className="btn btn-soft" href="/admin/unreleased">
          미공개 문 고르기
        </Link>
        <Link className="btn btn-soft" href="/admin/unreleased/ko">
          한국어 버전으로
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
