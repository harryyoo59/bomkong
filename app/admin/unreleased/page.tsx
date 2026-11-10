import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminRoomHeader } from "@/components/AdminRoomHeader";
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
      <AdminRoomHeader roomKey="unreleased" />
      <section className="panel">
        <UnreleasedVideoRoom />
      </section>
      <div className="vault-nav-row">
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
