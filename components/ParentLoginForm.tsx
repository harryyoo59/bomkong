"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createParentAuthBrowserClient } from "@/lib/parent-auth-browser";
import { parentAuthCallbackUrl, safeNextPath } from "@/lib/parent-auth";

type Props = {
  nextPath?: string;
  initialError?: string | null;
};

export function ParentLoginForm({ nextPath = "/", initialError }: Props) {
  const router = useRouter();
  const next = useMemo(() => safeNextPath(nextPath), [nextPath]);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneStep, setPhoneStep] = useState<"phone" | "code">("phone");
  const [smsCode, setSmsCode] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState(
    initialError === "login"
      ? "로그인에 실패했어요. 다시 해 주세요."
      : "",
  );

  async function startOAuth(provider: "google" | "apple") {
    if (busy) return;
    setBusy(provider);
    setMessage("");
    try {
      const supabase = createParentAuthBrowserClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: parentAuthCallbackUrl(next),
          skipBrowserRedirect: false,
        },
      });
      if (error) {
        setMessage(
          error.message ||
            (provider === "google"
              ? "구글 로그인을 시작하지 못했어요."
              : "애플 로그인을 시작하지 못했어요."),
        );
        setBusy(null);
        return;
      }
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      setMessage("로그인 창을 열지 못했어요. 다시 해 주세요.");
      setBusy(null);
    } catch {
      setMessage("로그인 창을 열지 못했어요. 다시 해 주세요.");
      setBusy(null);
    }
  }

  async function sendEmailLink(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setMessage("이메일 주소를 확인해 주세요.");
      return;
    }
    setBusy("email");
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
        setBusy(null);
        return;
      }
      setMessage(
        "로그인 메일을 보냈어요. 메일함에서 링크를 눌러 들어와 주세요.",
      );
      setBusy(null);
    } catch {
      setMessage("이메일을 보내지 못했어요. 다시 해 주세요.");
      setBusy(null);
    }
  }

  async function sendPhoneCode(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const trimmed = phone.trim().replace(/\s+/g, "");
    if (trimmed.length < 8) {
      setMessage("전화번호를 확인해 주세요. (예: +61412345678)");
      return;
    }
    const normalized = trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
    setBusy("phone");
    setMessage("");
    try {
      const supabase = createParentAuthBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        phone: normalized,
        options: { shouldCreateUser: true },
      });
      if (error) {
        setMessage(
          error.message ||
            "문자 번호를 보내지 못했어요. 이메일·구글·애플로 해 보세요.",
        );
        setBusy(null);
        return;
      }
      setMessage(
        "문자로 번호를 보냈어요. 받은 번호를 아래에 적고 「확인」을 눌러 주세요.",
      );
      setBusy(null);
      setPhoneStep("code");
      setPhone(normalized);
    } catch {
      setMessage("문자 번호를 보내지 못했어요. 다시 해 주세요.");
      setBusy(null);
    }
  }

  async function confirmPhoneCode(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const token = smsCode.trim();
    if (!token) {
      setMessage("문자로 받은 번호를 적어 주세요.");
      return;
    }
    setBusy("phone-code");
    setMessage("");
    try {
      const supabase = createParentAuthBrowserClient();
      const { error } = await supabase.auth.verifyOtp({
        phone: phone.trim(),
        token,
        type: "sms",
      });
      if (error) {
        setMessage(error.message || "번호가 맞지 않아요. 다시 해 주세요.");
        setBusy(null);
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setMessage("확인하지 못했어요. 다시 해 주세요.");
      setBusy(null);
    }
  }

  return (
    <div className="parent-login panel">
      <p className="muted">
        아이용이 아니에요. <strong>부모(보호자)</strong>만 로그인해 주세요.
        구독·상품 결제도 부모 계정으로 해요.
      </p>

      <div className="parent-login-primary" aria-label="빠른 로그인">
        <button
          type="button"
          className="btn btn-primary btn-wide"
          disabled={Boolean(busy)}
          onClick={() => void startOAuth("google")}
        >
          {busy === "google" ? "구글 여는 중…" : "구글로 들어가기"}
        </button>
        <button
          type="button"
          className="btn btn-soft btn-wide"
          disabled={Boolean(busy)}
          onClick={() => void startOAuth("apple")}
        >
          {busy === "apple" ? "애플 여는 중…" : "애플로 들어가기"}
        </button>
      </div>

      <hr className="parent-login-rule" />

      <p className="tiny muted">보조: 이메일 또는 전화</p>

      <form className="admin-form" onSubmit={(e) => void sendEmailLink(e)}>
        <label>
          이메일
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            placeholder="부모 이메일"
            disabled={Boolean(busy)}
          />
        </label>
        <button
          type="submit"
          className="btn btn-soft btn-wide"
          disabled={Boolean(busy)}
        >
          {busy === "email" ? "보내는 중…" : "이메일로 로그인 링크 받기"}
        </button>
      </form>

      {phoneStep === "phone" ? (
        <form className="admin-form" onSubmit={(e) => void sendPhoneCode(e)}>
          <label>
            전화 (나라번호 포함)
            <input
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(ev) => setPhone(ev.target.value)}
              placeholder="+61412345678"
              disabled={Boolean(busy)}
            />
          </label>
          <button
            type="submit"
            className="btn btn-soft btn-wide"
            disabled={Boolean(busy)}
          >
            {busy === "phone" ? "보내는 중…" : "문자로 번호 받기"}
          </button>
        </form>
      ) : (
        <form className="admin-form" onSubmit={(e) => void confirmPhoneCode(e)}>
          <label>
            문자로 받은 번호
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={smsCode}
              onChange={(ev) => setSmsCode(ev.target.value)}
              disabled={Boolean(busy)}
            />
          </label>
          <button
            type="submit"
            className="btn btn-primary btn-wide"
            disabled={Boolean(busy)}
          >
            {busy === "phone-code" ? "확인 중…" : "확인"}
          </button>
          <button
            type="button"
            className="btn btn-soft btn-wide"
            disabled={Boolean(busy)}
            onClick={() => {
              setPhoneStep("phone");
              setSmsCode("");
            }}
          >
            전화 다시 적기
          </button>
        </form>
      )}

      {message ? (
        <p className="form-msg" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
