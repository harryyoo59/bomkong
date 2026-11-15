"use client";

import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    const nextAdmin = readVideoRulesDocument();
    const nextAi = readVideoRulesAiDocument();
    setAdminText(nextAdmin);
    setAdminDraft(nextAdmin);
    setAiText(nextAi);
    setAiDraft(nextAi);
    setReady(true);
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

  function onSave() {
    if (isAdmin) {
      writeVideoRulesDocument(draft);
      setAdminText(draft);
    } else {
      writeVideoRulesAiDocument(draft);
      setAiText(draft);
    }
    setEditing(false);
  }

  function onCancel() {
    setDraft(text);
    setEditing(false);
  }

  function onReset() {
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
    } else {
      if (
        typeof window !== "undefined" &&
        !window.confirm("AI용 규칙을 비울까요?")
      ) {
        return;
      }
      clearVideoRulesAiDocument();
      setAiText(DEFAULT_VIDEO_RULES_AI_DOCUMENT);
      setAiDraft(DEFAULT_VIDEO_RULES_AI_DOCUMENT);
    }
    setEditing(false);
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
                onClick={onSave}
                disabled={!ready}
              >
                저장
              </button>
              <button
                type="button"
                className="btn btn-soft"
                onClick={onCancel}
                disabled={!ready}
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
            onClick={onReset}
            disabled={!ready}
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
