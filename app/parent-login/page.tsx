import Link from "next/link";
import { ParentLoginForm } from "@/components/ParentLoginForm";
import { SiteShell } from "@/components/SiteShell";
import { safeNextPath } from "@/lib/parent-auth";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ next?: string; error?: string }>;
};

export default async function ParentLoginPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const next = safeNextPath(params.next);
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <SiteShell title="부모 로그인">
      <section className="panel">
        <h1 className="section-title">부모 로그인</h1>
        <p className="muted tiny">
          구글·애플이 기본이에요. 안 되면 이메일이나 전화로도 들어올 수 있어요.
        </p>
      </section>
      <ParentLoginForm nextPath={next} initialError={error} />
      <div className="vault-nav-row">
        <Link className="btn btn-soft" href="/">
          거실로
        </Link>
      </div>
    </SiteShell>
  );
}
