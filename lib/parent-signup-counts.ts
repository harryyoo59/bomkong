import { createSupabaseServerClient } from "@/lib/supabase-public";

export type ParentSignupCounts = {
  lastMonth: number;
  thisMonth: number;
  lastWeek: number;
  thisWeek: number;
  today: number;
};

const EMPTY: ParentSignupCounts = {
  lastMonth: 0,
  thisMonth: 0,
  lastWeek: 0,
  thisWeek: 0,
  today: 0,
};

function asCount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

export async function fetchParentSignupCounts(): Promise<ParentSignupCounts> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc("parent_signup_counts");
  if (error || data == null) {
    return EMPTY;
  }

  const row =
    typeof data === "string"
      ? (JSON.parse(data) as Record<string, unknown>)
      : (data as Record<string, unknown>);

  return {
    lastMonth: asCount(row.lastMonth),
    thisMonth: asCount(row.thisMonth),
    lastWeek: asCount(row.lastWeek),
    thisWeek: asCount(row.thisWeek),
    today: asCount(row.today),
  };
}

export function formatParentSignupCountsLine(
  counts: ParentSignupCounts,
): string {
  return `가입 전월 ${counts.lastMonth} · 금월 ${counts.thisMonth} · 전주 ${counts.lastWeek} · 금주 ${counts.thisWeek} · 오늘 ${counts.today}`;
}
