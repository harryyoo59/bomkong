import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminRoomHeader } from "@/components/AdminRoomHeader";
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
      <AdminRoomHeader roomKey="source" />
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
