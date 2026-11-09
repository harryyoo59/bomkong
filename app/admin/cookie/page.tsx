import Link from "next/link";
import { redirect } from "next/navigation";
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
      <section className="panel">
        <p className="eyebrow">관리자실 · 6번 칸</p>
        <h1 className="section-title">쿠키완료실</h1>
        <p className="muted">
          쿠키 영상에 이미 쓴 소스를 옮겨 두는 방이에요. 같은 자료를 다시
          쓰지 않도록 영상 제목과 함께 보관해요.
        </p>
      </section>
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
