import { createSupabaseServerClient } from "@/lib/supabase-public";

/** 운영자(사장님) 계정 — 모든 회원 통계에서 제외 */
export const MEMBERS_STATS_EXCLUDED_EMAILS = [
  "harryyoo59@gmail.com",
] as const;

export type ParentSignupCounts = {
  total: number;
  lastMonth: number;
  thisMonth: number;
  lastWeek: number;
  thisWeek: number;
  today: number;
};

const EMPTY: ParentSignupCounts = {
  total: 0,
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
    total: asCount(row.total),
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
  return `가입 회원 :  전체 ${counts.total}     전월 ${counts.lastMonth} · 금월 ${counts.thisMonth} · 전주 ${counts.lastWeek} · 금주 ${counts.thisWeek} · 오늘 ${counts.today}`;
}

export type ParentActiveCounts = {
  lastMonth: number;
  thisMonth: number;
  lastWeek: number;
  thisWeek: number;
  today: number;
};

const EMPTY_ACTIVE: ParentActiveCounts = {
  lastMonth: 0,
  thisMonth: 0,
  lastWeek: 0,
  thisWeek: 0,
  today: 0,
};

export async function fetchParentActiveCounts(): Promise<ParentActiveCounts> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc("parent_active_counts");
  if (error || data == null) {
    return EMPTY_ACTIVE;
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

export function formatParentActiveCountsLine(
  counts: ParentActiveCounts,
): string {
  return `활동 회원 :  전월 ${counts.lastMonth} · 금월 ${counts.thisMonth} · 전주 ${counts.lastWeek} · 금주 ${counts.thisWeek} · 오늘 ${counts.today}`;
}

/** 정기 구독 결제 붙기 전 자리. 지금은 0. */
export const SUBSCRIBER_COUNTS_PLACEHOLDER_LINE =
  "정기 구독 회원 :  전체 0명 0원     전월 0명 0원 · 금월 0명 0원 · 전주 0명 0원 · 금주 0명 0원 · 오늘 0명 0원";

/** 정기 구독·시청 기록이 붙기 전 자리. 지금은 0. */
export const SUBSCRIBER_WATCH_AVG_PLACEHOLDER_LINE =
  "정기 구독 1일 평균 시청 :  전월 0분(0편) · 금월 0분(0편) · 전주 0분(0편) · 금주 0분(0편) · 오늘 0분(0편)";

/**
 * 나중에 기록 붙일 통계 자리. 필요 없으면 줄만 지우면 됨.
 * 지금은 전부 0 / 자리 표시.
 */
export const MEMBERS_EXTRA_STAT_PLACEHOLDER_LINES: string[] = [
  "이탈 회원(지난주 왔다가 이번주 안 옴) :  0명",
  "새 가입 재방문율 :  전월 0% · 금월 0% · 전주 0% · 금주 0% · 오늘 0%",
  "인기 편 TOP5 :  (자리)     덜 본 편 :  (자리)",
  "기기 비율 :  폰 0% · 컴퓨터 0%",
  "로그인 실패 :  전월 0 · 금월 0 · 전주 0 · 금주 0 · 오늘 0",
  "손님 의견 :  전월 0 · 금월 0 · 전주 0 · 금주 0 · 오늘 0",
];

