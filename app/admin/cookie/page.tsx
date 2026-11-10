import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminRoomHeader } from "@/components/AdminRoomHeader";
import { CookieDoneRoom } from "@/components/CookieDoneRoom";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminCookiePage() {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    redirect(
      gate.reason === "missing_secret"
        ? "/admin/login?need=setup"
        : "/admin/login?next=/admin/cookie",
    );
  }

  return (
    <div className="study-room">
      <AdminRoomHeader roomKey="cookie" />
      <section className="panel">
        <CookieDoneRoom />
      </section>
      <div className="vault-nav-row">
        <Link className="btn btn-soft" href="/admin/source">
          소스 보관실로
        </Link>
        <Link className="btn btn-soft" href="/admin">
          관리자실로
        </Link>
      </div>
    </div>
  );
}
