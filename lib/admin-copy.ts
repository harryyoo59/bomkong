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
  "rules",
  "logos",
  "unreleased",
  "unreleased-ko",
  "unreleased-en",
  "watch",
  "mailbox",
] as const;

export type RoomKey = (typeof ROOM_KEYS)[number];

/** 더 이상 쓰지 않는 진료실 칸 (예전에 저장된 것도 목록에서 뺌) */
const REMOVED_DOOR_IDS = new Set([
  "door-source",
  "door-cookie",
  "door-public",
]);

export const ROOM_LABELS: Record<RoomKey, string> = {
  "bomi-photos": "봄이 사진 보관",
  "kongi-photos": "콩이 사진 보관",
  rules: "영상제작 규칙",
  logos: "로고 관리",
  unreleased: "미공개 영상실",
  "unreleased-ko": "미공개 영상실 · 한국어",
  "unreleased-en": "미공개 영상실 · 영어",
  watch: "영상보기",
  mailbox: "손님 의견",
};

const STORAGE_KEY = "bomkong_admin_copy_v1";

export const DEFAULT_CLINIC: ClinicHeaderCopy = {
  eyebrow: "관리자실 · 진료실",
  title: "관리자실을 칸으로 나눴어요",
  intro:
    "손님용 메뉴와 섞이지 않아요. 봄이·콩이·영상규칙·로고·미공개 영상실·영상보기·손님 의견이 여기에 있어요. 연결된 칸만 눌러 들어가요.",
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
    body: "최종 확정본을 읽고 따라요.",
    note: "열어 보기",
    href: "/admin/rules",
    kind: "link",
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
    id: "door-unreleased",
    number: "7",
    title: "미공개 영상실",
    body: "만들기는 끝났지만 아직 유튜브에 안 올린 영상을 모아 둬요. 한국어·영어를 따로 열어요.",
    note: "한국어 · 영어",
    href: "/admin/unreleased",
    kind: "link",
    groupId: "",
    builtIn: true,
  },
  {
    id: "door-watch",
    number: "9",
    title: "영상보기",
    body: "거실에서 아이들이 보는 영상을 모아 둬요.",
    note: "거실 영상보기",
    href: "/admin/watch",
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
  rules: {
    eyebrow: "관리자실 · 3번 칸",
    title: "영상제작 규칙",
    intro:
      "봄이콩이 모든 영상의 절대 기준이에요. 아래로 스크롤하며 읽고, 필요하면 「글 고치기」로 고쳐요.",
    empty: "",
  },
  logos: {
    eyebrow: "관리자실 · 4번 칸",
    title: "로고 관리",
    intro:
      "공식 로고에 일련번호를 붙여 모아 두는 방이에요. 번호를 정하고, 나중에 고쳐도 돼요.",
    empty: "아직 넣어 둔 로고가 없어요.",
  },
  unreleased: {
    eyebrow: "관리자실 · 7번 칸",
    title: "미공개 영상실",
    intro:
      "한국어용·영어용 미공개 영상을 따로 모아 둬요. 아래 문 중 하나를 눌러 들어가세요.",
    empty: "",
  },
  "unreleased-ko": {
    eyebrow: "관리자실 · 7번 칸 · 한국어",
    title: "미공개 영상실 · 한국어",
    intro:
      "한국어 시장용으로, 만들기는 끝났지만 아직 유튜브에 안 올린 영상을 모아 두는 방이에요.",
    empty: "아직 넣어 둔 한국어 미공개 영상이 없어요.",
  },
  "unreleased-en": {
    eyebrow: "관리자실 · 7번 칸 · 영어",
    title: "미공개 영상실 · 영어",
    intro:
      "영어 시장용으로, 만들기는 끝났지만 아직 유튜브에 안 올린 영상을 모아 두는 방이에요.",
    empty: "아직 넣어 둔 영어 미공개 영상이 없어요.",
  },
  watch: {
    eyebrow: "관리자실 · 9번 칸",
    title: "영상보기",
    intro:
      "거실 「영상보기」에 보여줄 영상만 모아 두는 방이에요. 편 번호와 언어(ko/en)를 넣고, 재생은 1-ko → 1-en → 2-ko → 2-en 순이에요. 영어가 없으면 다음 번호로 가요. 나중에 넣은 영상은 뒤로 가요.",
    empty: "아직 넣어 둔 영상이 없어요. 넣으면 거실 영상보기에 나와요.",
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

/** 예전에 비워 둔 기본 칸이 새 기본 연결을 따라가도록 */
function migrateBuiltInDoor(
  door: ClinicDoor,
  fallback?: ClinicDoor,
): ClinicDoor {
  if (!fallback || !door.builtIn) return door;

  if (door.id === "door-rules") {
    if (door.href) return door;

    const bodyLooksBlank =
      !door.body ||
      door.body.includes("비워") ||
      door.body.includes("나중에 붙여");
    const noteLooksBlank =
      !door.note ||
      door.note === "나중에 붙여 넣기" ||
      door.note.includes("붙여");

    return {
      ...door,
      href: fallback.href,
      kind: fallback.kind,
      body: bodyLooksBlank ? fallback.body : door.body,
      note: noteLooksBlank ? fallback.note : door.note,
    };
  }

  /** 미공개 칸: 예전 한 줄 안내 → 한국어·영어 분리 안내로 이어 받음 */
  if (door.id === "door-unreleased") {
    const oldNote = door.note === "유튜브 올리기 전" || !door.note;
    const oldBody =
      !door.body ||
      door.body ===
        "만들기는 끝났지만 아직 유튜브에 안 올린 영상을 모아 둬요.";
    if (!oldNote && !oldBody) return door;
    return {
      ...door,
      href: door.href || fallback.href,
      kind: fallback.kind,
      body: oldBody ? fallback.body : door.body,
      note: oldNote ? fallback.note : door.note,
    };
  }

  return door;
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
  let clinicIntro = asString(clinicRaw.intro, defaults.clinic.intro);
  // 지운 방 이름이 예전 안내 글에 남아 있으면 새 안내로 맞춤
  if (
    clinicIntro.includes("소스 보관실") ||
    clinicIntro.includes("쿠키완료실") ||
    clinicIntro.includes("공개 영상실")
  ) {
    clinicIntro = defaults.clinic.intro;
  }
  const clinic: ClinicHeaderCopy = {
    eyebrow: asString(clinicRaw.eyebrow, defaults.clinic.eyebrow),
    title: asString(clinicRaw.title, defaults.clinic.title),
    intro: clinicIntro,
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
    if (REMOVED_DOOR_IDS.has(normalized.id)) continue;
    seen.add(normalized.id);
    doors.push(migrateBuiltInDoor(normalized, defaultById.get(normalized.id)));
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
