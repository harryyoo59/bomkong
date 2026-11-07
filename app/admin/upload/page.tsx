import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminUploadForm } from "@/components/AdminUploadForm";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminUploadPage() {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    redirect(
      gate.reason === "missing_secret"
        ? "/admin/login?need=setup"
        : "/admin/login?next=/admin/upload",
    );
  }

  return (
    <div className="study-room">
      <section className="panel">
        <p className="eyebrow">책상 · 올리기</p>
        <h1 className="section-title">편 올리기</h1>
        <p className="muted">
          편 번호·제목·단어·한/영/쿠키 파일·공개 범위를 채워요. 영어 파일이
          없으면 「영어 준비 중」으로 두고, 이어보기는 다음 한국어로 가요.
        </p>
        <p className="tiny">
          제작 전에는{" "}
          <Link href="/rules" className="queue-link">
            영상규칙 보관소
          </Link>
          를 먼저 읽어요.
        </p>
      </section>
      <section className="panel">
        <AdminUploadForm />
      </section>
      <Link className="btn btn-soft btn-wide" href="/admin">
        공부방으로
      </Link>
    </div>
  );
}
