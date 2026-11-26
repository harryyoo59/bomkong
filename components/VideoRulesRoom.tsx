"use client";

import { useEffect, useMemo, useState } from "react";
import {
  loadVideoRulesAction,
  publishVideoRulesAction,
} from "@/app/admin/rules/actions";
import {
  DEFAULT_VIDEO_RULES_AI_DOCUMENT,
  DEFAULT_VIDEO_RULES_CHECKLIST_DOCUMENT,
  DEFAULT_VIDEO_RULES_COOKIE_DOCUMENT,
  DEFAULT_VIDEO_RULES_DOCUMENT,
  DEFAULT_VIDEO_RULES_ENGLISH_DOCUMENT,
  clearVideoRulesAiDocument,
  clearVideoRulesChecklistDocument,
  clearVideoRulesCookieDocument,
  clearVideoRulesDocumentOverride,
  clearVideoRulesEnglishDocument,
  parseVideoRulesDocument,
  readVideoRulesAiDocument,
  readVideoRulesChecklistDocument,
  readVideoRulesCookieDocument,
  readVideoRulesDocument,
  readVideoRulesEnglishDocument,
  writeVideoRulesAiDocument,
  writeVideoRulesChecklistDocument,
  writeVideoRulesCookieDocument,
  writeVideoRulesDocument,
  writeVideoRulesEnglishDocument,
  type VideoRulesAudience,
  type VideoRulesBlock,
} from "@/lib/video-rules";
import { askShareBossLock } from "@/lib/share-boss-lock-client";

function RulesDocumentView({
  blocks,
}: {
  blocks: VideoRulesBlock[];
}) {
  if (blocks.length === 0) {
    return (
      <p className="muted tiny">아직 글이 없어요. 「글 고치기」로 넣어 주세요.</p>
    );
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

function remoteHasSharedContent(
  adminBody: string,
  aiBody: string,
  checklistBody: string,
  englishBody: string,
  cookieBody: string,
): boolean {
  return Boolean(
    adminBody.trim() ||
      aiBody.trim() ||
      checklistBody.trim() ||
      englishBody.trim() ||
      cookieBody.trim(),
  );
}

type Docs = {
  admin: string;
  ai: string;
  checklist: string;
  english: string;
  cookie: string;
};

export function VideoRulesRoom() {
  const [audience, setAudience] = useState<VideoRulesAudience>("admin");
  const [adminText, setAdminText] = useState(DEFAULT_VIDEO_RULES_DOCUMENT);
  const [adminDraft, setAdminDraft] = useState(DEFAULT_VIDEO_RULES_DOCUMENT);
  const [aiText, setAiText] = useState(DEFAULT_VIDEO_RULES_AI_DOCUMENT);
  const [aiDraft, setAiDraft] = useState(DEFAULT_VIDEO_RULES_AI_DOCUMENT);
  const [checklistText, setChecklistText] = useState(
    DEFAULT_VIDEO_RULES_CHECKLIST_DOCUMENT,
  );
  const [checklistDraft, setChecklistDraft] = useState(
    DEFAULT_VIDEO_RULES_CHECKLIST_DOCUMENT,
  );
  const [englishText, setEnglishText] = useState(
    DEFAULT_VIDEO_RULES_ENGLISH_DOCUMENT,
  );
  const [englishDraft, setEnglishDraft] = useState(
    DEFAULT_VIDEO_RULES_ENGLISH_DOCUMENT,
  );
  const [cookieText, setCookieText] = useState(
    DEFAULT_VIDEO_RULES_COOKIE_DOCUMENT,
  );
  const [cookieDraft, setCookieDraft] = useState(
    DEFAULT_VIDEO_RULES_COOKIE_DOCUMENT,
  );
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
      const localChecklist = readVideoRulesChecklistDocument();
      const localEnglish = readVideoRulesEnglishDocument();
      const localCookie = readVideoRulesCookieDocument();
      if (!cancelled) {
        setAdminText(localAdmin);
        setAdminDraft(localAdmin);
        setAiText(localAi);
        setAiDraft(localAi);
        setChecklistText(localChecklist);
        setChecklistDraft(localChecklist);
        setEnglishText(localEnglish);
        setEnglishDraft(localEnglish);
        setCookieText(localCookie);
        setCookieDraft(localCookie);
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
      if (
        remoteHasSharedContent(
          store.adminBody,
          store.aiBody,
          store.checklistBody,
          store.englishBody,
          store.cookieBody,
        )
      ) {
        const nextAdmin = store.adminBody.trim()
          ? store.adminBody
          : DEFAULT_VIDEO_RULES_DOCUMENT;
        writeVideoRulesDocument(nextAdmin);
        writeVideoRulesAiDocument(store.aiBody);
        writeVideoRulesChecklistDocument(store.checklistBody);
        writeVideoRulesEnglishDocument(store.englishBody);
        writeVideoRulesCookieDocument(store.cookieBody);
        setAdminText(nextAdmin);
        setAdminDraft(nextAdmin);
        setAiText(store.aiBody);
        setAiDraft(store.aiBody);
        setChecklistText(store.checklistBody);
        setChecklistDraft(store.checklistBody);
        setEnglishText(store.englishBody);
        setEnglishDraft(store.englishBody);
        setCookieText(store.cookieBody);
        setCookieDraft(store.cookieBody);
        setSharedOk(true);
        setSyncMessage(
          "다른 기기와 같은 규칙이에요. 고쳐서 저장하면 자동으로 맞춰져요.",
        );
        return;
      }

      setSharedOk(false);
      setSyncBusy(true);
      setSyncMessage("이 기기 규칙을 다른 기기에도 맞게 올리는 중이에요…");
      const published = await publishVideoRulesAction({
        adminBody: localAdmin,
        aiBody: localAi,
        checklistBody: localChecklist,
        englishBody: localEnglish,
        cookieBody: localCookie,
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
  const isAi = audience === "ai";
  const isChecklist = audience === "checklist";
  const isEnglish = audience === "english";
  const isCookie = audience === "cookie";
  const isSideDoc = isAi || isChecklist || isEnglish || isCookie;

  const text = isAdmin
    ? adminText
    : isAi
      ? aiText
      : isChecklist
        ? checklistText
        : isEnglish
          ? englishText
          : cookieText;
  const draft = isAdmin
    ? adminDraft
    : isAi
      ? aiDraft
      : isChecklist
        ? checklistDraft
        : isEnglish
          ? englishDraft
          : cookieDraft;
  const setDraft = isAdmin
    ? setAdminDraft
    : isAi
      ? setAiDraft
      : isChecklist
        ? setChecklistDraft
        : isEnglish
          ? setEnglishDraft
          : setCookieDraft;
  const blocks = useMemo(() => parseVideoRulesDocument(text), [text]);

  async function publishAll(docs: Docs) {
    setSyncBusy(true);
    const result = await publishVideoRulesAction({
      adminBody: docs.admin,
      aiBody: docs.ai,
      checklistBody: docs.checklist,
      englishBody: docs.english,
      cookieBody: docs.cookie,
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

  function currentDocs(
    override: Partial<Docs> = {},
  ): Docs {
    return {
      admin: override.admin ?? adminText,
      ai: override.ai ?? aiText,
      checklist: override.checklist ?? checklistText,
      english: override.english ?? englishText,
      cookie: override.cookie ?? cookieText,
    };
  }

  async function onSave() {
    if (isAdmin) {
      writeVideoRulesDocument(draft);
      setAdminText(draft);
      const published = await publishAll(currentDocs({ admin: draft }));
      setEditing(false);
      setSyncMessage(
        published.ok
          ? "저장했고, 다른 기기에도 자동으로 맞춰 두었어요."
          : `이 기기에는 저장했어요. ${published.message} 「다시 맞추기」를 눌러 주세요.`,
      );
      return;
    }
    if (isAi) {
      writeVideoRulesAiDocument(draft);
      setAiText(draft);
      const published = await publishAll(currentDocs({ ai: draft }));
      setEditing(false);
      setSyncMessage(
        published.ok
          ? "저장했고, 다른 기기에도 자동으로 맞춰 두었어요."
          : `이 기기에는 저장했어요. ${published.message} 「다시 맞추기」를 눌러 주세요.`,
      );
      return;
    }
    if (isChecklist) {
      writeVideoRulesChecklistDocument(draft);
      setChecklistText(draft);
      const published = await publishAll(currentDocs({ checklist: draft }));
      setEditing(false);
      setSyncMessage(
        published.ok
          ? "저장했고, 다른 기기에도 자동으로 맞춰 두었어요."
          : `이 기기에는 저장했어요. ${published.message} 「다시 맞추기」를 눌러 주세요.`,
      );
      return;
    }
    if (isEnglish) {
      writeVideoRulesEnglishDocument(draft);
      setEnglishText(draft);
      const published = await publishAll(currentDocs({ english: draft }));
      setEditing(false);
      setSyncMessage(
        published.ok
          ? "저장했고, 다른 기기에도 자동으로 맞춰 두었어요."
          : `이 기기에는 저장했어요. ${published.message} 「다시 맞추기」를 눌러 주세요.`,
      );
      return;
    }

    writeVideoRulesCookieDocument(draft);
    setCookieText(draft);
    const published = await publishAll(currentDocs({ cookie: draft }));
    setEditing(false);
    setSyncMessage(
      published.ok
        ? "저장했고, 다른 기기에도 자동으로 맞춰 두었어요."
        : `이 기기에는 저장했어요. ${published.message} 「다시 맞추기」를 눌러 주세요.`,
    );
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
      const published = await publishAll(
        currentDocs({ admin: DEFAULT_VIDEO_RULES_DOCUMENT }),
      );
      setEditing(false);
      setSyncMessage(
        published.ok
          ? "처음 확정본으로 되돌렸고, 다른 기기에도 맞춰 두었어요."
          : `이 기기는 되돌렸어요. ${published.message}`,
      );
      return;
    }

    if (isAi) {
      if (
        typeof window !== "undefined" &&
        !window.confirm("AI용 규칙을 비울까요?")
      ) {
        return;
      }
      clearVideoRulesAiDocument();
      setAiText(DEFAULT_VIDEO_RULES_AI_DOCUMENT);
      setAiDraft(DEFAULT_VIDEO_RULES_AI_DOCUMENT);
      const published = await publishAll(
        currentDocs({ ai: DEFAULT_VIDEO_RULES_AI_DOCUMENT }),
      );
      setEditing(false);
      setSyncMessage(
        published.ok
          ? "AI용을 비웠고, 다른 기기에도 맞춰 두었어요."
          : `이 기기는 비웠어요. ${published.message}`,
      );
      return;
    }

    if (isChecklist) {
      if (
        typeof window !== "undefined" &&
        !window.confirm("체크리스트를 비울까요?")
      ) {
        return;
      }
      clearVideoRulesChecklistDocument();
      setChecklistText(DEFAULT_VIDEO_RULES_CHECKLIST_DOCUMENT);
      setChecklistDraft(DEFAULT_VIDEO_RULES_CHECKLIST_DOCUMENT);
      const published = await publishAll(
        currentDocs({ checklist: DEFAULT_VIDEO_RULES_CHECKLIST_DOCUMENT }),
      );
      setEditing(false);
      setSyncMessage(
        published.ok
          ? "체크리스트를 비웠고, 다른 기기에도 맞춰 두었어요."
          : `이 기기는 비웠어요. ${published.message}`,
      );
      return;
    }

    if (isEnglish) {
      if (
        typeof window !== "undefined" &&
        !window.confirm("영어 버전 글을 비울까요?")
      ) {
        return;
      }
      clearVideoRulesEnglishDocument();
      setEnglishText(DEFAULT_VIDEO_RULES_ENGLISH_DOCUMENT);
      setEnglishDraft(DEFAULT_VIDEO_RULES_ENGLISH_DOCUMENT);
      const published = await publishAll(
        currentDocs({ english: DEFAULT_VIDEO_RULES_ENGLISH_DOCUMENT }),
      );
      setEditing(false);
      setSyncMessage(
        published.ok
          ? "영어 버전 글을 비웠고, 다른 기기에도 맞춰 두었어요."
          : `이 기기는 비웠어요. ${published.message}`,
      );
      return;
    }

    if (
      typeof window !== "undefined" &&
      !window.confirm("쿠키영상 글을 비울까요?")
    ) {
      return;
    }
    clearVideoRulesCookieDocument();
    setCookieText(DEFAULT_VIDEO_RULES_COOKIE_DOCUMENT);
    setCookieDraft(DEFAULT_VIDEO_RULES_COOKIE_DOCUMENT);
    const published = await publishAll(
      currentDocs({ cookie: DEFAULT_VIDEO_RULES_COOKIE_DOCUMENT }),
    );
    setEditing(false);
    setSyncMessage(
      published.ok
        ? "쿠키영상 글을 비웠고, 다른 기기에도 맞춰 두었어요."
        : `이 기기는 비웠어요. ${published.message}`,
    );
  }

  async function onShareAgain() {
    if (syncBusy) return;
    const lock = await askShareBossLock();
    if (!lock.ok) {
      setSyncMessage(lock.message);
      return;
    }
    const published = await publishAll(currentDocs());
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

  async function onCopySide() {
    if (copyBusy || !isSideDoc) return;
    const raw = text.trim();
    const emptyMsg = isAi
      ? "아직 AI용 글이 없어요. 먼저 「글 고치기」로 붙여 넣어요."
      : isChecklist
        ? "아직 체크리스트 글이 없어요. 먼저 「글 고치기」로 붙여 넣어요."
        : isEnglish
          ? "아직 영어 버전 글이 없어요. 먼저 「글 고치기」로 붙여 넣어요."
          : "아직 쿠키영상 글이 없어요. 먼저 「글 고치기」로 붙여 넣어요.";
    const okMsg = isAi
      ? "AI용 규칙을 복사했어요. AI 채팅에 붙여 넣으면 돼요."
      : isChecklist
        ? "체크리스트를 복사했어요. 필요한 곳에 붙여 넣으면 돼요."
        : isEnglish
          ? "영어 버전 글을 복사했어요. 필요한 곳에 붙여 넣으면 돼요."
          : "쿠키영상 글을 복사했어요. 필요한 곳에 붙여 넣으면 돼요.";
    if (!raw) {
      setCopyMessage(emptyMsg);
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
      setCopyMessage(okMsg);
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

  const editorLabel = isAdmin
    ? "관리자용 규칙 고치기"
    : isAi
      ? "AI용 규칙 고치기"
      : isChecklist
        ? "체크리스트 고치기"
        : isEnglish
          ? "영어 버전 고치기"
          : "쿠키영상 고치기";

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
          className={`btn ${isAi ? "btn-primary" : "btn-soft"}`}
          onClick={() => setAudience("ai")}
        >
          AI용
        </button>
        <button
          type="button"
          className={`btn ${isChecklist ? "btn-primary" : "btn-soft"}`}
          onClick={() => setAudience("checklist")}
        >
          체크리스트
        </button>
        <button
          type="button"
          className={`btn ${isEnglish ? "btn-primary" : "btn-soft"}`}
          onClick={() => setAudience("english")}
        >
          영어 버전
        </button>
        <button
          type="button"
          className={`btn ${isCookie ? "btn-primary" : "btn-soft"}`}
          onClick={() => setAudience("cookie")}
        >
          쿠키영상
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
          {isSideDoc ? (
            <button
              type="button"
              className="btn btn-soft"
              onClick={() => void onCopySide()}
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

      {copyMessage && isSideDoc ? (
        <p className="form-msg">{copyMessage}</p>
      ) : null}

      {editing ? (
        <textarea
          className="video-rules-editor"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={isAdmin ? 28 : 16}
          spellCheck={false}
          aria-label={editorLabel}
        />
      ) : (
        <RulesDocumentView blocks={blocks} />
      )}
    </section>
  );
}
