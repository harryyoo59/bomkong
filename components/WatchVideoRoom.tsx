"use client";

import { useEffect, useState } from "react";
import { AdminEmptyText } from "@/components/AdminEmptyText";
import { AdminMediaPreview } from "@/components/AdminMediaPreview";
import {
  deleteMediaPreview,
  saveMediaPreview,
} from "@/lib/media-preview-store";
import {
  makeWatchId,
  readWatchMediaStore,
  writeWatchMediaStore,
  type WatchItem,
} from "@/lib/watch-media";

export function WatchVideoRoom() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [fileLabel, setFileLabel] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    const store = readWatchMediaStore();
    setItems(store.items);
    setReady(true);
  }, []);

  function persist(next: WatchItem[]) {
    writeWatchMediaStore({ items: next });
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
      setMessage("아이들 보여줄 동영상 파일을 먼저 골라 주세요.");
      return;
    }
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setMessage("영상 제목을 적어 주세요.");
      return;
    }
    const item: WatchItem = {
      id: makeWatchId(),
      name: pendingFile.name,
      title: trimmedTitle,
      note: note.trim(),
      addedAt: new Date().toISOString(),
    };
    try {
      await saveMediaPreview(item.id, pendingFile, "video");
    } catch {
      setMessage("미리보기를 저장하지 못했어요. 목록에는 이름만 넣을게요.");
    }
    persist([item, ...items]);
    setMessage(
      `「${item.title}」을(를) 영상보기 방에 넣었어요. 거실 영상보기에서만 보여요.`,
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

  if (!ready) {
    return <p className="muted">목록을 불러오는 중이에요…</p>;
  }

  return (
    <div className="admin-wrap">
      <form key={formKey} className="admin-form" onSubmit={onAdd}>
        <p className="form-hint">
          거실에서 아이들이 「영상보기」를 누르면 여기 넣은 영상만 나와요.
          공개·미공개·소스·쿠키 방과는 섞이지 않아요. 파일은 이름만 이 기기에
          기억해요.
        </p>

        <label>
          동영상 고르기
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
            placeholder="예: 거실에 먼저 보여 줄 영상"
          />
        </label>

        <button type="submit" className="btn btn-primary btn-wide">
          영상보기 방에 넣기
        </button>
      </form>

      {message ? <p className="form-msg">{message}</p> : null}

      <section>
        <h2 className="section-title">거실에 보이는 영상</h2>
        <p className="muted tiny">
          이 기기에만 기억해요. 비어 있으면 거실에도 빈 화면이 나와요.
        </p>
        {items.length === 0 ? (
          <AdminEmptyText roomKey="watch" />
        ) : (
          <ul className="admin-ep-list">
            {items.map((item) => (
              <li key={item.id} className="admin-ep-item">
                <div className="admin-ep-main">
                  <AdminMediaPreview
                    itemId={item.id}
                    kindHint="video"
                    label={item.title}
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
                  </div>
                </div>
                <div className="vault-action-row">
                  <span className="pair-chip pair-ok">거실 영상보기</span>
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
