"use client";

import { useEffect, useState } from "react";
import {
  loadMembersNotesAction,
  publishMembersNotesAction,
} from "@/app/admin/members/notes-actions";
import {
  clearMembersNotesLocal,
  readMembersNotesLocal,
  writeMembersNotesLocal,
} from "@/lib/members-room-store";

type Props = {
  signupCountsLine?: string;
  activeCountsLine?: string;
  subscriberWatchAvgLine?: string;
};

export function MembersRoomHome({
  signupCountsLine,
  activeCountsLine,
  subscriberWatchAvgLine,
}: Props) {
  const [text, setText] = useState("");
  const [draft, setDraft] = useState("");
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [sharedOk, setSharedOk] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const local = readMembersNotesLocal();
      if (!cancelled) {
        setText(local);
        setDraft(local);
        setReady(true);
      }

      const remote = await loadMembersNotesAction();
      if (cancelled) return;

      if (!remote.ok) {
        setSharedOk(false);
        setMessage(
          "이 기기 메모는 그대로예요. 인터넷 메모는 아직 확인하지 못했어요.",
        );
        return;
      }

      if (remote.store.notesBody.trim()) {
        writeMembersNotesLocal(remote.store.notesBody);
        setText(remote.store.notesBody);
        setDraft(remote.store.notesBody);
        setSharedOk(true);
        setMessage(
          "다른 기기와 같은 메모예요. 저장하면 자동으로 맞춰져요.",
        );
        return;
      }

      if (local.trim()) {
        setBusy(true);
        setMessage("이 기기 메모를 다른 기기에도 맞게 올리는 중이에요…");
        const published = await publishMembersNotesAction(local);
        if (cancelled) return;
        setBusy(false);
        if (published.ok) {
          setSharedOk(true);
          setMessage(
            "이 기기 메모를 인터넷에 맞춰 두었어요. 앞으로 저장하면 자동으로 같아져요.",
          );
        } else {
          setSharedOk(false);
          setMessage(published.message);
        }
        return;
      }

      setSharedOk(true);
      setMessage(
        "아직 메모가 없어요. 적어 두고 저장하면 다른 기기에도 자동으로 맞춰져요.",
      );
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSave() {
    writeMembersNotesLocal(draft);
    setText(draft);
    setBusy(true);
    const published = await publishMembersNotesAction(draft);
    setBusy(false);
    setEditing(false);
    if (published.ok) {
      setSharedOk(true);
      setMessage("저장했고, 다른 기기에도 자동으로 맞춰 두었어요.");
    } else {
      setSharedOk(false);
      setMessage(
        `이 기기에는 저장했어요. ${published.message}`,
      );
    }
  }

  function onCancel() {
    setDraft(text);
    setEditing(false);
  }

  async function onClear() {
    if (
      typeof window !== "undefined" &&
      !window.confirm("회원현황 메모를 비울까요?")
    ) {
      return;
    }
    clearMembersNotesLocal();
    setText("");
    setDraft("");
    setBusy(true);
    const published = await publishMembersNotesAction("");
    setBusy(false);
    setEditing(false);
    setMessage(
      published.ok
        ? "메모를 비웠고, 다른 기기에도 맞춰 두었어요."
        : `이 기기는 비웠어요. ${published.message}`,
    );
  }

  return (
    <section className="panel" aria-label="회원현황">
      {signupCountsLine ? (
        <p className="tiny muted" aria-label="가입 인원">
          {signupCountsLine}
        </p>
      ) : null}
      {activeCountsLine ? (
        <p className="tiny muted" aria-label="활동 인원">
          {activeCountsLine}
        </p>
      ) : null}
      {subscriberWatchAvgLine ? (
        <p className="tiny muted" aria-label="정기 구독 평균 시청">
          {subscriberWatchAvgLine}
        </p>
      ) : null}
      <p className="muted">
        여기는 회원 정보·관리·통계를 모아 볼 방이에요. 지금은 먼저{" "}
        <strong>관리 메모</strong>를 적어 두고, 다른 기기에서도 같게 볼 수
        있어요.
      </p>

      <div className="watch-share-box" aria-label="다른 기기에 맞추기">
        <p className="tiny muted">
          {sharedOk
            ? "저장하면 자동으로 다른 기기에도 맞춰져요."
            : "저장하면 다른 기기에도 맞춰져요."}
        </p>
        {message ? (
          <p className="form-msg" role="status">
            {message}
          </p>
        ) : null}
      </div>

      <div className="video-rules-toolbar">
        <div className="video-rules-toolbar-actions">
          {editing ? (
            <>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void onSave()}
                disabled={!ready || busy}
              >
                저장
              </button>
              <button
                type="button"
                className="btn btn-soft"
                onClick={onCancel}
                disabled={!ready || busy}
              >
                취소
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-soft"
              onClick={() => setEditing(true)}
              disabled={!ready}
            >
              메모 고치기
            </button>
          )}
          <button
            type="button"
            className="btn btn-soft"
            onClick={() => void onClear()}
            disabled={!ready || busy}
          >
            비우기
          </button>
        </div>
      </div>

      {editing ? (
        <textarea
          className="video-rules-editor"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={16}
          spellCheck={false}
          aria-label="회원현황 관리 메모"
          placeholder="회원 관련 메모·통계·할 일을 적어 두세요."
        />
      ) : text.trim() ? (
        <article className="video-rules-document" tabIndex={0}>
          {text.split("\n").map((line, index) => (
            <p key={`m-${index}`} className="video-rules-paragraph">
              {line || "\u00a0"}
            </p>
          ))}
        </article>
      ) : (
        <p className="tiny muted">지금은 메모가 비어 있어요.</p>
      )}
    </section>
  );
}
