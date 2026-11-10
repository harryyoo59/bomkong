"use client";

import {
  DEFAULT_DOORS,
  ROOM_KEYS,
  ROOM_LABELS,
  getDefaultAdminCopy,
  makeCustomDoorId,
  type AdminCopyStore,
  type ClinicDoor,
  type ClinicDoorKind,
  type RoomKey,
} from "@/lib/admin-copy";

type Props = {
  store: AdminCopyStore;
  onChange: (next: AdminCopyStore) => void;
};

function updateDoor(
  doors: ClinicDoor[],
  id: string,
  patch: Partial<ClinicDoor>,
): ClinicDoor[] {
  return doors.map((door) => (door.id === id ? { ...door, ...patch } : door));
}

export function AdminCopyEditor({ store, onChange }: Props) {
  function setClinic<K extends keyof AdminCopyStore["clinic"]>(
    key: K,
    value: AdminCopyStore["clinic"][K],
  ) {
    onChange({
      ...store,
      clinic: { ...store.clinic, [key]: value },
    });
  }

  function setRoomField(roomKey: RoomKey, field: keyof AdminCopyStore["rooms"][string], value: string) {
    onChange({
      ...store,
      rooms: {
        ...store.rooms,
        [roomKey]: {
          ...store.rooms[roomKey],
          [field]: value,
        },
      },
    });
  }

  function onAddDoor() {
    const custom: ClinicDoor = {
      id: makeCustomDoorId(),
      number: String(store.doors.length + 1),
      title: "새 칸 이름",
      body: "여기에 설명을 적어 주세요.",
      note: "",
      href: "",
      kind: "empty",
      groupId: "",
      builtIn: false,
    };
    onChange({ ...store, doors: [...store.doors, custom] });
  }

  function onRemoveDoor(id: string) {
    const target = store.doors.find((d) => d.id === id);
    if (!target || target.builtIn) return;
    onChange({
      ...store,
      doors: store.doors.filter((d) => d.id !== id),
    });
  }

  function onResetAll() {
    if (
      typeof window !== "undefined" &&
      !window.confirm("모든 글을 처음 글로 되돌릴까요?")
    ) {
      return;
    }
    onChange(getDefaultAdminCopy());
  }

  function onResetDoors() {
    if (
      typeof window !== "undefined" &&
      !window.confirm("칸 글만 처음 글로 되돌릴까요? (직접 만든 칸은 사라져요)")
    ) {
      return;
    }
    onChange({
      ...store,
      doors: DEFAULT_DOORS.map((d) => ({ ...d })),
    });
  }

  return (
    <div className="admin-copy-editor" aria-label="관리자실 글 고치기">
      <header className="admin-copy-editor-head">
        <div>
          <h2 className="section-title">관리자실 글 고치기</h2>
          <p className="muted tiny">
            칸 이름·설명·방 소개·빈 화면 글을 고치거나 새 칸 글을 넣을 수
            있어요. 이 기기에만 기억해요.
          </p>
        </div>
        <div className="admin-copy-editor-actions">
          <button type="button" className="btn btn-soft" onClick={onResetDoors}>
            칸 글만 처음대로
          </button>
          <button type="button" className="btn btn-soft" onClick={onResetAll}>
            전부 처음대로
          </button>
        </div>
      </header>

      <section className="admin-copy-block">
        <h3>진료실 맨 위 글</h3>
        <label>
          작은 제목
          <input
            value={store.clinic.eyebrow}
            onChange={(e) => setClinic("eyebrow", e.target.value)}
          />
        </label>
        <label>
          큰 제목
          <input
            value={store.clinic.title}
            onChange={(e) => setClinic("title", e.target.value)}
          />
        </label>
        <label>
          소개 글
          <textarea
            rows={3}
            value={store.clinic.intro}
            onChange={(e) => setClinic("intro", e.target.value)}
          />
        </label>
        <label>
          나가기 버튼
          <input
            value={store.clinic.logoutLabel}
            onChange={(e) => setClinic("logoutLabel", e.target.value)}
          />
        </label>
        <label>
          거실로 버튼
          <input
            value={store.clinic.homeLinkLabel}
            onChange={(e) => setClinic("homeLinkLabel", e.target.value)}
          />
        </label>
      </section>

      <section className="admin-copy-block">
        <div className="admin-copy-block-head">
          <h3>칸(문) 글</h3>
          <button type="button" className="btn btn-primary" onClick={onAddDoor}>
            새 칸 글 넣기
          </button>
        </div>
        <ul className="admin-copy-door-list">
          {store.doors.map((door) => (
            <li key={door.id} className="admin-copy-door-card">
              <div className="admin-copy-door-card-head">
                <strong>
                  {door.number ? `${door.number}. ` : ""}
                  {door.title || "이름 없음"}
                </strong>
                {!door.builtIn ? (
                  <button
                    type="button"
                    className="btn btn-soft"
                    onClick={() => onRemoveDoor(door.id)}
                  >
                    이 칸 지우기
                  </button>
                ) : (
                  <span className="tiny muted">기본 칸</span>
                )}
              </div>
              <label>
                번호
                <input
                  value={door.number}
                  onChange={(e) =>
                    onChange({
                      ...store,
                      doors: updateDoor(store.doors, door.id, {
                        number: e.target.value,
                      }),
                    })
                  }
                />
              </label>
              <label>
                제목
                <input
                  value={door.title}
                  onChange={(e) =>
                    onChange({
                      ...store,
                      doors: updateDoor(store.doors, door.id, {
                        title: e.target.value,
                      }),
                    })
                  }
                />
              </label>
              <label>
                설명
                <textarea
                  rows={2}
                  value={door.body}
                  onChange={(e) =>
                    onChange({
                      ...store,
                      doors: updateDoor(store.doors, door.id, {
                        body: e.target.value,
                      }),
                    })
                  }
                />
              </label>
              <label>
                짧은 메모
                <input
                  value={door.note}
                  onChange={(e) =>
                    onChange({
                      ...store,
                      doors: updateDoor(store.doors, door.id, {
                        note: e.target.value,
                      }),
                    })
                  }
                />
              </label>
              <label>
                연결 주소 (비우면 눌리지 않음)
                <input
                  value={door.href}
                  onChange={(e) =>
                    onChange({
                      ...store,
                      doors: updateDoor(store.doors, door.id, {
                        href: e.target.value,
                      }),
                    })
                  }
                  placeholder="예: /admin/source"
                />
              </label>
              <label>
                칸 모양
                <select
                  value={door.kind}
                  onChange={(e) =>
                    onChange({
                      ...store,
                      doors: updateDoor(store.doors, door.id, {
                        kind: e.target.value as ClinicDoorKind,
                      }),
                    })
                  }
                >
                  <option value="link">연결 칸</option>
                  <option value="photo">사진 칸</option>
                  <option value="empty">빈 칸</option>
                </select>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-copy-block">
        <h3>방 소개·빈 화면 글</h3>
        {ROOM_KEYS.map((roomKey) => {
          const room = store.rooms[roomKey];
          return (
            <div key={roomKey} className="admin-copy-room-card">
              <h4>{ROOM_LABELS[roomKey]}</h4>
              <label>
                작은 제목
                <input
                  value={room.eyebrow}
                  onChange={(e) =>
                    setRoomField(roomKey, "eyebrow", e.target.value)
                  }
                />
              </label>
              <label>
                큰 제목
                <input
                  value={room.title}
                  onChange={(e) => setRoomField(roomKey, "title", e.target.value)}
                />
              </label>
              <label>
                소개 글
                <textarea
                  rows={2}
                  value={room.intro}
                  onChange={(e) => setRoomField(roomKey, "intro", e.target.value)}
                />
              </label>
              <label>
                비었을 때 글
                <input
                  value={room.empty}
                  onChange={(e) => setRoomField(roomKey, "empty", e.target.value)}
                />
              </label>
            </div>
          );
        })}
      </section>
    </div>
  );
}
