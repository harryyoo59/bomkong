import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

export default function RulesPage() {
  return (
    <SiteShell title="영상규칙">
      <section className="panel rules-box stub-card">
        <h1 className="section-title">봄이콩이 영상규칙 보관소</h1>
        <p>
          어떤 AI든 영상을 만들기 <strong>전에</strong> 규칙을 읽고 따라야
          해요. 캐릭터 모습은 마음대로 바꾸면 안 돼요.
        </p>
        <p className="muted">
          외형·옷·기준 사진 세부는 아직 빈칸이에요. 이 앱에서는 모습을 새로
          지어내지 않아요.
        </p>
        <ol>
          <li>보관소 README</li>
          <li>봄이 · 콩이</li>
          <li>화면·연출 공통</li>
          <li>한 편 스토리·학습</li>
          <li>쿠키 실사</li>
          <li>금지</li>
        </ol>
        <div className="price-box">
          <p className="eyebrow">문서 위치 (프로젝트 창고)</p>
          <p className="tiny">
            docs/character-rules/README.md · media/character-refs/
          </p>
          <p className="muted tiny">
            앱 안에서는 요약만 보여 줘요. 자세한 규칙은 창고 문서를 보세요.
          </p>
        </div>
        <Link className="btn btn-soft btn-wide" href="/admin">
          올리기 화면으로
        </Link>
      </section>
    </SiteShell>
  );
}
