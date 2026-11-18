import Link from "next/link";

/** 이모티콘 제작실에서 봄이·콩이 보관함을 고르는 칸 */
export function EmoticonShelfChooser() {
  return (
    <div className="unreleased-lang-doors" role="list">
      <Link
        href="/admin/emoticons/bomi"
        className="clinic-door"
        role="listitem"
        aria-label="봄이 이모티콘"
        prefetch
      >
        <span className="clinic-door-number" aria-hidden="true">
          봄
        </span>
        <span className="clinic-door-body">
          <h2>봄이 이모티콘</h2>
          <p>봄이 이모티콘을 갤러리처럼 모아 둬요. 눈으로 다 볼 수 있어요.</p>
          <p className="clinic-door-note">봄이 보관 · 들어가서 넣기</p>
        </span>
      </Link>

      <Link
        href="/admin/emoticons/kongi"
        className="clinic-door"
        role="listitem"
        aria-label="콩이 이모티콘"
        prefetch
      >
        <span className="clinic-door-number" aria-hidden="true">
          콩
        </span>
        <span className="clinic-door-body">
          <h2>콩이 이모티콘</h2>
          <p>콩이 이모티콘을 갤러리처럼 모아 둬요. 눈으로 다 볼 수 있어요.</p>
          <p className="clinic-door-note">콩이 보관 · 들어가서 넣기</p>
        </span>
      </Link>
    </div>
  );
}
