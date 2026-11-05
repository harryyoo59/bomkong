import Link from "next/link";
import { AdminUploadForm } from "@/components/AdminUploadForm";
import { SiteShell } from "@/components/SiteShell";

export default function AdminPage() {
  return (
    <SiteShell title="올리기">
      <section className="panel">
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
    </SiteShell>
  );
}
