import Link from "next/link";
import { logoutAdmin } from "@/app/admin/actions";
import { requireAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const FURNITURE = [
  {
    href: "/rules",
    title: "책장 · 규칙",
    blurb: "영상규칙 보관소를 읽어요.",
  },
  {
    href: "/characters/bomi",
    title: "책상 옆 · 봄이",
    blurb: "봄이 공식 소개·기준 시트.",
  },
  {
    href: "/characters/kongi",
    title: "책상 옆 · 콩이",
    blurb: "콩이 공식 소개·기준 시트.",
  },
  {
    href: "/logos",
    title: "로고 금고",
    blurb: "공식 로고만 모아 둔 방.",
  },
  {
    href: "/admin/upload",
    title: "책상 · 올리기",
    blurb: "편 올리기·파일 자리를 관리해요.",
  },
] as const;

export default async function AdminStudyPage() {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    redirect(
      gate.reason === "missing_secret"
        ? "/admin/login?need=setup"
        : "/admin/login",
    );
  }

  return (
    <div className="study-room">
      <header className="study-header">
        <div>
          <p className="eyebrow">관리자실 · 공부방</p>
          <h1 className="section-title">가구를 눌러 메뉴를 열어요</h1>
          <p className="muted">
            손님용 TV 메뉴와 섞이지 않아요. 규칙·캐릭터·로고·올리기만 여기에
            있어요.
          </p>
        </div>
        <form action={logoutAdmin}>
          <button type="submit" className="btn btn-soft">
            나가기
          </button>
        </form>
      </header>

      <div className="study-grid">
        {FURNITURE.map((item) => (
          <Link key={item.href} href={item.href} className="study-card">
            <h2>{item.title}</h2>
            <p>{item.blurb}</p>
          </Link>
        ))}
      </div>

      <Link className="btn btn-soft btn-wide" href="/">
        거실로 돌아가기
      </Link>
    </div>
  );
}
