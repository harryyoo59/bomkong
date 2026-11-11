"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  readWatchMediaStore,
  type WatchItem,
} from "@/lib/watch-media";

export function WatchLobbyList() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readWatchMediaStore().items);
    setReady(true);
  }, []);

  if (!ready) {
    return <p className="muted">영상을 불러오는 중이에요…</p>;
  }

  if (items.length === 0) {
    return (
      <section className="panel watch-empty-panel" aria-live="polite">
        <h2 className="section-title">아직 볼 영상이 없어요</h2>
        <p className="muted">
          사장님이 영상보기 방에 넣어 주시면, 여기에 나와요.
        </p>
        <p className="muted tiny">다른 방에 있는 영상은 여기 안 보여요.</p>
      </section>
    );
  }

  return (
    <ul className="ep-list">
      {items.map((item, index) => (
        <li key={item.id} className="ep-row">
          <div className="ep-meta">
            <div className="ep-head">
              <span className="ep-num">{index + 1}번</span>
              <span className="badge badge-free">영상보기</span>
            </div>
            <strong>{item.title}</strong>
            {item.note ? <p className="muted tiny">{item.note}</p> : null}
          </div>
          <div className="ep-actions">
            <Link
              className="btn btn-primary"
              href={`/watch/${encodeURIComponent(item.id)}`}
            >
              보기
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
