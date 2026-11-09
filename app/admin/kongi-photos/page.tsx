import Link from "next/link";
import { redirect } from "next/navigation";
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
      <section className="panel">
        <p className="eyebrow">관리자실 · 콩이 칸 아래</p>
        <h1 className="section-title">영상규칙에 쓸 사진 보관</h1>
        <p className="muted">
          콩이 영상규칙에 쓸 사진을 모아 두는 방이에요. 사진을 골라 넣을 수
          있어요.
        </p>
      </section>
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
