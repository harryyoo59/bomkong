"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  formatSerial,
  readLogoCatalog,
  SEED_LOGOS,
  type LogoItem,
} from "@/lib/logo-catalog";

export function LogoGallery() {
  const [items, setItems] = useState<LogoItem[]>(SEED_LOGOS);

  useEffect(() => {
    setItems(readLogoCatalog().items);
  }, []);

  const withPicture = items.filter((it) => Boolean(it.src));
  const nameOnly = items.filter((it) => !it.src);

  return (
    <>
      {withPicture.map((room, index) => (
        <section key={room.id} className="panel logo-room" id={room.id}>
          <p className="logo-serial-badge">
            일련번호 · {formatSerial(room.serial)}
          </p>
          <h2 className="section-title">{room.title}</h2>
          {room.blurb ? (
            <p className="muted logo-room-blurb">{room.blurb}</p>
          ) : null}
          <figure className="logo-card">
            <Image
              src={room.src!}
              alt={`${formatSerial(room.serial)} ${room.title}`}
              width={room.width ?? 1200}
              height={room.height ?? 800}
              className="logo-image"
              sizes="(max-width: 390px) 100vw, 390px"
              priority={index === 0}
            />
            <figcaption className="logo-caption">
              {formatSerial(room.serial)} · {room.title}
            </figcaption>
          </figure>
        </section>
      ))}

      {nameOnly.length > 0 ? (
        <section className="panel">
          <h2 className="section-title">번호만 적어 둔 로고</h2>
          <p className="muted">
            그림은 아직 사이트에 없고, 이름과 일련번호만 기억해 두었어요.
          </p>
          <ul className="admin-ep-list">
            {nameOnly.map((item) => (
              <li key={item.id} className="admin-ep-item">
                <div>
                  <p className="logo-serial-line">
                    일련번호 · {formatSerial(item.serial)}
                  </p>
                  <strong>{item.title}</strong>
                  {item.blurb ? (
                    <p className="tiny muted">{item.blurb}</p>
                  ) : null}
                  <p className="tiny muted">파일 · {item.name}</p>
                </div>
                <span className="pair-chip">
                  번호 {formatSerial(item.serial)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
