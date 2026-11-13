import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/** 소스 보관실은 더 이상 쓰지 않아요 → 관리자실로 */
export default async function AdminSourcePage() {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    redirect(
      gate.reason === "missing_secret"
        ? "/admin/login?need=setup"
        : "/admin/login?next=/admin",
    );
  }
  redirect("/admin");
}
