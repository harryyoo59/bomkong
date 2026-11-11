"use client";

import { useEffect, useState } from "react";
import { AdminEmptyText } from "@/components/AdminEmptyText";
import { AdminMediaPreview } from "@/components/AdminMediaPreview";
import { AdminPreviewAttach } from "@/components/AdminPreviewAttach";
import {
  deleteMediaPreview,
  saveMediaPreview,
} from "@/lib/media-preview-store";
import {
  makePublicId,
  readPublicMediaStore,
  writePublicMediaStore,
  type PublicItem,
} from "@/lib/public-media";

export function PublicVideoRoom() {
  const [items, setItems] = useState<PublicItem[]>([]);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [note, setNote] = useState("");
  const [fileLabel, setFileLabel] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [previewTicks, setPreviewTicks] = useState<Record<string, number>>(
    {},
  );

  useEffect(() => {
    const store = readPublicMediaStore();
    setItems(store.items);
    setReady(true);
  }, []);

  function persist(next: PublicItem[]) {
    writePublicMediaStore({ items: next });
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
      setMessage("공개한 원본 동영상 파일을 먼저 골라 주세요.");
      return;
    }
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setMessage("공개한 영상 제목을 적어 주세요.");
      return;
    }
    const item: PublicItem = {
      id: makePublicId(),
      name: pendingFile.name,
      title: trimmedTitle,
      youtubeUrl: youtubeUrl.trim(),
      note: note.trim(),
      addedAt: new Date().toISOString(),
      youtubeStatus: "public",
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
        ? `「${item.title}」을(를) 공개 영상실에 넣었어요. 옆에 미리보기가 보여요.`
        : `목록에는 넣었어요. 미리보기는 저장하지 못했어요. 「미리보기 파일 넣기」로 다시 해 주세요.`,
    );
    setTitle("");
    setYoutubeUrl("");
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

  if (!ready) {
    return <p className="muted">목록을 불러오는 중이에요…</p>;
  }

  return (
    <div className="admin-wrap">
      <form key={formKey} className="admin-form" onSubmit={onAdd}>
        <p className="form-hint">
          유튜브에 공개한 뒤의 원본 파일과 제목을 모아 두는 방이에요. 파일을
          고르면 옆에 작은 미리보기가 이 기기에만 저장돼요. 예전에 이름만 넣은
          항목은 「미리보기 파일 넣기」로 다시 넣어 주세요.
        </p>

        <label>
          원본 동영상 고르기
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
          공개한 영상 제목
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 공원에서 공 놀이"
            required
          />
        </label>

        <label>
          유튜브 주소 (선택)
          <input
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="예: https://youtu.be/…"
            inputMode="url"
          />
        </label>

        <label>
          짧은 메모 (선택)
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="예: 쇼츠로 공개 · 썸네일 A안"
          />
        </label>

        <button type="submit" className="btn btn-primary btn-wide">
          공개 영상실에 넣기
        </button>
      </form>

      {message ? <p className="form-msg">{message}</p> : null}

      <section>
        <h2 className="section-title">공개한 원본</h2>
        <p className="muted tiny">
          이 기기에만 기억해요. 새로고침해도 남아 있어요. 서버 저장은 아직
          없어요.
        </p>
        {items.length === 0 ? (
          <AdminEmptyText roomKey="public" />
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
                    <p className="tiny muted">원본 · {item.name}</p>
                    {item.youtubeUrl ? (
                      <p className="tiny muted">주소 · {item.youtubeUrl}</p>
                    ) : null}
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
                <div className="vault-action-row">
                  <span className="pair-chip">공개함</span>
                  <button
                    type="button"
                    className="btn btn-soft"
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
