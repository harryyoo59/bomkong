"use client";

import { useEffect, useState } from "react";
import { publishWatchCatalogAction } from "@/app/admin/watch/actions";
import { AdminEmptyText } from "@/components/AdminEmptyText";
import { WatchYoutubeCapture } from "@/components/WatchYoutubeCapture";
import { askShareBossLock } from "@/lib/share-boss-lock-client";
import {
  fetchWatchMediaFromServer,
  findWatchSlot,
  isWatchSubscribeGuide,
  makeWatchId,
  pushWatchMediaToServer,
  readWatchMediaStore,
  resolveYoutubeWatchUrl,
  sortWatchItemsForPlay,
  sortWatchItemsNumberDesc,
  suggestNextWatchSlot,
  suggestWatchSlotAfterAdd,
  syncWatchMediaWithServer,
  watchSlotLabel,
  writeWatchMediaStore,
  YOUTUBE_CHANNEL_BY_LANG,
  type WatchItem,
  type WatchLang,
} from "@/lib/watch-media";

function tellShareResult(
  setMessage: (msg: string) => void,
  msg: string,
): void {
  setMessage(msg);
  if (typeof window === "undefined") return;
  try {
    window.alert(msg);
  } catch {
    /* 알림이 막혀도 화면 글은 남김 */
  }
}

const CHANNEL_ROWS = [
  {
    id: "ko" as const,
    label: "유튜브 한국어 채널",
    url: YOUTUBE_CHANNEL_BY_LANG.ko,
    displayUrl: "https://www.youtube.com/@봄이콩이BomKong",
  },
  {
    id: "en" as const,
    label: "유튜브 영어 채널",
    url: YOUTUBE_CHANNEL_BY_LANG.en,
    displayUrl: "https://www.youtube.com/@bomkong-En",
  },
];

export function WatchVideoRoom() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  /** 글자로 둬서 지울 때 빈칸이 되게 함 (숫자면 지우자마자 1로 고정됨) */
  const [episodeNumberText, setEpisodeNumberText] = useState("0");
  const [lang, setLang] = useState<WatchLang>("ko");
  const [message, setMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [copyBusyId, setCopyBusyId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [editTitles, setEditTitles] = useState<Record<string, string>>({});
  const [editUrls, setEditUrls] = useState<Record<string, string>>({});
  const [editSlots, setEditSlots] = useState<
    Record<string, { episodeNumberText: string; lang: WatchLang }>
  >({});
  const [shareBusy, setShareBusy] = useState(false);
  const [sharedOk, setSharedOk] = useState(false);

  function syncEditors(list: WatchItem[]) {
    setEditTitles(Object.fromEntries(list.map((it) => [it.id, it.title])));
    setEditUrls(
      Object.fromEntries(list.map((it) => [it.id, it.youtubeUrl])),
    );
    setEditSlots(
      Object.fromEntries(
        list.map((it) => [
          it.id,
          {
            episodeNumberText: String(it.episodeNumber),
            lang: it.lang,
          },
        ]),
      ),
    );
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const before = sortWatchItemsForPlay(readWatchMediaStore().items);
        const synced = await syncWatchMediaWithServer({
          allowUploadLocal: true,
          confirmChange: (msg) =>
            typeof window !== "undefined" ? window.confirm(msg) : false,
        });
        const ordered = sortWatchItemsForPlay(synced);
        // 빈 결과로 기존 목록을 덮지 않음 (writeWatchMediaStore 가드와 함께)
        if (ordered.length > 0) {
          writeWatchMediaStore({ items: ordered });
        }
        if (cancelled) return;
        const shown = ordered.length > 0 ? ordered : before;
        setItems(shown);
        const nextSlot = suggestNextWatchSlot(shown);
        setEpisodeNumberText(String(nextSlot.episodeNumber));
        setLang(nextSlot.lang);
        syncEditors(shown);

        let remoteCount = -1;
        try {
          remoteCount = (await fetchWatchMediaFromServer()).length;
        } catch {
          remoteCount = -1;
        }

        if (shown.length === 0) {
          setSharedOk(false);
          setMessage("목록이 비어 있어요. 넣으면 인터넷에도 바로 저장돼요.");
        } else if (remoteCount === shown.length) {
          setSharedOk(true);
          setMessage(
            `영상 ${shown.length}개예요. 인터넷에도 같아서 다른 기기에서도 봐요.`,
          );
        } else if (remoteCount === 0) {
          setSharedOk(false);
          setMessage(
            `이 기기에 ${shown.length}개가 있어요. 아직 인터넷에는 없어요. 아래 「다른 기기에도 보이게 올리기」를 눌러 주세요.`,
          );
        } else if (remoteCount > 0) {
          setSharedOk(false);
          setMessage(
            `이 기기 ${shown.length}개 · 인터넷 ${remoteCount}개예요. 「다른 기기에도 보이게 올리기」로 맞춰 주세요.`,
          );
        } else {
          setSharedOk(false);
          setMessage(
            `이 기기에 ${shown.length}개가 있어요. 인터넷 상태를 확인하지 못했어요.`,
          );
        }
      } catch {
        if (!cancelled) {
          setSharedOk(false);
          setMessage("인터넷 목록을 못 불러왔어요. 잠시 후 다시 열어 주세요.");
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function persist(next: WatchItem[]) {
    const ordered = sortWatchItemsForPlay(next);
    writeWatchMediaStore({ items: ordered }, { allowEmpty: true });
    setItems(ordered);
    syncEditors(ordered);
    if (ordered.length === 0) {
      setSharedOk(false);
      setMessage("목록이 비어 있어요.");
      return;
    }
    const result = await publishWatchCatalogAction(ordered);
    if (!result.ok) {
      setSharedOk(false);
      setMessage(result.message);
      if (typeof window !== "undefined") {
        window.alert(result.message);
      }
      return;
    }
    setItems(result.items);
    syncEditors(result.items);
    writeWatchMediaStore({ items: result.items });
    setSharedOk(true);
    setMessage(
      `저장했어요. 다른 기기에서도 같은 목록(${result.count}개)을 봐요.`,
    );
  }

  async function onShareToOtherDevices() {
    if (shareBusy) {
      tellShareResult(
        setMessage,
        "아직 이전 올리기가 끝나지 않았어요. 잠시만 기다려 주세요.",
      );
      return;
    }
    const ordered = sortWatchItemsForPlay(items);
    if (ordered.length === 0) {
      setSharedOk(false);
      tellShareResult(
        setMessage,
        "올릴 영상이 없어요. 먼저 목록에 영상을 넣어 주세요.",
      );
      return;
    }
    const lock = await askShareBossLock();
    if (!lock.ok) {
      tellShareResult(setMessage, lock.message);
      return;
    }
    setShareBusy(true);
    setMessage(`인터넷에 ${ordered.length}개 올리는 중이에요…`);
    try {
      let result: Awaited<ReturnType<typeof publishWatchCatalogAction>>;
      try {
        result = await Promise.race([
          publishWatchCatalogAction(ordered),
          new Promise<never>((_, reject) => {
            window.setTimeout(() => {
              reject(
                new Error(
                  "시간이 너무 오래 걸려요. 새로고침한 뒤 다시 눌러 주세요.",
                ),
              );
            }, 25000);
          }),
        ]);
      } catch (actionErr) {
        // 서버 연결이 실패하면 다른 길로 한 번 더 시도 (목록은 지우지 않음)
        try {
          const saved = await pushWatchMediaToServer(ordered);
          const remote = await fetchWatchMediaFromServer();
          if (remote.length === 0) {
            throw new Error(
              "올렸다고 나왔지만 인터넷 목록이 비어 있어요. 다시 해 주세요.",
            );
          }
          result = { ok: true, items: remote, count: remote.length };
          void saved;
        } catch (fallbackErr) {
          const actionMsg =
            actionErr instanceof Error ? actionErr.message : "올리기 실패";
          const fallbackMsg =
            fallbackErr instanceof Error
              ? fallbackErr.message
              : "다른 길 올리기도 실패";
          throw new Error(`${actionMsg} / ${fallbackMsg}`);
        }
      }

      if (!result.ok) {
        setSharedOk(false);
        tellShareResult(setMessage, result.message);
        return;
      }
      setItems(result.items);
      syncEditors(result.items);
      writeWatchMediaStore({ items: result.items });
      setSharedOk(true);
      tellShareResult(
        setMessage,
        `확인했어요. 인터넷에 ${result.count}개 있어요. 다른 기기에서 새로고침 해 보세요.`,
      );
    } catch (err) {
      setSharedOk(false);
      tellShareResult(
        setMessage,
        err instanceof Error
          ? err.message
          : "인터넷에 올리지 못했어요. 다시 해 주세요.",
      );
    } finally {
      setShareBusy(false);
    }
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setMessage("영상 제목을 적어 주세요.");
      return;
    }
    const num = Math.floor(Number(episodeNumberText.trim()));
    if (!Number.isFinite(num) || num < 0) {
      setMessage("편 번호는 0 이상으로 적어 주세요.");
      return;
    }
    if (findWatchSlot(items, num, lang)) {
      setMessage(
        `이미 ${num}-${lang} 자리가 있어요. 번호를 바꾸거나 다른 언어를 골라 주세요.`,
      );
      return;
    }
    const item: WatchItem = {
      id: makeWatchId(),
      name: "",
      title: trimmedTitle,
      youtubeUrl: "",
      note: "",
      addedAt: new Date().toISOString(),
      episodeNumber: num,
      lang,
    };
    // 나중에 넣은 것은 뒤로 — 번호 순으로 정렬해 저장
    const next = sortWatchItemsForPlay([...items, item]);
    await persist(next);
    const slot = watchSlotLabel(item);
    setMessage(
      `「${item.title}」(${slot})을(를) 영상보기 방에 넣었어요. 유튜브 주소를 넣으면 옆에 화면이 나와요.`,
    );
    setTitle("");
    // 한국어 넣었으면 같은 번호 영어가 다음 · 영어까지 넣었으면 다음 번호 한국어
    const nextSlot = suggestWatchSlotAfterAdd(next, item);
    setEpisodeNumberText(String(nextSlot.episodeNumber));
    setLang(nextSlot.lang);
    setFormKey((k) => k + 1);
  }

  function onLangChange(nextLang: WatchLang) {
    setLang(nextLang);
    // 언어를 바꾸면: 짝이 비어 있는 편 번호를 우선 맞춤
    const numbers = [
      ...new Set(items.map((it) => it.episodeNumber)),
    ].sort((a, b) => a - b);
    for (const n of numbers) {
      const hasThis = items.some(
        (it) => it.episodeNumber === n && it.lang === nextLang,
      );
      if (hasThis) continue;
      const other = nextLang === "ko" ? "en" : "ko";
      const hasOther = items.some(
        (it) => it.episodeNumber === n && it.lang === other,
      );
      if (hasOther) {
        setEpisodeNumberText(String(n));
        return;
      }
    }
    const slot = suggestNextWatchSlot(items);
    if (slot.lang === nextLang) {
      setEpisodeNumberText(String(slot.episodeNumber));
    }
  }

  function onSaveSlot(id: string, nextNumberText: string, nextLang: WatchLang) {
    const target = items.find((it) => it.id === id);
    if (!target) return;
    const num = Math.floor(Number(nextNumberText.trim()));
    if (!Number.isFinite(num) || num < 0) {
      setMessage("편 번호는 0 이상으로 적어 주세요.");
      return;
    }
    const clash = findWatchSlot(items, num, nextLang);
    if (clash && clash.id !== id) {
      setMessage(
        `이미 ${num}-${nextLang} 자리가 있어요. 다른 번호·언어로 바꿔 주세요.`,
      );
      return;
    }
    void persist(
      items.map((it) =>
        it.id === id
          ? {
              ...it,
              episodeNumber: num,
              lang: nextLang,
            }
          : it,
      ),
    );
    setMessage(
      `「${target.title}」 자리를 ${num}-${nextLang}(으)로 바꿨어요.`,
    );
  }

  function onSaveTitle(id: string) {
    const target = items.find((it) => it.id === id);
    if (!target) return;
    const nextTitle = (editTitles[id] ?? "").trim();
    if (!nextTitle) {
      setMessage("영상 제목을 적어 주세요.");
      return;
    }
    void persist(
      items.map((it) => (it.id === id ? { ...it, title: nextTitle } : it)),
    );
    setMessage(`제목을 「${nextTitle}」(으)로 바꿨어요.`);
  }

  function onSaveYoutube(id: string) {
    const target = items.find((it) => it.id === id);
    if (!target) return;
    const raw = (editUrls[id] ?? "").trim();
    if (!raw) {
      void persist(
        items.map((it) =>
          it.id === id ? { ...it, youtubeUrl: "" } : it,
        ),
      );
      setEditUrls((prev) => ({ ...prev, [id]: "" }));
      setMessage(`「${target.title}」 유튜브 주소를 비워 두었어요.`);
      return;
    }
    const nextUrl = resolveYoutubeWatchUrl(raw);
    if (!nextUrl) {
      setMessage(
        "영상(숏츠) 주소를 붙여 넣어 주세요. 채널 주소만으로는 안 돼요.",
      );
      return;
    }
    void persist(
      items.map((it) =>
        it.id === id ? { ...it, youtubeUrl: nextUrl } : it,
      ),
    );
    setEditUrls((prev) => ({ ...prev, [id]: nextUrl }));
    setMessage(`「${target.title}」 유튜브 주소를 저장했어요.`);
  }

  async function onRemove(id: string) {
    const target = items.find((it) => it.id === id);
    if (!target) return;
    const next = items.filter((it) => it.id !== id);
    await persist(next);
    const nextSlot = suggestNextWatchSlot(next);
    setEpisodeNumberText(String(nextSlot.episodeNumber));
    setLang(nextSlot.lang);
    setMessage(
      `「${target.title}」(${watchSlotLabel(target)})을(를) 목록에서 빼 두었어요.`,
    );
  }

  async function onCopyChannel(id: string, url: string, label: string) {
    if (copyBusyId) return;
    setCopyBusyId(id);
    try {
      if (
        typeof navigator === "undefined" ||
        !navigator.clipboard?.writeText
      ) {
        throw new Error(
          "이 기기에서는 복사를 못 해요. 다른 브라우저로 해 보세요.",
        );
      }
      await navigator.clipboard.writeText(url);
      setCopyMessage(`${label} 주소를 복사했어요.`);
    } catch (err) {
      setCopyMessage(
        err instanceof Error
          ? err.message
          : "주소를 복사하지 못했어요. 다시 해 주세요.",
      );
    } finally {
      setCopyBusyId(null);
    }
  }

  if (!ready) {
    return <p className="muted">목록을 불러오는 중이에요…</p>;
  }

  // 관리자 목록: 번호 큰 것이 위 · 0번은 맨 아래 (찾기 쉽게)
  const adminList = sortWatchItemsNumberDesc(items);

  return (
    <div className="admin-wrap">
      <div className="watch-share-box" aria-label="다른 기기에 보이기">
        <p className="tiny muted">
          {sharedOk
            ? "지금 인터넷과 같아요. 다른 기기에서도 이 목록을 봐요."
            : "다른 기기에서도 같게 보려면, 이 버튼으로 인터넷에 올려 주세요. 목록을 지우지는 않아요."}
        </p>
        <p className="tiny muted">지금 이 기기 목록 {items.length}개</p>
        <button
          type="button"
          className="btn btn-primary btn-wide"
          disabled={shareBusy || items.length === 0}
          onClick={() => void onShareToOtherDevices()}
        >
          {shareBusy ? "올리는 중…" : "다른 기기에도 보이게 올리기"}
        </button>
        {message ? (
          <p className="form-msg" role="alert">
            {message}
          </p>
        ) : null}
      </div>
      <div className="watch-channel-box" aria-label="유튜브 채널 주소">
        {CHANNEL_ROWS.map((row) => (
          <div key={row.id} className="watch-channel-row">
            <div className="watch-channel-main">
              <strong>{row.label}</strong>
              <p className="watch-channel-url">{row.displayUrl}</p>
            </div>
            <button
              type="button"
              className="btn btn-soft"
              disabled={Boolean(copyBusyId)}
              onClick={() => void onCopyChannel(row.id, row.url, row.label)}
            >
              {copyBusyId === row.id ? "복사 중…" : "복사하기"}
            </button>
          </div>
        ))}
        {copyMessage ? <p className="form-msg">{copyMessage}</p> : null}
      </div>

      <form key={formKey} className="admin-form" onSubmit={onAdd}>
        <p className="tiny muted">
          먼저 제목·번호만 넣고, 유튜브 영상 주소는 아래 목록 칸에 직접 붙여
          넣어요.
        </p>

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
              min={0}
              step={1}
              value={episodeNumberText}
              onChange={(e) => setEpisodeNumberText(e.target.value)}
              inputMode="numeric"
              required
            />
          </label>
          <label>
            언어
            <select
              value={lang}
              onChange={(e) => onLangChange(e.target.value as WatchLang)}
            >
              <option value="ko">한국어 (ko)</option>
              <option value="en">영어 (en)</option>
            </select>
          </label>
        </div>
        <p className="tiny muted">
          지금 넣을 자리 ·{" "}
          {episodeNumberText.trim()
            ? `${episodeNumberText.trim()}-${lang}`
            : `(번호 입력)-${lang}`}
          {lang === "en"
            ? " (같은 편 한국어와 짝)"
            : " (기본은 마지막 다음 번호 · 한국어)"}
        </p>

        <p className="tiny muted">
          미리보기 파일은 쓰지 않아요. 유튜브 주소를 넣으면 로비처럼 옆에 화면이
          자동으로 나와요.
        </p>

        <button type="submit" className="btn btn-primary btn-wide">
          영상보기 방에 넣기
        </button>
      </form>

      {message ? <p className="form-msg">{message}</p> : null}

      <section>
        <h2 className="section-title">거실에 보이는 영상</h2>
        <p className="muted tiny">
          인터넷에 저장해요. 다른 사람도 같은 목록을 봐요. 아래는 번호 큰 것이
          위, 0번은 맨 아래예요. 같은 번호는 한국어 → 영어 순이에요.
        </p>
        {adminList.length === 0 ? (
          <AdminEmptyText roomKey="watch" />
        ) : (
          <ul className="admin-ep-list">
            {adminList.map((item) => {
              const isGuide = isWatchSubscribeGuide(item);
              const resolved = resolveYoutubeWatchUrl(item.youtubeUrl);
              const slot = watchSlotLabel(item);
              return (
                <li key={item.id} className="admin-ep-item">
                  <div className="admin-ep-main">
                    <WatchYoutubeCapture
                      youtubeUrl={item.youtubeUrl}
                      size="admin"
                    />
                    <div>
                      <p className="tiny muted">{slot}</p>
                      {isGuide ? (
                        <p className="tiny muted">
                          20번 뒤 고정 · 손님 안내 화면에 유튜브로 재생
                          {resolved
                            ? ` · ${resolved}`
                            : " · 유튜브 주소를 넣어 주세요"}
                          {item.name ? ` · ${item.name}` : ""}
                        </p>
                      ) : resolved ? (
                        <p className="tiny muted">유튜브 · {resolved}</p>
                      ) : (
                        <p className="tiny muted">
                          유튜브 주소 없음 · 주소 넣으면 옆에 화면이 나와요
                        </p>
                      )}
                      <p className="tiny muted">
                        넣은 날{" "}
                        {new Date(item.addedAt).toLocaleString("ko-KR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                      <label className="admin-inline-youtube">
                        영상 제목
                        <input
                          value={editTitles[item.id] ?? ""}
                          onChange={(e) =>
                            setEditTitles((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          placeholder="영상 제목"
                        />
                      </label>
                      <button
                        type="button"
                        className="btn btn-soft"
                        onClick={() => onSaveTitle(item.id)}
                      >
                        제목 저장
                      </button>
                      {isGuide ? (
                        <>
                          <p className="tiny muted">
                            20번 뒤에 번호 없이 고정이에요. 유튜브 주소를 넣으면
                            손님 안내 화면에서 재생돼요.
                          </p>
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
                              placeholder="숏츠·영상 주소를 직접 붙여 넣기"
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
                        </>
                      ) : (
                        <>
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
                              placeholder="숏츠·영상 주소를 직접 붙여 넣기"
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
                          <div className="form-row">
                            <label>
                              편 번호
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={
                                  editSlots[item.id]?.episodeNumberText ??
                                  String(item.episodeNumber)
                                }
                                onChange={(e) =>
                                  setEditSlots((prev) => ({
                                    ...prev,
                                    [item.id]: {
                                      episodeNumberText: e.target.value,
                                      lang:
                                        prev[item.id]?.lang ?? item.lang,
                                    },
                                  }))
                                }
                                inputMode="numeric"
                              />
                            </label>
                            <label>
                              언어
                              <select
                                value={editSlots[item.id]?.lang ?? item.lang}
                                onChange={(e) =>
                                  setEditSlots((prev) => ({
                                    ...prev,
                                    [item.id]: {
                                      episodeNumberText:
                                        prev[item.id]?.episodeNumberText ??
                                        String(item.episodeNumber),
                                      lang: e.target.value as WatchLang,
                                    },
                                  }))
                                }
                              >
                                <option value="ko">한국어 (ko)</option>
                                <option value="en">영어 (en)</option>
                              </select>
                            </label>
                          </div>
                          <button
                            type="button"
                            className="btn btn-soft"
                            onClick={() => {
                              const slotEdit = editSlots[item.id] ?? {
                                episodeNumberText: String(item.episodeNumber),
                                lang: item.lang,
                              };
                              onSaveSlot(
                                item.id,
                                slotEdit.episodeNumberText,
                                slotEdit.lang,
                              );
                            }}
                          >
                            번호·언어 저장
                          </button>
                        </>
                      )}
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
