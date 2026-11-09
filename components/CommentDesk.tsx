"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { COMMENT_LIMITS } from "@/lib/comment-limits";

type PublicComment = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}.${dd} ${hh}:${mi}`;
}

export function CommentDesk() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const loadComments = async () => {
    try {
      const res = await fetch("/api/comments", { cache: "no-store" });
      const data = (await res.json()) as {
        ok?: boolean;
        comments?: PublicComment[];
      };
      if (res.ok && data.ok && Array.isArray(data.comments)) {
        setComments(data.comments);
      }
    } catch {
      /* keep previous list */
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    void loadComments();
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          message,
          website: honeypot,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        comment?: PublicComment;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "지금은 보낼 수 없어요.");
        return;
      }
      setDone(true);
      setName("");
      setMessage("");
      setHoneypot("");
      if (data.comment) {
        setComments((prev) => [data.comment!, ...prev].slice(0, 50));
      } else {
        void loadComments();
      }
    } catch {
      setError("연결이 끊겼어요. 잠시 뒤 다시 해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="panel stub-card">
        <p className="eyebrow">댓글쓰기 책상</p>
        <h1 className="section-title">봄이콩이에게 한마디</h1>
        <p>
          영상 보고 느낀 말, 응원, 궁금한 점을 남겨 주세요. 친구들이 함께 볼 수
          있어요.
        </p>
      </section>

      <section className="panel">
        <h2 className="section-title">새 댓글 쓰기</h2>
        {done ? (
          <p className="comment-done" role="status">
            잘 받았어요. 고마워요!
          </p>
        ) : null}
        <form className="comment-form" onSubmit={onSubmit}>
          <label className="form-row">
            <span>이름 (선택)</span>
            <input
              type="text"
              name="name"
              autoComplete="nickname"
              maxLength={COMMENT_LIMITS.maxName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="비우면 「친구」로 보여요"
            />
          </label>
          <label className="form-row">
            <span>하고 싶은 말</span>
            <textarea
              name="message"
              required
              rows={4}
              maxLength={COMMENT_LIMITS.maxMessage}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (done) setDone(false);
              }}
              placeholder="예: 봄이 콩이 재미있어요!"
            />
          </label>
          <label className="mailbox-honeypot" aria-hidden="true">
            <span>회사 사이트</span>
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </label>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            className="btn btn-primary btn-wide"
            disabled={busy || message.trim().length < 2}
          >
            {busy ? "보내는 중…" : "댓글 남기기"}
          </button>
        </form>
      </section>

      <section className="panel">
        <h2 className="section-title">최근 댓글</h2>
        {loadingList ? (
          <p className="muted">불러오는 중…</p>
        ) : comments.length === 0 ? (
          <p className="muted">아직 댓글이 없어요. 첫 마디를 남겨 볼까요?</p>
        ) : (
          <ul className="comment-list" aria-label="최근 댓글 목록">
            {comments.map((item) => (
              <li key={item.id} className="comment-card">
                <div className="comment-card-head">
                  <strong>{item.name}</strong>
                  <time dateTime={item.createdAt}>
                    {formatWhen(item.createdAt)}
                  </time>
                </div>
                <p className="comment-card-body">{item.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="tiny muted center-text">
        <Link href="/">거실로 돌아가기</Link>
      </p>
    </>
  );
}
