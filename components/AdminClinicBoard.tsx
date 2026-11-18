"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  loadAdminCopyAction,
  publishAdminCopyAction,
} from "@/app/admin/copy-actions";
import { AdminCopyEditor } from "@/components/AdminCopyEditor";
import {
  getDefaultAdminCopy,
  groupClinicDoors,
  readAdminCopyStore,
  writeAdminCopyStore,
  type AdminCopyStore,
  type ClinicDoor,
} from "@/lib/admin-copy";

type Props = {
  logoutAction: () => Promise<void>;
};

function doorClassName(door: ClinicDoor): string {
  if (door.kind === "photo") {
    return door.href
      ? "clinic-door clinic-door-photo clinic-door-photo-open"
      : "clinic-door clinic-door-photo";
  }
  if (door.kind === "empty" || !door.href) {
    return "clinic-door clinic-door-empty";
  }
  return "clinic-door";
}

function DoorBody({ door }: { door: ClinicDoor }) {
  return (
    <>
      <span className="clinic-door-number" aria-hidden="true">
        {door.number}
      </span>
      <span className="clinic-door-body">
        <h2>{door.title}</h2>
        {door.body ? <p>{door.body}</p> : null}
        {door.note ? <p className="clinic-door-note">{door.note}</p> : null}
      </span>
    </>
  );
}

function ClinicDoorView({ door }: { door: ClinicDoor }) {
  const className = doorClassName(door);
  const label = door.note ? `${door.title} · ${door.note}` : door.title;

  if (door.href) {
    return (
      <Link
        href={door.href}
        className={className}
        role="listitem"
        aria-label={label}
      >
        <DoorBody door={door} />
      </Link>
    );
  }

  return (
    <div className={className} role="listitem" aria-label={label}>
      <DoorBody door={door} />
    </div>
  );
}

export function AdminClinicBoard({ logoutAction }: Props) {
  const [store, setStore] = useState<AdminCopyStore>(getDefaultAdminCopy);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const local = readAdminCopyStore();
      if (!cancelled) {
        setStore(local);
        setReady(true);
      }

      const remote = await loadAdminCopyAction();
      if (cancelled) return;

      if (!remote.ok) {
        setSyncMessage(
          "이 기기 글씨는 그대로예요. 인터넷 글씨는 아직 확인하지 못했어요.",
        );
        return;
      }

      if (remote.remote.store) {
        writeAdminCopyStore(remote.remote.store);
        setStore(remote.remote.store);
        setSyncMessage(
          "칸 이름·글씨가 다른 기기와 같아요. 고치면 자동으로 맞춰져요.",
        );
        return;
      }

      // 인터넷이 비어 있으면 이 기기 글을 올려 맞춤
      const published = await publishAdminCopyAction(local);
      if (cancelled) return;
      if (published.ok && published.remote.store) {
        writeAdminCopyStore(published.remote.store);
        setStore(published.remote.store);
        setSyncMessage(
          "이 기기 글씨를 인터넷에 맞춰 두었어요. 앞으로 고치면 자동으로 같아져요.",
        );
      } else if (!published.ok) {
        setSyncMessage(published.message);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  function persist(next: AdminCopyStore) {
    writeAdminCopyStore(next);
    setStore(next);
    void publishAdminCopyAction(next).then((published) => {
      if (published.ok) {
        setSyncMessage("글씨를 고쳤고, 다른 기기에도 자동으로 맞춰 두었어요.");
      } else {
        setSyncMessage(
          `이 기기에는 저장했어요. ${published.message}`,
        );
      }
    });
  }

  const groups = groupClinicDoors(store.doors);

  return (
    <div className="clinic-room">
      <header className="clinic-header">
        <div>
          <p className="eyebrow">{store.clinic.eyebrow}</p>
          <h1 className="section-title">{store.clinic.title}</h1>
          <p className="muted">{store.clinic.intro}</p>
        </div>
        <div className="clinic-header-actions">
          <button
            type="button"
            className="btn btn-soft"
            onClick={() => setEditing((v) => !v)}
            disabled={!ready}
          >
            {editing
              ? store.clinic.editCloseLabel
              : store.clinic.editOpenLabel}
          </button>
          <form action={logoutAction}>
            <button type="submit" className="btn btn-soft">
              {store.clinic.logoutLabel}
            </button>
          </form>
        </div>
      </header>

      {syncMessage ? (
        <p className="form-msg tiny" role="status">
          {syncMessage}
        </p>
      ) : null}

      {editing ? (
        <section className="panel admin-copy-panel">
          <p className="tiny muted">
            고친 내용은 자동으로 다른 기기에도 맞춰져요.
          </p>
          <AdminCopyEditor store={store} onChange={persist} />
        </section>
      ) : null}

      <div className="clinic-grid" role="list">
        {groups.map((group) => {
          if (group.length === 1) {
            return <ClinicDoorView key={group[0].id} door={group[0]} />;
          }
          return (
            <div
              key={group.map((d) => d.id).join("-")}
              className="clinic-column"
              role="presentation"
            >
              {group.map((door) => (
                <ClinicDoorView key={door.id} door={door} />
              ))}
            </div>
          );
        })}
      </div>

      <Link className="btn btn-soft btn-wide" href="/">
        {store.clinic.homeLinkLabel}
      </Link>
    </div>
  );
}
