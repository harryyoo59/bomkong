import Link from "next/link";
import { logoutAdmin } from "@/app/admin/actions";
import { requireAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminClinicPage() {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    redirect(
      gate.reason === "missing_secret"
        ? "/admin/login?need=setup"
        : "/admin/login",
    );
  }

  return (
    <div className="clinic-room">
      <header className="clinic-header">
        <div>
          <p className="eyebrow">관리자실 · 진료실</p>
          <h1 className="section-title">관리자실을 칸으로 나눴어요</h1>
          <p className="muted">
            손님용 메뉴와 섞이지 않아요. 봄이·콩이·영상규칙·로고·소스
            보관실·쿠키완료실·미공개 영상실·공개 영상실·손님 의견이 여기에
            있어요. 연결된 칸만 눌러 들어가요.
          </p>
        </div>
        <form action={logoutAdmin}>
          <button type="submit" className="btn btn-soft">
            나가기
          </button>
        </form>
      </header>

      <div className="clinic-grid" role="list">
        <div className="clinic-column" role="presentation">
          <Link
            href="/characters/bomi"
            className="clinic-door"
            role="listitem"
          >
            <span className="clinic-door-number" aria-hidden="true">
              1
            </span>
            <span className="clinic-door-body">
              <h2>봄이</h2>
              <p>봄이 소개와 기준 그림을 봐요.</p>
            </span>
          </Link>
          <Link
            href="/admin/bomi-photos"
            className="clinic-door clinic-door-photo clinic-door-photo-open"
            role="listitem"
            aria-label="봄이 · 영상규칙에 쓸 사진 보관"
          >
            <span className="clinic-door-number" aria-hidden="true">
              ·
            </span>
            <span className="clinic-door-body">
              <h2>영상규칙에 쓸 사진 보관</h2>
              <p>봄이 칸 아래예요. 사진을 골라 넣을 수 있어요.</p>
              <p className="clinic-door-note">사진 올리기 열림</p>
            </span>
          </Link>
        </div>

        <div className="clinic-column" role="presentation">
          <Link
            href="/characters/kongi"
            className="clinic-door"
            role="listitem"
          >
            <span className="clinic-door-number" aria-hidden="true">
              2
            </span>
            <span className="clinic-door-body">
              <h2>콩이</h2>
              <p>콩이 소개와 기준 그림을 봐요.</p>
            </span>
          </Link>
          <Link
            href="/admin/kongi-photos"
            className="clinic-door clinic-door-photo clinic-door-photo-open"
            role="listitem"
            aria-label="콩이 · 영상규칙에 쓸 사진 보관"
          >
            <span className="clinic-door-number" aria-hidden="true">
              ·
            </span>
            <span className="clinic-door-body">
              <h2>영상규칙에 쓸 사진 보관</h2>
              <p>콩이 칸 아래예요. 사진을 골라 넣을 수 있어요.</p>
              <p className="clinic-door-note">사진 올리기 열림</p>
            </span>
          </Link>
        </div>

        <div
          className="clinic-door clinic-door-empty"
          role="listitem"
          aria-label="영상제작 규칙 · 나중에 붙여 넣기"
        >
          <span className="clinic-door-number" aria-hidden="true">
            3
          </span>
          <span className="clinic-door-body">
            <h2>영상제작 규칙</h2>
            <p>보관소 칸이에요. 안은 비워 두었어요.</p>
            <p className="clinic-door-note">나중에 붙여 넣기</p>
          </span>
        </div>

        <Link href="/admin/logos" className="clinic-door" role="listitem">
          <span className="clinic-door-number" aria-hidden="true">
            4
          </span>
          <span className="clinic-door-body">
            <h2>로고 관리</h2>
            <p>공식 로고에 일련번호를 붙여 모아 둬요.</p>
            <p className="clinic-door-note">상표·이름 관련은 나중에</p>
          </span>
        </Link>

        <Link href="/admin/source" className="clinic-door" role="listitem">
          <span className="clinic-door-number" aria-hidden="true">
            5
          </span>
          <span className="clinic-door-body">
            <h2>소스 보관실</h2>
            <p>쿠키 영상에 쓸 사진·동영상을 모아 둬요.</p>
            <p className="clinic-door-note">제작 전 자료</p>
          </span>
        </Link>

        <Link href="/admin/cookie" className="clinic-door" role="listitem">
          <span className="clinic-door-number" aria-hidden="true">
            6
          </span>
          <span className="clinic-door-body">
            <h2>쿠키완료실</h2>
            <p>쓴 소스를 옮겨 두고, 영상 제목을 붙여 보관해요.</p>
            <p className="clinic-door-note">재사용 방지</p>
          </span>
        </Link>

        <Link href="/admin/unreleased" className="clinic-door" role="listitem">
          <span className="clinic-door-number" aria-hidden="true">
            7
          </span>
          <span className="clinic-door-body">
            <h2>미공개 영상실</h2>
            <p>만들기는 끝났지만 아직 유튜브에 안 올린 영상을 모아 둬요.</p>
            <p className="clinic-door-note">유튜브 올리기 전</p>
          </span>
        </Link>

        <Link href="/admin/public" className="clinic-door" role="listitem">
          <span className="clinic-door-number" aria-hidden="true">
            8
          </span>
          <span className="clinic-door-body">
            <h2>공개 영상실</h2>
            <p>유튜브에 공개한 뒤의 원본과 제목을 모아 둬요.</p>
            <p className="clinic-door-note">공개한 원본</p>
          </span>
        </Link>

        <Link href="/admin/mailbox" className="clinic-door" role="listitem">
          <span className="clinic-door-number" aria-hidden="true">
            우
          </span>
          <span className="clinic-door-body">
            <h2>손님 의견</h2>
            <p>거실 우편함으로 온 의견을 읽어요.</p>
            <p className="clinic-door-note">의견 보내기</p>
          </span>
        </Link>
      </div>

      <Link className="btn btn-soft btn-wide" href="/">
        거실로 돌아가기
      </Link>
    </div>
  );
}
