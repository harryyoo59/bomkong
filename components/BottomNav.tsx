"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** 손님용만. 관리자실(올리기)은 거실 문 → 서버 확인 후에만. */
const NAV = [
  { href: "/", label: "홈" },
  { href: "/episodes", label: "편 목록" },
  { href: "/subscribe", label: "구독" },
  { href: "/goods", label: "상품" },
  { href: "/characters/bomi", label: "봄이" },
  { href: "/characters/kongi", label: "콩이" },
  { href: "/logos", label: "로고" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={active ? "nav-link nav-link-active" : "nav-link"}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
