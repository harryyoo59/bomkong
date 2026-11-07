"use client";

import { useActionState } from "react";
import { loginAdmin, type LoginState } from "@/app/admin/actions";

const initial: LoginState = {};

export function AdminLoginForm({ nextPath }: { nextPath: string }) {
  const [state, action, pending] = useActionState(loginAdmin, initial);

  return (
    <form action={action} className="admin-login-form">
      <input type="hidden" name="next" value={nextPath} />
      <label className="field-label" htmlFor="admin-password">
        관리자 열쇠
      </label>
      <input
        id="admin-password"
        name="password"
        type="password"
        autoComplete="current-password"
        className="field-input"
        required
        disabled={pending}
      />
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        className="btn btn-primary btn-wide"
        disabled={pending}
      >
        {pending ? "확인 중…" : "관리자실 들어가기"}
      </button>
    </form>
  );
}
