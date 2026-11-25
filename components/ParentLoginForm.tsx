"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createParentAuthBrowserClient } from "@/lib/parent-auth-browser";
import { safeNextPath } from "@/lib/parent-auth";

type Props = {
  nextPath?: string;
  initialError?: string | null;
};

type Mode = "login" | "signup";

/**
 * 소설가와 같이: 이메일+비밀번호로 같은 화면에서 바로 가입/로그인.
 * 구글·애플은 당분간 안 켬.
 */
export function ParentLoginForm({ nextPath = "/", initialError }: Props) {
  const router = useRouter();
  const next = useMemo(() => safeNextPath(nextPath), [nextPath]);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    initialError === "login"
      ? "로그인에 실패했어요. 다시 해 주세요."
      : "",
  );

  function friendlyAuthError(raw: string): string {
    const text = (raw || "").toLowerCase();
    if (text.includes("invalid login credentials")) {
      return "이메일 또는 비밀번호가 맞지 않아요.";
    }
    if (text.includes("user already registered")) {
      return "이미 가입된 이메일이에요. 「접속하기」로 들어와 주세요.";
    }
    if (text.includes("password") && text.includes("least")) {
      return "비밀번호는 6자 이상으로 해 주세요.";
    }
    if (text.includes("email") && text.includes("invalid")) {
      return "이메일 주소를 확인해 주세요.";
    }
    if (text.includes("email not confirmed")) {
      return "메일 확인이 아직 켜져 있어요. 사장님께 말씀해 주시면 바로 풀어 드릴게요.";
    }
    return raw || "처리하지 못했어요. 다시 해 주세요.";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail.includes("@")) {
      setMessage("이메일 주소를 확인해 주세요.");
      return;
    }
    if (password.length < 6) {
      setMessage("비밀번호는 6자 이상으로 해 주세요.");
      return;
    }
    if (mode === "signup" && password !== passwordConfirm) {
      setMessage("비밀번호 확인이 서로 달라요.");
      return;
    }

    setBusy(true);
    setMessage("");
    const supabase = createParentAuthBrowserClient();

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (error) {
          setMessage(friendlyAuthError(error.message));
          setBusy(false);
          return;
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });
        if (error) {
          setMessage(friendlyAuthError(error.message));
          setBusy(false);
          return;
        }
        if (!data.session) {
          // 메일 확인이 켜져 있으면 세션이 없음 → 바로 로그인 시도로 한 번 더
          const again = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          });
          if (again.error || !again.data.session) {
            setMessage(
              "가입은 됐는데 바로 들어오지 못했어요. 「접속하기」로 다시 눌러 보거나, 사장님께 말씀해 주세요.",
            );
            setBusy(false);
            return;
          }
        }
      }

      setMessage("로그인됐어요. 거실로 이동해요.");
      router.replace(next);
      router.refresh();
    } catch {
      setMessage("처리하지 못했어요. 다시 해 주세요.");
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
        이메일과 비밀번호로 바로 들어와요. 구글·애플은 당분간 나중에 켤게요.
      </p>

      <div className="vault-nav-row" style={{ marginBottom: "0.75rem" }}>
        <button
          type="button"
          className={`btn btn-soft${mode === "login" ? " is-active" : ""}`}
          onClick={() => {
            setMode("login");
            setMessage("");
          }}
          disabled={busy}
        >
          접속하기
        </button>
        <button
          type="button"
          className={`btn btn-soft${mode === "signup" ? " is-active" : ""}`}
          onClick={() => {
            setMode("signup");
            setMessage("");
          }}
          disabled={busy}
        >
          가입하기
        </button>
      </div>

      <form className="admin-form" onSubmit={(e) => void onSubmit(e)}>
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
        <label>
          비밀번호
          <input
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            placeholder="6자 이상"
            disabled={busy}
          />
        </label>
        {mode === "signup" ? (
          <label>
            비밀번호 확인
            <input
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(ev) => setPasswordConfirm(ev.target.value)}
              placeholder="한 번 더"
              disabled={busy}
            />
          </label>
        ) : null}
        <button
          type="submit"
          className="btn btn-primary btn-wide"
          disabled={busy}
        >
          {busy ? "처리 중…" : mode === "signup" ? "가입하기" : "접속하기"}
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
