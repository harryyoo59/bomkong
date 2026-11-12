"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_VIDEO_RULES_DOCUMENT,
  clearVideoRulesDocumentOverride,
  parseVideoRulesDocument,
  readVideoRulesDocument,
  writeVideoRulesDocument,
} from "@/lib/video-rules";

export function VideoRulesRoom() {
  const [text, setText] = useState(DEFAULT_VIDEO_RULES_DOCUMENT);
  const [draft, setDraft] = useState(DEFAULT_VIDEO_RULES_DOCUMENT);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const next = readVideoRulesDocument();
    setText(next);
    setDraft(next);
    setReady(true);
  }, []);

  const blocks = useMemo(() => parseVideoRulesDocument(text), [text]);

  function onSave() {
    writeVideoRulesDocument(draft);
    setText(draft);
    setEditing(false);
  }

  function onCancel() {
    setDraft(text);
    setEditing(false);
  }

  function onReset() {
    if (
      typeof window !== "undefined" &&
      !window.confirm("영상제작 규칙을 처음 확정본으로 되돌릴까요?")
    ) {
      return;
    }
    clearVideoRulesDocumentOverride();
    setText(DEFAULT_VIDEO_RULES_DOCUMENT);
    setDraft(DEFAULT_VIDEO_RULES_DOCUMENT);
    setEditing(false);
  }

  return (
    <section className="panel video-rules-panel" aria-label="영상제작 규칙">
      <div className="video-rules-toolbar">
        <p className="muted tiny video-rules-toolbar-note">
          사이트에 넣어 둔 최종 확정본이에요. 나중에 「글 고치기」로 고칠 수
          있어요.
        </p>
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
          <button
            type="button"
            className="btn btn-soft"
            onClick={onReset}
            disabled={!ready}
          >
            처음 확정본으로
          </button>
        </div>
      </div>

      {editing ? (
        <textarea
          className="video-rules-editor"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={28}
          spellCheck={false}
          aria-label="영상제작 규칙 고치기"
        />
      ) : (
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
      )}
    </section>
  );
}
