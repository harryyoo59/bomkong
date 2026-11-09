"use client";

import { useEffect, useState } from "react";
import {
  makeUploadedId,
  readUploadedMediaStore,
  writeUploadedMediaStore,
  type UploadedItem,
} from "@/lib/uploaded-media";

export function UploadedVideoRoom() {
  const [items, setItems] = useState<UploadedItem[]>([]);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [note, setNote] = useState("");
  const [fileLabel, setFileLabel] = useState("");
  const [pendingFile, setPendingFile] = useState<{ name: string } | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    const store = readUploadedMediaStore();
    setItems(store.items);
    setReady(true);
  }, []);

  function persist(next: UploadedItem[]) {
    writeUploadedMediaStore({ items: next });
    setItems(next);
  }

  function onPickFile(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      setPendingFile(null);
      setFileLabel("");
      return;
    }
    const file = fileList[0];
    setPendingFile({ name: file.name });
    setFileLabel(file.name);
  }

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingFile) {
      setMessage("유튜브에 올린 원본 동영상 파일을 먼저 골라 주세요.");
      return;
    }
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setMessage("유튜브에 올린 제목을 적어 주세요.");
      return;
    }
    const item: UploadedItem = {
      id: makeUploadedId(),
      name: pendingFile.name,
      title: trimmedTitle,
      youtubeUrl: youtubeUrl.trim(),
      note: note.trim(),
      addedAt: new Date().toISOString(),
      youtubeStatus: "uploaded",
    };
    persist([item, ...items]);
    setMessage(
      `「${item.title}」을(를) 유튜브 올린 영상실에 넣었어요. 원본과 제목을 기억해 둘게요.`,
    );
    setTitle("");
    setYoutubeUrl("");
    setNote("");
    setPendingFile(null);
    setFileLabel("");
    setFormKey((k) => k + 1);
  }

  function onRemove(id: string) {
    const target = items.find((it) => it.id === id);
    if (!target) return;
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
          이미 유튜브에 올린 영상의 원본 파일과 제목을 모아 두는 방이에요.
          파일은 이름만 이 기기에 기억해요. 인터넷 저장소는 아직 없어요.
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
          유튜브에 올린 제목
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
            placeholder="예: 쇼츠로 올림 · 썸네일 A안"
          />
        </label>

        <button type="submit" className="btn btn-primary btn-wide">
          유튜브 올린 영상실에 넣기
        </button>
      </form>

      {message ? <p className="form-msg">{message}</p> : null}

      <section>
        <h2 className="section-title">유튜브에 올린 원본</h2>
        <p className="muted tiny">
          이 기기에만 기억해요. 새로고침해도 남아 있어요. 서버 저장은 아직
          없어요.
        </p>
        {items.length === 0 ? (
          <p className="muted">아직 넣어 둔 유튜브 올린 영상이 없어요.</p>
        ) : (
          <ul className="admin-ep-list">
            {items.map((item) => (
              <li key={item.id} className="admin-ep-item">
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
                </div>
                <div className="vault-action-row">
                  <span className="pair-chip">유튜브에 올림</span>
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
