import Link from "next/link";
import { logoutAdmin } from "@/app/admin/actions";
import { requireAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type ClinicRoom =
  | {
      kind: "link";
      href: string;
      number: string;
      title: string;
      blurb: string;
      note?: string;
    }
  | {
      kind: "empty";
      number: string;
      title: string;
      blurb: string;
      note: string;
    };

const CLINIC_ROOMS: ClinicRoom[] = [
  {
    kind: "link",
    href: "/characters/bomi",
    number: "1",
    title: "봄이",
    blurb: "봄이 소개와 기준 그림을 봐요.",
  },
  {
    kind: "link",
    href: "/characters/kongi",
    number: "2",
    title: "콩이",
    blurb: "콩이 소개와 기준 그림을 봐요.",
  },
  {
    kind: "empty",
    number: "3",
    title: "영상제작 규칙",
    blurb: "보관소 칸이에요. 안은 비워 두었어요.",
    note: "나중에 붙여 넣기",
  },
  {
    kind: "link",
    href: "/logos",
    number: "4",
    title: "로고 관리",
    blurb: "공식 로고만 모아 둔 방이에요.",
    note: "상표·이름 관련은 나중에",
  },
];

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
          <h1 className="section-title">관리자실을 네 칸으로 나눴어요</h1>
          <p className="muted">
            손님용 메뉴와 섞이지 않아요. 봄이·콩이·영상규칙·로고만 여기에
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
        {CLINIC_ROOMS.map((room) => {
          const body = (
            <>
              <span className="clinic-door-number" aria-hidden="true">
                {room.number}
              </span>
              <span className="clinic-door-body">
                <h2>{room.title}</h2>
                <p>{room.blurb}</p>
                {room.note ? (
                  <p className="clinic-door-note">{room.note}</p>
                ) : null}
              </span>
            </>
          );

          if (room.kind === "link") {
            return (
              <Link
                key={room.href}
                href={room.href}
                className="clinic-door"
                role="listitem"
              >
                {body}
              </Link>
            );
          }

          return (
            <div
              key={`empty-${room.number}`}
              className="clinic-door clinic-door-empty"
              role="listitem"
              aria-label={`${room.title} · ${room.note}`}
            >
              {body}
            </div>
          );
        })}
      </div>

      <Link className="btn btn-soft btn-wide" href="/">
        거실로 돌아가기
      </Link>
    </div>
  );
}
