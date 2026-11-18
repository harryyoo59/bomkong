"use client";

import { verifyShareBossLockAction } from "@/app/admin/share-lock-actions";

/**
 * 「다른 기기와 맞추기」 누르기 직전 — 7번과 같은 비밀글로 사장님만 통과.
 */
export async function askShareBossLock(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  if (typeof window === "undefined") {
    return { ok: false, message: "이 기기에서는 맞추기를 쓸 수 없어요." };
  }

  const typed = window.prompt(
    "사장님만 쓸 수 있어요.\n7번 방과 같은 비밀글을 적어 주세요.",
  );
  if (typed === null) {
    return { ok: false, message: "맞추기를 취소했어요." };
  }

  return verifyShareBossLockAction(typed);
}
