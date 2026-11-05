"use client";

import { useMemo, useState } from "react";
import type { Episode, Visibility } from "@/lib/types";
import sample from "@/data/episodes.json";

type Draft = {
  number: string;
  titleKo: string;
  titleEn: string;
  wordEn: string;
  wordKo: string;
  wordDirection: "ko-en" | "en-ko";
  fileKo: string;
  fileEn: string;
  fileCookie: string;
  visibility: Visibility;
  summary: string;
  youtubeKo: string;
  youtubeEn: string;
};

const emptyDraft: Draft = {
  number: "",
  titleKo: "",
  titleEn: "",
  wordEn: "",
  wordKo: "",
  wordDirection: "ko-en",
  fileKo: "",
  fileEn: "",
  fileCookie: "",
  visibility: "free",
  summary: "",
  youtubeKo: "",
  youtubeEn: "",
};

function fileName(fileList: FileList | null): string {
  if (!fileList || fileList.length === 0) return "";
  return fileList[0].name;
}

export function AdminUploadForm() {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [formKey, setFormKey] = useState(0);
  const [localList, setLocalList] = useState<Episode[]>(
    () => sample as Episode[],
  );
  const [message, setMessage] = useState("");

  const hasKo = Boolean(draft.fileKo);
  const hasEn = Boolean(draft.fileEn);

  const preview = useMemo(() => {
    const n = Number(draft.number);
    if (!draft.titleKo || !Number.isFinite(n) || n <= 0) return null;
    return {
      id: `ep-local-${n}`,
      number: n,
      titleKo: draft.titleKo,
      titleEn: draft.titleEn || draft.titleKo,
      wordEn: draft.wordEn || "word",
      wordKo: draft.wordKo || "단어",
      hasKo,
      hasEn,
      cookieLabel: draft.fileCookie
        ? `쿠키 · ${draft.fileCookie}`
        : "쿠키 · 실사 자리표시",
      visibility: draft.visibility,
      summary: draft.summary || undefined,
    } satisfies Episode;
  }, [draft, hasEn, hasKo]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!preview) {
      setMessage("편 번호와 한국어 제목은 꼭 채워 주세요.");
      return;
    }
    if (!draft.fileKo) {
      setMessage("한국어 본편 파일 칸을 채워 주세요. (이름만 기억해요)");
      return;
    }

    setLocalList((prev) => {
      const without = prev.filter((ep) => ep.number !== preview.number);
      return [...without, preview].sort((a, b) => a.number - b.number);
    });

    const enNote = preview.hasEn
      ? "영어 짝 있음"
      : "영어 준비 중 → 이어보기에서 다음 한국어로";
    setMessage(
      `${preview.number}편 「${preview.titleKo}」을(를) 이 화면에만 넣었어요. (${enNote})`,
    );
    setDraft(emptyDraft);
    setFormKey((k) => k + 1);
  }

  return (
    <div className="admin-wrap">
      <form key={formKey} className="admin-form" onSubmit={onSubmit}>
        <p className="form-hint">
          필수 칸은 편 데이터 문서와 같아요. 파일은 이 기기에만 이름만
          기억해요. 서버 저장·실제 업로드는 아직 없어요.
        </p>

        <label>
          편 번호
          <input
            inputMode="numeric"
            value={draft.number}
            onChange={(e) => update("number", e.target.value)}
            placeholder="예: 5"
            required
          />
        </label>

        <label>
          제목 (한국어)
          <input
            value={draft.titleKo}
            onChange={(e) => update("titleKo", e.target.value)}
            placeholder="예: 공원에서 공 놀이"
            required
          />
        </label>

        <label>
          제목 (영어)
          <input
            value={draft.titleEn}
            onChange={(e) => update("titleEn", e.target.value)}
            placeholder="예: Ball at the park"
          />
        </label>

        <fieldset className="check-row">
          <legend>학습 단어 (그 편 하나)</legend>
          <div className="form-row">
            <label>
              영어 단어
              <input
                value={draft.wordEn}
                onChange={(e) => update("wordEn", e.target.value)}
                placeholder="ball"
              />
            </label>
            <label>
              한국어 단어
              <input
                value={draft.wordKo}
                onChange={(e) => update("wordKo", e.target.value)}
                placeholder="공"
              />
            </label>
          </div>
          <label>
            단어 방향
            <select
              value={draft.wordDirection}
              onChange={(e) =>
                update(
                  "wordDirection",
                  e.target.value as Draft["wordDirection"],
                )
              }
            >
              <option value="ko-en">한국어판 → 영어 단어 가르침</option>
              <option value="en-ko">영어판 → 한국어 단어 가르침</option>
            </select>
          </label>
        </fieldset>

        <fieldset className="check-row">
          <legend>본편 · 쿠키 파일</legend>
          <label>
            한국어 본편 파일
            <input
              type="file"
              accept="video/*"
              onChange={(e) => update("fileKo", fileName(e.target.files))}
            />
            <span className="file-note">
              {draft.fileKo ? `선택: ${draft.fileKo}` : "필수 · 아직 안 고름"}
            </span>
          </label>
          <label>
            영어 본편 파일
            <input
              type="file"
              accept="video/*"
              onChange={(e) => update("fileEn", fileName(e.target.files))}
            />
            <span className="file-note">
              {draft.fileEn ? (
                `선택: ${draft.fileEn}`
              ) : (
                <span className="pair-wait-text">
                  비우면 「영어 준비 중」→ 이어보기에서 다음 한국어
                </span>
              )}
            </span>
          </label>
          <label>
            쿠키 파일 (한·영 공통, 블러 완료)
            <input
              type="file"
              accept="video/*,image/*"
              onChange={(e) => update("fileCookie", fileName(e.target.files))}
            />
            <span className="file-note">
              {draft.fileCookie
                ? `선택: ${draft.fileCookie}`
                : "선택 · 없으면 자리표시"}
            </span>
          </label>
        </fieldset>

        <div className="pair-preview" aria-live="polite">
          {hasKo ? (
            <span className="pair-chip pair-ok">한국어 본편 있음</span>
          ) : (
            <span className="pair-chip pair-wait">한국어 파일 필요</span>
          )}
          {hasEn ? (
            <span className="pair-chip pair-ok">영어 짝 있음</span>
          ) : (
            <span className="pair-chip pair-wait">영어 준비 중</span>
          )}
        </div>

        <label>
          공개 범위
          <select
            value={draft.visibility}
            onChange={(e) =>
              update("visibility", e.target.value as Visibility)
            }
          >
            <option value="free">무료</option>
            <option value="subscribers">구독 전용</option>
          </select>
        </label>

        <details className="optional-block">
          <summary>선택 칸 (유튜브·줄거리)</summary>
          <label>
            유튜브 한국어 URL
            <input
              value={draft.youtubeKo}
              onChange={(e) => update("youtubeKo", e.target.value)}
              placeholder="숏츠 링크"
            />
          </label>
          <label>
            유튜브 영어 URL
            <input
              value={draft.youtubeEn}
              onChange={(e) => update("youtubeEn", e.target.value)}
              placeholder="숏츠 링크"
            />
          </label>
          <label>
            한 줄 줄거리 (부모용)
            <textarea
              rows={2}
              value={draft.summary}
              onChange={(e) => update("summary", e.target.value)}
              placeholder="짧게 적어 주세요"
            />
          </label>
        </details>

        <button type="submit" className="btn btn-primary btn-wide">
          이 화면에만 넣기
        </button>
        {message ? <p className="form-msg">{message}</p> : null}
      </form>

      <section>
        <h2 className="section-title">지금 화면 목록</h2>
        <p className="muted tiny">
          새로고침하면 샘플로 돌아가요. 서버 저장은 아직 없어요.
        </p>
        <ul className="admin-ep-list">
          {localList.map((ep) => (
            <li key={ep.id} className="admin-ep-item">
              <div>
                <strong>
                  {ep.number}편 · {ep.titleKo}
                </strong>
                <p className="tiny muted">
                  {ep.titleEn} · 단어 {ep.wordEn}/{ep.wordKo} ·{" "}
                  {ep.visibility === "free" ? "무료" : "구독 전용"}
                </p>
              </div>
              <div className="pair-row">
                <span
                  className={
                    ep.hasKo ? "pair-chip pair-ok" : "pair-chip pair-wait"
                  }
                >
                  한국어 {ep.hasKo ? "있음" : "없음"}
                </span>
                {ep.hasEn ? (
                  <span className="pair-chip pair-ok">영어 있음</span>
                ) : (
                  <span className="pair-chip pair-wait">영어 준비 중</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
