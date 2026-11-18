"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminEmptyText } from "@/components/AdminEmptyText";
import { AdminMediaPreview } from "@/components/AdminMediaPreview";
import { AdminPreviewAttach } from "@/components/AdminPreviewAttach";
import {
  listUnreleasedItemsAction,
  removeUnreleasedItemAction,
} from "@/app/admin/unreleased/actions";
import {
  deleteMediaPreview,
  getMediaPreview,
  moveMediaPreview,
  saveMediaPreview,
} from "@/lib/media-preview-store";
import { askShareBossLock } from "@/lib/share-boss-lock-client";
import { publishUnreleasedItemWithFile } from "@/lib/unreleased-media-client";
import {
  makeUnreleasedId,
  mergeUnreleasedLists,
  readUnreleasedMediaStore,
  UNRELEASED_LANG_LABELS,
  writeUnreleasedMediaStore,
  writeUnreleasedMediaStoreAllowEmpty,
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
  const [shareBusy, setShareBusy] = useState(false);
  const [sharedOk, setSharedOk] = useState(false);

  const isEnglish = lang === "en";
  const watchLang: WatchLang = lang;
  const titlePlaceholder = isEnglish
    ? "예: Ball play at the park"
    : "예: 공원에서 공 놀이";
  const videoAccept =
    "video/*,video/mp4,video/quicktime,video/webm,.mp4,.mov,.m4v,.webm";

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const local = readUnreleasedMediaStore(lang).items;
      if (!cancelled) {
        setItems(local);
        setReady(true);
        setTitle("");
        setPendingFile(null);
        setFileLabel("");
        setMessage("");
        setSendingId(null);
        setFormKey((k) => k + 1);
      }

      const remoteResult = await listUnreleasedItemsAction(lang);
      if (cancelled) return;

      if (!remoteResult.ok) {
        setSharedOk(false);
        if (local.length > 0) {
          setMessage(
            `이 기기에 ${local.length}개가 있어요. 인터넷 목록은 아직 확인하지 못했어요.`,
          );
        }
        return;
      }

      const merged = mergeUnreleasedLists(local, remoteResult.items);
      if (merged.length > 0) {
        writeUnreleasedMediaStore(lang, { items: merged });
        setItems(merged);
      }

      // 인터넷에 없는 이 기기 항목은 자동으로 맞춤 (원본은 지우지 않음)
      const missing = merged.filter(
        (it) => !remoteResult.items.some((r) => r.id === it.id),
      );
      if (missing.length > 0) {
        setShareBusy(true);
        setMessage(
          `이 기기 미공개 ${missing.length}개를 다른 기기에도 맞게 올리는 중이에요…`,
        );
        const next = [...merged];
        let ok = 0;
        for (const item of missing) {
          try {
            const saved = await publishUnreleasedItemWithFile(lang, item);
            const idx = next.findIndex((it) => it.id === item.id);
            if (idx >= 0) next[idx] = saved;
            ok += 1;
          } catch {
            /* 이 기기 원본은 그대로 */
          }
        }
        if (!cancelled) {
          writeUnreleasedMediaStore(lang, { items: next });
          setItems(next);
          setShareBusy(false);
          if (ok === missing.length) {
            setSharedOk(true);
            setMessage(
              `미공개 ${next.length}개예요. 인터넷에도 맞춰 두었어요. 새 영상은 넣을 때 자동으로 올라가요.`,
            );
          } else {
            setSharedOk(false);
            setMessage(
              `${ok}개는 올렸어요. 나머지는 「다시 맞추기」로 한 번 더 해 주세요. 원본은 그대로예요.`,
            );
          }
        }
        return;
      }

      if (remoteResult.count > 0) {
        setSharedOk(true);
        setMessage(
          `미공개 ${merged.length}개예요. 다른 기기와 같아요. 새 영상은 넣을 때 자동으로 올라가요.`,
        );
      } else {
        setSharedOk(true);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  function persist(next: UnreleasedItem[]) {
    if (next.length === 0) {
      writeUnreleasedMediaStoreAllowEmpty(lang, { items: next });
    } else {
      writeUnreleasedMediaStore(lang, { items: next });
    }
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
      const next = [item, ...items];
      persist(next);
      setPreviewTicks((prev) => ({
        ...prev,
        [item.id]: (prev[item.id] ?? 0) + 1,
      }));

      // 넣자마자 자동으로 다른 기기에도 맞춤
      let sharedItem = item;
      let shareOk = false;
      try {
        setMessage(
          isEnglish
            ? "Saving and sharing to other devices…"
            : "넣고, 다른 기기에도 자동으로 올리는 중이에요…",
        );
        sharedItem = await publishUnreleasedItemWithFile(lang, item);
        shareOk = true;
        persist([sharedItem, ...items]);
        setSharedOk(true);
      } catch {
        setSharedOk(false);
      }

      setMessage(
        shareOk
          ? isEnglish
            ? `Saved “${sharedItem.title}” and shared to other devices.`
            : `「${sharedItem.title}」을(를) 넣었고, 다른 기기에도 자동으로 올려 두었어요.`
          : previewOk
            ? isEnglish
              ? `Saved locally. Auto-share failed — tap “Sync again”.`
              : `이 기기에는 넣었어요. 자동 올리기는 실패해서 「다시 맞추기」를 눌러 주세요.`
            : isEnglish
              ? `Added to the list, but preview/share failed. Retry attach or sync.`
              : `목록에는 넣었어요. 미리보기·자동 올리기는 실패했어요. 「미리보기 파일 넣기」나 「다시 맞추기」를 해 주세요.`,
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

  async function onShareAgain() {
    if (shareBusy || items.length === 0) return;
    const lock = await askShareBossLock();
    if (!lock.ok) {
      setMessage(lock.message);
      return;
    }
    setShareBusy(true);
    let ok = 0;
    const next = [...items];
    try {
      for (let i = 0; i < next.length; i += 1) {
        const item = next[i];
        if (item.publicUrl && item.storagePath) {
          ok += 1;
          continue;
        }
        try {
          next[i] = await publishUnreleasedItemWithFile(lang, item);
          ok += 1;
        } catch {
          /* keep local */
        }
      }
      persist(next);
      if (ok === next.length) {
        setSharedOk(true);
        setMessage(
          `확인했어요. 인터넷에 미공개 ${ok}개가 있어요. 다른 기기에서 새로고침 해 보세요.`,
        );
      } else {
        setSharedOk(false);
        setMessage(
          `${ok}개는 맞췄어요. 나머지는 다시 눌러 주세요. 원본은 지우지 않았어요.`,
        );
      }
    } finally {
      setShareBusy(false);
    }
  }

  async function onRemove(id: string) {
    const target = items.find((it) => it.id === id);
    if (!target) return;
    // 이 항목 미리보기만 뺌. 다른 원본·6번 목록은 건드리지 않음.
    await deleteMediaPreview(id);
    await removeUnreleasedItemAction(lang, id, target.storagePath);
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
      } else if (target.publicUrl) {
        try {
          const res = await fetch(target.publicUrl);
          if (res.ok) {
            const blob = await res.blob();
            if (blob.size > 0) {
              downloadBlob(blob, target.name || `${target.title}.mp4`);
            }
          }
        } catch {
          /* 다운로드 실패해도 목록 옮기기는 계속 */
        }
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
      writeUnreleasedMediaStoreAllowEmpty(lang, { items: nextUnreleased });
      setItems(nextUnreleased);
      await removeUnreleasedItemAction(lang, id, target.storagePath);

      const slot = watchSlotLabel(watchItem);
      setMessage(
        preview?.blob || target.publicUrl
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
      <div className="watch-share-box" aria-label="다른 기기에 맞추기">
        <p className="tiny muted">
          {sharedOk
            ? "새 미공개 영상은 넣을 때 자동으로 다른 기기에도 맞춰져요. 원본은 지우지 않아요."
            : "새 영상은 넣을 때 자동으로 올라가요. 예전에 안 올린 것만 「다시 맞추기」로 한 번 맞추면 돼요."}
        </p>
        <p className="tiny muted">지금 이 기기 미공개 {items.length}개</p>
        <button
          type="button"
          className="btn btn-soft btn-wide"
          disabled={shareBusy || adding || items.length === 0}
          onClick={() => void onShareAgain()}
        >
          {shareBusy ? "맞추는 중…" : "예전에 안 올린 영상 다시 맞추기"}
        </button>
      </div>

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
            ? "English-market videos that are finished but not on YouTube yet. Pick a file, type a title (English OK), then save. It also shares to other devices automatically."
            : "한국어 시장용으로, 만들기는 끝났지만 아직 유튜브에 안 올린 영상을 모아 두는 방이에요. 넣으면 다른 기기에도 자동으로 맞춰져요. 한국어·영어 목록은 서로 섞이지 않아요."}
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
                    remoteUrl={item.publicUrl}
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
                      onAttached={() => {
                        setPreviewTicks((prev) => ({
                          ...prev,
                          [item.id]: (prev[item.id] ?? 0) + 1,
                        }));
                        void publishUnreleasedItemWithFile(lang, item)
                          .then((saved) => {
                            setItems((prev) => {
                              const next = prev.map((it) =>
                                it.id === saved.id ? saved : it,
                              );
                              writeUnreleasedMediaStore(lang, { items: next });
                              return next;
                            });
                            setSharedOk(true);
                          })
                          .catch(() => {
                            setSharedOk(false);
                          });
                      }}
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
