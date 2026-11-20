"use client";

import { useMemo, useState } from "react";
import { createParentAuthBrowserClient } from "@/lib/parent-auth-browser";
import { parentAuthCallbackUrl, safeNextPath } from "@/lib/parent-auth";

type Props = {
  nextPath?: string;
  initialError?: string | null;
};

/**
 * 당장 오픈용: 이메일 로그인만.
 * 구글·애플·전화는 나중에 켤 예정.
 */
export function ParentLoginForm({ nextPath = "/", initialError }: Props) {
  const next = useMemo(() => safeNextPath(nextPath), [nextPath]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    initialError === "login"
      ? "로그인에 실패했어요. 다시 해 주세요."
      : "",
  );

  async function sendEmailLink(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setMessage("이메일 주소를 확인해 주세요.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const supabase = createParentAuthBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: parentAuthCallbackUrl(next),
          shouldCreateUser: true,
        },
      });
      if (error) {
        setMessage(error.message || "이메일을 보내지 못했어요.");
        setBusy(false);
        return;
      }
      setMessage(
        "로그인 메일을 보냈어요. 메일함(스팸함도)에서 링크를 눌러 들어와 주세요.",
      );
      setBusy(false);
    } catch {
      setMessage("이메일을 보내지 못했어요. 다시 해 주세요.");
      setBusy(false);
    }
  }

  return (
    <div className="parent-login panel">
      <p className="muted">
        아이용이 아니에요. <strong>부모(보호자)</strong>만 로그인해 주세요.
        구독·상품 결제도 부모 계정으로 해요.
      </p>

      <p className="tiny muted">
        지금은 <strong>이메일 로그인</strong>만 열려 있어요. 구글·애플은 곧
        이어서 켤게요.
      </p>

      <form className="admin-form" onSubmit={(e) => void sendEmailLink(e)}>
        <label>
          이메일
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            placeholder="부모 이메일"
            disabled={busy}
          />
        </label>
        <button
          type="submit"
          className="btn btn-primary btn-wide"
          disabled={busy}
        >
          {busy ? "보내는 중…" : "이메일로 로그인 링크 받기"}
        </button>
      </form>

      {message ? (
        <p className="form-msg" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
