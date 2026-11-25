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
import { requireMembersRoomSession } from "@/lib/members-room-auth";
import {
  MEMBERS_EXTRA_STAT_PLACEHOLDER_LINES,
  SUBSCRIBER_COUNTS_PLACEHOLDER_LINE,
  SUBSCRIBER_WATCH_AVG_PLACEHOLDER_LINE,
  fetchParentActiveCounts,
  fetchParentSignupCounts,
  formatParentActiveCountsLine,
  formatParentSignupCountsLine,
} from "@/lib/parent-signup-counts";

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

  const roomGate = await requireMembersRoomSession();

  if (!roomGate.ok) {
    return (
      <div className="study-room">
        <MembersRoomGate enterAction={enterMembersRoom} />
        <div className="vault-nav-row">
          <Link className="btn btn-soft" href="/admin">
            관리자실
          </Link>
        </div>
      </div>
    );
  }

  const [signupCounts, activeCounts] = await Promise.all([
    fetchParentSignupCounts(),
    fetchParentActiveCounts(),
  ]);
  const signupCountsLine = formatParentSignupCountsLine(signupCounts);
  const activeCountsLine = formatParentActiveCountsLine(activeCounts);

  return (
    <div className="study-room">
      <AdminRoomHeader roomKey="members" />
      <MembersRoomHome
        signupCountsLine={signupCountsLine}
        activeCountsLine={activeCountsLine}
        subscriberCountsLine={SUBSCRIBER_COUNTS_PLACEHOLDER_LINE}
        subscriberWatchAvgLine={SUBSCRIBER_WATCH_AVG_PLACEHOLDER_LINE}
        extraStatLines={MEMBERS_EXTRA_STAT_PLACEHOLDER_LINES}
      />
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
