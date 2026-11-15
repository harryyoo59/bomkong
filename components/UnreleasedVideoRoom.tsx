"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminEmptyText } from "@/components/AdminEmptyText";
import { AdminMediaPreview } from "@/components/AdminMediaPreview";
import { AdminPreviewAttach } from "@/components/AdminPreviewAttach";
import {
  deleteMediaPreview,
  getMediaPreview,
  moveMediaPreview,
  saveMediaPreview,
} from "@/lib/media-preview-store";
import {
  makeUnreleasedId,
  readUnreleasedMediaStore,
  UNRELEASED_LANG_LABELS,
  writeUnreleasedMediaStore,
  type UnreleasedItem,
  type UnreleasedLang,
} from "@/lib/unreleased-media";
import {
  makeWatchId,
  pushWatchMediaToServer,
  readWatchMediaStore,
  sortWatchItemsForPlay,
  suggestNextEpisodeNumberForLang,
  syncWatchMediaWithServer,
  watchSlotLabel,
  writeWatchMediaStore,
  youtubeChannelUrlForLang,
  type WatchLang,
} from "@/lib/watch-media";

/** 유튜브 올리기 화면 — 세로 영상이면 숏츠·초안으로 이어짐 */
const YOUTUBE_SHORTS_UPLOAD = "https://www.youtube.com/upload";

type Props = {
  lang: UnreleasedLang;
};

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || "short.mp4";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

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
  const [previewTicks, setPreviewTicks] = useState<Record<string, number>>(
    {},
  );
  const [adding, setAdding] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  const isEnglish = lang === "en";
  const watchLang: WatchLang = lang;
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
    setSendingId(null);
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

  /** 원본 → 영상보기, 파일 받아서 유튜브 숏츠 올리기(초안) 화면으로 */
  async function sendToShortsDraft(id: string) {
    if (sendingId) return;
    const target = items.find((it) => it.id === id);
    if (!target) {
      setMessage("영상을 찾지 못했어요.");
      return;
    }

    setSendingId(id);
    setMessage(
      isEnglish
        ? `Moving “${target.title}” to Watch, then opening YouTube Shorts upload…`
        : `「${target.title}」원본을 영상보기로 옮기고, 유튜브 숏츠 올리기 화면으로 가요…`,
    );

    try {
      const preview = await getMediaPreview(target.id);
      if (preview?.blob) {
        downloadBlob(preview.blob, target.name || `${target.title}.mp4`);
      }

      let watchItems = readWatchMediaStore().items;
      try {
        watchItems = await syncWatchMediaWithServer({
          allowUploadLocal: true,
          confirmChange: (msg) =>
            typeof window !== "undefined" ? window.confirm(msg) : false,
        });
      } catch {
        /* 기기 목록으로 이어감 */
      }
      const episodeNumber = suggestNextEpisodeNumberForLang(
        watchItems,
        watchLang,
      );
      const watchId = makeWatchId();
      const watchItem = {
        id: watchId,
        name: target.name,
        title: target.title,
        youtubeUrl: youtubeChannelUrlForLang(watchLang),
        note: "",
        addedAt: new Date().toISOString(),
        episodeNumber,
        lang: watchLang,
      };
      const nextWatch = sortWatchItemsForPlay([...watchItems, watchItem]);
      writeWatchMediaStore({ items: nextWatch });
      try {
        await pushWatchMediaToServer(nextWatch);
      } catch {
        /* 인터넷 저장 실패해도 기기에는 남아 있음 */
      }
      await moveMediaPreview(target.id, watchId);

      const nextUnreleased = items.filter((it) => it.id !== id);
      writeUnreleasedMediaStore(lang, { items: nextUnreleased });
      setItems(nextUnreleased);

      const slot = watchSlotLabel(watchItem);
      setMessage(
        preview?.blob
          ? `「${target.title}」을(를) 영상보기(${slot})로 옮겼어요. 받은 파일을 유튜브 숏츠 초안에 붙여 주세요.`
          : `「${target.title}」을(를) 영상보기(${slot})로 옮겼어요. 미리보기 파일이 없어 다운로드는 못 했어요. 유튜브에서 같은 파일을 골라 올려 주세요.`,
      );

      window.setTimeout(() => {
        window.location.assign(YOUTUBE_SHORTS_UPLOAD);
      }, 500);
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "옮기지 못했어요. 잠시 후 다시 해 주세요.",
      );
      setSendingId(null);
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
          「숏츠 초안으로 가기」를 누르면 <strong>원본은 영상보기</strong>로
          옮기고, <strong>파일은 받아서</strong> 유튜브 숏츠 올리기(초안)
          화면으로 가요. 받은 파일을 거기에 붙이면 잊어버리지 않아요.
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

                <div className="vault-action-row">
                  <span className="pair-chip">아직 유튜브 전</span>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={Boolean(sendingId)}
                    onClick={() => sendToShortsDraft(item.id)}
                  >
                    {sendingId === item.id
                      ? "옮기는 중…"
                      : "숏츠 초안으로 가기 · 원본은 영상보기로"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-soft"
                    disabled={Boolean(sendingId)}
                    onClick={() => onRemove(item.id)}
                  >
                    목록에서 빼기
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
