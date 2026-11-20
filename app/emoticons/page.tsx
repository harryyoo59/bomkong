import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";

export default function EmoticonsPage() {
  return (
    <SiteShell title="이모티콘">
      <section className="panel stub-card">
        <p className="eyebrow">구매 · 선물</p>
        <h1 className="section-title">이모티콘 구매및 선물하기</h1>
        <p className="muted">
          봄이콩이 이모티콘을 사고 선물하는 자리예요. 결제·선물 보내기는 아직
          없어서 지금은 안내만 보여 줘요. 가짜로 「결제 완료」라고 하지 않아요.
        </p>
      </section>

      <Link className="btn btn-soft btn-wide" href="/">
        거실로 돌아가기
      </Link>
    </SiteShell>
  );
}
