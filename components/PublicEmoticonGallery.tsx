"use client";

import { useEffect, useRef, useState } from "react";
import { listPublicEmoticonsAction } from "@/app/emoticons/actions";
import { copyEmoticonToClipboard } from "@/lib/emoticon-copy-client";
import {
  prefetchEmoticonBlobs,
  shareEmoticonFile,
} from "@/lib/emoticon-share-client";
import {
  emoticonShelfLabel,
  isMotionEmoticon,
  type EmoticonItem,
  type EmoticonShelf,
} from "@/lib/emoticons";

const SHELVES: EmoticonShelf[] = ["bomi", "kongi", "etc"];

export function PublicEmoticonGallery() {
  const [shelf, setShelf] = useState<EmoticonShelf>("bomi");
  const [items, setItems] = useState<EmoticonItem[]>([]);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const prefetchRef = useRef<Map<string, Promise<Blob>>>(new Map());

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setMessage("");
    prefetchRef.current = new Map();
    (async () => {
      const result = await listPublicEmoticonsAction(shelf);
      if (cancelled) return;
      if (!result.ok) {
        setItems([]);
        setMessage(result.message);
        setReady(true);
        return;
      }
      setItems(result.items);
      prefetchRef.current = prefetchEmoticonBlobs(result.items);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [shelf]);

  async function onCopy(item: EmoticonItem) {
    if (busyId) return;
    setBusyId(item.id);
    setMessage("");
    try {
      await copyEmoticonToClipboard(item, item.name || "emoticon");
      setMessage(
        "복사했어요. 카톡이나 메시지 창에 붙여 넣으면 돼요.",
      );
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "복사하지 못했어요. 다시 해 주세요.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function onShare(item: EmoticonItem) {
    if (busyId) return;
    setBusyId(item.id);
    setMessage("");
    try {
      const outcome = await shareEmoticonFile(
        item,
        item.name || "emoticon",
        { blobPromise: prefetchRef.current.get(item.id) ?? null },
      );
      if (outcome === "shared") {
        setMessage("공유 창을 열었어요. 카톡·메시지를 골라 보내면 돼요.");
      } else if (outcome === "downloaded") {
        setMessage(
          "이 기기에서는 공유 창이 안 열려서 파일로 받아 두었어요. 그 파일을 카톡·메시지에 넣어 주세요.",
        );
      }
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "공유하지 못했어요. 다시 해 주세요.",
      );
    } finally {
      setBusyId(null);
    }
  }

  const who = emoticonShelfLabel(shelf);

  return (
    <section className="panel public-emoticon-panel" aria-label="이모티콘 목록">
      <p className="eyebrow">복사 · 공유</p>
      <h1 className="section-title">이모티콘 구매및 선물하기</h1>
      <p className="muted">
        정지 그림은 「복사」, 움직이는 그림·영상은 「공유」로 카톡·메시지에 보낼 수
        있어요. (결제는 아직 없어요.)
      </p>

      <div className="public-emoticon-tabs" role="tablist" aria-label="누구 이모티콘">
        {SHELVES.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={shelf === id}
            className={`btn${shelf === id ? " btn-primary" : " btn-soft"}`}
            onClick={() => setShelf(id)}
          >
            {emoticonShelfLabel(id)}
          </button>
        ))}
      </div>

      {!ready ? (
        <p className="muted">{who} 이모티콘을 불러오는 중이에요…</p>
      ) : items.length === 0 ? (
        <p className="muted">
          아직 {who} 이모티콘이 없어요. 사장님이 관리자실에 넣으면 여기에
          나와요.
        </p>
      ) : (
        <ul className="public-emoticon-grid" aria-label={`${who} 이모티콘`}>
          {items.map((item) => {
            const src = item.publicUrl?.trim();
            const motion = isMotionEmoticon(item);
            return (
              <li key={item.id} className="public-emoticon-tile">
                <div className="public-emoticon-thumb" aria-hidden={!src}>
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <span className="public-emoticon-empty">없음</span>
                  )}
                </div>
                <p className="tiny muted public-emoticon-name" title={item.name}>
                  {item.name || who}
                </p>
                {motion ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-wide"
                    disabled={Boolean(busyId) || !src}
                    onClick={() => void onShare(item)}
                  >
                    {busyId === item.id ? "공유 중…" : "공유"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-wide"
                    disabled={Boolean(busyId) || !src}
                    onClick={() => void onCopy(item)}
                  >
                    {busyId === item.id ? "복사 중…" : "복사"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {message ? (
        <p className="form-msg" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
