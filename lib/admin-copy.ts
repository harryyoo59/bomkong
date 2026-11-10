/** 관리자실 한글 글 — 이 기기 브라우저에만 기억 (고치기·새로 쓰기) */

export type ClinicDoorKind = "link" | "empty" | "photo";

export type ClinicDoor = {
  id: string;
  /** 칸 번호 표시 (예: 1, ·, 우) */
  number: string;
  title: string;
  body: string;
  note: string;
  /** 비우면 눌리지 않는 칸 */
  href: string;
  kind: ClinicDoorKind;
  /** 같은 값이면 한 세로줄로 묶음 (봄이·콩이 사진 칸) */
  groupId: string;
  builtIn: boolean;
};

export type RoomCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  empty: string;
};

export type ClinicHeaderCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  logoutLabel: string;
  homeLinkLabel: string;
  editOpenLabel: string;
  editCloseLabel: string;
};

export type AdminCopyStore = {
  clinic: ClinicHeaderCopy;
  doors: ClinicDoor[];
  rooms: Record<string, RoomCopy>;
};

export const ROOM_KEYS = [
  "bomi-photos",
  "kongi-photos",
  "logos",
  "source",
  "cookie",
  "unreleased",
  "public",
  "mailbox",
] as const;

export type RoomKey = (typeof ROOM_KEYS)[number];

export const ROOM_LABELS: Record<RoomKey, string> = {
  "bomi-photos": "봄이 사진 보관",
  "kongi-photos": "콩이 사진 보관",
  logos: "로고 관리",
  source: "소스 보관실",
  cookie: "쿠키완료실",
  unreleased: "미공개 영상실",
  public: "공개 영상실",
  mailbox: "손님 의견",
};

const STORAGE_KEY = "bomkong_admin_copy_v1";

export const DEFAULT_CLINIC: ClinicHeaderCopy = {
  eyebrow: "관리자실 · 진료실",
  title: "관리자실을 칸으로 나눴어요",
  intro:
    "손님용 메뉴와 섞이지 않아요. 봄이·콩이·영상규칙·로고·소스 보관실·쿠키완료실·미공개 영상실·공개 영상실·손님 의견이 여기에 있어요. 연결된 칸만 눌러 들어가요.",
  logoutLabel: "나가기",
  homeLinkLabel: "거실로 돌아가기",
  editOpenLabel: "글 고치기",
  editCloseLabel: "글 고치기 닫기",
};

export const DEFAULT_DOORS: ClinicDoor[] = [
  {
    id: "door-bomi",
    number: "1",
    title: "봄이",
    body: "봄이 소개와 기준 그림을 봐요.",
    note: "",
    href: "/characters/bomi",
    kind: "link",
    groupId: "bomi",
    builtIn: true,
  },
  {
    id: "door-bomi-photos",
    number: "·",
    title: "영상규칙에 쓸 사진 보관",
    body: "봄이 칸 아래예요. 사진을 골라 넣을 수 있어요.",
    note: "사진 올리기 열림",
    href: "/admin/bomi-photos",
    kind: "photo",
    groupId: "bomi",
    builtIn: true,
  },
  {
    id: "door-kongi",
    number: "2",
    title: "콩이",
    body: "콩이 소개와 기준 그림을 봐요.",
    note: "",
    href: "/characters/kongi",
    kind: "link",
    groupId: "kongi",
    builtIn: true,
  },
  {
    id: "door-kongi-photos",
    number: "·",
    title: "영상규칙에 쓸 사진 보관",
    body: "콩이 칸 아래예요. 사진을 골라 넣을 수 있어요.",
    note: "사진 올리기 열림",
    href: "/admin/kongi-photos",
    kind: "photo",
    groupId: "kongi",
    builtIn: true,
  },
  {
    id: "door-rules",
    number: "3",
    title: "영상제작 규칙",
    body: "보관소 칸이에요. 안은 비워 두었어요.",
    note: "나중에 붙여 넣기",
    href: "",
    kind: "empty",
    groupId: "",
    builtIn: true,
  },
  {
    id: "door-logos",
    number: "4",
    title: "로고 관리",
    body: "공식 로고에 일련번호를 붙여 모아 둬요.",
    note: "상표·이름 관련은 나중에",
    href: "/admin/logos",
    kind: "link",
    groupId: "",
    builtIn: true,
  },
  {
    id: "door-source",
    number: "5",
    title: "소스 보관실",
    body: "쿠키 영상에 쓸 사진·동영상을 모아 둬요.",
    note: "제작 전 자료",
    href: "/admin/source",
    kind: "link",
    groupId: "",
    builtIn: true,
  },
  {
    id: "door-cookie",
    number: "6",
    title: "쿠키완료실",
    body: "쓴 소스를 옮겨 두고, 영상 제목을 붙여 보관해요.",
    note: "재사용 방지",
    href: "/admin/cookie",
    kind: "link",
    groupId: "",
    builtIn: true,
  },
  {
    id: "door-unreleased",
    number: "7",
    title: "미공개 영상실",
    body: "만들기는 끝났지만 아직 유튜브에 안 올린 영상을 모아 둬요.",
    note: "유튜브 올리기 전",
    href: "/admin/unreleased",
    kind: "link",
    groupId: "",
    builtIn: true,
  },
  {
    id: "door-public",
    number: "8",
    title: "공개 영상실",
    body: "유튜브에 공개한 뒤의 원본과 제목을 모아 둬요.",
    note: "공개한 원본",
    href: "/admin/public",
    kind: "link",
    groupId: "",
    builtIn: true,
  },
  {
    id: "door-mailbox",
    number: "우",
    title: "손님 의견",
    body: "거실 우편함으로 온 의견을 읽어요.",
    note: "의견 보내기",
    href: "/admin/mailbox",
    kind: "link",
    groupId: "",
    builtIn: true,
  },
];

export const DEFAULT_ROOMS: Record<RoomKey, RoomCopy> = {
  "bomi-photos": {
    eyebrow: "관리자실 · 봄이 칸 아래",
    title: "영상규칙에 쓸 사진 보관",
    intro: "봄이 영상규칙에 쓸 사진을 모아 두는 방이에요. 사진을 골라 넣을 수 있어요.",
    empty: "아직 넣어 둔 사진이 없어요.",
  },
  "kongi-photos": {
    eyebrow: "관리자실 · 콩이 칸 아래",
    title: "영상규칙에 쓸 사진 보관",
    intro: "콩이 영상규칙에 쓸 사진을 모아 두는 방이에요. 사진을 골라 넣을 수 있어요.",
    empty: "아직 넣어 둔 사진이 없어요.",
  },
  logos: {
    eyebrow: "관리자실 · 4번 칸",
    title: "로고 관리",
    intro:
      "공식 로고에 일련번호를 붙여 모아 두는 방이에요. 번호를 정하고, 나중에 고쳐도 돼요.",
    empty: "아직 넣어 둔 로고가 없어요.",
  },
  source: {
    eyebrow: "관리자실 · 5번 칸",
    title: "소스 보관실",
    intro: "앞으로 쿠키 영상에 쓸 사진·동영상을 모아 두는 방이에요.",
    empty: "아직 넣어 둔 사진·동영상이 없어요.",
  },
  cookie: {
    eyebrow: "관리자실 · 6번 칸",
    title: "쿠키완료실",
    intro:
      "쿠키 영상에 이미 쓴 소스를 옮겨 두는 방이에요. 같은 자료를 다시 쓰지 않도록 영상 제목과 함께 보관해요.",
    empty: "아직 옮긴 자료가 없어요.",
  },
  unreleased: {
    eyebrow: "관리자실 · 7번 칸",
    title: "미공개 영상실",
    intro:
      "만들기는 끝났지만 아직 유튜브에 안 올린 영상을 모아 두는 방이에요.",
    empty: "아직 넣어 둔 미공개 영상이 없어요.",
  },
  public: {
    eyebrow: "관리자실 · 8번 칸",
    title: "공개 영상실",
    intro: "유튜브에 공개한 뒤의 원본과 제목을 모아 두는 방이에요.",
    empty: "아직 넣어 둔 공개 영상이 없어요.",
  },
  mailbox: {
    eyebrow: "관리자실 · 손님 의견",
    title: "의견 보내기 우편함",
    intro: "거실 빨간 우편함으로 온 글이에요. 이름은 비어 있을 수 있어요.",
    empty: "아직 받은 의견이 없어요.",
  },
};

export function getDefaultAdminCopy(): AdminCopyStore {
  return {
    clinic: { ...DEFAULT_CLINIC },
    doors: DEFAULT_DOORS.map((d) => ({ ...d })),
    rooms: Object.fromEntries(
      ROOM_KEYS.map((key) => [key, { ...DEFAULT_ROOMS[key] }]),
    ) as Record<string, RoomCopy>,
  };
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeDoor(raw: Partial<ClinicDoor>, fallback?: ClinicDoor): ClinicDoor | null {
  const id = asString(raw.id, fallback?.id ?? "");
  if (!id) return null;
  const kindRaw = asString(raw.kind, fallback?.kind ?? "link");
  const kind: ClinicDoorKind =
    kindRaw === "empty" || kindRaw === "photo" || kindRaw === "link"
      ? kindRaw
      : "link";
  return {
    id,
    number: asString(raw.number, fallback?.number ?? ""),
    title: asString(raw.title, fallback?.title ?? ""),
    body: asString(raw.body, fallback?.body ?? ""),
    note: asString(raw.note, fallback?.note ?? ""),
    href: asString(raw.href, fallback?.href ?? ""),
    kind,
    groupId: asString(raw.groupId, fallback?.groupId ?? ""),
    builtIn: Boolean(raw.builtIn ?? fallback?.builtIn ?? false),
  };
}

function normalizeRoom(raw: Partial<RoomCopy>, fallback: RoomCopy): RoomCopy {
  return {
    eyebrow: asString(raw.eyebrow, fallback.eyebrow),
    title: asString(raw.title, fallback.title),
    intro: asString(raw.intro, fallback.intro),
    empty: asString(raw.empty, fallback.empty),
  };
}

export function normalizeAdminCopyStore(
  raw: Partial<AdminCopyStore> | null | undefined,
): AdminCopyStore {
  const defaults = getDefaultAdminCopy();
  if (!raw) return defaults;

  const clinicRaw = (raw.clinic ?? {}) as Partial<ClinicHeaderCopy>;
  const clinic: ClinicHeaderCopy = {
    eyebrow: asString(clinicRaw.eyebrow, defaults.clinic.eyebrow),
    title: asString(clinicRaw.title, defaults.clinic.title),
    intro: asString(clinicRaw.intro, defaults.clinic.intro),
    logoutLabel: asString(clinicRaw.logoutLabel, defaults.clinic.logoutLabel),
    homeLinkLabel: asString(
      clinicRaw.homeLinkLabel,
      defaults.clinic.homeLinkLabel,
    ),
    editOpenLabel: asString(
      clinicRaw.editOpenLabel,
      defaults.clinic.editOpenLabel,
    ),
    editCloseLabel: asString(
      clinicRaw.editCloseLabel,
      defaults.clinic.editCloseLabel,
    ),
  };

  const defaultById = new Map(defaults.doors.map((d) => [d.id, d]));
  const doorsRaw = Array.isArray(raw.doors) ? raw.doors : defaults.doors;
  const doors: ClinicDoor[] = [];
  const seen = new Set<string>();
  for (const item of doorsRaw) {
    const normalized = normalizeDoor(item, defaultById.get(item.id));
    if (!normalized || seen.has(normalized.id)) continue;
    seen.add(normalized.id);
    doors.push(normalized);
  }
  for (const door of defaults.doors) {
    if (!seen.has(door.id)) doors.push({ ...door });
  }

  const rooms: Record<string, RoomCopy> = {};
  for (const key of ROOM_KEYS) {
    const fallback = defaults.rooms[key];
    rooms[key] = normalizeRoom(raw.rooms?.[key] ?? {}, fallback);
  }
  if (raw.rooms) {
    for (const [key, value] of Object.entries(raw.rooms)) {
      if (ROOM_KEYS.includes(key as RoomKey)) continue;
      rooms[key] = normalizeRoom(value ?? {}, {
        eyebrow: "",
        title: "",
        intro: "",
        empty: "",
      });
    }
  }

  return { clinic, doors, rooms };
}

export function readAdminCopyStore(): AdminCopyStore {
  if (typeof window === "undefined") return getDefaultAdminCopy();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultAdminCopy();
    return normalizeAdminCopyStore(JSON.parse(raw) as Partial<AdminCopyStore>);
  } catch {
    return getDefaultAdminCopy();
  }
}

export function writeAdminCopyStore(store: AdminCopyStore): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(normalizeAdminCopyStore(store)),
  );
}

export function makeCustomDoorId(): string {
  return `door-custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function getRoomCopy(
  store: AdminCopyStore,
  roomKey: string,
): RoomCopy {
  const fallback =
    DEFAULT_ROOMS[roomKey as RoomKey] ??
    ({
      eyebrow: "",
      title: "",
      intro: "",
      empty: "",
    } satisfies RoomCopy);
  return normalizeRoom(store.rooms[roomKey] ?? {}, fallback);
}

/** 진료실 칸을 세로줄(group) 단위로 묶어서 그리드에 넣기 */
export function groupClinicDoors(doors: ClinicDoor[]): ClinicDoor[][] {
  const groups: ClinicDoor[][] = [];
  const groupIndex = new Map<string, number>();

  for (const door of doors) {
    if (door.groupId) {
      const existing = groupIndex.get(door.groupId);
      if (existing === undefined) {
        groupIndex.set(door.groupId, groups.length);
        groups.push([door]);
      } else {
        groups[existing].push(door);
      }
      continue;
    }
    groups.push([door]);
  }
  return groups;
}
