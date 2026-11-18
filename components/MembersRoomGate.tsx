"use client";

import { useState } from "react";

type Props = {
  enterAction: (formData: FormData) => Promise<{ ok: false; message: string } | void>;
  setupNeeded?: boolean;
};

export function MembersRoomGate({ enterAction, setupNeeded }: Props) {
  const [message, setMessage] = useState(
    setupNeeded
      ? "입장 비밀글을 아직 정해 두지 않았어요. 사장님께 먼저 정해 달라고 해 주세요."
      : "",
  );
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (setupNeeded || busy) return;
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
            disabled={setupNeeded || busy}
            required={!setupNeeded}
          />
        </label>
        <button
          type="submit"
          className="btn btn-primary btn-wide"
          disabled={setupNeeded || busy}
        >
          {busy ? "확인 중…" : "들어가기"}
        </button>
      </form>
      {message ? <p className="form-msg">{message}</p> : null}
    </section>
  );
}
