import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminRoomHeader } from "@/components/AdminRoomHeader";
import { EmoticonShelfChooser } from "@/components/EmoticonShelfChooser";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminEmoticonsHubPage() {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    redirect(
      gate.reason === "missing_secret"
        ? "/admin/login?need=setup"
        : "/admin/login?next=/admin/emoticons",
    );
  }

  return (
    <div className="study-room">
      <AdminRoomHeader roomKey="emoticons" />
      <section className="panel">
        <EmoticonShelfChooser />
      </section>
      <div className="vault-nav-row">
        <Link className="btn btn-soft" href="/admin/logos">
          로고 관리로
        </Link>
        <Link className="btn btn-soft" href="/admin">
          관리자실로
        </Link>
      </div>
    </div>
  );
}
