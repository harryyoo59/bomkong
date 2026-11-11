"use client";

import { useEffect, useState } from "react";
import { AdminEmptyText } from "@/components/AdminEmptyText";
import { AdminMediaPreview } from "@/components/AdminMediaPreview";
import { moveMediaPreview } from "@/lib/media-preview-store";
import {
  kindLabel,
  makeId,
  readSourceMediaStore,
  writeSourceMediaStore,
  type CookieItem,
  type SourceItem,
} from "@/lib/source-media";

export function CookieDoneRoom() {
  const [cookies, setCookies] = useState<CookieItem[]>([]);
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [ready, setReady] = useState(false);
  const [sourceId, setSourceId] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [message, setMessage] = useState("");

  function reload() {
    const store = readSourceMediaStore();
    setCookies(store.cookies);
    setSources(store.sources);
  }

  useEffect(() => {
    reload();
    setReady(true);
  }, []);

  async function onMove(e: React.FormEvent) {
    e.preventDefault();
    const title = videoTitle.trim();
    if (!sourceId) {
      setMessage("소스 보관실에서 옮길 자료를 골라 주세요.");
      return;
    }
    if (!title) {
      setMessage("쿠키 영상에 쓴 제목을 적어 주세요.");
      return;
    }
    const store = readSourceMediaStore();
    const target = store.sources.find((it) => it.id === sourceId);
    if (!target) {
      setMessage("선택한 소스를 찾지 못했어요. 목록을 다시 불러와 주세요.");
      reload();
      return;
    }
    const cookieId = makeId("ck");
    const nextSources = store.sources.filter((it) => it.id !== sourceId);
    const nextCookies = [
      {
        id: cookieId,
        kind: target.kind,
        name: target.name,
        videoTitle: title,
        movedAt: new Date().toISOString(),
        sourceId: target.id,
      },
      ...store.cookies,
    ];
    await moveMediaPreview(target.id, cookieId);
    writeSourceMediaStore({ sources: nextSources, cookies: nextCookies });
    setCookies(nextCookies);
    setSources(nextSources);
    setSourceId("");
    setVideoTitle("");
    setMessage(
      `「${target.name}」을(를) 옮겼어요. 영상 제목: ${title}`,
    );
  }

  if (!ready) {
    return <p className="muted">목록을 불러오는 중이에요…</p>;
  }

  return (
    <div className="admin-wrap">
      <p className="form-hint">
        쿠키 영상에 이미 쓴 소스를 모아 두는 방이에요. 여기 있는 자료는 다시
        쓰지 않아요. 각 자료에는 그 영상에 쓴 제목이 붙어 있어요.
      </p>

      <form className="admin-form" onSubmit={onMove}>
        <h2 className="section-title">소스에서 옮기기</h2>
        {sources.length === 0 ? (
          <p className="muted">
            소스 보관실에 남은 자료가 없어요. 먼저 소스를 넣어 주세요.
          </p>
        ) : (
          <>
            <label>
              옮길 소스
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                required
              >
                <option value="">고르기</option>
                {sources.map((item) => (
                  <option key={item.id} value={item.id}>
                    {kindLabel(item.kind)} · {item.name}
                    {item.note ? ` (${item.note})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              영상 제목 (쿠키에 쓴 제목)
              <input
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="예: 공원에서 공 놀이"
                required
              />
            </label>
            <button type="submit" className="btn btn-primary btn-wide">
              쿠키완료실로 옮기기
            </button>
          </>
        )}
      </form>

      {message ? <p className="form-msg">{message}</p> : null}

      <section>
        <h2 className="section-title">쿠키에 쓴 자료</h2>
        <p className="muted tiny">
          이 기기에만 기억해요. 새로고침해도 남아 있어요. 서버 저장은 아직
          없어요.
        </p>
        {cookies.length === 0 ? (
          <AdminEmptyText roomKey="cookie" />
        ) : (
          <ul className="admin-ep-list">
            {cookies.map((item) => (
              <li key={item.id} className="admin-ep-item">
                <div className="admin-ep-main">
                  <AdminMediaPreview
                    itemId={item.id}
                    kindHint={item.kind}
                    label={item.videoTitle}
                  />
                  <div>
                    <strong>
                      {kindLabel(item.kind)} · {item.name}
                    </strong>
                    <p className="vault-title-line">
                      영상 제목 · {item.videoTitle}
                    </p>
                    <p className="tiny muted">
                      옮긴 날{" "}
                      {new Date(item.movedAt).toLocaleString("ko-KR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
                <span className="pair-chip pair-ok">쿠키 사용 완료</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
