import Link from "next/link";
import { redirect } from "next/navigation";
import {
  enterMembersRoom,
  leaveMembersRoom,
} from "@/app/admin/members/actions";
import { AdminRoomHeader } from "@/components/AdminRoomHeader";
import { MembersRoomGate } from "@/components/MembersRoomGate";
import { MembersRoomHome } from "@/components/MembersRoomHome";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  getMembersRoomAuthConfig,
  requireMembersRoomSession,
} from "@/lib/members-room-auth";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const adminGate = await requireAdminSession();
  if (!adminGate.ok) {
    redirect(
      adminGate.reason === "missing_secret"
        ? "/admin/login?need=setup"
        : "/admin/login?next=/admin/members",
    );
  }

  const { configured } = getMembersRoomAuthConfig();
  const roomGate = await requireMembersRoomSession();

  if (!roomGate.ok) {
    return (
      <div className="study-room">
        <MembersRoomGate
          enterAction={enterMembersRoom}
          setupNeeded={!configured}
        />
        <div className="vault-nav-row">
          <Link className="btn btn-soft" href="/admin">
            관리자실
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="study-room">
      <AdminRoomHeader roomKey="members" />
      <MembersRoomHome />
      <div className="vault-nav-row">
        <form action={leaveMembersRoom}>
          <button type="submit" className="btn btn-soft">
            방 잠그고 나가기
          </button>
        </form>
        <Link className="btn btn-soft" href="/admin">
          관리자실
        </Link>
      </div>
    </div>
  );
}
