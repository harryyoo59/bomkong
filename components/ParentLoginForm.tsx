"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createParentAuthBrowserClient } from "@/lib/parent-auth-browser";
import { parentAuthCallbackUrl, safeNextPath } from "@/lib/parent-auth";

type Props = {
  nextPath?: string;
  initialError?: string | null;
};

/**
 * 당장 오픈용: 이메일 로그인만.
 * 구글·애플은 당분간 안 켬.
 */
export function ParentLoginForm({ nextPath = "/", initialError }: Props) {
  const router = useRouter();
  const next = useMemo(() => safeNextPath(nextPath), [nextPath]);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [awaitingCode, setAwaitingCode] = useState(false);
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
        const raw = (error.message || "").toLowerCase();
        if (raw.includes("rate limit")) {
          setMessage(
            "지금은 메일 보내기 횟수가 잠시 꽉 찼어요. 조금 기다렸다가 다시 눌러 주세요. 아까 보낸 메일이 있으면 메일함·스팸함도 확인해 보세요.",
          );
        } else {
          setMessage(error.message || "이메일을 보내지 못했어요.");
        }
        setBusy(false);
        return;
      }
      setAwaitingCode(true);
      setMessage(
        "로그인 메일을 보냈어요. 메일함(스팸함도)에서 링크를 누르거나, 숫자 6자리가 있으면 아래에 적어 주세요. 가능하면 메일 보낸 그 폰·컴퓨터에서 링크를 눌러 주세요.",
      );
      setBusy(false);
    } catch {
      setMessage("이메일을 보내지 못했어요. 다시 해 주세요.");
      setBusy(false);
    }
  }

  async function verifyEmailCode(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const trimmedEmail = email.trim();
    const trimmedCode = code.trim().replace(/\s+/g, "");
    if (!trimmedEmail.includes("@")) {
      setMessage("이메일 주소를 확인해 주세요.");
      return;
    }
    if (trimmedCode.length < 6) {
      setMessage("메일 안 숫자 6자리를 확인해 주세요.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const supabase = createParentAuthBrowserClient();
      const { error } = await supabase.auth.verifyOtp({
        email: trimmedEmail,
        token: trimmedCode,
        type: "email",
      });
      if (error) {
        setMessage(
          error.message ||
            "숫자 확인에 실패했어요. 메일 링크를 눌러 보거나, 숫자를 다시 확인해 주세요.",
        );
        setBusy(false);
        return;
      }
      setMessage("로그인됐어요. 거실로 이동해요.");
      router.replace(next);
      router.refresh();
    } catch {
      setMessage("숫자 확인에 실패했어요. 다시 해 주세요.");
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
        지금은 <strong>이메일 로그인</strong>만 열려 있어요. 구글·애플은
        당분간 나중에 켤게요.
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
          {busy && !awaitingCode ? "보내는 중…" : "이메일로 로그인 링크 받기"}
        </button>
      </form>

      {awaitingCode ? (
        <form className="admin-form" onSubmit={(e) => void verifyEmailCode(e)}>
          <label>
            메일 안 숫자 6자리 (있으면)
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(ev) => setCode(ev.target.value)}
              placeholder="123456"
              disabled={busy}
            />
          </label>
          <button
            type="submit"
            className="btn btn-soft btn-wide"
            disabled={busy}
          >
            {busy ? "확인 중…" : "숫자로 로그인"}
          </button>
        </form>
      ) : null}

      {message ? (
        <p className="form-msg" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
