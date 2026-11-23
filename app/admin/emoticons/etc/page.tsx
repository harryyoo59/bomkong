import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminRoomHeader } from "@/components/AdminRoomHeader";
import { EmoticonShelf } from "@/components/EmoticonShelf";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminEtcEmoticonsPage() {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    redirect(
      gate.reason === "missing_secret"
        ? "/admin/login?need=setup"
        : "/admin/login?next=/admin/emoticons/etc",
    );
  }

  return (
    <div className="study-room">
      <AdminRoomHeader roomKey="etc-emoticons" />
      <section className="panel">
        <EmoticonShelf shelf="etc" />
      </section>
      <div className="vault-nav-row">
        <Link className="btn btn-soft" href="/admin/emoticons">
          이모티콘 제작으로
        </Link>
        <Link className="btn btn-soft" href="/admin">
          관리자실로
        </Link>
      </div>
    </div>
  );
}
