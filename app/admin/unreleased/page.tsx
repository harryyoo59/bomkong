import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminRoomHeader } from "@/components/AdminRoomHeader";
import { UnreleasedLangChooser } from "@/components/UnreleasedLangChooser";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminUnreleasedHubPage() {
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
        <UnreleasedLangChooser />
      </section>
      <div className="vault-nav-row">
        <Link className="btn btn-soft" href="/admin/youtube-connect">
          유튜브 숏츠 연결
        </Link>
        <Link className="btn btn-soft" href="/admin">
          관리자실
        </Link>
      </div>
    </div>
  );
}
