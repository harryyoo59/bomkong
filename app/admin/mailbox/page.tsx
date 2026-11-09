import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { listMailboxFeedback } from "@/lib/mailbox-feedback";

export const dynamic = "force-dynamic";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export default async function AdminMailboxPage() {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    redirect(
      gate.reason === "missing_secret"
        ? "/admin/login?need=setup"
        : "/admin/login?next=/admin/mailbox",
    );
  }

  const items = await listMailboxFeedback();

  return (
    <div className="clinic-room">
      <header className="clinic-header">
        <div>
          <p className="eyebrow">관리자실 · 손님 의견</p>
          <h1 className="section-title">의견 보내기 우편함</h1>
          <p className="muted">
            거실 빨간 우편함으로 온 글이에요. 이름은 비어 있을 수 있어요.
          </p>
        </div>
        <Link className="btn btn-soft" href="/admin">
          진료실로
        </Link>
      </header>

      {items.length === 0 ? (
        <p className="muted">아직 받은 의견이 없어요.</p>
      ) : (
        <ul className="mailbox-list" aria-label="받은 의견 목록">
          {items.map((item) => (
            <li key={item.id} className="mailbox-card">
              <div className="mailbox-card-head">
                <strong>{item.name.trim() ? item.name : "이름 없음"}</strong>
                <time dateTime={item.createdAt}>
                  {formatWhen(item.createdAt)}
                </time>
              </div>
              <p className="mailbox-card-body">{item.message}</p>
            </li>
          ))}
        </ul>
      )}

      <Link className="btn btn-soft btn-wide" href="/">
        거실로 돌아가기
      </Link>
    </div>
  );
}
