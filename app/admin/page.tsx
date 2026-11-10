import { logoutAdmin } from "@/app/admin/actions";
import { AdminClinicBoard } from "@/components/AdminClinicBoard";
import { requireAdminSession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminClinicPage() {
  const gate = await requireAdminSession();
  if (!gate.ok) {
    redirect(
      gate.reason === "missing_secret"
        ? "/admin/login?need=setup"
        : "/admin/login",
    );
  }

  return <AdminClinicBoard logoutAction={logoutAdmin} />;
}
