"use client";

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

  const withPicture = items.filter((it) => Boolean(it.src || it.publicUrl));
  const nameOnly = items.filter((it) => !it.src && !it.publicUrl);

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
            {/* 공식 로고는 사이트 안 그림, 새로 넣은 로고는 인터넷 주소 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={(room.src || room.publicUrl)!}
              alt={`${formatSerial(room.serial)} ${room.title}`}
              className="logo-image"
              width={room.width ?? 1200}
              height={room.height ?? 800}
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
