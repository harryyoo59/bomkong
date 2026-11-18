"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminMediaPreview } from "@/components/AdminMediaPreview";
import {
  findWatchSlot,
  resolveYoutubeWatchUrl,
  watchSlotLabel,
  youtubeUrlForWatchLang,
  type WatchItem,
  type WatchLang,
} from "@/lib/watch-media";

type Props = {
  items: WatchItem[];
  previewTicks: Record<string, number>;
  onSaveItem: (next: WatchItem) => Promise<void> | void;
  onRemoveItem: (id: string) => Promise<void> | void;
  onExit: () => void;
};

/**
 * 미리보기를 크게 보며 제목·번호·유튜브만 하나씩 다시 적는 정리 화면.
 */
export function WatchTitleCleanup({
  items,
  previewTicks,
  onSaveItem,
  onRemoveItem,
  onExit,
}: Props) {
  const ordered = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (a.episodeNumber !== b.episodeNumber) {
          return a.episodeNumber - b.episodeNumber;
        }
        if (a.lang === b.lang) return a.id.localeCompare(b.id);
        return a.lang === "ko" ? -1 : 1;
      }),
    [items],
  );

  const [index, setIndex] = useState(0);
  const safeIndex =
    ordered.length === 0 ? 0 : Math.min(index, ordered.length - 1);
  const current = ordered[safeIndex] ?? null;

  const [title, setTitle] = useState("");
  const [episodeText, setEpisodeText] = useState("0");
  const [lang, setLang] = useState<WatchLang>("ko");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!current) return;
    setTitle(current.title);
    setEpisodeText(String(current.episodeNumber));
    setLang(current.lang);
    setYoutubeUrl(current.youtubeUrl);
    setNote("");
  }, [current?.id]);

  useEffect(() => {
    if (ordered.length === 0) {
      setIndex(0);
      return;
    }
    if (index > ordered.length - 1) {
      setIndex(ordered.length - 1);
    }
  }, [ordered.length, index]);

  if (ordered.length === 0 || !current) {
    return (
      <section className="panel watch-cleanup-panel" aria-label="제목 다시 쓰기">
        <h2 className="section-title">제목 다시 쓰기</h2>
        <p className="muted">정리할 영상이 없어요.</p>
        <button type="button" className="btn btn-soft" onClick={onExit}>
          목록으로
        </button>
      </section>
    );
  }

  const slotPreview = `${episodeText.trim() || "?"}-${lang}`;
  const needsTitleFix =
    !title.trim() ||
    title.trim().startsWith("복구한 영상") ||
    title.trim() === current.id;

  async function saveCurrent(then: "stay" | "next") {
    if (busy || !current) return;
    const nextTitle = title.trim();
    if (!nextTitle) {
      setNote("제목을 적어 주세요.");
      return;
    }
    const num = Math.floor(Number(episodeText.trim()));
    if (!Number.isFinite(num) || num < 0) {
      setNote("편 번호는 0 이상으로 적어 주세요.");
      return;
    }
    const clash = findWatchSlot(items, num, lang);
    if (clash && clash.id !== current.id) {
      setNote(`이미 ${num}-${lang} 자리가 있어요. 번호를 바꿔 주세요.`);
      return;
    }

    const rawYoutube = youtubeUrl.trim();
    let nextYoutube = "";
    if (!rawYoutube) {
      nextYoutube = youtubeUrlForWatchLang(lang, "");
    } else {
      const resolved = resolveYoutubeWatchUrl(rawYoutube);
      if (resolved) {
        nextYoutube = resolved;
      } else if (/youtu\.?be/i.test(rawYoutube)) {
        // 채널 주소 등 — 일단 보관 (밖에서 재생은 영상 주소 필요할 수 있음)
        nextYoutube = rawYoutube;
      } else {
        setNote("유튜브 주소를 다시 붙여 넣어 주세요.");
        return;
      }
    }

    setBusy(true);
    try {
      await onSaveItem({
        ...current,
        title: nextTitle,
        episodeNumber: num,
        lang,
        youtubeUrl: nextYoutube,
      });
      setNote(`「${nextTitle}」(${num}-${lang}) 저장했어요.`);
      if (then === "next" && safeIndex < ordered.length - 1) {
        setIndex(safeIndex + 1);
      }
    } catch (err) {
      setNote(
        err instanceof Error ? err.message : "저장하지 못했어요. 다시 해 주세요.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function removeCurrent() {
    if (busy || !current) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `「${current.title}」칸을 목록에서 뺄까요? (미리보기 파일도 함께 지워요)`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const removingIndex = safeIndex;
      await onRemoveItem(current.id);
      setNote("칸을 빼 두었어요.");
      setIndex(Math.max(0, removingIndex - (removingIndex > 0 ? 0 : 0)));
    } catch (err) {
      setNote(
        err instanceof Error ? err.message : "빼지 못했어요. 다시 해 주세요.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel watch-cleanup-panel" aria-label="제목 다시 쓰기">
      <div className="watch-cleanup-head">
        <h2 className="section-title">제목 다시 쓰기</h2>
        <button type="button" className="btn btn-soft" onClick={onExit} disabled={busy}>
          목록으로
        </button>
      </div>
      <p className="muted tiny">
        미리보기를 보고, 유튜브에서 확인한 제목·주소를 붙여 넣어요.{" "}
        <strong>
          {safeIndex + 1} / {ordered.length}
        </strong>
      </p>

      <div className="watch-cleanup-card">
        <div className="watch-cleanup-preview">
          <AdminMediaPreview
            itemId={current.id}
            kindHint="video"
            label={current.title}
            refreshToken={previewTicks[current.id] ?? 0}
          />
        </div>

        <p className="tiny muted">
          지금 자리 미리보기 · {slotPreview} (저장 전) · 원래{" "}
          {watchSlotLabel(current)}
        </p>
        {needsTitleFix ? (
          <p className="form-msg" role="status">
            제목을 새로 적어 주세요.
          </p>
        ) : null}

        <label className="admin-inline-youtube">
          영상 제목
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="유튜브에서 본 제목"
            autoComplete="off"
          />
        </label>

        <div className="form-row">
          <label>
            편 번호
            <input
              type="number"
              min={0}
              step={1}
              value={episodeText}
              onChange={(e) => setEpisodeText(e.target.value)}
              inputMode="numeric"
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

        <label className="admin-inline-youtube">
          유튜브 주소 (숏츠·영상)
          <input
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://youtube.com/shorts/… 또는 watch?v=…"
            inputMode="url"
            autoComplete="off"
          />
        </label>

        {note ? <p className="form-msg">{note}</p> : null}

        <div className="watch-cleanup-actions">
          <button
            type="button"
            className="btn btn-soft"
            disabled={busy || safeIndex <= 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
          >
            이전
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() => void saveCurrent("stay")}
          >
            {busy ? "저장 중…" : "이 칸 저장"}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() => void saveCurrent("next")}
          >
            저장 후 다음
          </button>
        </div>
        <div className="watch-cleanup-actions">
          <button
            type="button"
            className="btn btn-soft"
            disabled={busy || safeIndex >= ordered.length - 1}
            onClick={() =>
              setIndex((i) => Math.min(ordered.length - 1, i + 1))
            }
          >
            다음 (저장 안 함)
          </button>
          <button
            type="button"
            className="btn btn-soft"
            disabled={busy}
            onClick={() => void removeCurrent()}
          >
            이 칸 빼기
          </button>
        </div>
      </div>
    </section>
  );
}
