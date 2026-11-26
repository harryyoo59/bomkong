"use server";

import { requireAdminSession } from "@/lib/admin-auth";
import {
  fetchVideoRulesFromServer,
  upsertVideoRulesOnServer,
  type VideoRulesRemoteStore,
} from "@/lib/video-rules-server";

/**
 * 관리자실 3번: 영상제작 규칙을 인터넷에서 읽음.
 * 원본 영상·사진 목록은 건드리지 않음.
 */
export async function loadVideoRulesAction(): Promise<
  | { ok: true; store: VideoRulesRemoteStore }
  | { ok: false; message: string }
> {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    return {
      ok: false,
      message:
        "관리자 문이 풀렸어요. 거실 문을 다섯 번 눌러 다시 들어간 뒤 확인해 주세요.",
    };
  }
  try {
    const store = await fetchVideoRulesFromServer();
    return { ok: true, store };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "인터넷 규칙을 불러오지 못했어요.",
    };
  }
}

/**
 * 관리자실 3번: 규칙을 인터넷에 맞춰 둠 (저장·되돌리기 때 자동 호출).
 */
export async function publishVideoRulesAction(input: {
  adminBody: string;
  aiBody: string;
  checklistBody: string;
  englishBody: string;
  cookieBody: string;
}): Promise<
  | { ok: true; store: VideoRulesRemoteStore }
  | { ok: false; message: string }
> {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    return {
      ok: false,
      message:
        "관리자 문이 풀렸어요. 다시 들어간 뒤 한 번 더 저장해 주세요.",
    };
  }

  const adminBody =
    typeof input?.adminBody === "string" ? input.adminBody : "";
  const aiBody = typeof input?.aiBody === "string" ? input.aiBody : "";
  const checklistBody =
    typeof input?.checklistBody === "string" ? input.checklistBody : "";
  const englishBody =
    typeof input?.englishBody === "string" ? input.englishBody : "";
  const cookieBody =
    typeof input?.cookieBody === "string" ? input.cookieBody : "";

  try {
    const store = await upsertVideoRulesOnServer({
      adminBody,
      aiBody,
      checklistBody,
      englishBody,
      cookieBody,
    });
    return { ok: true, store };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : "규칙을 인터넷에 올리지 못했어요.",
    };
  }
}
