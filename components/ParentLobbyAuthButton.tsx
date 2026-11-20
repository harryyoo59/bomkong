"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createParentAuthBrowserClient } from "@/lib/parent-auth-browser";

/**
 * 로비 맨 왼쪽 아래 — 부모 로그인 / 로그아웃.
 * 아이 전용 계정은 없음.
 */
export function ParentLobbyAuthButton() {
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createParentAuthBrowserClient();
    let cancelled = false;

    void supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setEmail(data.session?.user?.email ?? data.session?.user?.phone ?? null);
      setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? session?.user?.phone ?? null);
      setReady(true);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function onLogout() {
    if (busy) return;
    setBusy(true);
    try {
      const supabase = createParentAuthBrowserClient();
      await supabase.auth.signOut();
      setEmail(null);
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <span className="btn btn-soft living-ctrl living-login is-disabled" aria-hidden>
        …
      </span>
    );
  }

  if (email) {
    return (
      <button
        type="button"
        className="btn btn-soft living-ctrl living-login"
        onClick={() => void onLogout()}
        disabled={busy}
        title={email}
      >
        {busy ? "나가는 중…" : "부모 나가기"}
      </button>
    );
  }

  return (
    <Link
      href="/parent-login?next=/"
      className="btn btn-soft living-ctrl living-login"
    >
      로그인
    </Link>
  );
}
