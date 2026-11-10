"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    setStore(readAdminCopyStore());
    setReady(true);
  }, []);

  function persist(next: AdminCopyStore) {
    writeAdminCopyStore(next);
    setStore(next);
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

      {editing ? (
        <section className="panel admin-copy-panel">
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
