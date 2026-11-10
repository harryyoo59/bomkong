import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminRoomHeader } from "@/components/AdminRoomHeader";
import { CharacterPhotoShelf } from "@/components/CharacterPhotoShelf";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminBomiPhotosPage() {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    redirect(
      gate.reason === "missing_secret"
        ? "/admin/login?need=setup"
        : "/admin/login?next=/admin/bomi-photos",
    );
  }

  return (
    <div className="study-room">
      <AdminRoomHeader roomKey="bomi-photos" />
      <section className="panel">
        <CharacterPhotoShelf shelf="bomi" />
      </section>
      <div className="vault-nav-row">
        <Link className="btn btn-soft" href="/characters/bomi">
          봄이 소개로
        </Link>
        <Link className="btn btn-soft" href="/admin">
          관리자실로
        </Link>
      </div>
    </div>
  );
}
