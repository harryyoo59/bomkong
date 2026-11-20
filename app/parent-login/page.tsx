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
          지금은 이메일로 로그인해요. 구글·애플은 곧 이어서 열게요.
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
