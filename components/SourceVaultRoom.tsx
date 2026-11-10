"use client";

import { useEffect, useState } from "react";
import { AdminEmptyText } from "@/components/AdminEmptyText";
import {
  detectKind,
  kindLabel,
  makeId,
  readSourceMediaStore,
  writeSourceMediaStore,
  type SourceItem,
  type SourceKind,
} from "@/lib/source-media";

export function SourceVaultRoom() {
  const [items, setItems] = useState<SourceItem[]>([]);
  const [ready, setReady] = useState(false);
  const [kind, setKind] = useState<SourceKind>("video");
  const [note, setNote] = useState("");
  const [fileLabel, setFileLabel] = useState("");
  const [pendingFile, setPendingFile] = useState<{
    name: string;
    kind: SourceKind;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [moveId, setMoveId] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    const store = readSourceMediaStore();
    setItems(store.sources);
    setReady(true);
  }, []);

  function persistSources(next: SourceItem[]) {
    const store = readSourceMediaStore();
    writeSourceMediaStore({ ...store, sources: next });
    setItems(next);
  }

  function onPickFile(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      setPendingFile(null);
      setFileLabel("");
      return;
    }
    const file = fileList[0];
    const detected = detectKind(file.name, file.type);
    setPendingFile({ name: file.name, kind: detected });
    setKind(detected);
    setFileLabel(file.name);
  }

  function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingFile) {
      setMessage("사진이나 동영상 파일을 먼저 골라 주세요.");
      return;
    }
    const item: SourceItem = {
      id: makeId("src"),
      kind,
      name: pendingFile.name,
      note: note.trim(),
      addedAt: new Date().toISOString(),
    };
    persistSources([item, ...items]);
    setMessage(
      `${kindLabel(kind)} 「${item.name}」을(를) 소스 보관실에 넣었어요.`,
    );
    setNote("");
    setPendingFile(null);
    setFileLabel("");
    setFormKey((k) => k + 1);
  }

  function startMove(id: string) {
    setMoveId(id);
    setVideoTitle("");
    setMessage("");
  }

  function cancelMove() {
    setMoveId(null);
    setVideoTitle("");
  }

  function confirmMove(e: React.FormEvent) {
    e.preventDefault();
    if (!moveId) return;
    const title = videoTitle.trim();
    if (!title) {
      setMessage("쿠키 영상에 쓴 제목을 적어 주세요.");
      return;
    }
    const target = items.find((it) => it.id === moveId);
    if (!target) {
      setMessage("옮길 자료를 찾지 못했어요.");
      cancelMove();
      return;
    }
    const store = readSourceMediaStore();
    const nextSources = store.sources.filter((it) => it.id !== moveId);
    const nextCookies = [
      {
        id: makeId("ck"),
        kind: target.kind,
        name: target.name,
        videoTitle: title,
        movedAt: new Date().toISOString(),
        sourceId: target.id,
      },
      ...store.cookies,
    ];
    writeSourceMediaStore({ sources: nextSources, cookies: nextCookies });
    setItems(nextSources);
    setMessage(
      `「${target.name}」을(를) 쿠키완료실로 옮겼어요. 제목: ${title}`,
    );
    cancelMove();
  }

  if (!ready) {
    return <p className="muted">목록을 불러오는 중이에요…</p>;
  }

  return (
    <div className="admin-wrap">
      <form key={formKey} className="admin-form" onSubmit={onAdd}>
        <p className="form-hint">
          나중에 쿠키 영상에 쓸 사진·동영상을 모아 두는 방이에요. 파일은
          이름만 이 기기에 기억해요. 인터넷 저장소는 아직 없어요.
        </p>

        <label>
          사진 / 동영상 고르기
          <input
            type="file"
            accept="image/*,video/*"
            onChange={(e) => onPickFile(e.target.files)}
          />
          <span className="file-note">
            {fileLabel ? `선택: ${fileLabel}` : "아직 안 고름"}
          </span>
        </label>

        <label>
          종류
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as SourceKind)}
          >
            <option value="video">동영상</option>
            <option value="photo">사진</option>
          </select>
        </label>

        <label>
          짧은 메모 (선택)
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="예: 공원 놀이 · 얼굴 가리기 전"
          />
        </label>

        <button type="submit" className="btn btn-primary btn-wide">
          소스 보관실에 넣기
        </button>
      </form>

      {message ? <p className="form-msg">{message}</p> : null}

      <section>
        <h2 className="section-title">보관 중인 소스</h2>
        <p className="muted tiny">
          쿠키 영상에 쓴 뒤에는 「쿠키완료실로 옮기기」를 눌러 주세요. 같은
          자료를 다시 쓰지 않게 막아 줘요.
        </p>
        {items.length === 0 ? (
          <AdminEmptyText roomKey="source" />
        ) : (
          <ul className="admin-ep-list">
            {items.map((item) => (
              <li key={item.id} className="admin-ep-item">
                <div>
                  <strong>
                    {kindLabel(item.kind)} · {item.name}
                  </strong>
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

                {moveId === item.id ? (
                  <form className="admin-form vault-move-form" onSubmit={confirmMove}>
                    <label>
                      영상 제목 (쿠키에 쓴 제목)
                      <input
                        value={videoTitle}
                        onChange={(e) => setVideoTitle(e.target.value)}
                        placeholder="예: 공원에서 공 놀이"
                        required
                        autoFocus
                      />
                    </label>
                    <div className="vault-action-row">
                      <button type="submit" className="btn btn-primary">
                        옮기기 확인
                      </button>
                      <button
                        type="button"
                        className="btn btn-soft"
                        onClick={cancelMove}
                      >
                        취소
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    className="btn btn-soft"
                    onClick={() => startMove(item.id)}
                  >
                    쿠키완료실로 옮기기
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
