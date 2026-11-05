import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { getEpisodes } from "@/lib/episodes";

export default function SubscribePage() {
  const first = getEpisodes().find((ep) => ep.hasKo);

  return (
    <SiteShell title="정기 구독">
      <section className="panel stub-card">
        <p className="eyebrow">부모용</p>
        <h1 className="section-title">왜 사이트에서 구독하나요?</h1>
        <p>
          유튜브는 관심은 끌지만, 알고리즘 때문에 봄이콩이만 이어서 보기
          어려워요. 사이트에서는 <strong>한국어 → 같은 편 영어 → 다음
          한국어</strong>로 계속 볼 수 있어요.
        </p>
      </section>

      <section className="panel">
        <h2 className="section-title">유튜브와 사이트</h2>
        <div className="compare-grid">
          <div className="compare-card">
            <p className="compare-label">유튜브</p>
            <ul className="mini-list tight">
              <li>관심 끌기 · 숏츠</li>
              <li>다음에 다른 영상이 섞여요</li>
            </ul>
          </div>
          <div className="compare-card compare-card-on">
            <p className="compare-label">이 사이트</p>
            <ul className="mini-list tight">
              <li>한·영 짝으로 이어 보기</li>
              <li>봄이콩이만 이어서</li>
            </ul>
          </div>
        </div>
        <p className="muted tiny compare-foot">
          한 편마다 단어 하나. 한국어판은 영어 단어, 영어판은 한국어 단어를
          배워요.
        </p>
      </section>

      <section className="panel stub-card">
        <h2 className="section-title">요금 맛보기</h2>
        <div className="price-box">
          <p className="eyebrow">정기 구독 자리</p>
          <p className="price-big">금액 미정</p>
          <p className="muted">
            혜택·무료로 몇 편까지인지는 아직 정하지 않았어요. 가입·결제는
            나중에 붙일 예정이에요.
          </p>
        </div>
        <ul className="benefit-list">
          <li>한→영 이어보기로 자연스럽게 단어 익히기</li>
          <li>유튜브보다 봄이콩이만 이어서 보기</li>
          <li>나중에 구독 전용 편도 열릴 예정</li>
        </ul>
        <button type="button" className="btn btn-primary btn-wide" disabled>
          나중에 결제 · 준비 중
        </button>
        {first ? (
          <Link
            className="btn btn-soft btn-wide"
            href={`/watch/${first.id}?lang=ko`}
          >
            먼저 맛보기 · {first.number}편 한국어
          </Link>
        ) : (
          <Link className="btn btn-soft btn-wide" href="/episodes">
            먼저 맛보기 · 편 목록
          </Link>
        )}
        <p className="tiny muted center-text">
          지금 결제는 없어요. 맛보기만 해 보세요.
        </p>
      </section>
    </SiteShell>
  );
}
