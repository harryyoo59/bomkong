import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminRoomHeader } from "@/components/AdminRoomHeader";
import { LogoManageRoom } from "@/components/LogoManageRoom";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLogosPage() {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    redirect(
      gate.reason === "missing_secret"
        ? "/admin/login?need=setup"
        : "/admin/login?next=/admin/logos",
    );
  }

  return (
    <div className="study-room">
      <AdminRoomHeader roomKey="logos" />
      <section className="panel">
        <LogoManageRoom />
      </section>
      <div className="vault-nav-row">
        <Link className="btn btn-soft" href="/logos">
          손님용 로고 보기
        </Link>
        <Link className="btn btn-soft" href="/admin">
          관리자실로
        </Link>
      </div>
    </div>
  );
}
