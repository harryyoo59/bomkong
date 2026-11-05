import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { getEpisodes } from "@/lib/episodes";

export default function HomePage() {
  const episodes = getEpisodes();
  const first = episodes.find((ep) => ep.hasKo);

  return (
    <SiteShell title="홈">
      <section className="hero">
        <p className="hero-brand">봄이콩이</p>
        <h1>한국어 보고, 같은 편 영어도 이어서</h1>
        <p>
          한 → 영 → 다음 한. 유튜브보다 여기서 계속 볼 수 있어요.
        </p>
        <div className="hero-actions">
          {first ? (
            <Link
              className="btn btn-primary btn-cta"
              href={`/watch/${first.id}?lang=ko`}
            >
              {first.number}편부터 보기
            </Link>
          ) : null}
        </div>
        {first ? (
          <p className="hero-cta-note">
            시작: {first.number}편 「{first.titleKo}」 · 한국어
          </p>
        ) : null}
      </section>

      <section className="panel cta-panel">
        <h2 className="section-title">지금 보기</h2>
        <p className="muted">
          추천은 첫 한국어 편이에요. 끝나면 같은 편 영어(없으면 다음
          한국어)로 이어져요.
        </p>
        {first ? (
          <Link
            className="btn btn-primary btn-wide"
            href={`/watch/${first.id}?lang=ko`}
          >
            시청 시작 · {first.number}편 한국어
          </Link>
        ) : null}
        <Link className="btn btn-soft btn-wide" href="/episodes">
          편 목록에서 고르기
        </Link>
      </section>

      <section className="panel">
        <h2 className="section-title">보는 순서</h2>
        <ol className="flow-list">
          <li>
            <strong>한국어</strong> 본편
          </li>
          <li>
            <strong>같은 편 영어</strong> (없으면 다음 한국어)
          </li>
          <li>
            <strong>다음 한국어</strong> …
          </li>
        </ol>
      </section>

      <section className="panel stub-card">
        <h2 className="section-title">캐릭터 · 봄이</h2>
        <p className="muted">
          봄이 공식 소개와 기준 시트를 볼 수 있어요.
        </p>
        <Link className="btn btn-soft btn-wide" href="/characters/bomi">
          봄이 소개 보기
        </Link>
      </section>

      <section className="panel stub-card">
        <h2 className="section-title">캐릭터 · 콩이</h2>
        <p className="muted">
          콩이 공식 소개와 기준 시트를 볼 수 있어요.
        </p>
        <Link className="btn btn-soft btn-wide" href="/characters/kongi">
          콩이 소개 보기
        </Link>
      </section>
    </SiteShell>
  );
}
