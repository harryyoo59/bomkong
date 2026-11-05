import Link from "next/link";
import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";

export function SiteShell({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <div className="phone-shell">
      <header className="top-bar">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden>
            봄콩
          </span>
          <span className="brand-name">봄이콩이</span>
        </Link>
        {title ? <p className="page-chip">{title}</p> : null}
      </header>

      <main className="page-body">{children}</main>

      <BottomNav />
    </div>
  );
}
