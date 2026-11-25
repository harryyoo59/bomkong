import Link from "next/link";
import { redirect } from "next/navigation";
import { ParentLoginForm } from "@/components/ParentLoginForm";
import { SiteShell } from "@/components/SiteShell";
import { safeNextPath } from "@/lib/parent-auth";
import { getParentSession } from "@/lib/parent-auth-server";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ next?: string; error?: string }>;
};

export default async function ParentLoginPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const next = safeNextPath(params.next);
  const error = typeof params.error === "string" ? params.error : null;

  const user = await getParentSession();
  if (user && !error) {
    redirect(next);
  }

  return (
    <SiteShell title="부모 로그인">
      <section className="panel">
        <h1 className="section-title">부모 로그인</h1>
        <p className="muted tiny">
          이메일과 비밀번호로 바로 들어와요. 구글·애플은 당분간 나중에 열어요.
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
