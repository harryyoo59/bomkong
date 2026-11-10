import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminRoomHeader } from "@/components/AdminRoomHeader";
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
      <AdminRoomHeader roomKey="public" />
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
