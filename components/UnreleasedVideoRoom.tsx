"use client";

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
  writeUnreleasedMediaStore,
  type UnreleasedItem,
} from "@/lib/unreleased-media";

export function UnreleasedVideoRoom() {
  const [items, setItems] = useState<UnreleasedItem[]>([]);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [fileLabel, setFileLabel] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [moveId, setMoveId] = useState<string | null>(null);
  const [moveYoutubeUrl, setMoveYoutubeUrl] = useState("");
  const [previewTicks, setPreviewTicks] = useState<Record<string, number>>(
    {},
  );

  useEffect(() => {
    const store = readUnreleasedMediaStore();
    setItems(store.items);
    setReady(true);
  }, []);

  function persist(next: UnreleasedItem[]) {
    writeUnreleasedMediaStore({ items: next });
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
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingFile) {
      setMessage("완성된 동영상 파일을 먼저 골라 주세요.");
      return;
    }
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setMessage("영상 제목을 적어 주세요.");
      return;
    }
    const item: UnreleasedItem = {
      id: makeUnreleasedId(),
      name: pendingFile.name,
      title: trimmedTitle,
      note: note.trim(),
      addedAt: new Date().toISOString(),
      youtubeStatus: "not_uploaded",
    };
    let previewOk = true;
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
        ? `「${item.title}」을(를) 미공개 영상실에 넣었어요. 옆에 미리보기가 보여요.`
        : `목록에는 넣었어요. 미리보기는 저장하지 못했어요. 「미리보기 파일 넣기」로 다시 해 주세요.`,
    );
    setTitle("");
    setNote("");
    setPendingFile(null);
    setFileLabel("");
    setFormKey((k) => k + 1);
  }

  async function onRemove(id: string) {
    const target = items.find((it) => it.id === id);
    if (!target) return;
    await deleteMediaPreview(id);
    persist(items.filter((it) => it.id !== id));
    setMessage(`「${target.title}」을(를) 목록에서 빼 두었어요.`);
  }

  function startMove(id: string) {
    setMoveId(id);
    setMoveYoutubeUrl("");
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

    const publicId = makePublicId();
    const nextUnreleased = items.filter((it) => it.id !== moveId);
    const publicStore = readPublicMediaStore();
    const nextPublic = [
      {
        id: publicId,
        name: target.name,
        title: target.title,
        youtubeUrl: moveYoutubeUrl.trim(),
        note: target.note,
        addedAt: new Date().toISOString(),
        youtubeStatus: "public" as const,
        fromUnreleasedId: target.id,
      },
      ...publicStore.items,
    ];

    await moveMediaPreview(target.id, publicId);
    writeUnreleasedMediaStore({ items: nextUnreleased });
    writePublicMediaStore({ items: nextPublic });
    setItems(nextUnreleased);
    setMessage(
      `「${target.title}」을(를) 공개 영상실로 옮겼어요. 제목은 그대로 두었어요.`,
    );
    cancelMove();
  }

  if (!ready) {
    return <p className="muted">목록을 불러오는 중이에요…</p>;
  }

  return (
    <div className="admin-wrap">
      <form key={formKey} className="admin-form" onSubmit={onAdd}>
        <p className="form-hint">
          만들기는 끝났지만 아직 유튜브에 안 올린 영상을 모아 두는 방이에요.
          파일을 고르면 옆에 작은 미리보기가 이 기기에만 저장돼요. 예전에
          이름만 넣은 항목은 「미리보기 파일 넣기」로 다시 넣어 주세요.
        </p>

        <label>
          완성된 동영상 고르기
          <input
            type="file"
            accept="video/*"
            onChange={(e) => onPickFile(e.target.files)}
          />
          <span className="file-note">
            {fileLabel ? `선택: ${fileLabel}` : "아직 안 고름"}
          </span>
        </label>

        <label>
          영상 제목
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 공원에서 공 놀이"
            required
          />
        </label>

        <label>
          짧은 메모 (선택)
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="예: 올리기 전에 자막만 더 볼 것"
          />
        </label>

        <button type="submit" className="btn btn-primary btn-wide">
          미공개 영상실에 넣기
        </button>
      </form>

      {message ? <p className="form-msg">{message}</p> : null}

      <section>
        <h2 className="section-title">아직 유튜브에 안 올린 영상</h2>
        <p className="muted tiny">
          공개한 뒤에는 「공개 영상실로 옮기기」를 눌러 주세요. 제목은 그대로
          가져가요.
        </p>
        {items.length === 0 ? (
          <AdminEmptyText roomKey="unreleased" />
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
                    {item.note ? (
                      <p className="tiny muted">{item.note}</p>
                    ) : null}
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
                      accept="video/*"
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
                      제목 「{item.title}」을(를) 그대로 공개 영상실로
                      옮깁니다.
                    </p>
                    <label>
                      유튜브 주소 (선택)
                      <input
                        value={moveYoutubeUrl}
                        onChange={(e) => setMoveYoutubeUrl(e.target.value)}
                        placeholder="예: https://youtu.be/…"
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
