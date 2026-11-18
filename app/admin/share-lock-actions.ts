"use server";

import { requireAdminSession } from "@/lib/admin-auth";
import { verifyMembersRoomPassword } from "@/lib/members-room-auth";

/**
 * 「다른 기기와 맞추기」 버튼용 2차 잠금.
 * 7번 회원현황과 같은 비밀글(열매는 니들이 따먹어라)을 씀.
 */
export async function verifyShareBossLockAction(
  password: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    return {
      ok: false,
      message:
        "관리자 문이 풀렸어요. 거실 문을 다섯 번 눌러 다시 들어간 뒤 해 주세요.",
    };
  }

  const typed = typeof password === "string" ? password : "";
  if (!verifyMembersRoomPassword(typed)) {
    return {
      ok: false,
      message: "비밀글이 틀렸어요. 사장님만 맞추기를 쓸 수 있어요.",
    };
  }

  return { ok: true };
}
