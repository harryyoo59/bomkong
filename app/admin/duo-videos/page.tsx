import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminRoomHeader } from "@/components/AdminRoomHeader";
import { CharacterPhotoShelf } from "@/components/CharacterPhotoShelf";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminDuoVideosPage() {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    redirect(
      gate.reason === "missing_secret"
        ? "/admin/login?need=setup"
        : "/admin/login?next=/admin/duo-videos",
    );
  }

  return (
    <div className="study-room">
      <AdminRoomHeader roomKey="duo-videos" />
      <section className="panel">
        <CharacterPhotoShelf shelf="duo" mediaKind="video" />
      </section>
      <div className="vault-nav-row">
        <Link className="btn btn-soft" href="/characters/duo">
          봄이·콩이 소개로
        </Link>
        <Link className="btn btn-soft" href="/admin">
          관리자실로
        </Link>
      </div>
    </div>
  );
}
