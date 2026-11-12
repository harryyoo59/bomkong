import Link from "next/link";

/** 미공개 영상실 안에서 한국어·영어 문을 고르는 칸 */
export function UnreleasedLangChooser() {
  return (
    <div className="unreleased-lang-doors" role="list">
      <Link
        href="/admin/unreleased/ko"
        className="clinic-door"
        role="listitem"
        aria-label="미공개 영상실 · 한국어"
      >
        <span className="clinic-door-number" aria-hidden="true">
          한
        </span>
        <span className="clinic-door-body">
          <h2>미공개 영상실 · 한국어</h2>
          <p>한국어 시장용으로 아직 유튜브에 안 올린 영상을 모아 둬요.</p>
          <p className="clinic-door-note">한국어 목록</p>
        </span>
      </Link>

      <Link
        href="/admin/unreleased/en"
        className="clinic-door"
        role="listitem"
        aria-label="미공개 영상실 · 영어"
      >
        <span className="clinic-door-number" aria-hidden="true">
          EN
        </span>
        <span className="clinic-door-body">
          <h2>미공개 영상실 · 영어</h2>
          <p>영어 시장용으로 아직 유튜브에 안 올린 영상을 모아 둬요.</p>
          <p className="clinic-door-note">영어 목록</p>
        </span>
      </Link>
    </div>
  );
}
