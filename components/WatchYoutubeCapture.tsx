"use client";

import { watchYoutubeThumbUrl } from "@/lib/watch-media";

type Props = {
  youtubeUrl: string;
  /** 관리실에서 조금 더 크게 */
  size?: "lobby" | "admin";
};

/** 유튜브 주소로 옆 작은 캡쳐 — 양옆 띠 없이 칸 꽉 채움 */
export function WatchYoutubeCapture({
  youtubeUrl,
  size = "lobby",
}: Props) {
  const thumb = watchYoutubeThumbUrl(youtubeUrl);
  return (
    <span
      className={`ep-thumb${size === "admin" ? " admin-watch-yt-thumb" : ""}`}
      aria-hidden={thumb ? undefined : true}
      title={thumb ? undefined : "유튜브 주소 없음"}
    >
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="ep-thumb-image"
          src={thumb}
          alt=""
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className="ep-thumb-empty" />
      )}
    </span>
  );
}
