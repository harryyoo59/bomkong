import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminRoomHeader } from "@/components/AdminRoomHeader";
import { CharacterPhotoShelf } from "@/components/CharacterPhotoShelf";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminKongiPhotosPage() {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    redirect(
      gate.reason === "missing_secret"
        ? "/admin/login?need=setup"
        : "/admin/login?next=/admin/kongi-photos",
    );
  }

  return (
    <div className="study-room">
      <AdminRoomHeader roomKey="kongi-photos" />
      <section className="panel">
        <CharacterPhotoShelf shelf="kongi" />
      </section>
      <div className="vault-nav-row">
        <Link className="btn btn-soft" href="/characters/kongi">
          콩이 소개로
        </Link>
        <Link className="btn btn-soft" href="/admin">
          관리자실로
        </Link>
      </div>
    </div>
  );
}
