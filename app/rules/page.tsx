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
        <ol>
          <li>보관소 README</li>
          <li>봄이 · 콩이</li>
          <li>화면·연출 공통</li>
          <li>한 편 스토리·학습</li>
          <li>쿠키 실사</li>
          <li>금지</li>
        </ol>
        <div className="price-box">
          <p className="eyebrow">봄이</p>
          <p>
            봄이 공식 소개와 기준 시트(표정·전신·디자인)가 준비되어 있어요.
          </p>
          <Link className="btn btn-primary btn-wide" href="/characters/bomi">
            봄이 소개 보기
          </Link>
        </div>
        <div className="price-box">
          <p className="eyebrow">콩이</p>
          <p>
            콩이 공식 소개와 기준 시트(얼굴 분석·전신)가 준비되어 있어요.
          </p>
          <Link className="btn btn-primary btn-wide" href="/characters/kongi">
            콩이 소개 보기
          </Link>
        </div>
        <Link className="btn btn-soft btn-wide" href="/admin">
          올리기 화면으로
        </Link>
      </section>
    </SiteShell>
  );
}
