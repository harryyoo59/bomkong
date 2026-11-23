"use client";

import { useEffect, useState } from "react";
import { listPublicEmoticonsAction } from "@/app/emoticons/actions";
import { copyEmoticonToClipboard } from "@/lib/emoticon-copy-client";
import {
  emoticonShelfLabel,
  type EmoticonItem,
  type EmoticonShelf,
} from "@/lib/emoticons";

const SHELVES: EmoticonShelf[] = ["bomi", "kongi"];

export function PublicEmoticonGallery() {
  const [shelf, setShelf] = useState<EmoticonShelf>("bomi");
  const [items, setItems] = useState<EmoticonItem[]>([]);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [copyBusyId, setCopyBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setMessage("");
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
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [shelf]);

  async function onCopy(item: EmoticonItem) {
    if (copyBusyId) return;
    setCopyBusyId(item.id);
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
      setCopyBusyId(null);
    }
  }

  const who = emoticonShelfLabel(shelf);

  return (
    <section className="panel public-emoticon-panel" aria-label="이모티콘 목록">
      <p className="eyebrow">복사 · 붙여 넣기</p>
      <h1 className="section-title">이모티콘 구매및 선물하기</h1>
      <p className="muted">
        마음에 드는 이모티콘을 「복사」한 뒤, 카톡이나 메시지 창에 붙여
        넣으세요. (결제는 아직 없어요.)
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
                <button
                  type="button"
                  className="btn btn-primary btn-wide"
                  disabled={Boolean(copyBusyId) || !src}
                  onClick={() => void onCopy(item)}
                >
                  {copyBusyId === item.id ? "복사 중…" : "복사"}
                </button>
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
