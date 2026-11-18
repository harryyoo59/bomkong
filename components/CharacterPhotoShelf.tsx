"use client";

import { useEffect, useState } from "react";
import { AdminEmptyText } from "@/components/AdminEmptyText";
import { AdminMediaPreview } from "@/components/AdminMediaPreview";
import {
  listCharacterPhotosAction,
  publishOneCharacterPhotoAction,
  removeCharacterPhotoAction,
} from "@/app/admin/character-photos/actions";
import {
  deleteMediaPreview,
  getMediaPreview,
  saveMediaPreview,
} from "@/lib/media-preview-store";
import {
  characterPhotoRoomKey,
  characterShelfLabel,
  makeCharacterPhotoId,
  mergeCharacterPhotoLists,
  readCharacterPhotoStore,
  writeCharacterPhotoStore,
  writeCharacterPhotoStoreAllowEmpty,
  type CharacterPhotoItem,
  type CharacterShelf,
} from "@/lib/character-photos";

type Props = {
  shelf: CharacterShelf;
};

/** 이번 요청: 봄이 사진보관만 다른 기기 공유 */
const SHARE_ENABLED: Record<CharacterShelf, boolean> = {
  bomi: true,
  kongi: false,
  duo: false,
};

function isImageFile(file: File): boolean {
  return (
    file.type.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|heic|bmp|avif)$/i.test(file.name)
  );
}

function tellResult(
  setMessage: (msg: string) => void,
  text: string,
  alertToo = false,
) {
  setMessage(text);
  if (alertToo && typeof window !== "undefined") {
    window.alert(text);
  }
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

async function resolvePhotoBlob(item: CharacterPhotoItem): Promise<Blob> {
  const record = await getMediaPreview(item.id);
  if (record?.blob) return record.blob;
  const remote = item.publicUrl?.trim();
  if (!remote) {
    throw new Error("사진이 없어요. 갤러리에 사진을 다시 넣어 주세요.");
  }
  const res = await fetch(remote);
  if (!res.ok) {
    throw new Error("인터넷 사진을 읽지 못했어요.");
  }
  const blob = await res.blob();
  if (!blob.size) {
    throw new Error("인터넷 사진이 비어 있어요.");
  }
  await saveMediaPreview(item.id, blob, "photo", item.name || "photo");
  return blob;
}

async function preparePngBlob(item: CharacterPhotoItem): Promise<Blob> {
  const blob = await resolvePhotoBlob(item);
  return blobToPng(blob);
}

async function downloadPngFallback(
  item: CharacterPhotoItem,
  fileName: string,
): Promise<void> {
  const png = await preparePngBlob(item);
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
 */
function copyPhotoToClipboard(
  item: CharacterPhotoItem,
  fileName: string,
): Promise<void> {
  const canWriteImage =
    typeof navigator !== "undefined" &&
    Boolean(navigator.clipboard?.write) &&
    typeof ClipboardItem !== "undefined" &&
    !/firefox/i.test(navigator.userAgent || "");

  const pngPromise = preparePngBlob(item);

  if (!canWriteImage) {
    return downloadPngFallback(item, fileName).then(() => {
      throw new Error(
        "이 기기에서는 복사가 안 돼서 사진 파일로 받아 두었어요. AI에 그 파일을 넣어 주세요.",
      );
    });
  }

  return navigator.clipboard
    .write([
      new ClipboardItem({
        "image/png": pngPromise,
      }),
    ])
    .catch(async () => {
      try {
        const png = await pngPromise;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": png }),
        ]);
      } catch {
        await downloadPngFallback(item, fileName);
        throw new Error(
          "복사가 안 돼서 사진 파일로 받아 두었어요. AI에 그 파일을 넣어 주세요.",
        );
      }
    });
}

async function cacheRemotePhotoIfNeeded(item: CharacterPhotoItem): Promise<void> {
  const existing = await getMediaPreview(item.id);
  if (existing?.blob) return;
  const remote = item.publicUrl?.trim();
  if (!remote) return;
  try {
    const res = await fetch(remote);
    if (!res.ok) return;
    const blob = await res.blob();
    if (!blob.size) return;
    await saveMediaPreview(item.id, blob, "photo", item.name || "photo");
  } catch {
    /* 미리보기만 인터넷 주소로 보여 줌 */
  }
}

export function CharacterPhotoShelf({ shelf }: Props) {
  const who = characterShelfLabel(shelf);
  const canShare = SHARE_ENABLED[shelf];
  const [items, setItems] = useState<CharacterPhotoItem[]>([]);
  const [ready, setReady] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [sharedOk, setSharedOk] = useState(false);
  const [previewTicks, setPreviewTicks] = useState<Record<string, number>>(
    {},
  );

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const local = readCharacterPhotoStore(shelf).items;
      if (!cancelled) {
        setItems(local);
        setReady(true);
        setPendingFiles([]);
        setMessage("");
        setFormKey((k) => k + 1);
      }

      if (!canShare) return;

      const remoteResult = await listCharacterPhotosAction(shelf);
      if (cancelled) return;

      if (!remoteResult.ok) {
        setSharedOk(false);
        if (local.length > 0) {
          setMessage(
            `이 기기에 ${local.length}장이 있어요. 인터넷 목록은 아직 확인하지 못했어요.`,
          );
        }
        return;
      }

      const merged = mergeCharacterPhotoLists(local, remoteResult.items);
      // 인터넷이 비어 있어도 이 기기 사진은 그대로 둠
      if (merged.length > 0) {
        writeCharacterPhotoStore(shelf, { items: merged });
        setItems(merged);
      }

      for (const item of remoteResult.items) {
        await cacheRemotePhotoIfNeeded(item);
      }
      if (cancelled) return;

      setPreviewTicks((prev) => {
        const copy = { ...prev };
        for (const it of remoteResult.items) {
          copy[it.id] = (copy[it.id] ?? 0) + 1;
        }
        return copy;
      });

      if (remoteResult.count === 0 && merged.length > 0) {
        setSharedOk(false);
        setMessage(
          `이 기기에 ${merged.length}장이 있어요. 아직 인터넷에는 없어요. 아래 「예전에 안 올린 사진 다시 맞추기」를 한 번만 눌러 주세요. 앞으로 새 사진은 자동으로 올라가요.`,
        );
      } else if (remoteResult.count > 0 && remoteResult.count >= merged.length) {
        setSharedOk(true);
        setMessage(
          `사진 ${merged.length}장이에요. 인터넷에도 같아서 다른 기기에서도 봐요. 새 사진은 넣을 때 자동으로 올라가요.`,
        );
      } else if (remoteResult.count > 0) {
        setSharedOk(false);
        setMessage(
          `이 기기 ${merged.length}장 · 인터넷 ${remoteResult.count}장이에요. 아래 「다시 맞추기」로 한 번만 맞추면 돼요.`,
        );
      } else {
        setSharedOk(true);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [shelf, canShare]);

  function persist(next: CharacterPhotoItem[]) {
    if (next.length === 0) {
      writeCharacterPhotoStoreAllowEmpty(shelf, { items: next });
    } else {
      writeCharacterPhotoStore(shelf, { items: next });
    }
    setItems(next);
  }

  /** 한 장을 인터넷에 올림. 실패해도 이 기기 사진은 그대로 둠. */
  async function publishOneItem(
    item: CharacterPhotoItem,
  ): Promise<CharacterPhotoItem | null> {
    const blob = await resolvePhotoBlob(item);
    const file = new File([blob], item.name || "photo.jpg", {
      type: blob.type || "image/jpeg",
    });
    const form = new FormData();
    form.set("shelf", shelf);
    form.set("id", item.id);
    form.set("name", item.name || file.name);
    form.set("note", item.note || "");
    form.set("addedAt", item.addedAt || new Date().toISOString());
    form.set("file", file);

    const result = await publishOneCharacterPhotoAction(form);
    if (!result.ok) return null;
    return {
      ...item,
      publicUrl: result.item.publicUrl,
      storagePath: result.item.storagePath,
    };
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

      let nextItems = items;
      if (added.length > 0) {
        nextItems = [...added, ...items];
        persist(nextItems);
        setSharedOk(false);
        setPreviewTicks((prev) => {
          const copy = { ...prev };
          for (const it of added) {
            copy[it.id] = (copy[it.id] ?? 0) + 1;
          }
          return copy;
        });
      }

      // 봄이: 넣자마자 자동으로 인터넷에도 올림 (매번 버튼 안 눌러도 됨)
      let autoOk = 0;
      let autoFail = 0;
      if (canShare && added.length > 0) {
        setMessage(`${added.length}장 넣는 중… 다른 기기에도 자동으로 올리는 중이에요.`);
        const published = [...nextItems];
        for (let i = 0; i < added.length; i += 1) {
          const localItem = added[i];
          const idx = published.findIndex((it) => it.id === localItem.id);
          try {
            const saved = await publishOneItem(localItem);
            if (!saved) {
              autoFail += 1;
              continue;
            }
            if (idx >= 0) published[idx] = saved;
            autoOk += 1;
          } catch {
            autoFail += 1;
          }
        }
        nextItems = published;
        persist(published);
        if (autoOk > 0 && autoFail === 0) {
          setSharedOk(true);
        } else if (autoFail > 0) {
          setSharedOk(false);
        }
      }

      if (added.length > 0 && failNames.length === 0) {
        if (!canShare) {
          setMessage(
            `${who} 사진 보관에 ${added.length}장을 갤러리에 넣었어요.`,
          );
        } else if (autoOk > 0 && autoFail === 0) {
          setMessage(
            `${who} 사진 ${autoOk}장을 넣었고, 다른 기기에도 자동으로 올려 두었어요.`,
          );
        } else if (autoOk > 0 && autoFail > 0) {
          setMessage(
            `${autoOk}장은 다른 기기에도 올렸어요. ${autoFail}장은 자동 올리기에 실패해서, 아래 「다시 맞추기」를 눌러 주세요.`,
          );
        } else {
          setMessage(
            `${added.length}장은 이 기기에 넣었어요. 자동 올리기는 실패했어요. 아래 「다시 맞추기」를 눌러 주세요.`,
          );
        }
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

  async function onShareToOtherDevices() {
    if (!canShare || shareBusy) return;
    if (items.length === 0) {
      tellResult(setMessage, "올릴 사진이 없어요.", true);
      return;
    }

    setShareBusy(true);
    let okCount = 0;
    const failNames: string[] = [];
    const nextItems = [...items];

    try {
      for (let i = 0; i < nextItems.length; i += 1) {
        const item = nextItems[i];
        // 이미 인터넷에 있는 건 건너뛰고, 안 올린 것만 / 실패 복구용
        if (item.publicUrl && item.storagePath) {
          okCount += 1;
          continue;
        }
        try {
          const saved = await publishOneItem(item);
          if (!saved) {
            failNames.push(item.name || item.id);
            continue;
          }
          nextItems[i] = saved;
          okCount += 1;
        } catch {
          failNames.push(item.name || item.id);
        }
      }

      persist(nextItems);

      if (okCount > 0 && failNames.length === 0) {
        setSharedOk(true);
        tellResult(
          setMessage,
          `확인했어요. 인터넷에 사진 ${okCount}장이 있어요. 다른 기기에서 새로고침 해 보세요.`,
          true,
        );
      } else if (okCount > 0) {
        setSharedOk(false);
        tellResult(
          setMessage,
          `${okCount}장은 올렸어요. ${failNames.length}장은 못 올렸어요. 다시 눌러 주세요.`,
          true,
        );
      } else {
        setSharedOk(false);
        tellResult(
          setMessage,
          failNames.length > 0
            ? "사진을 올리지 못했어요. 관리자 문을 다시 연 뒤 한 번 더 해 주세요."
            : "사진을 올리지 못했어요. 다시 해 주세요.",
          true,
        );
      }
    } finally {
      setShareBusy(false);
    }
  }

  async function onRemove(id: string) {
    const target = items.find((it) => it.id === id);
    if (!target) return;
    // 사진 미리보기만 뺌. 원본 영상(다른 id)은 절대 건드리지 않음.
    await deleteMediaPreview(id);
    if (canShare) {
      await removeCharacterPhotoAction(shelf, id, target.storagePath);
    }
    persist(items.filter((it) => it.id !== id));
    setMessage("사진을 갤러리에서 빼 두었어요.");
  }

  async function onCopy(item: CharacterPhotoItem) {
    try {
      await copyPhotoToClipboard(item, item.name);
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
      {canShare ? (
        <div className="watch-share-box" aria-label="다른 기기에 보이기">
          <p className="tiny muted">
            {sharedOk
              ? "새 사진은 넣을 때 자동으로 다른 기기에도 올라가요. 지금 인터넷과 같아요."
              : "새 사진은 넣을 때 자동으로 올라가요. 예전에 안 올린 사진만 아래 「다시 맞추기」로 한 번 맞추면 돼요. 사진은 지우지 않아요."}
          </p>
          <p className="tiny muted">지금 이 기기 사진 {items.length}장</p>
          <button
            type="button"
            className="btn btn-soft btn-wide"
            disabled={shareBusy || items.length === 0}
            onClick={() => void onShareToOtherDevices()}
          >
            {shareBusy ? "맞추는 중…" : "예전에 안 올린 사진 다시 맞추기"}
          </button>
        </div>
      ) : null}

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
                  remoteUrl={item.publicUrl}
                />
                <p className="tiny muted character-photo-caption" title={item.name}>
                  {item.name}
                </p>
                <div className="character-photo-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-wide"
                    onClick={() => void onCopy(item)}
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
