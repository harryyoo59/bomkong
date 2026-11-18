"use client";

import { useEffect, useState } from "react";
import { AdminEmptyText } from "@/components/AdminEmptyText";
import { AdminMediaPreview } from "@/components/AdminMediaPreview";
import {
  listLogoItemsAction,
  removeLogoItemAction,
} from "@/app/admin/logos/actions";
import {
  copyPngPromiseToClipboard,
  pngFromBlob,
  pngFromImageUrl,
} from "@/lib/copy-image-clipboard";
import { publishLogoItemWithFile } from "@/lib/logo-catalog-client";
import {
  formatSerial,
  makeLogoId,
  mergeLogoCatalogWithRemote,
  readLogoCatalog,
  sortBySerial,
  suggestNextSerial,
  writeLogoCatalog,
  type LogoItem,
} from "@/lib/logo-catalog";
import {
  deleteMediaPreview,
  getMediaPreview,
  saveMediaPreview,
} from "@/lib/media-preview-store";

export function LogoManageRoom() {
  const [items, setItems] = useState<LogoItem[]>([]);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const [blurb, setBlurb] = useState("");
  const [serialText, setSerialText] = useState("5");
  const [fileLabel, setFileLabel] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editSerialText, setEditSerialText] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editBlurb, setEditBlurb] = useState("");
  const [previewTicks, setPreviewTicks] = useState<Record<string, number>>(
    {},
  );
  const [shareBusy, setShareBusy] = useState(false);
  const [sharedOk, setSharedOk] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const local = readLogoCatalog().items;
      if (!cancelled) {
        setItems(local);
        setSerialText(String(suggestNextSerial(local)));
        setReady(true);
      }

      const remote = await listLogoItemsAction();
      if (cancelled) return;

      if (!remote.ok) {
        setSharedOk(false);
        setMessage(
          "이 기기 로고는 그대로예요. 인터넷 목록은 아직 확인하지 못했어요.",
        );
        return;
      }

      const merged = mergeLogoCatalogWithRemote(local, remote.items);
      writeLogoCatalog({ items: merged });
      setItems(merged);
      setSerialText(String(suggestNextSerial(merged)));

      // 인터넷에 없는 항목(새 로고·고친 공식 로고 정보) 자동 맞춤
      const remoteIds = new Set(remote.items.map((it) => it.id));
      const toPublish = merged.filter((it) => {
        if (!remoteIds.has(it.id)) return true;
        if (it.builtIn) return false;
        return !it.publicUrl && !it.storagePath;
      });

      if (toPublish.length === 0) {
        setSharedOk(true);
        setMessage(
          "로고 목록이 다른 기기와 같아요. 새 로고는 넣을 때 자동으로 올라가요.",
        );
        return;
      }

      setShareBusy(true);
      setMessage(
        `이 기기 로고 ${toPublish.length}개를 다른 기기에도 맞게 올리는 중이에요…`,
      );
      const next = [...merged];
      let ok = 0;
      for (const item of toPublish) {
        try {
          const saved = await publishLogoItemWithFile(item);
          const idx = next.findIndex((it) => it.id === item.id);
          if (idx >= 0) next[idx] = saved;
          ok += 1;
        } catch {
          /* 이 기기 원본 유지 */
        }
      }
      if (cancelled) return;
      const sorted = sortBySerial(next);
      writeLogoCatalog({ items: sorted });
      setItems(sorted);
      setShareBusy(false);
      if (ok === toPublish.length) {
        setSharedOk(true);
        setMessage(
          "로고를 인터넷에 맞춰 두었어요. 앞으로 넣거나 고치면 자동으로 같아져요.",
        );
      } else {
        setSharedOk(false);
        setMessage(
          `${ok}개는 올렸어요. 나머지는 「다시 맞추기」로 한 번 더 해 주세요.`,
        );
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  function persist(next: LogoItem[]) {
    const sorted = sortBySerial(next);
    writeLogoCatalog({ items: sorted });
    setItems(sorted);
  }

  function onPickFile(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      setPendingFile(null);
      setFileLabel("");
      return;
    }
    const file = fileList[0];
    if (
      !file.type.startsWith("image/") &&
      !/\.(png|jpe?g|gif|webp|heic|bmp|avif|svg)$/i.test(file.name)
    ) {
      setMessage("로고 그림 파일만 넣을 수 있어요.");
      setPendingFile(null);
      setFileLabel("");
      return;
    }
    setPendingFile(file);
    setFileLabel(file.name);
    setMessage("");
  }

  function parseSerial(text: string): number | null {
    const n = Number(text.trim());
    if (!Number.isFinite(n) || n < 1) return null;
    return Math.floor(n);
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setMessage("로고 이름을 적어 주세요.");
      return;
    }
    const serial = parseSerial(serialText);
    if (serial === null) {
      setMessage("일련번호는 1 이상의 숫자로 적어 주세요.");
      return;
    }
    if (items.some((it) => it.serial === serial)) {
      setMessage(
        `일련번호 ${formatSerial(serial)}은(는) 이미 있어요. 다른 번호를 적어 주세요.`,
      );
      return;
    }
    const item: LogoItem = {
      id: makeLogoId(),
      serial,
      title: trimmedTitle,
      blurb: blurb.trim(),
      name: pendingFile?.name ?? "이름 없음",
      note: "",
      addedAt: new Date().toISOString(),
      builtIn: false,
    };

    setSaving(true);
    try {
      if (pendingFile) {
        try {
          await saveMediaPreview(item.id, pendingFile, "photo");
        } catch {
          setMessage(
            `「${item.title}」은(는) 목록에 넣었어요. 그림 보기는 저장하지 못했어요.`,
          );
        }
      }
      let nextItem = item;
      const next = [...items, item];
      persist(next);
      if (pendingFile) {
        setPreviewTicks((prev) => ({
          ...prev,
          [item.id]: (prev[item.id] ?? 0) + 1,
        }));
      }

      try {
        setMessage("넣고, 다른 기기에도 자동으로 올리는 중이에요…");
        nextItem = await publishLogoItemWithFile(item);
        persist([...items, nextItem]);
        setSharedOk(true);
        setMessage(
          `일련번호 ${formatSerial(serial)} 「${nextItem.title}」을(를) 넣었고, 다른 기기에도 자동으로 올려 두었어요.`,
        );
      } catch {
        setSharedOk(false);
        setMessage(
          `일련번호 ${formatSerial(serial)} 「${item.title}」은(는) 이 기기에 넣었어요. 자동 올리기는 실패해서 「다시 맞추기」를 눌러 주세요.`,
        );
      }

      setTitle("");
      setBlurb("");
      setPendingFile(null);
      setFileLabel("");
      setSerialText(String(suggestNextSerial([...items, nextItem])));
      setFormKey((k) => k + 1);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item: LogoItem) {
    setEditId(item.id);
    setEditSerialText(String(item.serial));
    setEditTitle(item.title);
    setEditBlurb(item.blurb);
    setMessage("");
  }

  function cancelEdit() {
    setEditId(null);
    setEditSerialText("");
    setEditTitle("");
    setEditBlurb("");
  }

  async function confirmEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    const serial = parseSerial(editSerialText);
    if (serial === null) {
      setMessage("일련번호는 1 이상의 숫자로 적어 주세요.");
      return;
    }
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setMessage("로고 이름을 적어 주세요.");
      return;
    }
    if (items.some((it) => it.id !== editId && it.serial === serial)) {
      setMessage(
        `일련번호 ${formatSerial(serial)}은(는) 이미 있어요. 다른 번호를 적어 주세요.`,
      );
      return;
    }
    const fixed = items.map((it) =>
      it.id === editId
        ? {
            ...it,
            serial,
            title: trimmedTitle,
            blurb: editBlurb.trim(),
          }
        : it,
    );
    persist(fixed);
    const edited = fixed.find((it) => it.id === editId);
    if (edited) {
      try {
        const saved = await publishLogoItemWithFile(edited);
        persist(fixed.map((it) => (it.id === saved.id ? saved : it)));
        setSharedOk(true);
        setMessage(
          `「${trimmedTitle}」을(를) 고쳤고, 다른 기기에도 맞춰 두었어요. 일련번호 ${formatSerial(serial)}.`,
        );
      } catch {
        setSharedOk(false);
        setMessage(
          `「${trimmedTitle}」은(는) 이 기기에서 고쳤어요. 자동 맞추기는 실패해서 「다시 맞추기」를 눌러 주세요.`,
        );
      }
    }
    cancelEdit();
  }

  async function onShareAgain() {
    if (shareBusy || items.length === 0) return;
    setShareBusy(true);
    let ok = 0;
    const next = [...items];
    try {
      for (let i = 0; i < next.length; i += 1) {
        try {
          next[i] = await publishLogoItemWithFile(next[i]);
          ok += 1;
        } catch {
          /* keep */
        }
      }
      persist(next);
      if (ok === next.length) {
        setSharedOk(true);
        setMessage(
          `확인했어요. 인터넷에 로고 ${ok}개가 맞춰져 있어요. 다른 기기에서 새로고침 해 보세요.`,
        );
      } else {
        setSharedOk(false);
        setMessage(
          `${ok}개는 맞췄어요. 나머지는 다시 눌러 주세요.`,
        );
      }
    } finally {
      setShareBusy(false);
    }
  }

  async function onRemove(id: string) {
    const target = items.find((it) => it.id === id);
    if (!target) return;
    if (target.builtIn) {
      setMessage("사이트에 미리 넣어 둔 공식 로고는 목록에서 빼지 않아요.");
      return;
    }
    await deleteMediaPreview(id);
    await removeLogoItemAction(id, target.storagePath);
    persist(items.filter((it) => it.id !== id));
    setMessage(`「${target.title}」을(를) 목록에서 빼 두었어요.`);
    if (editId === id) cancelEdit();
  }

  async function onCopy(item: LogoItem) {
    const fileName = item.name || item.title || "logo";
    const pngPromise = (async () => {
      if (item.src) {
        return pngFromImageUrl(item.src);
      }
      if (item.publicUrl) {
        return pngFromImageUrl(item.publicUrl);
      }
      const record = await getMediaPreview(item.id);
      if (!record?.blob) {
        throw new Error("로고 그림이 없어요. 파일을 다시 넣어 주세요.");
      }
      return pngFromBlob(record.blob);
    })();

    try {
      await copyPngPromiseToClipboard(pngPromise, fileName);
      setMessage("로고를 복사했어요. AI 채팅에 붙여 넣으면 돼요.");
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "로고를 복사하지 못했어요. 다시 해 주세요.",
      );
    }
  }

  if (!ready) {
    return <p className="muted">목록을 불러오는 중이에요…</p>;
  }

  return (
    <div className="admin-wrap">
      <div className="watch-share-box" aria-label="다른 기기에 맞추기">
        <p className="tiny muted">
          {sharedOk
            ? "새 로고·고치기는 자동으로 다른 기기에도 맞춰져요."
            : "넣거나 고치면 자동으로 올라가요. 안 맞으면 「다시 맞추기」를 눌러 주세요."}
        </p>
        <p className="tiny muted">지금 이 기기 로고 {items.length}개</p>
        <button
          type="button"
          className="btn btn-soft btn-wide"
          disabled={shareBusy || saving || items.length === 0}
          onClick={() => void onShareAgain()}
        >
          {shareBusy ? "맞추는 중…" : "다른 기기와 다시 맞추기"}
        </button>
      </div>

      <form key={formKey} className="admin-form" onSubmit={onAdd}>
        <p className="form-hint">
          공식 로고에 <strong>일련번호</strong>를 붙여 관리하는 방이에요.
          넣으면 다른 기기에도 자동으로 맞춰져요. 「복사하기」로 AI에게 붙여
          넣을 수 있어요.
        </p>

        <label>
          일련번호
          <input
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={serialText}
            onChange={(e) => setSerialText(e.target.value)}
            placeholder="예: 5"
            required
          />
          <span className="file-note">
            목록에 보이는 번호예요. 겹치지 않게 적어 주세요.
          </span>
        </label>

        <label>
          로고 이름
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 봄콩 작은 잎 마크"
            required
          />
        </label>

        <label>
          짧은 설명 (선택)
          <input
            value={blurb}
            onChange={(e) => setBlurb(e.target.value)}
            placeholder="예: 옷 왼쪽 가슴에 쓰는 작은 마크"
          />
        </label>

        <label>
          로고 파일 고르기 (선택)
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onPickFile(e.target.files)}
            disabled={saving}
          />
          <span className="file-note">
            {fileLabel
              ? `선택: ${fileLabel}`
              : "아직 안 고름 · 고르면 목록에 그림으로 보여요"}
          </span>
        </label>

        <button
          type="submit"
          className="btn btn-primary btn-wide"
          disabled={saving}
        >
          {saving ? "넣는 중…" : "로고 목록에 넣기"}
        </button>
      </form>

      {message ? <p className="form-msg">{message}</p> : null}

      <section>
        <h2 className="section-title">로고 목록 · 일련번호</h2>
        <p className="muted tiny">
          번호 순서대로 보여 줘요. 로고 그림 아래 설명이 나와요. 「복사하기」로
          AI에 붙여 넣을 수 있어요.
        </p>
        {items.length === 0 ? (
          <AdminEmptyText roomKey="logos" />
        ) : (
          <ul className="logo-manage-gallery">
            {items.map((item) => (
              <li key={item.id} className="logo-manage-tile">
                <p className="logo-serial-line">
                  일련번호 · {formatSerial(item.serial)}
                </p>
                <div className="logo-manage-visual">
                  {item.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.src}
                      alt={item.title}
                      className="logo-manage-image"
                    />
                  ) : (
                    <AdminMediaPreview
                      itemId={item.id}
                      kindHint="photo"
                      label={item.title}
                      refreshToken={previewTicks[item.id] ?? 0}
                      remoteUrl={item.publicUrl}
                    />
                  )}
                </div>
                <strong className="logo-manage-title">{item.title}</strong>
                {item.blurb ? (
                  <p className="tiny muted logo-manage-blurb">{item.blurb}</p>
                ) : (
                  <p className="tiny muted logo-manage-blurb">설명 없음</p>
                )}
                <p className="tiny muted">
                  {item.builtIn ? "공식 로고(사이트에 있음)" : "새로 넣은 로고"}
                </p>

                {editId === item.id ? (
                  <form
                    className="admin-form vault-move-form"
                    onSubmit={(e) => void confirmEdit(e)}
                  >
                    <label>
                      일련번호
                      <input
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        value={editSerialText}
                        onChange={(e) => setEditSerialText(e.target.value)}
                        required
                        autoFocus
                      />
                    </label>
                    <label>
                      로고 이름
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        required
                      />
                    </label>
                    <label>
                      짧은 설명 (선택)
                      <input
                        value={editBlurb}
                        onChange={(e) => setEditBlurb(e.target.value)}
                      />
                    </label>
                    <div className="vault-action-row">
                      <button type="submit" className="btn btn-primary">
                        저장
                      </button>
                      <button
                        type="button"
                        className="btn btn-soft"
                        onClick={cancelEdit}
                      >
                        취소
                      </button>
                    </div>
                  </form>
                ) : (
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
                      onClick={() => startEdit(item)}
                    >
                      번호·내용 고치기
                    </button>
                    {!item.builtIn ? (
                      <button
                        type="button"
                        className="btn btn-soft btn-wide"
                        onClick={() => void onRemove(item.id)}
                      >
                        목록에서 빼기
                      </button>
                    ) : null}
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
