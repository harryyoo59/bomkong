"use client";

import { useEffect, useState } from "react";
import { AdminEmptyText } from "@/components/AdminEmptyText";
import {
  characterShelfLabel,
  makeCharacterPhotoId,
  readCharacterPhotoStore,
  writeCharacterPhotoStore,
  type CharacterPhotoItem,
  type CharacterShelf,
} from "@/lib/character-photos";
import type { RoomKey } from "@/lib/admin-copy";

type Props = {
  shelf: CharacterShelf;
};

export function CharacterPhotoShelf({ shelf }: Props) {
  const who = characterShelfLabel(shelf);
  const [items, setItems] = useState<CharacterPhotoItem[]>([]);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState("");
  const [fileLabel, setFileLabel] = useState("");
  const [pendingFile, setPendingFile] = useState<{ name: string } | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    const store = readCharacterPhotoStore(shelf);
    setItems(store.items);
    setReady(true);
  }, [shelf]);

  function persist(next: CharacterPhotoItem[]) {
    writeCharacterPhotoStore(shelf, { items: next });
    setItems(next);
  }

  function onPickFile(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      setPendingFile(null);
      setFileLabel("");
      return;
    }
    const file = fileList[0];
    if (!file.type.startsWith("image/") && !/\.(png|jpe?g|gif|webp|heic|bmp|avif)$/i.test(file.name)) {
      setMessage("사진 파일만 넣을 수 있어요.");
      setPendingFile(null);
      setFileLabel("");
      return;
    }
    setPendingFile({ name: file.name });
    setFileLabel(file.name);
    setMessage("");
  }

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingFile) {
      setMessage("사진 파일을 먼저 골라 주세요.");
      return;
    }
    const item: CharacterPhotoItem = {
      id: makeCharacterPhotoId(shelf),
      name: pendingFile.name,
      note: note.trim(),
      addedAt: new Date().toISOString(),
    };
    persist([item, ...items]);
    setMessage(`「${item.name}」을(를) ${who} 사진 보관에 넣었어요.`);
    setNote("");
    setPendingFile(null);
    setFileLabel("");
    setFormKey((k) => k + 1);
  }

  function onRemove(id: string) {
    const target = items.find((it) => it.id === id);
    if (!target) return;
    persist(items.filter((it) => it.id !== id));
    setMessage(`「${target.name}」을(를) 목록에서 빼 두었어요.`);
  }

  if (!ready) {
    return <p className="muted">목록을 불러오는 중이에요…</p>;
  }

  return (
    <div className="admin-wrap">
      <form key={formKey} className="admin-form" onSubmit={onAdd}>
        <p className="form-hint">
          {who} 영상규칙에 쓸 사진을 모아 두는 방이에요. 파일은 이름만 이
          기기에 기억해요. 인터넷 저장소는 아직 없어요.
        </p>

        <label>
          사진 고르기
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onPickFile(e.target.files)}
          />
          <span className="file-note">
            {fileLabel ? `선택: ${fileLabel}` : "아직 안 고름"}
          </span>
        </label>

        <label>
          짧은 메모 (선택)
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={`예: ${who} 옆모습 · 규칙 참고용`}
          />
        </label>

        <button type="submit" className="btn btn-primary btn-wide">
          {who} 사진 보관에 넣기
        </button>
      </form>

      {message ? <p className="form-msg">{message}</p> : null}

      <section>
        <h2 className="section-title">보관 중인 사진</h2>
        <p className="muted tiny">
          {who} 칸 아래 사진 보관이에요. 영상규칙에만 쓰는 자료예요.
        </p>
        {items.length === 0 ? (
          <AdminEmptyText
            roomKey={
              (shelf === "bomi" ? "bomi-photos" : "kongi-photos") as RoomKey
            }
          />
        ) : (
          <ul className="admin-ep-list">
            {items.map((item) => (
              <li key={item.id} className="admin-ep-item">
                <div>
                  <strong>사진 · {item.name}</strong>
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
                <button
                  type="button"
                  className="btn btn-soft"
                  onClick={() => onRemove(item.id)}
                >
                  목록에서 빼기
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
