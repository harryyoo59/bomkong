"use client";

import { useState } from "react";

export type CharacterCopySection = {
  title: string;
  paragraphs: string[];
};

type Props = {
  name: string;
  sections: CharacterCopySection[];
};

function buildCharacterText(
  name: string,
  sections: CharacterCopySection[],
): string {
  const lines = [`${name} 캐릭터 설명`, ""];
  for (const section of sections) {
    lines.push(`【${section.title}】`);
    for (const para of section.paragraphs) {
      lines.push(para);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

export function CharacterCopyButton({ name, sections }: Props) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function onCopy() {
    if (busy) return;
    setBusy(true);
    try {
      const text = buildCharacterText(name, sections);
      if (
        typeof navigator === "undefined" ||
        !navigator.clipboard?.writeText
      ) {
        throw new Error("이 기기에서는 복사를 못 해요. 다른 브라우저로 해 보세요.");
      }
      await navigator.clipboard.writeText(text);
      setMessage("설명을 복사했어요. AI에게 붙여 넣으면 돼요.");
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "설명을 복사하지 못했어요. 다시 해 주세요.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="character-copy-box">
      <button
        type="button"
        className="btn btn-primary btn-wide"
        onClick={() => void onCopy()}
        disabled={busy}
      >
        {busy ? "복사 중…" : `${name} 설명 복사하기`}
      </button>
      <p className="muted tiny">
        복사한 뒤 AI 채팅에 붙여 넣으면, 이 캐릭터 설명을 보낼 수 있어요.
      </p>
      {message ? <p className="form-msg">{message}</p> : null}
    </div>
  );
}
