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
  characterIntroPath,
  characterMediaKind,
  characterMediaKindLabel,
  characterPhotoRoomKey,
  characterShelfLabel,
  filterCharacterItemsByMediaKind,
  makeCharacterPhotoId,
  mergeCharacterPhotoLists,
  readCharacterPhotoStore,
  replaceCharacterItemsForMediaKind,
  type CharacterMediaKind,
  type CharacterPhotoItem,
  type CharacterShelf,
} from "@/lib/character-photos";
import { askShareBossLock } from "@/lib/share-boss-lock-client";

type Props = {
  shelf: CharacterShelf;
  /** 기본은 사진 칸. 동영상 칸은 video */
  mediaKind?: CharacterMediaKind;
};

/** 봄이·콩이·함께 보관함 다른 기기 공유 (넣을 때 자동 올리기) */
const SHARE_ENABLED: Record<CharacterShelf, boolean> = {
  bomi: true,
  kongi: true,
  duo: true,
};

function isImageFile(file: File): boolean {
  return (
    file.type.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|heic|bmp|avif)$/i.test(file.name)
  );
}

function isVideoFile(file: File): boolean {
  return (
    file.type.startsWith("video/") ||
    /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(file.name)
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

async function resolveMediaBlob(
  item: CharacterPhotoItem,
  mediaKind: CharacterMediaKind,
): Promise<Blob> {
  const record = await getMediaPreview(item.id);
  if (record?.blob) return record.blob;
  const remote = item.publicUrl?.trim();
  if (!remote) {
    throw new Error(
      mediaKind === "video"
        ? "동영상이 없어요. 갤러리에 영상을 다시 넣어 주세요."
        : "사진이 없어요. 갤러리에 사진을 다시 넣어 주세요.",
    );
  }
  const res = await fetch(remote);
  if (!res.ok) {
    throw new Error(
      mediaKind === "video"
        ? "인터넷 동영상을 읽지 못했어요."
        : "인터넷 사진을 읽지 못했어요.",
    );
  }
  const blob = await res.blob();
  if (!blob.size) {
    throw new Error(
      mediaKind === "video"
        ? "인터넷 동영상이 비어 있어요."
        : "인터넷 사진이 비어 있어요.",
    );
  }
  await saveMediaPreview(
    item.id,
    blob,
    mediaKind === "video" ? "video" : "photo",
    item.name || mediaKind,
  );
  return blob;
}

async function preparePngBlob(item: CharacterPhotoItem): Promise<Blob> {
  const blob = await resolveMediaBlob(item, "photo");
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

async function cacheRemoteMediaIfNeeded(
  item: CharacterPhotoItem,
  mediaKind: CharacterMediaKind,
): Promise<void> {
  const existing = await getMediaPreview(item.id);
  if (existing?.blob) return;
  const remote = item.publicUrl?.trim();
  if (!remote) return;
  try {
    const res = await fetch(remote);
    if (!res.ok) return;
    const blob = await res.blob();
    if (!blob.size) return;
    await saveMediaPreview(
      item.id,
      blob,
      mediaKind === "video" ? "video" : "photo",
      item.name || mediaKind,
    );
  } catch {
    /* 미리보기만 인터넷 주소로 보여 줌 */
  }
}

export function CharacterPhotoShelf({
  shelf,
  mediaKind = "photo",
}: Props) {
  const who = characterShelfLabel(shelf);
  const kindLabel = characterMediaKindLabel(mediaKind);
  const unit = mediaKind === "video" ? "개" : "장";
  const countText = (n: number) => `${kindLabel} ${n}${unit}`;
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
      const localAll = readCharacterPhotoStore(shelf).items;
      const local = filterCharacterItemsByMediaKind(localAll, mediaKind);
      if (!cancelled) {
        setItems(local);
        setReady(true);
        setPendingFiles([]);
        setMessage("");
        setFormKey((k) => k + 1);
      }

      if (!canShare) return;

      const remoteResult = await listCharacterPhotosAction(shelf, mediaKind);
      if (cancelled) return;

      if (!remoteResult.ok) {
        setSharedOk(false);
        if (local.length > 0) {
          setMessage(
            `이 기기에 ${countText(local.length)} 있어요. 인터넷 목록은 아직 확인하지 못했어요.`,
          );
        }
        return;
      }

      const merged = filterCharacterItemsByMediaKind(
        mergeCharacterPhotoLists(local, remoteResult.items),
        mediaKind,
      );
      if (merged.length > 0) {
        replaceCharacterItemsForMediaKind(shelf, mediaKind, merged);
        setItems(merged);
      }

      for (const item of remoteResult.items) {
        await cacheRemoteMediaIfNeeded(item, mediaKind);
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
          `이 기기에 ${countText(merged.length)} 있어요. 아직 인터넷에는 없어요. 아래 「다시 맞추기」를 한 번만 눌러 주세요. 앞으로 새 ${kindLabel}은 자동으로 올라가요.`,
        );
      } else if (remoteResult.count > 0 && remoteResult.count >= merged.length) {
        setSharedOk(true);
        setMessage(
          `${countText(merged.length)}이에요. 인터넷에도 같아서 다른 기기에서도 봐요. 새 ${kindLabel}은 넣을 때 자동으로 올라가요.`,
        );
      } else if (remoteResult.count > 0) {
        setSharedOk(false);
        setMessage(
          `이 기기 ${countText(merged.length)} · 인터넷 ${countText(remoteResult.count)}이에요. 아래 「다시 맞추기」로 한 번만 맞추면 돼요.`,
        );
      } else {
        setSharedOk(true);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [shelf, mediaKind, canShare, kindLabel, unit]);

  function persist(nextKindItems: CharacterPhotoItem[]) {
    replaceCharacterItemsForMediaKind(
      shelf,
      mediaKind,
      nextKindItems,
      nextKindItems.length === 0,
    );
    setItems(nextKindItems);
  }

  async function publishOneItem(
    item: CharacterPhotoItem,
  ): Promise<CharacterPhotoItem | null> {
    const blob = await resolveMediaBlob(item, mediaKind);
    const fallbackMime =
      mediaKind === "video"
        ? "video/mp4"
        : "image/jpeg";
    const file = new File(
      [blob],
      item.name || (mediaKind === "video" ? "clip.mp4" : "photo.jpg"),
      { type: blob.type || item.mimeType || fallbackMime },
    );
    const form = new FormData();
    form.set("shelf", shelf);
    form.set("id", item.id);
    form.set("name", item.name || file.name);
    form.set("note", item.note || "");
    form.set("addedAt", item.addedAt || new Date().toISOString());
    form.set("mediaKind", mediaKind);
    form.set("file", file);

    const result = await publishOneCharacterPhotoAction(form);
    if (!result.ok) return null;
    return {
      ...item,
      publicUrl: result.item.publicUrl,
      storagePath: result.item.storagePath,
      mimeType: result.item.mimeType || file.type || fallbackMime,
    };
  }

  function onPickFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      setPendingFiles([]);
      return;
    }
    const picked = Array.from(fileList).filter(
      mediaKind === "video" ? isVideoFile : isImageFile,
    );
    if (picked.length === 0) {
      setMessage(
        mediaKind === "video"
          ? "동영상 파일만 넣을 수 있어요."
          : "사진 파일만 넣을 수 있어요.",
      );
      setPendingFiles([]);
      return;
    }
    if (picked.length < fileList.length) {
      setMessage(
        mediaKind === "video"
          ? `동영상만 ${picked.length}개 골랐어요. (영상이 아닌 파일은 빼 두었어요.)`
          : `사진만 ${picked.length}장 골랐어요. (사진이 아닌 파일은 빼 두었어요.)`,
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
      setMessage(
        mediaKind === "video"
          ? "동영상을 먼저 골라 주세요. 여러 개도 한 번에 고를 수 있어요."
          : "사진을 먼저 골라 주세요. 여러 장도 한 번에 고를 수 있어요.",
      );
      return;
    }

    setSaving(true);
    const added: CharacterPhotoItem[] = [];
    const failNames: string[] = [];

    try {
      const snapshots: { name: string; blob: Blob; mimeType: string }[] = [];
      for (const file of pendingFiles) {
        try {
          const buffer = await file.arrayBuffer();
          const mimeType =
            file.type ||
            (mediaKind === "video" ? "video/mp4" : "image/jpeg");
          snapshots.push({
            name: file.name,
            blob: new Blob([buffer], { type: mimeType }),
            mimeType,
          });
        } catch {
          failNames.push(file.name || kindLabel);
        }
      }

      for (const snap of snapshots) {
        const item: CharacterPhotoItem = {
          id: makeCharacterPhotoId(shelf),
          name: snap.name,
          note: "",
          addedAt: new Date().toISOString(),
          mimeType: snap.mimeType,
        };
        try {
          await saveMediaPreview(
            item.id,
            snap.blob,
            mediaKind === "video" ? "video" : "photo",
            snap.name,
          );
          added.push(item);
        } catch (err) {
          failNames.push(snap.name || kindLabel);
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

      let autoOk = 0;
      let autoFail = 0;
      if (canShare && added.length > 0) {
        setMessage(
          `${countText(added.length)} 넣는 중… 다른 기기에도 자동으로 올리는 중이에요.`,
        );
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
            `${who} ${kindLabel} 보관에 ${countText(added.length)} 넣었어요.`,
          );
        } else if (autoOk > 0 && autoFail === 0) {
          setMessage(
            `${who} ${countText(autoOk)} 넣었고, 다른 기기에도 자동으로 올려 두었어요.`,
          );
        } else if (autoOk > 0 && autoFail > 0) {
          setMessage(
            `${countText(autoOk)} 다른 기기에도 올렸어요. ${countText(autoFail)} 자동 올리기에 실패해서, 아래 「다시 맞추기」를 눌러 주세요.`,
          );
        } else {
          setMessage(
            `${countText(added.length)} 이 기기에 넣었어요. 자동 올리기는 실패했어요. 아래 「다시 맞추기」를 눌러 주세요.`,
          );
        }
      } else if (added.length > 0 && failNames.length > 0) {
        setMessage(
          `${countText(added.length)} 넣었어요. ${countText(failNames.length)} 못 넣었어요. 다시 골라 주세요.`,
        );
      } else if (failNames.length > 0) {
        setMessage(
          `${kindLabel}을 넣지 못했어요. 파일이 너무 크거나, 이 기기 자리가 부족할 수 있어요. 다시 해 주세요.`,
        );
      }

      setPendingFiles([]);
      setFormKey((k) => k + 1);
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : `${kindLabel}을 넣지 못했어요. 다시 해 주세요.`,
      );
    } finally {
      setSaving(false);
    }
  }

  async function onShareToOtherDevices() {
    if (!canShare || shareBusy) return;
    if (items.length === 0) {
      tellResult(setMessage, `올릴 ${kindLabel}이 없어요.`, true);
      return;
    }
    const lock = await askShareBossLock();
    if (!lock.ok) {
      tellResult(setMessage, lock.message, true);
      return;
    }

    setShareBusy(true);
    let okCount = 0;
    const failNames: string[] = [];
    const nextItems = [...items];

    try {
      for (let i = 0; i < nextItems.length; i += 1) {
        const item = nextItems[i];
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
          `확인했어요. 인터넷에 ${countText(okCount)} 있어요. 다른 기기에서 새로고침 해 보세요.`,
          true,
        );
      } else if (okCount > 0) {
        setSharedOk(false);
        tellResult(
          setMessage,
          `${countText(okCount)} 올렸어요. ${countText(failNames.length)} 못 올렸어요. 다시 눌러 주세요.`,
          true,
        );
      } else {
        setSharedOk(false);
        tellResult(
          setMessage,
          failNames.length > 0
            ? `${kindLabel}을 올리지 못했어요. 관리자 문을 다시 연 뒤 한 번 더 해 주세요.`
            : `${kindLabel}을 올리지 못했어요. 다시 해 주세요.`,
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
    await deleteMediaPreview(id);
    if (canShare) {
      await removeCharacterPhotoAction(shelf, id, target.storagePath);
    }
    persist(items.filter((it) => it.id !== id));
    setMessage(`${kindLabel}을 갤러리에서 빼 두었어요.`);
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

  const introHref = characterIntroPath(shelf);
  const otherKind: CharacterMediaKind =
    mediaKind === "photo" ? "video" : "photo";
  const otherHref = `/admin/${characterPhotoRoomKey(shelf, otherKind)}`;

  return (
    <div className="admin-wrap">
      <p className="tiny muted">
        지금 칸은 <strong>{who} {kindLabel} 보관함</strong>이에요.{" "}
        <a className="text-link" href={otherHref}>
          {who} {characterMediaKindLabel(otherKind)} 보관함으로
        </a>
      </p>

      {canShare ? (
        <div className="watch-share-box" aria-label="다른 기기에 보이기">
          <p className="tiny muted">
            {sharedOk
              ? `새 ${kindLabel}은 넣을 때 자동으로 다른 기기에도 올라가요. 지금 인터넷과 같아요.`
              : `새 ${kindLabel}은 넣을 때 자동으로 올라가요. 예전에 안 올린 것만 아래 「다시 맞추기」로 한 번 맞추면 돼요. 이미 있는 ${kindLabel}은 지우지 않아요.`}
          </p>
          <p className="tiny muted">
            지금 이 기기 {kindLabel} {items.length}
            {unit}
          </p>
          <button
            type="button"
            className="btn btn-soft btn-wide"
            disabled={shareBusy || items.length === 0}
            onClick={() => void onShareToOtherDevices()}
          >
            {shareBusy
              ? "맞추는 중…"
              : `예전에 안 올린 ${kindLabel} 다시 맞추기`}
          </button>
        </div>
      ) : null}

      <form key={formKey} className="admin-form" onSubmit={onAdd}>
        <p className="form-hint">
          {who} 영상규칙에 쓸 {kindLabel}을 <strong>갤러리</strong>처럼 모아
          두는 방이에요. 여러 {unit === "장" ? "장" : "개"}를 한 번에 고르면,
          한 칸에 {kindLabel}
          {mediaKind === "video" ? "으로 미리보기·재생" : "으로 보여 줘요"}.
        </p>

        <label>
          {kindLabel} 고르기 (여러 {unit === "장" ? "장" : "개"} 가능)
          <input
            type="file"
            accept={mediaKind === "video" ? "video/*" : "image/*"}
            multiple
            onChange={(e) => onPickFiles(e.target.files)}
            disabled={saving}
          />
          <span className="file-note">
            {pendingFiles.length > 0
              ? `${pendingFiles.length}${unit} 선택됨`
              : `아직 안 고름 · 여러 ${unit === "장" ? "장" : "개"} 한꺼번에 골라도 돼요`}
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
              ? `${pendingFiles.length}${unit} 갤러리에 넣기`
              : `${who} ${kindLabel} 보관에 넣기`}
        </button>
      </form>

      {message ? <p className="form-msg">{message}</p> : null}

      <section>
        <h2 className="section-title">{kindLabel} 갤러리</h2>
        <p className="muted tiny">
          {who} {kindLabel} 보관함이에요.
          {mediaKind === "photo"
            ? " 「복사하기」로 사진을 복사한 뒤 AI에게 붙여 넣으면 돼요."
            : " 칸을 누르면 미리보기·재생할 수 있어요."}
        </p>
        {items.length === 0 ? (
          <AdminEmptyText roomKey={characterPhotoRoomKey(shelf, mediaKind)} />
        ) : (
          <ul className="character-photo-gallery">
            {items.map((item) => {
              const kind = characterMediaKind(item);
              return (
                <li key={item.id} className="character-photo-tile">
                  <AdminMediaPreview
                    itemId={item.id}
                    kindHint={kind === "video" ? "video" : "photo"}
                    label={item.name}
                    refreshToken={previewTicks[item.id] ?? 0}
                    remoteUrl={item.publicUrl}
                    preferRemote={Boolean(item.publicUrl)}
                  />
                  <p
                    className="tiny muted character-photo-caption"
                    title={item.name}
                  >
                    {item.name}
                  </p>
                  <div className="character-photo-actions">
                    {kind === "photo" ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-wide"
                        onClick={() => void onCopy(item)}
                      >
                        복사하기
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="btn btn-soft btn-wide"
                      onClick={() => void onRemove(item.id)}
                    >
                      빼기
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="tiny muted">
        <a className="text-link" href={introHref}>
          {who} 소개로
        </a>
      </p>
    </div>
  );
}
