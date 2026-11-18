"use client";

import { useEffect, useMemo, useState } from "react";
import {
  loadVideoRulesAction,
  publishVideoRulesAction,
} from "@/app/admin/rules/actions";
import {
  DEFAULT_VIDEO_RULES_AI_DOCUMENT,
  DEFAULT_VIDEO_RULES_DOCUMENT,
  clearVideoRulesAiDocument,
  clearVideoRulesDocumentOverride,
  parseVideoRulesDocument,
  readVideoRulesAiDocument,
  readVideoRulesDocument,
  writeVideoRulesAiDocument,
  writeVideoRulesDocument,
  type VideoRulesAudience,
  type VideoRulesBlock,
} from "@/lib/video-rules";

function RulesDocumentView({
  blocks,
}: {
  blocks: VideoRulesBlock[];
}) {
  if (blocks.length === 0) {
    return null;
  }

  return (
    <article className="video-rules-document" tabIndex={0}>
      {blocks.map((block, index) => {
        if (block.type === "title") {
          return (
            <h2 key={`t-${index}`} className="video-rules-title">
              {block.text}
            </h2>
          );
        }
        if (block.type === "heading") {
          return (
            <h3 key={`h-${index}`} className="video-rules-heading">
              {block.text}
            </h3>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={`l-${index}`} className="video-rules-list">
              {block.items.map((item, itemIndex) => (
                <li key={`li-${index}-${itemIndex}`}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={`p-${index}`} className="video-rules-paragraph">
            {block.text}
          </p>
        );
      })}
    </article>
  );
}

function remoteHasSharedContent(adminBody: string, aiBody: string): boolean {
  return Boolean(adminBody.trim() || aiBody.trim());
}

export function VideoRulesRoom() {
  const [audience, setAudience] = useState<VideoRulesAudience>("admin");
  const [adminText, setAdminText] = useState(DEFAULT_VIDEO_RULES_DOCUMENT);
  const [adminDraft, setAdminDraft] = useState(DEFAULT_VIDEO_RULES_DOCUMENT);
  const [aiText, setAiText] = useState(DEFAULT_VIDEO_RULES_AI_DOCUMENT);
  const [aiDraft, setAiDraft] = useState(DEFAULT_VIDEO_RULES_AI_DOCUMENT);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const [copyBusy, setCopyBusy] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [syncBusy, setSyncBusy] = useState(false);
  const [sharedOk, setSharedOk] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const localAdmin = readVideoRulesDocument();
      const localAi = readVideoRulesAiDocument();
      if (!cancelled) {
        setAdminText(localAdmin);
        setAdminDraft(localAdmin);
        setAiText(localAi);
        setAiDraft(localAi);
        setReady(true);
      }

      const remote = await loadVideoRulesAction();
      if (cancelled) return;

      if (!remote.ok) {
        setSharedOk(false);
        setSyncMessage(
          "이 기기 규칙은 그대로예요. 인터넷 규칙은 아직 확인하지 못했어요.",
        );
        return;
      }

      const { store } = remote;
      if (remoteHasSharedContent(store.adminBody, store.aiBody)) {
        const nextAdmin = store.adminBody.trim()
          ? store.adminBody
          : DEFAULT_VIDEO_RULES_DOCUMENT;
        const nextAi = store.aiBody;
        writeVideoRulesDocument(nextAdmin);
        writeVideoRulesAiDocument(nextAi);
        setAdminText(nextAdmin);
        setAdminDraft(nextAdmin);
        setAiText(nextAi);
        setAiDraft(nextAi);
        setSharedOk(true);
        setSyncMessage(
          "다른 기기와 같은 규칙이에요. 고쳐서 저장하면 자동으로 맞춰져요.",
        );
        return;
      }

      // 인터넷이 비어 있으면 이 기기 글을 지우지 않고, 한 번 자동으로 올림
      setSharedOk(false);
      setSyncBusy(true);
      setSyncMessage("이 기기 규칙을 다른 기기에도 맞게 올리는 중이에요…");
      const published = await publishVideoRulesAction({
        adminBody: localAdmin,
        aiBody: localAi,
      });
      if (cancelled) return;
      setSyncBusy(false);
      if (published.ok) {
        setSharedOk(true);
        setSyncMessage(
          "이 기기 규칙을 인터넷에 맞춰 두었어요. 앞으로 저장하면 자동으로 같아져요.",
        );
      } else {
        setSharedOk(false);
        setSyncMessage(
          published.message ||
            "자동 올리기에 실패했어요. 아래에서 다시 맞춰 주세요.",
        );
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setEditing(false);
    setCopyMessage("");
  }, [audience]);

  const isAdmin = audience === "admin";
  const text = isAdmin ? adminText : aiText;
  const draft = isAdmin ? adminDraft : aiDraft;
  const setDraft = isAdmin ? setAdminDraft : setAiDraft;
  const blocks = useMemo(() => parseVideoRulesDocument(text), [text]);

  async function publishBoth(nextAdmin: string, nextAi: string) {
    setSyncBusy(true);
    const result = await publishVideoRulesAction({
      adminBody: nextAdmin,
      aiBody: nextAi,
    });
    setSyncBusy(false);
    if (result.ok) {
      setSharedOk(true);
      return { ok: true as const };
    }
    setSharedOk(false);
    return {
      ok: false as const,
      message: result.message || "인터넷에 맞추지 못했어요.",
    };
  }

  async function onSave() {
    if (isAdmin) {
      writeVideoRulesDocument(draft);
      setAdminText(draft);
      const published = await publishBoth(draft, aiText);
      setEditing(false);
      if (published.ok) {
        setSyncMessage("저장했고, 다른 기기에도 자동으로 맞춰 두었어요.");
      } else {
        setSyncMessage(
          `이 기기에는 저장했어요. ${published.message} 「다시 맞추기」를 눌러 주세요.`,
        );
      }
      return;
    }

    writeVideoRulesAiDocument(draft);
    setAiText(draft);
    const published = await publishBoth(adminText, draft);
    setEditing(false);
    if (published.ok) {
      setSyncMessage("저장했고, 다른 기기에도 자동으로 맞춰 두었어요.");
    } else {
      setSyncMessage(
        `이 기기에는 저장했어요. ${published.message} 「다시 맞추기」를 눌러 주세요.`,
      );
    }
  }

  function onCancel() {
    setDraft(text);
    setEditing(false);
  }

  async function onReset() {
    if (isAdmin) {
      if (
        typeof window !== "undefined" &&
        !window.confirm("관리자용 규칙을 처음 확정본으로 되돌릴까요?")
      ) {
        return;
      }
      clearVideoRulesDocumentOverride();
      setAdminText(DEFAULT_VIDEO_RULES_DOCUMENT);
      setAdminDraft(DEFAULT_VIDEO_RULES_DOCUMENT);
      const published = await publishBoth(
        DEFAULT_VIDEO_RULES_DOCUMENT,
        aiText,
      );
      setEditing(false);
      setSyncMessage(
        published.ok
          ? "처음 확정본으로 되돌렸고, 다른 기기에도 맞춰 두었어요."
          : `이 기기는 되돌렸어요. ${published.message}`,
      );
      return;
    }

    if (
      typeof window !== "undefined" &&
      !window.confirm("AI용 규칙을 비울까요?")
    ) {
      return;
    }
    clearVideoRulesAiDocument();
    setAiText(DEFAULT_VIDEO_RULES_AI_DOCUMENT);
    setAiDraft(DEFAULT_VIDEO_RULES_AI_DOCUMENT);
    const published = await publishBoth(
      adminText,
      DEFAULT_VIDEO_RULES_AI_DOCUMENT,
    );
    setEditing(false);
    setSyncMessage(
      published.ok
        ? "AI용을 비웠고, 다른 기기에도 맞춰 두었어요."
        : `이 기기는 비웠어요. ${published.message}`,
    );
  }

  async function onShareAgain() {
    if (syncBusy) return;
    const published = await publishBoth(adminText, aiText);
    if (published.ok) {
      setSyncMessage(
        "확인했어요. 다른 기기에서도 같은 규칙을 봐요. 새로고침 해 보세요.",
      );
      if (typeof window !== "undefined") {
        window.alert(
          "확인했어요. 다른 기기에서도 같은 규칙을 봐요. 새로고침 해 보세요.",
        );
      }
    } else {
      setSyncMessage(published.message);
      if (typeof window !== "undefined") {
        window.alert(published.message);
      }
    }
  }

  async function onCopyAi() {
    if (copyBusy) return;
    const raw = aiText.trim();
    if (!raw) {
      setCopyMessage("아직 AI용 글이 없어요. 먼저 「글 고치기」로 붙여 넣어요.");
      return;
    }
    setCopyBusy(true);
    try {
      if (
        typeof navigator === "undefined" ||
        !navigator.clipboard?.writeText
      ) {
        throw new Error(
          "이 기기에서는 복사를 못 해요. 다른 브라우저로 해 보세요.",
        );
      }
      await navigator.clipboard.writeText(raw);
      setCopyMessage("AI용 규칙을 복사했어요. AI 채팅에 붙여 넣으면 돼요.");
    } catch (err) {
      setCopyMessage(
        err instanceof Error
          ? err.message
          : "복사하지 못했어요. 다시 해 주세요.",
      );
    } finally {
      setCopyBusy(false);
    }
  }

  return (
    <section className="panel video-rules-panel" aria-label="영상제작 규칙">
      <div className="watch-share-box" aria-label="다른 기기에 맞추기">
        <p className="tiny muted">
          {sharedOk
            ? "새 저장은 자동으로 다른 기기에도 맞춰져요."
            : "규칙을 고쳐서 저장하면 자동으로 다른 기기에도 맞춰져요. 안 맞으면 「다시 맞추기」를 눌러 주세요."}
        </p>
        <button
          type="button"
          className="btn btn-soft btn-wide"
          disabled={!ready || syncBusy}
          onClick={() => void onShareAgain()}
        >
          {syncBusy ? "맞추는 중…" : "다른 기기와 다시 맞추기"}
        </button>
        {syncMessage ? (
          <p className="form-msg" role="status">
            {syncMessage}
          </p>
        ) : null}
      </div>

      <div className="video-rules-audience" aria-label="규칙 종류 고르기">
        <button
          type="button"
          className={`btn ${isAdmin ? "btn-primary" : "btn-soft"}`}
          onClick={() => setAudience("admin")}
        >
          관리자용
        </button>
        <button
          type="button"
          className={`btn ${!isAdmin ? "btn-primary" : "btn-soft"}`}
          onClick={() => setAudience("ai")}
        >
          AI용
        </button>
      </div>

      <div className="video-rules-toolbar">
        <div className="video-rules-toolbar-actions">
          {editing ? (
            <>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void onSave()}
                disabled={!ready || syncBusy}
              >
                저장
              </button>
              <button
                type="button"
                className="btn btn-soft"
                onClick={onCancel}
                disabled={!ready || syncBusy}
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
              글 고치기
            </button>
          )}
          {!isAdmin ? (
            <button
              type="button"
              className="btn btn-soft"
              onClick={() => void onCopyAi()}
              disabled={!ready || copyBusy}
            >
              {copyBusy ? "복사 중…" : "복사하기"}
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-soft"
            onClick={() => void onReset()}
            disabled={!ready || syncBusy}
          >
            {isAdmin ? "처음 확정본으로" : "비우기"}
          </button>
        </div>
      </div>

      {copyMessage && !isAdmin ? (
        <p className="form-msg">{copyMessage}</p>
      ) : null}

      {editing ? (
        <textarea
          className="video-rules-editor"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={isAdmin ? 28 : 16}
          spellCheck={false}
          aria-label={isAdmin ? "관리자용 규칙 고치기" : "AI용 규칙 고치기"}
        />
      ) : (
        <RulesDocumentView blocks={blocks} />
      )}
    </section>
  );
}
