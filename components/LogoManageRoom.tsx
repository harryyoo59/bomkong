"use client";

import { useEffect, useState } from "react";
import { AdminEmptyText } from "@/components/AdminEmptyText";
import {
  formatSerial,
  makeLogoId,
  readLogoCatalog,
  sortBySerial,
  suggestNextSerial,
  writeLogoCatalog,
  type LogoItem,
} from "@/lib/logo-catalog";

export function LogoManageRoom() {
  const [items, setItems] = useState<LogoItem[]>([]);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const [blurb, setBlurb] = useState("");
  const [note, setNote] = useState("");
  const [serialText, setSerialText] = useState("5");
  const [fileLabel, setFileLabel] = useState("");
  const [pendingFile, setPendingFile] = useState<{ name: string } | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [editSerialText, setEditSerialText] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editBlurb, setEditBlurb] = useState("");
  const [editNote, setEditNote] = useState("");

  useEffect(() => {
    const store = readLogoCatalog();
    setItems(store.items);
    setSerialText(String(suggestNextSerial(store.items)));
    setReady(true);
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
    setPendingFile({ name: file.name });
    setFileLabel(file.name);
  }

  function parseSerial(text: string): number | null {
    const n = Number(text.trim());
    if (!Number.isFinite(n) || n < 1) return null;
    return Math.floor(n);
  }

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
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
      note: note.trim(),
      addedAt: new Date().toISOString(),
      builtIn: false,
    };
    const next = [...items, item];
    persist(next);
    setMessage(
      `일련번호 ${formatSerial(serial)} 「${item.title}」을(를) 로고 목록에 넣었어요.`,
    );
    setTitle("");
    setBlurb("");
    setNote("");
    setPendingFile(null);
    setFileLabel("");
    setSerialText(String(suggestNextSerial(next)));
    setFormKey((k) => k + 1);
  }

  function startEdit(item: LogoItem) {
    setEditId(item.id);
    setEditSerialText(String(item.serial));
    setEditTitle(item.title);
    setEditBlurb(item.blurb);
    setEditNote(item.note);
    setMessage("");
  }

  function cancelEdit() {
    setEditId(null);
    setEditSerialText("");
    setEditTitle("");
    setEditBlurb("");
    setEditNote("");
  }

  function confirmEdit(e: React.FormEvent) {
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
    const next = items.map((it) =>
      it.id === editId
        ? {
            ...it,
            serial,
            title: trimmedTitle,
            blurb: editBlurb.trim(),
            note: editNote.trim(),
          }
        : it,
    );
    persist(next);
    setMessage(
      `「${trimmedTitle}」을(를) 고쳤어요. 일련번호 ${formatSerial(serial)}.`,
    );
    cancelEdit();
  }

  function onRemove(id: string) {
    const target = items.find((it) => it.id === id);
    if (!target) return;
    if (target.builtIn) {
      setMessage("사이트에 미리 넣어 둔 공식 로고는 목록에서 빼지 않아요.");
      return;
    }
    persist(items.filter((it) => it.id !== id));
    setMessage(`「${target.title}」을(를) 목록에서 빼 두었어요.`);
    if (editId === id) cancelEdit();
  }

  if (!ready) {
    return <p className="muted">목록을 불러오는 중이에요…</p>;
  }

  return (
    <div className="admin-wrap">
      <form key={formKey} className="admin-form" onSubmit={onAdd}>
        <p className="form-hint">
          공식 로고에 <strong>일련번호</strong>를 붙여 관리하는 방이에요.
          앞으로 넣는 로고에도 번호를 정해 주세요. 파일은 이름만 이 기기에
          기억해요. 인터넷 저장소는 아직 없어요.
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
          />
          <span className="file-note">
            {fileLabel ? `선택: ${fileLabel}` : "아직 안 고름 · 이름만 기억해요"}
          </span>
        </label>

        <label>
          짧은 메모 (선택)
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="예: 모자용 · 밝은 배경만"
          />
        </label>

        <button type="submit" className="btn btn-primary btn-wide">
          로고 목록에 넣기
        </button>
      </form>

      {message ? <p className="form-msg">{message}</p> : null}

      <section>
        <h2 className="section-title">로고 목록 · 일련번호</h2>
        <p className="muted tiny">
          번호 순서대로 보여 줘요. 이 기기에만 기억해요. 새로고침해도 남아
          있어요.
        </p>
        {items.length === 0 ? (
          <AdminEmptyText roomKey="logos" />
        ) : (
          <ul className="admin-ep-list">
            {items.map((item) => (
              <li key={item.id} className="admin-ep-item">
                <div>
                  <p className="logo-serial-line">
                    일련번호 · {formatSerial(item.serial)}
                  </p>
                  <strong>{item.title}</strong>
                  {item.blurb ? (
                    <p className="tiny muted">{item.blurb}</p>
                  ) : null}
                  <p className="tiny muted">파일 · {item.name}</p>
                  {item.note ? (
                    <p className="tiny muted">{item.note}</p>
                  ) : null}
                  <p className="tiny muted">
                    {item.builtIn ? "공식 로고(사이트에 있음)" : "새로 넣은 로고"}
                    {" · "}
                    {new Date(item.addedAt).toLocaleString("ko-KR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>

                {editId === item.id ? (
                  <form
                    className="admin-form vault-move-form"
                    onSubmit={confirmEdit}
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
                    <label>
                      짧은 메모 (선택)
                      <input
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
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
                  <div className="vault-action-row">
                    <span className="pair-chip">
                      번호 {formatSerial(item.serial)}
                    </span>
                    <button
                      type="button"
                      className="btn btn-soft"
                      onClick={() => startEdit(item)}
                    >
                      번호·내용 고치기
                    </button>
                    {!item.builtIn ? (
                      <button
                        type="button"
                        className="btn btn-soft"
                        onClick={() => onRemove(item.id)}
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
