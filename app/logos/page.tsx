import Link from "next/link";
import { LogoGallery } from "@/components/LogoGallery";
import { SiteShell } from "@/components/SiteShell";

export default function LogosPage() {
  return (
    <SiteShell title="로고 보관">
      <section className="panel logo-hero">
        <p className="eyebrow">공식 로고</p>
        <h1 className="logo-page-title">로고 보관</h1>
        <p className="muted">
          영상·옷·사이트에 쓰는 로고만 모아 두었어요. 각 로고에는 일련번호가
          있어요.
        </p>
      </section>

      <LogoGallery />

      <section className="panel stub-card">
        <Link className="btn btn-soft btn-wide" href="/">
          홈으로
        </Link>
      </section>
    </SiteShell>
  );
}
