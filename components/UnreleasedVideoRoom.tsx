"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminEmptyText } from "@/components/AdminEmptyText";
import { AdminMediaPreview } from "@/components/AdminMediaPreview";
import { AdminPreviewAttach } from "@/components/AdminPreviewAttach";
import {
  deleteMediaPreview,
  moveMediaPreview,
  saveMediaPreview,
} from "@/lib/media-preview-store";
import {
  makePublicId,
  readPublicMediaStore,
  writePublicMediaStore,
} from "@/lib/public-media";
import {
  makeUnreleasedId,
  readUnreleasedMediaStore,
  UNRELEASED_LANG_LABELS,
  writeUnreleasedMediaStore,
  type UnreleasedItem,
  type UnreleasedLang,
} from "@/lib/unreleased-media";
import { resolveYoutubeWatchUrl } from "@/lib/watch-media";

/** 한국어 채널 — 숏츠 올리러 갈 때 */
const KOREAN_YOUTUBE_CHANNEL =
  "https://www.youtube.com/@%EB%B4%84%EC%9D%B4%EC%BD%A9%EC%9D%B4BomKong";

type Props = {
  lang: UnreleasedLang;
};

export function UnreleasedVideoRoom({ lang }: Props) {
  const langLabel = UNRELEASED_LANG_LABELS[lang];
  const roomKey = lang === "ko" ? "unreleased-ko" : "unreleased-en";
  const [items, setItems] = useState<UnreleasedItem[]>([]);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const [fileLabel, setFileLabel] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [moveId, setMoveId] = useState<string | null>(null);
  const [moveYoutubeUrl, setMoveYoutubeUrl] = useState("");
  const [previewTicks, setPreviewTicks] = useState<Record<string, number>>(
    {},
  );
  const [adding, setAdding] = useState(false);

  const isEnglish = lang === "en";
  const titlePlaceholder = isEnglish
    ? "예: Ball play at the park"
    : "예: 공원에서 공 놀이";
  const videoAccept =
    "video/*,video/mp4,video/quicktime,video/webm,.mp4,.mov,.m4v,.webm";

  useEffect(() => {
    const store = readUnreleasedMediaStore(lang);
    setItems(store.items);
    setReady(true);
    // 한국어↔영어 방 바꿀 때 입력칸·파일 선택을 비움 (이전 방 내용이 남지 않게)
    setTitle("");
    setPendingFile(null);
    setFileLabel("");
    setMessage("");
    setMoveId(null);
    setFormKey((k) => k + 1);
  }, [lang]);

  function persist(next: UnreleasedItem[]) {
    writeUnreleasedMediaStore(lang, { items: next });
    setItems(next);
  }

  function onPickFile(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      setPendingFile(null);
      setFileLabel("");
      return;
    }
    const file = fileList[0];
    setPendingFile(file);
    setFileLabel(file.name);
    setMessage("");
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (adding) return;
    if (!pendingFile) {
      setMessage(
        isEnglish
          ? "Pick the finished English video file first."
          : "완성된 동영상 파일을 먼저 골라 주세요.",
      );
      return;
    }
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setMessage(
        isEnglish ? "Please enter a video title." : "영상 제목을 적어 주세요.",
      );
      return;
    }
    const item: UnreleasedItem = {
      id: makeUnreleasedId(),
      name: pendingFile.name,
      title: trimmedTitle,
      note: "",
      addedAt: new Date().toISOString(),
      youtubeStatus: "not_uploaded",
    };
    setAdding(true);
    let previewOk = true;
    try {
      try {
        await saveMediaPreview(item.id, pendingFile, "video");
      } catch {
        previewOk = false;
      }
      persist([item, ...items]);
      setPreviewTicks((prev) => ({
        ...prev,
        [item.id]: (prev[item.id] ?? 0) + 1,
      }));
      setMessage(
        previewOk
          ? isEnglish
            ? `Saved “${item.title}” in Unreleased (English). Preview is on the side.`
            : `「${item.title}」을(를) 미공개 영상실(${langLabel})에 넣었어요. 옆에 미리보기가 보여요.`
          : isEnglish
            ? `Added to the list, but preview failed. Use “Attach preview file” again.`
            : `목록에는 넣었어요. 미리보기는 저장하지 못했어요. 「미리보기 파일 넣기」로 다시 해 주세요.`,
      );
      setTitle("");
      setPendingFile(null);
      setFileLabel("");
      setFormKey((k) => k + 1);
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : isEnglish
            ? "Could not save. Please try again."
            : "저장하지 못했어요. 다시 해 주세요.",
      );
    } finally {
      setAdding(false);
    }
  }

  async function onRemove(id: string) {
    const target = items.find((it) => it.id === id);
    if (!target) return;
    await deleteMediaPreview(id);
    persist(items.filter((it) => it.id !== id));
    setMessage(`「${target.title}」을(를) 목록에서 빼 두었어요.`);
  }

  function startMove(id: string, youtubeUrl = "") {
    setMoveId(id);
    setMoveYoutubeUrl(youtubeUrl);
    setMessage("");
  }

  function cancelMove() {
    setMoveId(null);
    setMoveYoutubeUrl("");
  }

  async function confirmMove(e: React.FormEvent) {
    e.preventDefault();
    if (!moveId) return;
    const target = items.find((it) => it.id === moveId);
    if (!target) {
      setMessage("옮길 영상을 찾지 못했어요.");
      cancelMove();
      return;
    }

    const resolved = resolveYoutubeWatchUrl(moveYoutubeUrl);
    if (!resolved) {
      setMessage(
        "유튜브 숏츠 주소를 붙여 넣어 주세요. 예: https://youtube.com/shorts/……",
      );
      return;
    }

    const publicId = makePublicId();
    const nextUnreleased = items.filter((it) => it.id !== moveId);
    const publicStore = readPublicMediaStore();
    const nextPublic = [
      {
        id: publicId,
        name: target.name,
        title: target.title,
        youtubeUrl: moveYoutubeUrl.trim(),
        note: "",
        addedAt: new Date().toISOString(),
        youtubeStatus: "public" as const,
        fromUnreleasedId: target.id,
      },
      ...publicStore.items,
    ];

    await moveMediaPreview(target.id, publicId);
    writeUnreleasedMediaStore(lang, { items: nextUnreleased });
    writePublicMediaStore({ items: nextPublic });
    setItems(nextUnreleased);
    cancelMove();
    // 주소 넣고 바로 그 유튜브(숏츠)로 이동
    if (typeof window !== "undefined") {
      window.location.assign(resolved);
    }
  }

  if (!ready) {
    return <p className="muted">목록을 불러오는 중이에요…</p>;
  }

  return (
    <div className="admin-wrap">
      <div className="unreleased-lang-switch" aria-label="미공개 버전 바꾸기">
        <span className="pair-chip">지금 · {langLabel}</span>
        <Link
          className="btn btn-soft"
          href={lang === "ko" ? "/admin/unreleased/en" : "/admin/unreleased/ko"}
        >
          {lang === "ko" ? "영어 버전으로" : "한국어 버전으로"}
        </Link>
        <Link className="btn btn-soft" href="/admin/unreleased">
          미공개 영상실
        </Link>
      </div>

      <form key={`${lang}-${formKey}`} className="admin-form" onSubmit={onAdd}>
        <p className="form-hint">
          {isEnglish
            ? "English-market videos that are finished but not on YouTube yet. Pick a file, type a title (English OK), then save. Korean and English lists stay separate."
            : "한국어 시장용으로, 만들기는 끝났지만 아직 유튜브에 안 올린 영상을 모아 두는 방이에요. 파일을 고르면 옆에 작은 미리보기가 이 기기에만 저장돼요. 예전에 이름만 넣은 항목은 「미리보기 파일 넣기」로 다시 넣어 주세요. 한국어·영어 목록은 서로 섞이지 않아요."}
        </p>

        <label>
          {isEnglish ? "Pick finished video" : "완성된 동영상 고르기"}
          <input
            type="file"
            accept={videoAccept}
            onChange={(e) => onPickFile(e.target.files)}
            disabled={adding}
          />
          <span className="file-note">
            {fileLabel
              ? isEnglish
                ? `Selected: ${fileLabel}`
                : `선택: ${fileLabel}`
              : isEnglish
                ? "No file yet"
                : "아직 안 고름"}
          </span>
        </label>

        <label>
          {isEnglish ? "Video title" : "영상 제목"}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={titlePlaceholder}
            lang={isEnglish ? "en" : "ko"}
            autoCapitalize="sentences"
            autoCorrect="on"
            enterKeyHint="done"
            required
            disabled={adding}
          />
        </label>

        <button
          type="submit"
          className="btn btn-primary btn-wide"
          disabled={adding}
        >
          {adding
            ? isEnglish
              ? "Saving…"
              : "넣는 중…"
            : isEnglish
              ? "Add to Unreleased (English)"
              : `미공개(${langLabel})에 넣기`}
        </button>
      </form>

      {message ? <p className="form-msg">{message}</p> : null}

      <section>
        <h2 className="section-title">
          아직 유튜브에 안 올린 영상 · {langLabel}
        </h2>
        <p className="muted tiny">
          유튜브에서 숏츠로 올린 뒤 <strong>숏츠 주소</strong>를 붙여 넣으면,
          공개 영상실로 옮기고 <strong>그 유튜브로 바로 가요</strong>.
        </p>
        {items.length === 0 ? (
          <AdminEmptyText roomKey={roomKey} />
        ) : (
          <ul className="admin-ep-list">
            {items.map((item) => (
              <li key={item.id} className="admin-ep-item">
                <div className="admin-ep-main">
                  <AdminMediaPreview
                    itemId={item.id}
                    kindHint="video"
                    label={item.title}
                    refreshToken={previewTicks[item.id] ?? 0}
                  />
                  <div>
                    <strong>{item.title}</strong>
                    <p className="tiny muted">파일 · {item.name}</p>
                    <p className="tiny muted">
                      넣은 날{" "}
                      {new Date(item.addedAt).toLocaleString("ko-KR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    <AdminPreviewAttach
                      itemId={item.id}
                      kindHint="video"
                      accept={videoAccept}
                      onMessage={setMessage}
                      onAttached={() =>
                        setPreviewTicks((prev) => ({
                          ...prev,
                          [item.id]: (prev[item.id] ?? 0) + 1,
                        }))
                      }
                    />
                  </div>
                </div>

                {moveId === item.id ? (
                  <form
                    className="admin-form vault-move-form"
                    onSubmit={confirmMove}
                  >
                    <p className="tiny muted">
                      「{item.title}」 · 숏츠 주소를 넣으면 공개 영상실에
                      저장하고, 그 유튜브로 바로 이동합니다.
                    </p>
                    <p className="tiny muted">
                      아직 안 올렸으면{" "}
                      <a
                        href={KOREAN_YOUTUBE_CHANNEL}
                        target="_blank"
                        rel="noreferrer"
                      >
                        한국어 채널에서 숏츠 올리기
                      </a>
                      로 먼저 올린 뒤, 주소를 복사해 오세요.
                    </p>
                    <label>
                      숏츠 주소 붙여 넣기
                      <input
                        value={moveYoutubeUrl}
                        onChange={(e) => setMoveYoutubeUrl(e.target.value)}
                        placeholder="예: https://youtube.com/shorts/…"
                        inputMode="url"
                        autoFocus
                        required
                      />
                    </label>
                    <div className="vault-action-row">
                      <button type="submit" className="btn btn-primary">
                        주소 넣고 유튜브로 가기
                      </button>
                      <button
                        type="button"
                        className="btn btn-soft"
                        onClick={cancelMove}
                      >
                        취소
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="vault-action-row">
                    <span className="pair-chip">아직 유튜브 전</span>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => startMove(item.id)}
                    >
                      숏츠 주소 넣고 유튜브로 가기
                    </button>
                    <button
                      type="button"
                      className="btn btn-soft"
                      onClick={() => onRemove(item.id)}
                    >
                      목록에서 빼기
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
