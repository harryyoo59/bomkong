"use client";

import Link from "next/link";

/** 비밀글 대신 거실 문 다섯 번으로 들어가요. */
export function AdminLoginForm() {
  return (
    <div className="admin-login-form">
      <p className="muted">
        거실에서 「관리자실」 문을 <strong>다섯 번</strong> 빠르게 누르면
        들어가요. 비밀글은 쓰지 않아요.
      </p>
      <Link className="btn btn-primary btn-wide" href="/">
        거실로 가서 문 누르기
      </Link>
    </div>
  );
}
