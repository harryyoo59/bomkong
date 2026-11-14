"use client";

import { useEffect, useState } from "react";
import { AdminEmptyText } from "@/components/AdminEmptyText";
import { AdminMediaPreview } from "@/components/AdminMediaPreview";
import {
  deleteMediaPreview,
  getMediaPreview,
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

/** AI 채팅에 붙여 넣을 수 있게 사진을 PNG로 만듦 */
async function blobToPng(blob: Blob): Promise<Blob> {
  if (blob.type === "image/png") return blob;
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("사진을 읽지 못했어요."));
      el.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    if (canvas.width < 1 || canvas.height < 1) {
      throw new Error("사진을 복사하지 못했어요.");
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("사진을 복사하지 못했어요.");
    ctx.drawImage(img, 0, 0);
    const png = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/png");
    });
    if (!png) throw new Error("사진을 복사하지 못했어요.");
    return png;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function preparePngBlob(itemId: string): Promise<Blob> {
  const record = await getMediaPreview(itemId);
  if (!record?.blob) {
    throw new Error("사진이 없어요. 갤러리에 사진을 다시 넣어 주세요.");
  }
  return blobToPng(record.blob);
}

async function downloadPngFallback(
  itemId: string,
  fileName: string,
): Promise<void> {
  const png = await preparePngBlob(itemId);
  const url = URL.createObjectURL(png);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.replace(/\.[^.]+$/, "") + ".png" || "photo.png";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
}

/**
 * 사진 복사.
 * 사파리 등은 클릭 직후에 clipboard.write를 바로 호출해야 함.
 * (먼저 await 하면 막힘 → ClipboardItem에 Promise를 넣음)
 */
function copyPhotoToClipboard(itemId: string, fileName: string): Promise<void> {
  const canWriteImage =
    typeof navigator !== "undefined" &&
    Boolean(navigator.clipboard?.write) &&
    typeof ClipboardItem !== "undefined" &&
    !/firefox/i.test(navigator.userAgent || "");

  const pngPromise = preparePngBlob(itemId);

  if (!canWriteImage) {
    return downloadPngFallback(itemId, fileName).then(() => {
      throw new Error(
        "이 기기에서는 복사가 안 돼서 사진 파일로 받아 두었어요. AI에 그 파일을 넣어 주세요.",
      );
    });
  }

  // 클릭 제스처 안에서 바로 write 호출 (사파리 필수)
  return navigator.clipboard
    .write([
      new ClipboardItem({
        "image/png": pngPromise,
      }),
    ])
    .catch(async () => {
      // 일부 브라우저는 Promise 값을 못 받아서, 만든 뒤 한 번 더 시도
      try {
        const png = await pngPromise;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": png }),
        ]);
      } catch {
        await downloadPngFallback(itemId, fileName);
        throw new Error(
          "복사가 안 돼서 사진 파일로 받아 두었어요. AI에 그 파일을 넣어 주세요.",
        );
      }
    });
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
    const failNames: string[] = [];

    try {
      // 아이폰 등은 첫 장 저장(await) 뒤 다음 파일이 비는 경우가 있어,
      // 고른 사진을 먼저 전부 복사해 둠
      const snapshots: { name: string; blob: Blob }[] = [];
      for (const file of pendingFiles) {
        try {
          const buffer = await file.arrayBuffer();
          snapshots.push({
            name: file.name,
            blob: new Blob([buffer], {
              type: file.type || "application/octet-stream",
            }),
          });
        } catch {
          failNames.push(file.name || "사진");
        }
      }

      for (const snap of snapshots) {
        const item: CharacterPhotoItem = {
          id: makeCharacterPhotoId(shelf),
          name: snap.name,
          note: "",
          addedAt: new Date().toISOString(),
        };
        try {
          await saveMediaPreview(item.id, snap.blob, "photo", snap.name);
          added.push(item);
        } catch (err) {
          failNames.push(snap.name || "사진");
          if (
            err instanceof Error &&
            err.message.includes("자리가 부족")
          ) {
            setMessage(err.message);
            break;
          }
        }
      }

      if (added.length > 0) {
        const next = [...added, ...items];
        persist(next);
        setPreviewTicks((prev) => {
          const copy = { ...prev };
          for (const it of added) {
            copy[it.id] = (copy[it.id] ?? 0) + 1;
          }
          return copy;
        });
      }

      if (added.length > 0 && failNames.length === 0) {
        setMessage(
          `${who} 사진 보관에 ${added.length}장을 갤러리에 넣었어요.`,
        );
      } else if (added.length > 0 && failNames.length > 0) {
        setMessage(
          `${added.length}장은 넣었어요. ${failNames.length}장은 못 넣었어요. 다시 골라 주세요.`,
        );
      } else if (failNames.length > 0) {
        setMessage(
          "사진을 넣지 못했어요. 파일이 너무 크거나, 이 기기 자리가 부족할 수 있어요. 다시 해 주세요.",
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

  async function onCopy(id: string, fileName: string) {
    try {
      await copyPhotoToClipboard(id, fileName);
      setMessage("사진을 복사했어요. AI 채팅에 붙여 넣으면 돼요.");
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "사진을 복사하지 못했어요. 다시 해 주세요.",
      );
    }
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
          {who} 칸 아래 사진 보관이에요. 「복사하기」로 사진을 복사한 뒤 AI에게
          붙여 넣으면 돼요.
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
                <div className="character-photo-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-wide"
                    onClick={() => void onCopy(item.id, item.name)}
                  >
                    복사하기
                  </button>
                  <button
                    type="button"
                    className="btn btn-soft btn-wide"
                    onClick={() => void onRemove(item.id)}
                  >
                    빼기
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
