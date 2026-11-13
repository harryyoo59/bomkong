"use client";

import { useEffect, useState } from "react";
import { AdminEmptyText } from "@/components/AdminEmptyText";
import { AdminMediaPreview } from "@/components/AdminMediaPreview";
import { AdminPreviewAttach } from "@/components/AdminPreviewAttach";
import {
  deleteMediaPreview,
  saveMediaPreview,
} from "@/lib/media-preview-store";
import {
  findWatchSlot,
  makeWatchId,
  readWatchMediaStore,
  resolveYoutubeWatchUrl,
  sortWatchItemsForPlay,
  suggestNextEpisodeNumber,
  watchSlotLabel,
  writeWatchMediaStore,
  type WatchItem,
  type WatchLang,
} from "@/lib/watch-media";

export function WatchVideoRoom() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [note, setNote] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [lang, setLang] = useState<WatchLang>("ko");
  const [fileLabel, setFileLabel] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [editUrls, setEditUrls] = useState<Record<string, string>>({});
  const [previewTicks, setPreviewTicks] = useState<Record<string, number>>(
    {},
  );

  useEffect(() => {
    const store = readWatchMediaStore();
    setItems(store.items);
    setEpisodeNumber(suggestNextEpisodeNumber(store.items));
    setEditUrls(
      Object.fromEntries(store.items.map((it) => [it.id, it.youtubeUrl])),
    );
    setReady(true);
  }, []);

  function persist(next: WatchItem[]) {
    const ordered = sortWatchItemsForPlay(next);
    writeWatchMediaStore({ items: ordered });
    setItems(ordered);
    setEditUrls(
      Object.fromEntries(ordered.map((it) => [it.id, it.youtubeUrl])),
    );
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
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setMessage("영상 제목을 적어 주세요.");
      return;
    }
    const num = Math.floor(Number(episodeNumber));
    if (!Number.isFinite(num) || num < 1) {
      setMessage("편 번호는 1 이상으로 적어 주세요.");
      return;
    }
    if (findWatchSlot(items, num, lang)) {
      setMessage(
        `이미 ${num}-${lang} 자리가 있어요. 번호를 바꾸거나 다른 언어를 골라 주세요.`,
      );
      return;
    }
    const resolved = resolveYoutubeWatchUrl(youtubeUrl);
    if (!resolved) {
      setMessage(
        "유튜브 주소를 붙여 넣어 주세요. 주소가 없거나 잘못된 것 같아요.",
      );
      return;
    }
    const item: WatchItem = {
      id: makeWatchId(),
      name: pendingFile?.name ?? "",
      title: trimmedTitle,
      youtubeUrl: youtubeUrl.trim(),
      note: note.trim(),
      addedAt: new Date().toISOString(),
      episodeNumber: num,
      lang,
    };
    let previewOk = true;
    if (pendingFile) {
      try {
        await saveMediaPreview(item.id, pendingFile, "video");
      } catch {
        previewOk = false;
      }
    }
    // 나중에 넣은 것은 뒤로 — 번호 순으로 정렬해 저장
    const next = sortWatchItemsForPlay([...items, item]);
    persist(next);
    if (pendingFile) {
      setPreviewTicks((prev) => ({
        ...prev,
        [item.id]: (prev[item.id] ?? 0) + 1,
      }));
    }
    const slot = watchSlotLabel(item);
    setMessage(
      pendingFile
        ? previewOk
          ? `「${item.title}」(${slot})을(를) 영상보기 방에 넣었어요. 아이들이 누르면 유튜브로 가요. 옆에 관리용 미리보기도 있어요.`
          : `유튜브 주소와 제목은 넣었어요(${slot}). 미리보기는 저장하지 못했어요. 「미리보기 파일 넣기」로 다시 해 주세요.`
        : `「${item.title}」(${slot})을(를) 영상보기 방에 넣었어요. 아이들이 누르면 유튜브로 가요.`,
    );
    setTitle("");
    setYoutubeUrl("");
    setNote("");
    setPendingFile(null);
    setFileLabel("");
    setLang("ko");
    setEpisodeNumber(suggestNextEpisodeNumber(next));
    setFormKey((k) => k + 1);
  }

  function onSaveYoutube(id: string) {
    const target = items.find((it) => it.id === id);
    if (!target) return;
    const raw = (editUrls[id] ?? "").trim();
    if (!raw) {
      setMessage("유튜브 주소를 적어 주세요.");
      return;
    }
    if (!resolveYoutubeWatchUrl(raw)) {
      setMessage("유튜브 주소가 잘못된 것 같아요. 다시 붙여 넣어 주세요.");
      return;
    }
    persist(
      items.map((it) =>
        it.id === id ? { ...it, youtubeUrl: raw } : it,
      ),
    );
    setMessage(`「${target.title}」 유튜브 주소를 저장했어요.`);
  }

  async function onRemove(id: string) {
    const target = items.find((it) => it.id === id);
    if (!target) return;
    await deleteMediaPreview(id);
    const next = items.filter((it) => it.id !== id);
    persist(next);
    setEpisodeNumber(suggestNextEpisodeNumber(next));
    setMessage(
      `「${target.title}」(${watchSlotLabel(target)})을(를) 목록에서 빼 두었어요.`,
    );
  }

  if (!ready) {
    return <p className="muted">목록을 불러오는 중이에요…</p>;
  }

  return (
    <div className="admin-wrap">
      <form key={formKey} className="admin-form" onSubmit={onAdd}>
        <p className="form-hint">
          거실 「영상보기」에는 여기 넣은 영상만 나와요. 재생 순서는{" "}
          <strong>1-ko → 1-en → 2-ko → 2-en</strong> 이에요. 영어가 없으면 다음
          번호로 넘어가요. 나중에 넣은 영상은 뒤쪽 번호로 가요.
        </p>

        <label>
          유튜브 주소 (또는 영상 아이디)
          <input
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="예: https://youtu.be/… 또는 영상 아이디"
            inputMode="url"
            required
          />
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

        <div className="form-row">
          <label>
            편 번호
            <input
              type="number"
              min={1}
              step={1}
              value={episodeNumber}
              onChange={(e) => setEpisodeNumber(Number(e.target.value) || 1)}
              required
            />
          </label>
          <label>
            언어
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as WatchLang)}
            >
              <option value="ko">한국어 (ko)</option>
              <option value="en">영어 (en)</option>
            </select>
          </label>
        </div>
        <p className="tiny muted">
          지금 넣을 자리 · {episodeNumber}-{lang}
        </p>

        <label>
          동영상 미리보기 (선택 · 관리용)
          <input
            type="file"
            accept="video/*"
            onChange={(e) => onPickFile(e.target.files)}
          />
          <span className="file-note">
            {fileLabel
              ? `선택: ${fileLabel}`
              : "없어도 돼요. 제목·유튜브만으로도 넣어요."}
          </span>
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
          이 기기에만 기억해요. 비어 있으면 거실에도 빈 화면이 나와요. 위에서부터
          1-ko → 1-en → 2-ko 순으로 이어져요.
        </p>
        {items.length === 0 ? (
          <AdminEmptyText roomKey="watch" />
        ) : (
          <ul className="admin-ep-list">
            {items.map((item) => {
              const resolved = resolveYoutubeWatchUrl(item.youtubeUrl);
              const slot = watchSlotLabel(item);
              return (
                <li key={item.id} className="admin-ep-item">
                  <div className="admin-ep-main">
                    <AdminMediaPreview
                      itemId={item.id}
                      kindHint="video"
                      label={item.title}
                      refreshToken={previewTicks[item.id] ?? 0}
                    />
                    <div>
                      <p className="tiny muted">{slot}</p>
                      <strong>{item.title}</strong>
                      {item.name ? (
                        <p className="tiny muted">파일 · {item.name}</p>
                      ) : (
                        <p className="tiny muted">미리보기 파일 없음</p>
                      )}
                      {resolved ? (
                        <p className="tiny muted">유튜브 · {resolved}</p>
                      ) : (
                        <p className="tiny muted">유튜브 주소 없음</p>
                      )}
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
                      <AdminPreviewAttach
                        itemId={item.id}
                        kindHint="video"
                        accept="video/*"
                        onMessage={setMessage}
                        onAttached={() =>
                          setPreviewTicks((prev) => ({
                            ...prev,
                            [item.id]: (prev[item.id] ?? 0) + 1,
                          }))
                        }
                      />
                      <label className="admin-inline-youtube">
                        유튜브 주소
                        <input
                          value={editUrls[item.id] ?? ""}
                          onChange={(e) =>
                            setEditUrls((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          placeholder="유튜브 주소 붙여 넣기"
                          inputMode="url"
                        />
                      </label>
                      <button
                        type="button"
                        className="btn btn-soft"
                        onClick={() => onSaveYoutube(item.id)}
                      >
                        유튜브 주소 저장
                      </button>
                    </div>
                  </div>
                  <div className="vault-action-row">
                    <span className="pair-chip pair-ok">{slot}</span>
                    <button
                      type="button"
                      className="btn btn-soft"
                      onClick={() => onRemove(item.id)}
                    >
                      목록에서 빼기
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
