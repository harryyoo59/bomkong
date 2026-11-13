"use client";

import { useEffect, useState } from "react";
import { getRoomCopy, readAdminCopyStore } from "@/lib/admin-copy";

type Props = {
  roomKey: string;
  className?: string;
};

export function AdminEmptyText({ roomKey, className = "muted" }: Props) {
  const [text, setText] = useState(
    () => getRoomCopy(readAdminCopyStore(), roomKey).empty,
  );

  useEffect(() => {
    setText(getRoomCopy(readAdminCopyStore(), roomKey).empty);
  }, [roomKey]);

  return <p className={className}>{text}</p>;
}
