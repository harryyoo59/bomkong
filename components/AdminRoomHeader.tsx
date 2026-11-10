"use client";

import { useEffect, useState } from "react";
import {
  getRoomCopy,
  readAdminCopyStore,
  type RoomCopy,
  type RoomKey,
} from "@/lib/admin-copy";

type Props = {
  roomKey: RoomKey;
  /** panel = 방 맨 위 카드 · plain = 우편함처럼 헤더 안 */
  variant?: "panel" | "plain";
};

export function AdminRoomHeader({ roomKey, variant = "panel" }: Props) {
  const [copy, setCopy] = useState<RoomCopy>(() =>
    getRoomCopy(readAdminCopyStore(), roomKey),
  );

  useEffect(() => {
    setCopy(getRoomCopy(readAdminCopyStore(), roomKey));
  }, [roomKey]);

  const body = (
    <>
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1 className="section-title">{copy.title}</h1>
      <p className="muted">{copy.intro}</p>
    </>
  );

  if (variant === "plain") {
    return <div>{body}</div>;
  }

  return <section className="panel">{body}</section>;
}
