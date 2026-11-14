"use client";

import { useEffect, useState } from "react";
import { AdminEmptyText } from "@/components/AdminEmptyText";
import { AdminMediaPreview } from "@/components/AdminMediaPreview";
import {
  deleteMediaPreview,
  saveMediaPreview,
} from "@/lib/media-preview-store";
import {
  characterPhotoRoomKey,
  characterShelfLabel,
  makeCharacterPhotoId,
  readCharacterPhotoStore,
  writeCharacterPhotoStore,
  type CharacterPhotoItem,
  type CharacterShelf,
} from "@/lib/character-photos";

type Props = {
  shelf: CharacterShelf;
};

function isImageFile(file: File): boolean {
  return (
    file.type.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|heic|bmp|avif)$/i.test(file.name)
  );
}

export function CharacterPhotoShelf({ shelf }: Props) {
  const who = characterShelfLabel(shelf);
  const [items, setItems] = useState<CharacterPhotoItem[]>([]);
  const [ready, setReady] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [previewTicks, setPreviewTicks] = useState<Record<string, number>>(
    {},
  );

  useEffect(() => {
    const store = readCharacterPhotoStore(shelf);
    setItems(store.items);
    setReady(true);
    setPendingFiles([]);
    setMessage("");
    setFormKey((k) => k + 1);
  }, [shelf]);

  function persist(next: CharacterPhotoItem[]) {
    writeCharacterPhotoStore(shelf, { items: next });
    setItems(next);
  }

  function onPickFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      setPendingFiles([]);
      return;
    }
    const picked = Array.from(fileList).filter(isImageFile);
    if (picked.length === 0) {
      setMessage("사진 파일만 넣을 수 있어요.");
      setPendingFiles([]);
      return;
    }
    if (picked.length < fileList.length) {
      setMessage(
        `사진만 ${picked.length}장 골랐어요. (사진이 아닌 파일은 빼 두었어요.)`,
      );
    } else {
      setMessage("");
    }
    setPendingFiles(picked);
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (pendingFiles.length === 0) {
      setMessage("사진을 먼저 골라 주세요. 여러 장도 한 번에 고를 수 있어요.");
      return;
    }

    setSaving(true);
    const added: CharacterPhotoItem[] = [];
    let previewFail = 0;

    try {
      for (const file of pendingFiles) {
        const item: CharacterPhotoItem = {
          id: makeCharacterPhotoId(shelf),
          name: file.name,
          note: "",
          addedAt: new Date().toISOString(),
        };
        try {
          await saveMediaPreview(item.id, file, "photo");
        } catch {
          previewFail += 1;
        }
        added.push(item);
      }

      const next = [...added, ...items];
      persist(next);
      setPreviewTicks((prev) => {
        const copy = { ...prev };
        for (const it of added) {
          copy[it.id] = (copy[it.id] ?? 0) + 1;
        }
        return copy;
      });

      if (previewFail > 0) {
        setMessage(
          `${added.length}장은 목록에 넣었어요. 그중 ${previewFail}장은 사진 보기에 실패했어요.`,
        );
      } else {
        setMessage(
          `${who} 사진 보관에 ${added.length}장을 갤러리에 넣었어요.`,
        );
      }
      setPendingFiles([]);
      setFormKey((k) => k + 1);
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "사진을 넣지 못했어요. 다시 해 주세요.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function onRemove(id: string) {
    const target = items.find((it) => it.id === id);
    if (!target) return;
    await deleteMediaPreview(id);
    persist(items.filter((it) => it.id !== id));
    setMessage(`사진을 갤러리에서 빼 두었어요.`);
  }

  if (!ready) {
    return <p className="muted">목록을 불러오는 중이에요…</p>;
  }

  return (
    <div className="admin-wrap">
      <form key={formKey} className="admin-form" onSubmit={onAdd}>
        <p className="form-hint">
          {who} 영상규칙에 쓸 사진을 <strong>갤러리</strong>처럼 모아 두는
          방이에요. 여러 장을 한 번에 고르면, 한 칸에 사진으로 보여 줘요.
        </p>

        <label>
          사진 고르기 (여러 장 가능)
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => onPickFiles(e.target.files)}
            disabled={saving}
          />
          <span className="file-note">
            {pendingFiles.length > 0
              ? `${pendingFiles.length}장 선택됨`
              : "아직 안 고름 · 여러 장 한꺼번에 골라도 돼요"}
          </span>
        </label>

        <button
          type="submit"
          className="btn btn-primary btn-wide"
          disabled={saving}
        >
          {saving
            ? "넣는 중…"
            : pendingFiles.length > 1
              ? `${pendingFiles.length}장 갤러리에 넣기`
              : `${who} 사진 보관에 넣기`}
        </button>
      </form>

      {message ? <p className="form-msg">{message}</p> : null}

      <section>
        <h2 className="section-title">사진 갤러리</h2>
        <p className="muted tiny">
          {who} 칸 아래 사진 보관이에요. 영상규칙에만 쓰는 자료예요.
        </p>
        {items.length === 0 ? (
          <AdminEmptyText roomKey={characterPhotoRoomKey(shelf)} />
        ) : (
          <ul className="character-photo-gallery">
            {items.map((item) => (
              <li key={item.id} className="character-photo-tile">
                <AdminMediaPreview
                  itemId={item.id}
                  kindHint="photo"
                  label={item.name}
                  refreshToken={previewTicks[item.id] ?? 0}
                />
                <p className="tiny muted character-photo-caption" title={item.name}>
                  {item.name}
                </p>
                <button
                  type="button"
                  className="btn btn-soft btn-wide"
                  onClick={() => void onRemove(item.id)}
                >
                  빼기
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
