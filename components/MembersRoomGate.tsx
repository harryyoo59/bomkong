"use client";

import { useState } from "react";

type Props = {
  enterAction: (formData: FormData) => Promise<{ ok: false; message: string } | void>;
};

export function MembersRoomGate({ enterAction }: Props) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      const result = await enterAction(formData);
      if (result && result.ok === false) {
        setMessage(result.message);
      }
    } catch {
      setMessage("잠시 후 다시 해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel" aria-label="회원현황 입장">
      <p className="eyebrow">관리자실 · 7번 칸</p>
      <h1 className="section-title">회원현황</h1>
      <p className="muted">
        회원 정보·관리·통계를 보는 방이에요. 들어가려면 비밀글을 적어 주세요.
      </p>
      <form className="admin-form" onSubmit={(e) => void onSubmit(e)}>
        <label>
          입장 비밀글
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            placeholder="비밀글을 적어 주세요"
            disabled={busy}
            required
          />
        </label>
        <button
          type="submit"
          className="btn btn-primary btn-wide"
          disabled={busy}
        >
          {busy ? "확인 중…" : "들어가기"}
        </button>
      </form>
      {message ? <p className="form-msg">{message}</p> : null}
    </section>
  );
}
