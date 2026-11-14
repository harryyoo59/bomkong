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
import {
  uploadShortViaServer,
  type YoutubePrivacyStatus,
} from "@/lib/youtube-client-upload";

type YoutubeStatus = {
  configured: boolean;
  canStartOAuth: boolean;
  missing: string[];
  channelHint: string;
};

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
  const [ytStatus, setYtStatus] = useState<YoutubeStatus | null>(null);
  const [ytStatusError, setYtStatusError] = useState("");
  const [shortsId, setShortsId] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<YoutubePrivacyStatus>("private");
  const [repickFile, setRepickFile] = useState<File | null>(null);
  const [repickLabel, setRepickLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [lastUploadUrl, setLastUploadUrl] = useState("");
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
    setShortsId(null);
    setFormKey((k) => k + 1);
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/youtube/status");
        const data = (await res.json()) as {
          ok?: boolean;
          configured?: boolean;
          canStartOAuth?: boolean;
          missing?: string[];
          channelHint?: string;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || data.ok !== true) {
          setYtStatusError(
            data.error || "유튜브 연결 상태를 확인하지 못했어요.",
          );
          return;
        }
        setYtStatus({
          configured: Boolean(data.configured),
          canStartOAuth: Boolean(data.canStartOAuth),
          missing: Array.isArray(data.missing) ? data.missing : [],
          channelHint: data.channelHint || "봄이콩이 채널",
        });
      } catch {
        if (!cancelled) {
          setYtStatusError("유튜브 연결 상태를 확인하지 못했어요.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
    setShortsId(null);
    setMessage("");
  }

  function cancelMove() {
    setMoveId(null);
    setMoveYoutubeUrl("");
  }

  function startShorts(id: string) {
    setShortsId(id);
    setMoveId(null);
    setPrivacy("private");
    setRepickFile(null);
    setRepickLabel("");
    setUploadPct(0);
    setLastUploadUrl("");
    setMessage("");
  }

  function cancelShorts() {
    if (uploading) return;
    setShortsId(null);
    setRepickFile(null);
    setRepickLabel("");
    setUploadPct(0);
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
    setMessage(
      `「${target.title}」을(를) 공개 영상실로 옮겼어요. 제목은 그대로 두었어요.`,
    );
    cancelMove();
  }

  async function confirmShortsUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!shortsId || uploading) return;
    const target = items.find((it) => it.id === shortsId);
    if (!target) {
      setMessage("올릴 영상을 찾지 못했어요.");
      cancelShorts();
      return;
    }

    let file: Blob | File | null = repickFile;
    let fileName = repickFile?.name || target.name;

    if (!file) {
      const preview = await getMediaPreview(target.id);
      if (preview?.blob) {
        file = preview.blob;
        fileName = target.name || "short.mp4";
      }
    }

    if (!file) {
      setMessage(
        "이 기기에 영상 파일이 없어요. 아래에서 같은 파일을 다시 골라 주세요.",
      );
      return;
    }

    setUploading(true);
    setUploadPct(0);
    setMessage(`「${target.title}」을(를) 유튜브 숏츠로 올리는 중이에요…`);

    try {
      const result = await uploadShortViaServer({
        file,
        title: target.title,
        privacyStatus: privacy,
        note: "",
        fileName,
        onProgress: (p) => {
          if (p.totalBytes <= 0) {
            setUploadPct(0);
            return;
          }
          setUploadPct(
            Math.min(99, Math.round((p.sentBytes / p.totalBytes) * 100)),
          );
        },
      });

      const url = result.shortsUrl || result.watchUrl;
      setLastUploadUrl(url);
      setUploadPct(100);
      setMessage(
        `「${target.title}」을(를) 유튜브에 올렸어요. 주소: ${url}`,
      );
      setShortsId(null);
      setRepickFile(null);
      setRepickLabel("");
      // 바로 공개 영상실로 옮기기 폼 열기 (주소 채움)
      startMove(target.id, url);
    } catch (err) {
      const text =
        err instanceof Error
          ? err.message
          : "유튜브 올리기에 실패했어요. 잠시 후 다시 해 주세요.";
      setMessage(text);
    } finally {
      setUploading(false);
    }
  }

  if (!ready) {
    return <p className="muted">목록을 불러오는 중이에요…</p>;
  }

  const ytReady = Boolean(ytStatus?.configured);

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

      <div className="yt-status-box">
        {ytStatusError ? (
          <p className="tiny muted">{ytStatusError}</p>
        ) : ytStatus == null ? (
          <p className="tiny muted">유튜브 연결 상태 확인 중…</p>
        ) : ytReady ? (
          <p className="tiny muted">
            유튜브 연결됨 · {ytStatus.channelHint}
          </p>
        ) : (
          <p className="tiny muted">
            유튜브 연결 전이에요. 숏츠로 올리려면{" "}
            <Link href="/admin/youtube-connect">연결 안내</Link>
            에서 비밀 값을 넣어야 해요.
            {ytStatus.missing.length
              ? ` (없는 값: ${ytStatus.missing.join(", ")})`
              : ""}
          </p>
        )}
      </div>

      {message ? <p className="form-msg">{message}</p> : null}
      {lastUploadUrl ? (
        <p className="tiny muted">
          마지막 올린 주소 ·{" "}
          <a href={lastUploadUrl} target="_blank" rel="noreferrer">
            {lastUploadUrl}
          </a>
        </p>
      ) : null}

      <section>
        <h2 className="section-title">
          아직 유튜브에 안 올린 영상 · {langLabel}
        </h2>
        <p className="muted tiny">
          「유튜브 숏츠로 올리기」로 채널에 올린 뒤, 「공개 영상실로 옮기기」로
          보관할 수 있어요. 제목은 그대로 가져가요.
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

                {shortsId === item.id ? (
                  <form
                    className="admin-form vault-move-form"
                    onSubmit={confirmShortsUpload}
                  >
                    <p className="tiny muted">
                      「{item.title}」을(를) 봄이콩이 채널 숏츠로 올립니다.
                      세로 영상이 좋아요.
                    </p>
                    <label>
                      공개 범위
                      <select
                        value={privacy}
                        onChange={(e) =>
                          setPrivacy(e.target.value as YoutubePrivacyStatus)
                        }
                        disabled={uploading}
                      >
                        <option value="private">비공개</option>
                        <option value="unlisted">일부공개</option>
                        <option value="public">공개</option>
                      </select>
                    </label>
                    <label>
                      영상 파일이 없을 때만 · 다시 고르기
                      <input
                        type="file"
                        accept={videoAccept}
                        disabled={uploading}
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null;
                          setRepickFile(f);
                          setRepickLabel(f?.name || "");
                        }}
                      />
                      <span className="file-note">
                        {repickLabel
                          ? `선택: ${repickLabel}`
                          : "미리보기에 파일이 있으면 다시 안 골라도 돼요"}
                      </span>
                    </label>
                    {uploading ? (
                      <p className="tiny muted">올리는 중… {uploadPct}%</p>
                    ) : null}
                    <div className="vault-action-row">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={uploading || !ytReady}
                      >
                        {uploading ? "올리는 중…" : "올리기 확인"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-soft"
                        onClick={cancelShorts}
                        disabled={uploading}
                      >
                        취소
                      </button>
                    </div>
                    {!ytReady ? (
                      <p className="tiny muted">
                        아직 유튜브 연결 전이에요.{" "}
                        <Link href="/admin/youtube-connect">연결 안내</Link>
                      </p>
                    ) : null}
                  </form>
                ) : moveId === item.id ? (
                  <form
                    className="admin-form vault-move-form"
                    onSubmit={confirmMove}
                  >
                    <p className="tiny muted">
                      제목 「{item.title}」을(를) 그대로 공개 영상실로
                      옮깁니다.
                    </p>
                    <label>
                      유튜브 주소 (선택)
                      <input
                        value={moveYoutubeUrl}
                        onChange={(e) => setMoveYoutubeUrl(e.target.value)}
                        placeholder="예: https://youtube.com/shorts/…"
                        inputMode="url"
                        autoFocus
                      />
                    </label>
                    <div className="vault-action-row">
                      <button type="submit" className="btn btn-primary">
                        옮기기 확인
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
                      onClick={() => startShorts(item.id)}
                    >
                      유튜브 숏츠로 올리기
                    </button>
                    <button
                      type="button"
                      className="btn btn-soft"
                      onClick={() => startMove(item.id)}
                    >
                      공개 영상실로 옮기기
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
