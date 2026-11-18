/** 7번 회원현황 — 관리 메모 (이 기기 기억 + 인터넷 맞춤) */

export const MEMBERS_NOTES_STORAGE_KEY = "bomkong_members_notes_v1";

export const DEFAULT_MEMBERS_NOTES = "";

export function readMembersNotesLocal(): string {
  if (typeof window === "undefined") return DEFAULT_MEMBERS_NOTES;
  try {
    const raw = window.localStorage.getItem(MEMBERS_NOTES_STORAGE_KEY);
    if (typeof raw === "string") return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_MEMBERS_NOTES;
}

export function writeMembersNotesLocal(text: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MEMBERS_NOTES_STORAGE_KEY, text);
}

export function clearMembersNotesLocal(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(MEMBERS_NOTES_STORAGE_KEY);
}
