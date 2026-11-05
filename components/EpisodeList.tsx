import Link from "next/link";
import type { Episode } from "@/lib/types";

export function EpisodeList({ episodes }: { episodes: Episode[] }) {
  return (
    <ul className="ep-list">
      {episodes.map((ep) => (
        <li key={ep.id} className="ep-row">
          <div className="ep-meta">
            <div className="ep-head">
              <span className="ep-num">{ep.number}편</span>
              <span
                className={
                  ep.visibility === "free" ? "badge badge-free" : "badge"
                }
              >
                {ep.visibility === "free" ? "무료" : "구독 맛보기"}
              </span>
            </div>
            <strong>{ep.titleKo}</strong>
            <p className="muted tiny">
              단어 {ep.wordEn} / {ep.wordKo}
              {ep.summary ? ` · ${ep.summary}` : ""}
            </p>

            <div className="pair-row" aria-label="한·영 짝">
              <span className={ep.hasKo ? "pair-chip pair-ok" : "pair-chip"}>
                한국어 {ep.hasKo ? "있음" : "없음"}
              </span>
              {ep.hasEn ? (
                <span className="pair-chip pair-ok">영어 · {ep.titleEn}</span>
              ) : (
                <span className="pair-chip pair-wait">영어 준비 중</span>
              )}
            </div>
          </div>

          <div className="ep-actions">
            {ep.hasKo ? (
              <Link
                className="btn btn-primary"
                href={`/watch/${ep.id}?lang=ko`}
              >
                한국어 보기
              </Link>
            ) : null}
            {ep.hasEn ? (
              <Link className="btn btn-soft" href={`/watch/${ep.id}?lang=en`}>
                영어 보기
              </Link>
            ) : (
              <span className="badge badge-wait">영어 준비 중</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
